# 🚦 11.6 Rate Limiting (Kiểm Soát Tốc Độ API)

> **Rate Limiting** giới hạn số request/client — bảo vệ API khỏi abuse, DDoS, và chi phí cao.

---

## 🎯 Thuật Toán Rate Limiting

```
┌─────────────────────────────────────────────────────────────┐
│              ALGORITHM COMPARISON                           │
├───────────────────┬─────────────────┬──────────────────────┤
│ Algorithm         │    Token Bucket │   Sliding Window     │
├───────────────────┼─────────────────┼──────────────────────┤
│ Cơ chế            │ Tokens refill   │ Đếm request trong    │
│                   │ liên tục        │ window time          │
│ Burst允许?        │ ✅ (dùng token  │ ❌ (cứng boundary)   │
│                   │  dự trữ)        │                      │
│ Độ chính xác      │ Trung bình      │ Cao                  │
│ Implement         │ Đơn giản        │ Phức tạp hơn         │
│ Redis support     │ ✅incr + EXPIRE │ ZSET sorted set      │
└───────────────────┴─────────────────┴──────────────────────┘
```

---

## 11.6.1 Token Bucket (Express Middleware)

```typescript
// middleware/rateLimit.ts
interface RateLimitOptions {
  windowMs: number;    // ms
  max: number;         // requests per window
}

function tokenBucketLimit(options: RateLimitOptions) {
  const buckets = new Map<string, { tokens: number; lastRefill: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();
    const bucket = buckets.get(key) ?? {
      tokens: options.max,
      lastRefill: now
    };

    // Refill tokens
    const elapsed = now - bucket.lastRefill;
    const refillRate = options.max / options.windowMs;
    bucket.tokens = Math.min(
      options.max,
      bucket.tokens + elapsed * refillRate
    );
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      buckets.set(key, bucket);
      next();
    } else {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Quá nhiều yêu cầu' }
      });
    }
  };
}

// Usage
app.use('/api/', tokenBucketLimit({ windowMs: 60000, max: 100 }));
```

---

## 11.6.2 Sliding Window (Redis-backed)

```typescript
// middleware/rateLimitRedis.ts
import Redis from 'ioredis';
const redis = new Redis();

async function slidingWindowLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const windowStart = Date.now() - windowMs;
  const redisKey = `rate:${key}`;

  // Xóa các request cũ
  await redis.zremrangebyscore(redisKey, 0, windowStart);

  // Đếm request trong window hiện tại
  const currentCount = await redis.zcard(redisKey);

  if (currentCount >= maxRequests) {
    return false;
  }

  // Thêm request mới với timestamp làm score
  await redis.zadd(redisKey, Date.now(), `${Date.now()}:${Math.random()}`);
  await redis.expire(redisKey, Math.ceil(windowMs / 1000) + 1);

  return true;
}

// Express middleware
app.use('/api/', async (req, res, next) => {
  const key = req.ip;
  const allowed = await slidingWindowLimit(key, 100, 60000);

  if (!allowed) {
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Bạn đã vượt quá giới hạn' }
    });
  }

  next();
});
```

---

## 📋 Khi Nào Áp Dụng Rate Limiting

| Scenario | Window | Limit | Lý do |
|----------|--------|-------|-------|
| Login endpoint | 15 phút | 5 attempts | Chống brute-force |
| API public | 1 giờ | 1000 requests | Chống abuse |
| Search endpoint | 1 phút | 30 requests | Giảm load DB |
| WebSocket connect | 1 phút | 10 connections | Chống spam conn |

---

## 🔗 Liên Quan

- **11.5 REST Clients** — Retry logic cho 429
- **9.5 Encryption** — Bảo vệ API keys

---

## ⏭️ Bạn đã hoàn thành Nhóm 11: Networking & APIs!
