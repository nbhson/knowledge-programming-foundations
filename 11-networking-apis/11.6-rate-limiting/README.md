# 🚦 11.6 Rate Limiting (Kiểm Soát Tốc Độ API)

> **Rate Limiting** giới hạn số request/client — bảo vệ API khỏi abuse, DDoS, và chi phí cao. Nhưng rate limiting không chỉ là "ngăn bot spam" — nó là **traffic shaping** quan trọng cho hệ thống: đảm bảo fair usage, prevent resource exhaustion, protect downstream services (database, third-party APIs), và control costs. Hiểu đúng algorithm và deployment strategy là khác biệt giữa "rate limit hoạt động" và "rate limit gây ra downtime".

---

## 🎯 Tại sao cần rate limiting?

```
┌─────────────────────────────────────────────────────────────┐
│           WHY RATE LIMITING?                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Protect against abuse                                   │
│     • Brute-force login attempts (chống guess password)     │
│     • Credential stuffing (bot attacks)                     │
│     • Scraping / data theft                                 │
│     • DDoS (volume-based attacks)                           │
│                                                             │
│  2. Ensure fair usage                                       │
│     • Prevent one user from starving others                 │
│     • Tiered limits (free vs paid plans)                    │
│     • Resource allocation fairness                          │
│                                                             │
│  3. Protect downstream services                             │
│     • Database connection pool exhaustion                   │
│     • Third-party API quota limits (Twilio, Stripe, etc.)   │
│     • External service rate limits                          │
│                                                             │
│  4. Control costs                                           │
│     • Cloud compute costs scale with traffic                │
│     • Third-party API calls cost money                      │
│     • Cache invalidation storms (thundering herd)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rate limiting ≠ throttling:**
- **Rate limiting**: hard cap — reject requests beyond limit (HTTP 429)
- **Throttling**: soft cap — queue or delay requests (better UX, same protection)

Thực tế, production systems thường dùng cả hai: throttle cho user-facing actions, hard limit cho sensitive operations (login, payment).

---

## 🎯 Thuật Toán Rate Limiting — Deep comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ALGORITHM COMPARISON                                      │
├───────────────────┬─────────────────┬──────────────────────────────────┤
│ Algorithm         │   Token Bucket  │   Sliding Window Log           │
├───────────────────┼─────────────────┼──────────────────────────────────┤
│ Cơ chế            │ Tokens refill   │ Record each request timestamp    │
│                   │ liên tục        │ trong window                     │
│ Burst允许?        │ ✅ (dùng token  │ ❌ (cứng boundary)              │
│                   │  dự trữ)        │                                  │
│ Độ chính xác      │ Trung bình      │ Cao (per-request tracking)      │
│ Memory usage      │ O(1) per client │ O(n) per client (n = requests)  │
│ Implement         │ Đơn giản        │ Phức tạp hơn (sorted set)       │
│ Redis support     │ ✅incr + EXPIRE  │ ✅ZADD + ZREMRANGEBYSCORE       │
│ Perfect for       │ API rate limit  │ Precise security (login)        │
│                   │ general use     │                                  │
├───────────────────┼─────────────────┼──────────────────────────────────┤
│ Algorithm         │ Fixed Window    │   Sliding Window Counter       │
├───────────────────┼─────────────────┼──────────────────────────────────┤
│ Cơ chế            │ Count in fixed  │ Weighted combo of current +    │
│                   │ time bucket     │ previous window                │
│ Burst允许?        │ ❌ (edge spike) │ ✅ Smoothed                      │
│ Độ chính xác      │ Thấp (x2 error  │ Cao (~99% accuracy)            │
│                   │  tại boundary)  │                                  │
│ Memory usage      │ O(1) per client │ O(1) per client                │
│ Implement         │ Đơn giản        │ Trung bình (2 counters)        │
│ Redis support     │ ✅INCR + EXPIRE  │ ✅Lua script hoặc 2 keys       │
│ Perfect for       │ Simple apps     │ Production API limit            │
│                   │                 │                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Algorithm details:

**Token Bucket:**
- Mỗi client có "bucket" chứa N tokens
- Mỗi request tiêu thụ 1 token
- Tokens refill ở rate R tokens/second
- Nếu bucket empty → reject (429)
- Ưu điểm: cho phép burst up đến N requests
- Nhược điểm: không chính xác tại boundary (user có thể gửi 2N requests trong 1 giây nếu bucket đầy + refill)

**Sliding Window Log:**
- Lưu timestamp của MỌI request trong window
- Khi request đến: xóa timestamps cũ (< windowStart), đếm remaining
- Nếu count >= limit → reject
- Ưu điểm: chính xác nhất
- Nhược điểm: memory O(n) per client — với 1000 requests/min × 10000 clients = 10 triệu entries

**Fixed Window:**
- Chia thời gian thành bucket cố định (e.g., 0-60s, 60-120s)
- Đếm requests trong bucket hiện tại
- Nhược điểm: boundary spike — user gửi limit requests cuối window + limit requests đầu window next = 2x limit trong 1 giây

**Sliding Window Counter:**
- Hybrid: weighted average của fixed window trước + hiện tại
- count = prevCount × (1 - elapsed/windowSize) + currentCount
- Cân bằng giữa accuracy và memory

---

## 11.6.1 Token Bucket (Express Middleware) — In-memory implementation

```typescript
// middleware/rateLimit.ts — Token Bucket algorithm
interface RateLimitOptions {
  windowMs: number;    // milliseconds
  max: number;         // max requests per window
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  headers?: boolean;   // send X-RateLimit-* headers
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

function tokenBucketLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const {
    windowMs = 60_000,
    max = 100,
    keyGenerator = (req) => req.ip,
    skip = () => false,
    headers = true,
  } = options;

  const refillRate = max / windowMs;  // tokens per millisecond

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create bucket
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: max, lastRefill: now };
      buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    // Check if request allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      buckets.set(key, bucket);

      // Set rate limit headers
      if (headers) {
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
        res.setHeader('X-RateLimit-Reset', String(Math.ceil((windowMs - elapsed * (max / refillRate)) / 1000)));
      }

      next();
    } else {
      // Rate limited
      const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
          details: [],
          requestId: (req as any).requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

// Usage — global rate limit
app.use('/api/', tokenBucketLimit({ windowMs: 60_000, max: 100 }));

// Usage — stricter limit for sensitive endpoints
app.use('/api/auth/login', tokenBucketLimit({ windowMs: 900_000, max: 5 }));  // 5 per 15 minutes
```

> ⚠️ **In-memory limitation:** Token bucket middleware này dùng Map trong memory — mỗi server instance có state riêng. Trong production với nhiều instances (behind load balancer), mỗi instance sẽ có limit riêng → user thực tế có thể gửi N×instances requests. Solution: dùng Redis-backed rate limiter (xem bên dưới).

---

## 11.6.2 Sliding Window (Redis-backed) — Production-ready

```typescript
// middleware/rateLimitRedis.ts — Sliding Window Log với Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface RateLimitConfig {
  keyPrefix?: string;
  windowMs: number;
  maxRequests: number;
}

async function slidingWindowLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const {
    keyPrefix = 'rate',
    windowMs = 60_000,
    maxRequests = 100,
  } = config;

  const redisKey = `${keyPrefix}:${identifier}`;
  const windowStart = Date.now() - windowMs;

  try {
    // Pipeline: remove old entries + get count + add new entry
    const pipeline = redis.pipeline();

    // Remove requests outside window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);

    // Count remaining requests in window
    const currentCount = await pipeline.zcard(redisKey).exec();

    // Add current request with timestamp as score
    const requestId = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    pipeline.zadd(redisKey, Date.now(), requestId);

    // Set expiry (window + small buffer)
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000) + 10);

    const results = await pipeline.exec();
    const count = results[1][1] as number;  // zcard result
    const allowed = count < maxRequests;

    // Calculate reset time (when oldest request in window expires)
    const oldestInWindow = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const resetAt = oldestInWindow.length >= 2
      ? Math.ceil((parseInt(oldestInWindow[1]) + windowMs) / 1000)
      : Math.ceil((Date.now() + windowMs) / 1000);

    return {
      allowed,
      remaining: Math.max(0, maxRequests - count - 1),
      resetAt,
    };
  } catch (error) {
    // Fail open: if Redis is down, allow request (don't block legitimate traffic)
    console.error('Rate limit Redis error:', error);
    return { allowed: true, remaining: maxRequests, resetAt: 0 };
  }
}

// Express middleware wrapper
async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const identifier = req.ip;  // Or req.userId for authenticated users
  const config = { windowMs: 60_000, maxRequests: 100 };

  const result = await slidingWindowLimit(identifier, config);

  // Set headers
  res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(result.resetAt));

  if (!result.allowed) {
    const retryAfter = result.resetAt - Math.ceil(Date.now() / 1000);
    res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Bạn đã vượt quá giới hạn yêu cầu',
        details: [],
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  next();
}

app.use('/api/', rateLimitMiddleware);
```

### Different limits per endpoint — Strategy

```typescript
// Per-endpoint rate limits
const rateLimits: Record<string, RateLimitConfig> = {
  // Auth endpoints — strict to prevent brute-force
  '/api/auth/login':    { windowMs: 900_000, maxRequests: 5 },    // 5 per 15 min
  '/api/auth/register': { windowMs: 3_600_000, maxRequests: 3 },  // 3 per hour
  '/api/auth/reset-password': { windowMs: 3_600_000, maxRequests: 3 },

  // Search — moderate to prevent DB overload
  '/api/search': { windowMs: 60_000, maxRequests: 30 },

  // General API — generous
  '/api/': { windowMs: 60_000, maxRequests: 100 },

  // Webhook endpoints — no limit (trusted source)
  '/api/webhooks/': { windowMs: 60_000, maxRequests: 99999 },
};

// Middleware with endpoint-specific limits
app.use('/api/', async (req, res, next) => {
  const path = req.path;
  // Find most specific matching limit
  const config = Object.entries(rateLimits)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => path.startsWith(prefix))?.[1];

  if (!config) return next();  // No limit configured

  const result = await slidingWindowLimit(`${path}:${req.ip}`, config);
  // ... set headers and handle 429
});
```

---

## 📋 Khi Nào Áp Dụng Rate Limiting — Scenarios & Rationale

| Scenario | Window | Limit | Lý do | Lập luận sâu |
|----------|--------|-------|-------|-------------|
| **Login endpoint** | 15 phút | 5 attempts | Chống brute-force password guessing | Login là target #1 của attack. 5 attempts/15min = ~12 attempts/hour — đủ chậm để stop automated attack, không làm phiền user quên password |
| **Password reset** | 1 giờ | 3 requests | Chống enumeration + email spam | Reset token có thể dùng để verify email existence. Giới hạn chặt предотвращает mass registration abuse |
| **API public (authenticated)** | 1 giờ | 1000 requests | Chống abuse, protect downstream | Public API thường có tier pricing. 1000/hour ≈ 16 req/min — đủ cho legitimate use, chặn scraper |
| **API public (unauthenticated)** | 1 giờ | 100 requests | Protect without auth gate | Không có auth = khó trace abuse. Giới hạn theo IP chặt hơn, yêu cầu signup để tăng limit |
| **Search endpoint** | 1 phút | 30 requests | Giảm load DB full-text search | Search query thường expensive (full table scan, text indexing). 30/min = 0.5/sec — acceptable cho most users |
| **WebSocket connect** | 1 phút | 10 connections | Chống spam connections | Mỗi WS connection chiếm server resource (memory, event loop). 10 conn/user = đủ cho multi-tab, chặn bot |
| **File upload** | 1 giờ | 10 uploads | Prevent storage abuse | Upload tốn disk + CDN cost + processing time. 10/giờ prevent bulk upload attacks |
| **Webhook delivery** | — | Không limit | Trusted source | Webhook từ partner có IP whitelisting + HMAC signature verification — không cần rate limit |
| **Health check** | — | Không limit | Internal monitoring | Health endpoint từ internal monitoring tool — nên bypass all rate limits |

---

## 🔗 Liên Quan

- **11.5 REST Clients** — Retry logic cho 429 responses (exponential backoff + jitter)
- **10.6 Redis** — Redis-backed rate limiter implementation (ZSET sorted set pattern)

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.6-rate-limiting
npx ts-node examples/index.ts
```

Demo bao gồm: token bucket middleware, Redis sliding window, per-endpoint limits, và 429 response handling. Chú ý cách Redis được dùng làm shared state cho distributed rate limiting.

---

## ⏭️ Bài tiếp theo

Nhóm 11 đã hoàn thành — tiếp tục với concurrency:

→ [12.1 Async/Await](../../12-concurrency/12.1-async-await/README.md)
