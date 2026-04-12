import crypto from 'node:crypto';

const webhookUrl = String(process.env.WEBHOOK_URL || '').trim();
const webhookSecret = String(process.env.WEBHOOK_SECRET || '').trim();
const customPayload = String(process.env.WEBHOOK_PAYLOAD_JSON || '').trim();

if (!webhookUrl) {
  console.error('WEBHOOK_URL is required. Example: https://your-domain/api/webhooks/shipments');
  process.exit(1);
}

if (!webhookSecret || webhookSecret.length < 32) {
  console.error('WEBHOOK_SECRET is required and must be at least 32 characters.');
  process.exit(1);
}

function buildDefaultPayload() {
  return {
    shipment: {
      trackingId: `LIVE-${Date.now()}`,
      status: 'in_transit',
      carrier: 'DHL',
      mode: 'road',
      origin: 'Berlin, DE',
      destination: 'Munich, DE',
      riskScore: 38,
      riskLevel: 'medium',
      progress: 47,
      source: 'signed-sender-script',
    },
  };
}

function parsePayload() {
  if (!customPayload) return buildDefaultPayload();
  try {
    return JSON.parse(customPayload);
  } catch (error) {
    console.error('WEBHOOK_PAYLOAD_JSON is not valid JSON:', error.message);
    process.exit(1);
  }
}

function signPayload(secret, timestamp, rawBody) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
}

async function sendSignedWebhook() {
  const payloadObj = parsePayload();
  const rawBody = JSON.stringify(payloadObj);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(webhookSecret, timestamp, rawBody);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-timestamp': timestamp,
      'x-webhook-signature': `sha256=${signature}`,
    },
    body: rawBody,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const printable = typeof data === 'string' ? data : JSON.stringify(data);
  console.log(`status=${response.status}`);
  console.log(`response=${printable}`);

  if (!response.ok) {
    process.exit(2);
  }
}

sendSignedWebhook().catch((error) => {
  console.error('Signed webhook send failed:', error.message);
  process.exit(3);
});
