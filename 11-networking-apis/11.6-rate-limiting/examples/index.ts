/**
 * 11.6 Rate Limiting - Sliding Window + Token Bucket Demo
 *
 * Mô phỏng 2 thuật toán giới hạn tốc độ bằng TS thuần:
 * - TokenBucket: tokens được nạp dần theo thời gian, mỗi request tiêu 1 token
 * - SlidingWindow: đếm số request trong cửa sổ trượt windowMs vừa qua
 *
 * Cả hai đều tính toán:
 * - remaining (số request còn được phép)
 * - retryAfterMs (sau bao lâu mới gọi lại được) → dùng cho header Retry-After
 *
 * KHÔNG dùng Redis thật — mô phỏng bằng Map + timestamp.
 */

// ─────────────────────────── Token Bucket ───────────────────────────

interface BucketState {
  tokens: number;
  lastRefill: number;
}

class TokenBucket {
  private bucket: BucketState;

  constructor(
    private readonly capacity: number, // tối đa tokens
    private readonly refillPerMs: number, // tốc độ nạp token
  ) {
    this.bucket = { tokens: capacity, lastRefill: Date.now() };
  }

  // Mỗi lần gọi: nạp token theo thời gian trôi, rồi cố tiêu 1 token
  tryConsume(): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const elapsedMs = now - this.bucket.lastRefill;
    this.bucket.tokens = Math.min(this.capacity, this.bucket.tokens + elapsedMs * this.refillPerMs);
    this.bucket.lastRefill = now;

    if (this.bucket.tokens >= 1) {
      this.bucket.tokens -= 1;
      return { allowed: true, remaining: Math.floor(this.bucket.tokens), retryAfterMs: 0 };
    }

    // Chờ tới khi có đủ 1 token
    const needed = 1 - this.bucket.tokens;
    const retryAfterMs = Math.ceil(needed / this.refillPerMs);
    return { allowed: false, remaining: 0, retryAfterMs };
  }
}

// ─────────────────────────── Sliding Window ───────────────────────────

class SlidingWindowLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const stamps = (this.requests.get(key) ?? []).filter((t) => t > windowStart);
    this.requests.set(key, stamps);

    if (stamps.length < this.maxRequests) {
      stamps.push(now);
      return { allowed: true, remaining: this.maxRequests - stamps.length, retryAfterMs: 0 };
    }

    // Cửa sổ trượt: request cũ nhất "rơi ra" sau bao lâu?
    const retryAfterMs = Math.max(0, stamps[0] + this.windowMs - now);
    return { allowed: false, remaining: 0, retryAfterMs };
  }
}

// ─────────────────────────── Mock HTTP Response ───────────────────────────

interface RateLimitResult {
  status: number; // 200 | 429
  headers: { "X-RateLimit-Limit": number; "X-RateLimit-Remaining": number; "Retry-After"?: number };
  body?: string;
}

// ───────────────────────────────── Demo ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== Rate Limiting Demo ===");
  console.log("");

  // ─────────────── 1. Token Bucket ───────────────
  console.log("1️⃣ Token Bucket — 3 tokens, nạp lại 1 token/20ms:");
  const bucket = new TokenBucket(3, 1 / 20); // capacity 3, nạp 1 token mỗi 20ms

  for (let i = 1; i <= 5; i++) {
    const result = bucket.tryConsume();
    const bar = result.allowed ? `✅ request ${i} OK` : `❌ request ${i} bị chặn`;
    console.log(`   ${bar} → remaining=${result.remaining}${result.allowed ? "" : `, retryAfter=${result.retryAfterMs}ms`}`);
  }

  console.log("   ⏳ chờ 25ms để token được nạp...");
  await sleep(25);
  const refilled = bucket.tryConsume();
  console.log(`   sau khi chờ: allowed=${refilled.allowed}, remaining=${refilled.remaining}`);
  console.log("");

  // ─────────────── 2. Sliding Window ───────────────
  console.log("2️⃣ Sliding Window — tối đa 3 request trong 100ms:");
  const limiter = new SlidingWindowLimiter(100, 3);
  const key = "client-123";

  for (let i = 1; i <= 5; i++) {
    const result = limiter.check(key);
    const bar = result.allowed ? `✅ request ${i} OK` : `❌ request ${i} bị chặn`;
    const headerText = result.allowed
      ? `X-RateLimit-Remaining: ${result.remaining}`
      : `Retry-After: ${result.retryAfterMs}ms`;
    console.log(`   ${bar} → ${headerText}`);
  }

  console.log("   ⏳ chờ 110ms để cửa sổ trượt mở lại...");
  await sleep(110);
  const afterWindow = limiter.check(key);
  console.log(`   sau khi chờ: allowed=${afterWindow.allowed}, remaining=${afterWindow.remaining}`);
  console.log("");

  // ─────────────── 3. HTTP response preview ───────────────
  console.log("3️⃣ Headers chuẩn trả về cho client (mô phỏng HTTP 429):");
  const makeResponse = (result: { allowed: boolean; remaining: number; retryAfterMs: number }, limit: number): RateLimitResult => ({
    status: result.allowed ? 200 : 429,
    headers: {
      "X-RateLimit-Limit": limit,
      "X-RateLimit-Remaining": result.remaining,
      ...(result.allowed ? {} : { "Retry-After": Math.ceil(result.retryAfterMs / 1000) }),
    },
    body: result.allowed ? "OK" : "Too Many Requests — hãy thử lại sau",
  });

  const bucketRes = makeResponse(bucket.tryConsume(), 3);
  console.log(`   ${bucketRes.status} ${JSON.stringify(bucketRes.headers)} → ${bucketRes.body}`);
  console.log("   (Retry-After tính theo giây — client nên tôn trọng header này)");
  console.log("");

  console.log("✅ Rate limiting: remaining + Retry-After giúp client biết lúc nào được gọi tiếp");
}

run();
export {};