const DEFAULT_RETRY_ATTEMPTS = Math.max(0, Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 2);
const DEFAULT_RETRY_DELAY_MS = Math.max(100, Number(import.meta.env.VITE_API_RETRY_DELAY_MS) || 350);
const DEFAULT_TIMEOUT_MS = Math.max(1000, Number(import.meta.env.VITE_API_TIMEOUT_MS) || 12000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

export async function fetchWithRetry(url, options = {}) {
  const retries = Number.isFinite(options.retries) ? options.retries : DEFAULT_RETRY_ATTEMPTS;
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? options.retryDelayMs : DEFAULT_RETRY_DELAY_MS;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok || !isRetriableStatus(res.status) || attempt === retries) {
        return res;
      }

      await wait(retryDelayMs * (attempt + 1));
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt === retries) break;
      await wait(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError || new Error('Request failed after retries');
}
