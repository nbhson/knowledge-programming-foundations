/**
 * 5.6.2 Retry Pattern — exponential backoff + jitter Demo
 *
 * Thử lại thao tác có lỗi tạm thời với khoảng chờ tăng dần
 * (backoff: 200ms, 400ms, 800ms...) + jitter ngẫu nhiên để
 * nhiều client không retry đồng loạt (tránh thundering herd).
 */

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface RetryConfig {
  attempts: number;
  baseDelay: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 4, baseDelay = 60 }: RetryConfig,
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === attempts) break;
      const backoff = baseDelay * 2 ** (i - 1);   // 60, 120, 240, ...
      const jitter = Math.floor(Math.random() * backoff); // 0..backoff
      console.log(`      🔁 attempt ${i} fail → chờ ${backoff + jitter}ms (backoff + jitter)`);
      await sleep(backoff + jitter);
    }
  }
  throw lastError;
}

// Service hồi phục sau 3 lần fail
function makeUnstableService(calls: { n: number }): () => Promise<string> {
  return async () => {
    calls.n++;
    if (calls.n < 4) throw new Error("502 Bad Gateway — tạm thời quá tải");
    return "✅ 200 OK: dữ liệu được trả về";
  };
}

// ────────────────────────────────── Demo ────────────────────────────────────
async function main(): Promise<void> {
console.log("=== 5.6.2 Retry Pattern Demo ===");
console.log("");

const calls = { n: 0 };
const fetchData = makeUnstableService(calls);

console.log("   Gọi API có transient failure → retry với exponential backoff:");
try {
  const result = await withRetry(fetchData, { attempts: 4, baseDelay: 60 });
  console.log(`   Kết quả cuối: ${result}`);
} catch (err) {
  console.log(`   ❌ Hết attempts, trả lỗi: ${(err as Error).message}`);
}
console.log(`   Tổng số lần gọi service: ${calls.n}`);
console.log("");

// Ví dụ lỗi VĨNH VIỄN — retry cũng vô ích (chỉ nên retry lỗi tạm thời)
console.log("   Lỗi 400 (lỗi client, vĩnh viễn) — 4.1 JWT hết hạn:");
const permanent = async (): Promise<string> => {
  throw new Error("400 Bad Request — token hết hạn");
};
try {
  await withRetry(permanent, { attempts: 3, baseDelay: 10 });
} catch (err) {
  console.log(`   ❌ Vẫn fail sau retry: ${(err as Error).message}`);
  console.log("      → Kết luận: chỉ retry lỗi tạm thời (5xx/timeout/network), KHÔNG retry lỗi 4xx");
}
console.log("");
console.log("✅ Retry + exponential backoff + jitter giúp vượt lỗi thoáng qua mà không dồn tải target");
}
void main();
export {};