import crypto from 'node:crypto';

const webhookUrl = (process.env.WEBHOOK_URL || 'http://localhost:8787/api/webhooks/shipments').replace(/\/$/, '');
const webhookSecret = String(process.env.WEBHOOK_SECRET || '').trim();
const expectStrict = String(process.env.EXPECT_STRICT_MODE || 'false').toLowerCase() === 'true';

if (!webhookSecret || webhookSecret.length < 32) {
  console.error('WEBHOOK_SECRET must be set and at least 32 characters long for smoke tests.');
  process.exit(1);
}

const payload = {
  shipment: {
    trackingId: `SMOKE-${Date.now()}`,
    status: 'in_transit',
    carrier: 'DHL',
    mode: 'road',
    origin: 'Berlin, DE',
    destination: 'Munich, DE',
    riskScore: 35,
    riskLevel: 'medium',
    progress: 45,
  },
};

const rawBody = JSON.stringify(payload);

function sign(ts, body, secret) {
  return crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
}

async function postWithHeaders(headers, body = rawBody) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    status: res.status,
    body: json || text,
  };
}

function printResult(name, result) {
  const summary = typeof result.body === 'object'
    ? JSON.stringify(result.body)
    : String(result.body);
  console.log(`${name}: status=${result.status} body=${summary}`);
}

function isAuthAccepted(status) {
  return status !== 401;
}

async function run() {
  const ts = Math.floor(Date.now() / 1000).toString();
  const goodSig = sign(ts, rawBody, webhookSecret);

  const hmacValid = await postWithHeaders({
    'x-webhook-timestamp': ts,
    'x-webhook-signature': `sha256=${goodSig}`,
  });
  printResult('valid_hmac', hmacValid);

  const hmacInvalid = await postWithHeaders({
    'x-webhook-timestamp': ts,
    'x-webhook-signature': 'sha256=deadbeef',
  });
  printResult('invalid_hmac', hmacInvalid);

  const legacySecret = await postWithHeaders({
    'x-webhook-secret': webhookSecret,
  });
  printResult('legacy_secret', legacySecret);

  const checks = [];
  checks.push({
    name: 'Valid HMAC should pass auth layer',
    pass: isAuthAccepted(hmacValid.status),
    detail: `expected !=401, got ${hmacValid.status}`,
  });
  checks.push({
    name: 'Invalid HMAC should fail auth layer',
    pass: hmacInvalid.status === 401,
    detail: `expected 401, got ${hmacInvalid.status}`,
  });

  if (expectStrict) {
    checks.push({
      name: 'Legacy secret should be blocked in strict mode',
      pass: legacySecret.status === 401,
      detail: `expected 401, got ${legacySecret.status}`,
    });
  } else {
    checks.push({
      name: 'Legacy secret should still work in migration mode',
      pass: isAuthAccepted(legacySecret.status),
      detail: `expected !=401, got ${legacySecret.status}`,
    });
  }

  const failed = checks.filter((c) => !c.pass);
  checks.forEach((c) => {
    console.log(`${c.pass ? 'PASS' : 'FAIL'} - ${c.name} (${c.detail})`);
  });

  if (failed.length > 0) {
    process.exit(2);
  }

  process.exit(0);
}

run().catch((error) => {
  console.error('Smoke test failed unexpectedly:', error.message);
  process.exit(3);
});
