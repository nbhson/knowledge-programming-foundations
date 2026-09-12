# 🚀 10.6 Redis

> **Redis** là in-memory data store, dùng làm cache, message queue, session store, và nhiều more.

```
┌─────────────────────────────────────────────────────────────┐
│           REDIS USE CASES                                  │
├───────────────────┬─────────────────────────────────────────┤
│ Cache             │ Giảm tải DB, tăng speed                │
│ Session Store     │ Lưu session user nhanh                 │
│ Rate Limiting     │ Đếm request theo thời gian thực        │
│ Leaderboard       │ Sorted set cho game score               │
│ Message Queue     │ Publish/subscribe, job queue           │
│ Real-time         │ Chat, notification, live data          │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 📐 Redis Data Structures

| Structure | Mô tả | Ví dụ dùng |
|-----------|-------|-----------|
| **String** | Key-value đơn giản | Cache, counter, session |
| **Hash** | Field-value map | User profile, object |
| **List** | Linked list | Queue, recent activity |
| **Set** | Unique unordered | Tags, friend list |
| **Sorted Set** | Unique + score | Leaderboard, ranking |
| **Bitmap** | Bit array | Active users, flags |
| **HyperLogLog** | Cardinality estimate | Unique visitors |
| **Geospatial** | Lat/lng data | Nearby search |

---

## 💻 Commands Reference

```redis
# ── STRING ──────────────────────────────────────
SET user:1:name "Alice"
GET user:1:name
SETEX user:1:session 3600 "abc123"      # với TTL
INCR view_count:post:123                # increment
INCRBY view_count:post:123 10           # increment by N
MSET user:1:name "Alice" user:1:email "a@b.com"
MGET user:1:name user:1:email

# ── HASH ────────────────────────────────────────
HSET user:1 name "Alice" email "a@b.com" age 30
HGET user:1 name
HGETALL user:1
HINCRBY user:1 age 1
HMSET user:1 status "active" role "admin"
HDEL user:1 status

# ── LIST ────────────────────────────────────────
RPUSH tasks "task1" "task2" "task3"     # thêm cuối
LPUSH tasks "task0"                      # thêm đầu
LPOP tasks                               # lấy và xóa đầu
RPOP tasks                               # lấy và xóa cuối
LRANGE tasks 0 -1                        # lấy tất cả
BLPOP tasks 10                           # blocking pop (queue)

# ── SET ────────────────────────────────────────
SADD tags:post:1 "redis" "database" "cache"
SMEMBERS tags:post:1
SISMEMBER tags:post:1 "redis"           # kiểm tra thành viên
SINTER tags:post:1 tags:post:2          # giao
SUNION tags:post:1 tags:post:2          # hợp
SDIFF tags:post:1 tags:post:2           # hiệu

# ── SORTED SET (Leaderboard) ───────────────────
ZADD leaderboard 100 "Alice" 200 "Bob" 150 "Carol"
ZRANGE leaderboard 0 -1 WITHSCORES       # thứ tự tăng
ZREVRANGE leaderboard 0 9 WITHSCORES     # top 10
ZINCRBY leaderboard 50 "Alice"           # tăng score
ZREM leaderboard "Alice"                 # xóa

# ── KEYS & TTL ────────────────────────────────
EXISTS user:1
DEL user:1
TTL user:1                              # thời gian sống (giây)
PEXPIRE user:1 60000                    # TTL ms
KEYS "user:*"                           # ⚠️ Chỉ dùng khi dev!
```

---

## 🏗️ TypeScript + Redis Client

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

// ── Cache Pattern ─────────────────────────────
async function getUserCached(userId: string) {
  const key = `user:${userId}`;

  // 1. Try cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — fetch from DB
  const user = await db.users.findById(userId);
  if (!user) return null;

  // 3. Store in cache (TTL 5 phút)
  await redis.set(key, JSON.stringify(user), 'EX', 300);
  return user;
}

// ── Rate Limiting ─────────────────────────────
async function isRateLimited(userId: string, limit = 10): Promise<boolean> {
  const key = `rate:${userId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60); // reset sau 1 phút
  }

  return current > limit;
}

// ── Leaderboard ───────────────────────────────
async function updateScore(gameId: string, userId: string, score: number) {
  await redis.zadd(`leaderboard:${gameId}`, score, userId);
}

async function getTopPlayers(gameId: string, limit = 10) {
  return redis.zrevrangewithscore(
    `leaderboard:${gameId}`,
    0,
    limit - 1
  );
}
```

---

## 💾 Persistence Options

```
┌─────────────────────────────────────────────────────────────┐
│           PERSISTENCE MODES                               │
├───────────────────┬─────────────────────────────────────────┤
│ RDB (Snapshot)    │ Chụp ảnh DB theo khoảng thời gian      │
│                   │ • Nhanh, file nhỏ                      │
│                   │ • Mất data giữa các snapshot           │
│                   │ • Dùng cho backup                      │
├───────────────────┼─────────────────────────────────────────┤
│ AOF (Append Only) │ Ghi lại mọi write operation            │
│                   │ • An toàn hơn (configurable)           │
│                   │ • File lớn hơn                         │
│                   │ • Phục hồi nhanh hơn                  │
├───────────────────┼─────────────────────────────────────────┤
│ Neither           │ Cache-only mode — không lưu持久        │
│                   │ • Nhanh nhất                          │
│                   │ • Mất hết data khi restart            │
│                   │ • Dùng cho cache thuần túy             │
└───────────────────┴─────────────────────────────────────────┘
```

```conf
# redis.conf
# RDB — snapshot mỗi 60s nếu có >= 1 key đổi
save 60 1

# AOF — ghi mỗi giây
appendonly yes
appendfsync everysec

# Kết hợp cả hai (recommended)
# Redis dùng AOF để recover, rồi rebuild RDB
```

---

## ⚠️ Common Patterns & Anti-patterns

```
┌─────────────────────────────────────────────────────────────┐
│           PATTERNS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Cache-Aside (lazy loading)                              │
│     1. Check cache                                          │
│     2. MISS → query DB → store cache                       │
│     3. HIT → return cached                                 │
│                                                             │
│  ✅ Write-Invalidate                                        │
│     Update DB → Xóa cache (không update cache)             │
│                                                             │
│  ✅ Pub/Sub                                                 │
│     publish channel "news" "message"                       │
│     subscribe "news" callback                              │
│                                                             │
│  ❌ Dùng Redis làm primary database                        │
│     → Không có ACID đầy đủ, risk data loss                  │
│                                                             │
│  ❌ Key quá lớn (> 10KB)                                   │
│     → Dùng hash thay vì string                             │
│                                                             │
│  ❌ Quên TTL cho cache key                                 │
│     → Memory leak, stale data                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Redis vs Memcached

| Feature | Redis | Memcached |
|---------|-------|-----------|
| Data structures | ✅ Nhiều loại | ❌ Chỉ string |
| Persistence | ✅ RDB/AOF | ❌ Không |
| Pub/Sub | ✅ Có | ❌ Không |
| Atomic operations | ✅ Có | ⚠️ Giới hạn |
| Complexity | Trung bình | Đơn giản |
| Use case | Đa năng | Cache thuần túy |

---

## 📚 Tài liệu tham khảo

- 📖 [Redis Documentation](https://redis.io/docs/)
- 📖 [Redis Commands Cheat Sheet](https://redis.io/commands/)
- 📖 [Redis Labs Blog](https://redis.io/blog/)

---

⏭️ Bạn đã hoàn thành nhóm này! 🎉
