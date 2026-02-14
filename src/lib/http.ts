export async function fetchWithRetry(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
) {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const retries = 3;

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...opts,
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
          ...(opts.headers || {}),
        },
      });

      clearTimeout(t);

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      return res;
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      if (attempt < retries) {
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
    }
  }

  throw lastErr ?? new Error("fetchWithRetry failed");
}
