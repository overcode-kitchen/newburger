/**
 * 브라우저 UA 뒤에 서비스명과 연락처를 덧붙인다. 분쟁 시 "정상적·공개적 수집"의 근거이자 브랜드가 연락할 수 있는 통로.
 * 브라우저 UA 를 통째로 바꾸면 일부 사이트가 막으므로 덧붙이기만 한다. 연락처는 CRAWLER_CONTACT 환경변수.
 */
const USER_AGENT = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  `NewBurger/1.0 (+https://github.com/overcode-kitchen/newburger${process.env.CRAWLER_CONTACT ? `; ${process.env.CRAWLER_CONTACT}` : ""})`,
].join(" ");

/**
 * Node fetch 는 네트워크 실패를 "fetch failed" 한 줄로 감추고 실제 원인은 error.cause 에 둔다.
 * 무인 실행 로그에서 ETIMEDOUT / ECONNREFUSED / ENOTFOUND 를 바로 볼 수 있게 펼친다.
 */
function describeError(error: unknown, url: string): Error {
  if (!(error instanceof Error)) return new Error(`${String(error)} · ${url}`);
  const cause = error.cause as { code?: string; message?: string } | undefined;
  const detail = cause?.code ?? cause?.message;
  return new Error(detail ? `${error.message} (${detail}) · ${url}` : `${error.message} · ${url}`);
}

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

  throw describeError(lastError, url);
}

/** application/x-www-form-urlencoded POST 후 JSON 응답. 버거킹 트랜잭션 API 용 */
export async function postFormJson<T>(
  url: string,
  form: Record<string, string>,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { referer, timeoutMs = 20_000, retries = 2 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          ...(referer ? { Referer: referer, Origin: new URL(referer).origin } : {}),
        },
        body: new URLSearchParams(form).toString(),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)));
    }
  }

  throw describeError(lastError, url);
}

/** HTML 문서 GET. 정적 렌더링 사이트(롯데리아·맘스터치) 용 */
export async function fetchHtml(url: string, options: FetchJsonOptions = {}): Promise<string> {
  const { referer, timeoutMs = 20_000, retries = 2 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          ...(referer ? { Referer: referer } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)));
    }
  }

  throw describeError(lastError, url);
}

/** 상대 서버에 부담을 주지 않도록 연속 요청 사이에 쉰다 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
