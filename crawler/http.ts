const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

interface FetchJsonOptions {
  referer?: string;
  timeoutMs?: number;
  retries?: number;
}

/** 브랜드 사이트용 GET. 타임아웃·재시도 포함. 실패는 예외로 올린다. */
export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { referer, timeoutMs = 20_000, retries = 2 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          ...(referer ? { Referer: referer } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
