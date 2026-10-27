/**
 * 11.5 REST Clients - Timeout / Retry / Error Handling Demo
 *
 * Mô phỏng thư viện HTTP client (kiểu fetch/axios) bằng TS thuần:
 * - MiniHttpClient: async request với timeout, mô phỏng độ trễ mạng
 * - fetchWithTimeout: hủy request khi quá thời gian chờ
 * - fetchWithRetry: retry với exponential backoff
 * - HttpError: lỗi mang theo status code
 *
 * KHÔNG dùng fetch/axios thật — mô phỏng bằng Promise + setTimeout.
 */

// ─────────────────────────── Lỗi HTTP ───────────────────────────

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ─────────────────────────── Mini HTTP Client ───────────────────────────

interface HttpClientConfig {
  baseUrl: string;
  timeoutMs: number;
  headers: Record<string, string>;
}

interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MiniHttpClient {
  constructor(private config: HttpClientConfig) {}

  // Mô phỏng fetch: chờ `delayMs`, có thể fail với status tạm thời (500/503)
  async get<T>(path: string, options?: { delayMs?: number; failStatuses?: number[]; timeoutMs?: number }): Promise<HttpResponse<T>> {
    const delayMs = options?.delayMs ?? 50;
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs;
    const fullUrl = this.config.baseUrl + path;
    console.log(`  ➡️  GET ${fullUrl} (timeout ${timeoutMs}ms)`);

    await delay(delayMs);

    const status = options?.failStatuses?.shift();
    if (status !== undefined) {
      throw new HttpError(status, status === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR", `Server trả về ${status}`);
    }
    return { status: 200, data: { message: `OK từ ${fullUrl}` } as T, headers: { "Content-Type": "application/json" } };
  }
}

// ─────────────────────────── Timeout ───────────────────────────

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new HttpError(408, "REQUEST_TIMEOUT", `Hết thời gian chờ (${timeoutMs}ms)`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function fetchWithTimeout<T>(client: MiniHttpClient, path: string, timeoutMs: number, delayMs: number): Promise<HttpResponse<T>> {
  try {
    return await withTimeout(client.get<T>(path, { delayMs, timeoutMs }), timeoutMs);
  } catch (error) {
    if (error instanceof HttpError) {
      console.log(`  ❌  ${error.code}: ${error.message}`);
    }
    throw error;
  }
}

// ─────────────────────────── Retry (exponential backoff) ───────────────────────────

async function fetchWithRetry<T>(
  client: MiniHttpClient,
  path: string,
  maxRetries: number,
  baseDelayMs: number,
  failStatuses: number[],
): Promise<HttpResponse<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const waitMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`  ⏳  Lần thử ${attempt + 1}: chờ ${waitMs}ms (backoff) rồi gọi lại...`);
        await delay(waitMs);
      }
      return await client.get<T>(path, { failStatuses, delayMs: 10 });
    } catch (error) {
      lastError = error;
      if (error instanceof HttpError) {
        console.log(`  ⚠️  Lần ${attempt + 1} thất bại: ${error.status} ${error.code}`);
      }
      if (attempt === maxRetries) break;
    }
  }
  throw lastError;
}

// ─────────────────────────── Error handling pattern ───────────────────────────

interface SafeResult<T> {
  ok: boolean;
  data?: T;
  error?: HttpError;
}

async function safeCall<T>(fn: () => Promise<HttpResponse<T>>): Promise<SafeResult<T>> {
  try {
    const res = await fn();
    return { ok: true, data: res.data };
  } catch (error) {
    const httpError = error instanceof HttpError ? error : new HttpError(500, "UNKNOWN_ERROR", String(error));
    return { ok: false, error: httpError };
  }
}

// ───────────────────────────────── Demo ───────────────────────────────

async function run(): Promise<void> {
  console.log("=== REST Clients Demo ===");
  console.log("");

  const client = new MiniHttpClient({
    baseUrl: "https://api.example.com",
    timeoutMs: 1000,
    headers: { Authorization: "Bearer token" },
  });

  console.log("1️⃣ Gọi thành công:");
  const ok = await client.get<{ data: string }>("/api/users");
  console.log(`   → ${JSON.stringify(ok.data)}`);
  console.log("");

  console.log("2️⃣ Timeout — request chậm hơn giới hạn 100ms:");
  try {
    await fetchWithTimeout(client, "/api/slow-report", 100, 400);
  } catch {
    console.log("   → đã bị hủy do timeout, không chờ request lâu nữa");
  }
  console.log("");

  console.log("3️⃣ Retry — server lỗi 500 2 lần đầu, thành công ở lần 3:");
  try {
    const res = await fetchWithRetry<{ message: string }>(client, "/api/flaky", 2, 10, [500, 500]);
    console.log(`   → ${JSON.stringify(res.data)}`);
  } catch (error) {
    console.log(`   → vẫn thất bại sau retry: ${error instanceof HttpError ? error.message : String(error)}`);
  }
  console.log("");

  console.log("4️⃣ Retry hết hạn — server lỗi 503 liên tục:");
  try {
    await fetchWithRetry(client, "/api/down", 2, 10, [503, 503, 503]);
  } catch (error) {
    console.log(`   → ném lỗi sau cùng: ${error instanceof HttpError ? `HTTP ${error.status} ${error.code}` : String(error)}`);
  }
  console.log("");

  console.log("5️⃣ safeCall — wrap lỗi thành kết quả { ok, error } thay vì throw:");
  const result = await safeCall(() => fetchWithTimeout(client, "/api/slow-report", 50, 300));
  if (result.ok) {
    console.log(`   → OK: ${JSON.stringify(result.data)}`);
  } else {
    console.log(`   → Không OK: ${result.error?.code} — code caller vẫn chạy tiếp được`);
  }
  console.log("");

  console.log("✅ REST client: timeout + retry/backoff + error handling = gọi API bền bỉ, dễ kiểm soát");
}

run();
export {};