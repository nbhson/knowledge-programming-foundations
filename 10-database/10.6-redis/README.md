# 🚀 10.6 Redis

> **Redis** là in-memory data store, dùng làm cache, message queue, session store, và nhiều use cases khác. Ra đời 2009 bởi Salvatore Sanfilippo, Redis đã trở thành **standard** cho in-memory computing nhờ đơn giản (5 data structures cơ bản) nhưng cực kỳ mạnh mẽ (atomic operations, persistence, pub/sub, clustering). Điểm khác biệt then chốt: Redis lưu data **trong RAM** — tốc độ access ~nanosecond so với disk ~millisecond, tức là **100,000x nhanh hơn** lưu trữ truyền thống.

---

## 🎯 Redis là gì và tại sao chọn nó?

Redis không phải "database thay thế PostgreSQL" — nó là **complement** cho database chính. Use case chính:

1. **Cache layer** — reduce DB load, sub-ms response time
2. **Session store** — fast user state across requests
3. **Rate limiter** — atomic counters with TTL
4. **Message queue** — publish/subscribe, job queues
5. **Real-time leaderboards** — sorted sets for ranking
6. **Geospatial** — find nearby items (restaurants, users)
7. **Pub/Sub broadcasting** — chat, notifications, live updates

**Tại sao Redis nhanh đến vậy?**
- Data trong RAM — không có disk I/O
- Single-threaded event loop — no lock contention, no context switching overhead
- Simple data structures — O(1) or O(log n) operations
- Pipeline — batch multiple commands in 1 round-trip
- Lua scripting — atomic multi-step operations

**Trade-off:** RAM đắt hơn disk ~100x theo dung lượng. Redis phù hợp cho **hot data** (thường truy cập), không phải archive.

---

## 📐 Redis Data Structures — Five pillars

| Structure | Mô tả | Complexity | Ví dụ dùng |
|-----------|-------|-----------|-----------|
| **String** | Binary-safe string, up to 512MB | O(1) | Cache, counter, session, rate limit |
| **Hash** | Field-value map (like JS object) | O(1) | User profile, product details |
| **List** | Doubly-linked list | O(1) push/pop ends | Queue, recent activity, timeline |
| **Set** | Unordered unique collection | O(1) avg | Tags, friend lists, unique visitors |
| **Sorted Set** | Unique + score (ranking) | O(log n) | Leaderboard, priority queue, rate limit window |
| **Bitmap** | Bit array (1 bit per element) | O(1) | Active users, feature flags, bloom filter |
| **HyperLogLog** | Cardinality estimate (approx) | O(1) space | Unique visitors, distinct counts |
| **Geospatial** | Lat/lng stored as sorted set | O(log n) | Nearby search, geofencing |

> 💡 **Quy tắc chọn structure:** muốn atomic increment → String INCR. Muốn unique collection → Set. Muốn ranked collection → Sorted Set. Muốn object-like → Hash. Muốn ordered queue → List.

---

## 💻 Commands Reference — Essential operations

```redis
# ═══════════════════════════════════════════════════════════
# ── STRING ───────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════

SET user:1:name "Alice"           # Đặt key-value
GET user:1:name                   # Đọc giá trị → "Alice"
DEL user:1:name                   # Xóa key

# Atomic operations — quan trọng cho counters/rate limiting
INCR view_count:post:123          # Tăng 1, trả về giá trị mới
INCRBY view_count:post:123 10     # Tăng 10
DECR balance:account:1            # Giảm 1
DECRBY balance:account:1 50       # Giảm 50
GETEX user:1:session EX 1800      # Đọc + đổi TTL (Redis 6.2+)
GETSET user:1:counter 0           # Set + get old value (atomic)
APPEND user:1:name " Jr."         # Nối vào cuối string

# Batch operations
MSET user:1:name "Alice" user:1:email "a@b.com" user:1:role "admin"
MGET user:1:name user:1:email     # Trả về array giá trị
STRLEN user:1:name                # Độ dài string
GETRANGE user:1:name 0 4          # substring (0-indexed)
SETRANGE user:1:name 5 " Jr."     # overwrite substring

# Conditional set — distributed lock primitive
SETNX lock:order:456 "processing" # Set if Not eXists → return 1 if set, 0 if exists
EXPIRE lock:order:456 30          # TTL 30s (prevent deadlock if holder crashes)

# Value with TTL
SETEX user:1:session 3600 "abc123token"   # Set + expire in 1 hour
PSETEX user:1:session 3600000 "abc123"    # Same but milliseconds


# ═══════════════════════════════════════════════════════════
# ── HASH ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════

HSET user:1 name "Alice" email "a@b.com" age 30
HGET user:1 name                     # "Alice"
HGETALL user:1                       # {name: Alice, email: a@b.com, age: 30}
HMSET user:1 status "active" role "admin"
HINCRBY user:1 age 1                 # Increment field atomically → age: 31
HDEL user:1 status                   # Delete field
HEXISTS user:1 email                 # 1 (exists)
HLEN user:1                          # 3 (field count)
HKEYS user:1                         # [name, email, age]
HVALS user:1                         # [Alice, a@b.com, 30]


# ═══════════════════════════════════════════════════════════
# ── LIST ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════

RPUSH tasks "task1" "task2" "task3"   # Thêm cuối → [task1, task2, task3]
LPUSH tasks "task0"                    # Thêm đầu → [task0, task1, task2, task3]
LPOP tasks                             # Lấy và xóa đầu → "task0"
RPOP tasks                             # Lấy và xóa cuối → "task3"
LRANGE tasks 0 -1                      # Lấy tất cả → [task1, task2]
LINDEX tasks 1                         # Get by index → "task2"
LLEN tasks                             # List length → 2
BLPOP tasks 10                         # Blocking pop — wait up to 10s for item
BRPOP tasks 10                         # Blocking pop from right

# Use case: Job queue
RPUSH job:queue "process_email:123"
RPUSH job:queue "send_notification:456"
# Worker:
BLPOP job:queue 0   # Block forever until job available


# ═══════════════════════════════════════════════════════════
# ── SET ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════

SADD tags:post:1 "redis" "database" "cache"
SMEMBERS tags:post:1             # {redis, database, cache}
SISMEMBER tags:post:1 "redis"    # 1 (member)
SCARD tags:post:1                # 3 (cardinality)
SREM tags:post:1 "cache"         # Remove element
SRANDMEMBER tags:post:1 2        # Get 2 random members (without remove)

# Set operations — powerful for tagging/following systems
SADD tags:post:2 "redis" "cloud"
SINTER tags:post:1 tags:post:2   # Giao: {redis}
SUNION tags:post:1 tags:post:2   # Hợp: {redis, database, cache, cloud}
SDIFF tags:post:1 tags:post:2    # Hiệu: {database, cache}

# Use case: Follow system
SADD user:1:followers user:2 user:3 user:4
SADD user:2:followers user:1 user:3
SINTER user:1:followers user:2:followers  # Mutual followers: {user:3}


# ═══════════════════════════════════════════════════════════
# ── SORTED SET (Leaderboard) ─────────────────────────────
# ═══════════════════════════════════════════════════════════

ZADD leaderboard 100 "Alice" 200 "Bob" 150 "Carol"
ZRANGE leaderboard 0 -1 WITHSCORES     # Rank ascending: Alice(100), Carol(150), Bob(200)
ZREVRANGE leaderboard 0 9 WITHSCORES   # Top 10 descending: Bob(200), Carol(150), Alice(100)
ZREVRANK leaderboard "Bob"             # Rank of Bob: 0 (highest score)
ZINCRBY leaderboard 50 "Alice"         # Alice: 100+50 = 150
ZREM leaderboard "Alice"               # Remove member
ZCARD leaderboard                      # Member count: 2
ZCOUNT leaderboard 100 200             # Count members in score range

# Score-based range queries
ZADD rankings 95 "player1" 87 "player2" 92 "player3" 78 "player4"
ZRANGEBYSCORE rankings 80 95 WITHSCORES  # All players with score 80-95


# ═══════════════════════════════════════════════════════════
# ── KEYS & TTL Management ────────────────────────────────
# ═══════════════════════════════════════════════════════════

EXISTS user:1                      # 1 (true)
TYPE user:1                        # "string"
DEL user:1                         # Delete
TTL user:1                         # Seconds until expire: 3540
PEXTTL user:1                      # Milliseconds until expire
EXPIRE user:1 3600                 # Set TTL to 1 hour
PEXPIRE user:1 3600000             # Set TTL in milliseconds
EXPIREAT user:1 1704067200         # Set expire at unix timestamp
KEYS "user:*"                      # ⚠️ Chỉ dùng khi dev! Trong prod dùng SCAN
SCAN 0 MATCH "user:*" COUNT 100    # Non-blocking key scan (production safe)
```

---

## 🏗️ TypeScript + Redis Client — Patterns

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,  // Never auto-retry, handle yourself
  retryDelayOnFailover: 100,
  lazyConnect: true,           // Connect on first command
});

// Listen for connection events
redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));
redis.on('reconnecting', (ms) => console.log(`🔄 Reconnecting in ${ms}ms`));


// ═══════════════════════════════════════════════════════════
// ── Pattern 1: Cache-Aside (Lazy Loading) ────────────────
// ═══════════════════════════════════════════════════════════
// Most common pattern: check cache first, miss → DB → store cache

async function getUserCached(userId: string) {
  const key = `user:${userId}`;

  // 1. Try cache (O(1) memory read)
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — fetch from database
  const user = await db.users.findById(userId);
  if (!user) return null;

  // 3. Store in cache with TTL (5 minutes)
  //    Why TTL? Prevents stale data indefinitely
  await redis.set(key, JSON.stringify(user), 'EX', 300);

  return user;
}

// Write-invalidate pattern — update DB first, then delete cache
async function updateUser(user: Partial<User>) {
  await db.users.updateById(user.id, user);
  await redis.del(`user:${user.id}`);  // Invalidate, don't update cache
  // Why invalidate instead of update? Simpler, avoids race conditions
}


// ═══════════════════════════════════════════════════════════
// ── Pattern 2: Rate Limiting (Sliding Window) ────────────
// ═══════════════════════════════════════════════════════════
// Atomic counter with TTL — perfect for API rate limits

async function isRateLimited(userId: string, limit = 10, windowMs = 60_000): Promise<boolean> {
  const key = `rate:${userId}`;

  // INCR is atomic — safe under concurrent requests
  const current = await redis.incr(key);

  // On first request in window, set TTL
  if (current === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }

  return current > limit;
}

// Usage in Express middleware
app.use('/api/', async (req, res, next) => {
  const limited = await isRateLimited(req.ip, 100, 60_000);
  if (limited) {
    return res.status(429).json({ error: 'Rate limited' });
  }
  res.setHeader('X-RateLimit-Remaining', String(100 - (await redis.get(`rate:${req.ip}`))));
  next();
});


// ═══════════════════════════════════════════════════════════
// ── Pattern 3: Leaderboard (Sorted Set) ──────────────────
// ═══════════════════════════════════════════════════════════

async function updateScore(gameId: string, userId: string, score: number) {
  // ZADD with NX flag: only update if score is HIGHER (not lower)
  await redis.zadd(`leaderboard:${gameId}`, score, userId);
}

async function getTopPlayers(gameId: string, limit = 10) {
  // ZREVRANGE with scores — top N descending
  const results = await redis.zrevrangebyscore(
    `leaderboard:${gameId}`,
    '+inf', '-inf',
    'WITHSCORES',
    'LIMIT', 0, limit
  );
  // Results: ["player1", "200", "player2", "150", ...]
  const players = [];
  for (let i = 0; i < results.length; i += 2) {
    players.push({ userId: results[i], score: parseInt(results[i + 1]) });
  }
  return players;
}

async function getPlayerRank(gameId: string, userId: string) {
  // ZREVRANK: 0 = highest score (leader)
  const rank = await redis.zrevrank(`leaderboard:${gameId}`, userId);
  return rank !== null ? rank + 1 : null;  // 1-indexed
}


// ═══════════════════════════════════════════════════════════
// ── Pattern 4: Pub/Sub (Real-time messaging) ─────────────
// ═══════════════════════════════════════════════════════════

// Publisher — send message to channel
async function publishNotification(channel: string, message: any) {
  await redis.publish(channel, JSON.stringify(message));
}

// Subscriber — receive messages (fire-and-forget)
function subscribeToNotifications(channel: string, handler: (msg: any) => void) {
  const subscriber = redis.createClient();
  subscriber.subscribe(channel, (err, count) => {
    if (err) console.error('Subscribe error:', err);
    console.log(`Subscribed to ${channel} (${count} channels)`);
  });

  subscriber.on('message', (chan, msg) => {
    if (chan === channel) handler(JSON.parse(msg));
  });

  return subscriber;  // Return to call .quit() when done
}

// Usage
const sub = subscribeToNotifications('order-updates', (msg) => {
  console.log(`New order: ${msg.orderId}, total: $${msg.total}`);
});


// ═══════════════════════════════════════════════════════════
// ── Pattern 5: Distributed Lock ──────────────────────────
// ═══════════════════════════════════════════════════════════
// Prevent race conditions across multiple app instances

async function withDistributedLock(lockKey: string, ttlMs: number, fn: () => Promise<any>) {
  const lockValue = `${Date.now()}-${Math.random()}`;  // Unique value
  const acquired = await redis.set(lockKey, lockValue, 'EX', ttlMs / 1000, 'NX');

  if (!acquired) throw new Error(`Lock already held: ${lockKey}`);

  try {
    return await fn();
  } finally {
    // Only delete if we still own the lock (check value)
    const current = await redis.get(lockKey);
    if (current === lockValue) {
      await redis.del(lockKey);
    }
  }
}

// Usage: prevent double-order creation
async function createOrder(userId: string, items: any[]) {
  return withDistributedLock(`order-lock:${userId}`, 5000, async () => {
    return orderService.create(userId, items);
  });
}


// ═══════════════════════════════════════════════════════════
// ── Pattern 6: Pipeline (Batch commands) ─────────────────
// ═══════════════════════════════════════════════════════════
// Reduce round-trips: 10 commands in 1 network round-trip

async function batchGetUsers(userIds: string[]) {
  const pipeline = redis.pipeline();
  userIds.forEach(id => pipeline.get(`user:${id}`));
  const results = await pipeline.exec();
  return results.map(([err, value]) => err ? null : value);
}

async function batchSetUserProfiles(profiles: Array<{ id: string; data: any }>) {
  const pipeline = redis.pipeline();
  profiles.forEach(({ id, data }) => {
    pipeline.setex(`profile:${id}`, 3600, JSON.stringify(data));
  });
  return pipeline.exec();
}
```

---

## 💾 Persistence Options — RDB vs AOF

```
┌─────────────────────────────────────────────────────────────┐
│           PERSISTENCE MODES                                │
├───────────────────┬─────────────────────────────────────────┤
│ RDB (Snapshot)    │ Chụp ảnh DB theo khoảng thời gian       │
│                   │ • Nhanh, file nhỏ (~MB cho GB data)     │
│                   │ • Mất data giữa các snapshot             │
│                   │ • Fork process → write fork's memory    │
│                   │ • Dùng cho backup, failover             │
├───────────────────┼─────────────────────────────────────────┤
│ AOF (Append Only) │ Ghi lại MỌI write operation             │
│                   │ • An toàn hơn (configurable fsync)      │
│                   │ • File lớn hơn (text log)               │
│                   │ • Phục hồi nhanh hơn (sequential read)  │
│                   │ • Có thể rewrite (truncation)           │
├───────────────────┼─────────────────────────────────────────┤
│ Both (Recommended)│ Kết hợp cả hai                         │
│                   │ • AOF cho durability, RDB cho backup   │
│                   │ • Redis dùng AOF để recover,            │
│                     rồi rebuild RDB periodically            │
├───────────────────┼─────────────────────────────────────────┤
│ Neither           │ Cache-only mode — không lưu持久          │
│                   │ • Nhanh nhất (no disk I/O)             │
│                   │ • Mất hết data khi restart              │
│                   │ • Dùng cho cache thuần túy              │
└───────────────────┴─────────────────────────────────────────┘
```

```conf
# redis.conf — Persistence configuration
# RDB — snapshot mỗi 60s nếu có ≥ 1 key đổi
save 60 1

# AOF — ghi mỗi giây (balance between performance and durability)
appendonly yes
appendfsync everysec

# AOF rewrite — khi file quá lớn, tạo bản compact mới
auto-aof-rewrite-percentage 100   # Rewrite khi AOF grow 100% from last rewrite
auto-aof-rewrite-min-size 64mb    # Minimum AOF size before trigger
```

> ⚠️ **Persistence trade-off:** `appendfsync everysec` (mặc định) có thể mất tối đa 1 giây data nếu Redis crash. Nếu cần strong durability → `appendfsync always` (slower writes). Nếu cache-only → disable cả RDB và AOF.

---

## ⚠️ Common Patterns & Anti-patterns

```
┌─────────────────────────────────────────────────────────────┐
│           PATTERNS & ANTI-PATTERNS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Cache-Aside (lazy loading)                              │
│     1. Check cache                                          │
│     2. MISS → query DB → store cache with TTL              │
│     3. HIT → return cached                                 │
│     → Đơn giản, chỉ cache khi cần, TTL prevent staleness   │
│                                                             │
│  ✅ Write-Invalidate                                        │
│     Update DB → Xóa cache (không update cache)             │
│     → Đơn giản, tránh race condition giữa write + cache     │
│     → Next read sẽ populate cache lại từ DB               │
│                                                             │
│  ✅ Pub/Sub                                                 │
│     publish channel "news" "message"                       │
│     subscribe "news" callback                              │
│     →广播消息, multiple listeners, fire-and-forget         │
│                                                             │
│  ✅ Sorted Set for Leaderboard                              │
│     ZADD leaderboard score member                           │
│     ZREVRANGE leaderboard 0 9 WITHSCORES                   │
│     → O(log n) insert, O(log n + N) range query            │
│                                                             │
│  ❌ Dùng Redis làm primary database                        │
│     → Không có ACID đầy đủ, single-key atomic only,         │
│       multi-key transactions limited (Redis 7+ improves)   │
│     → Risk data loss nếu persistence off hoặc crash        │
│                                                             │
│  ❌ Key quá lớn (> 10KB)                                   │
│     → Dùng hash thay vì string, hoặc chunk dữ liệu         │
│     → Large keys block single thread (Redis is single-threaded)│
│                                                             │
│  ❌ Quên TTL cho cache key                                 │
│     → Memory leak, stale data indefinitely                  │
│     → Rule: every cache key MUST have TTL                   │
│                                                             │
│  ❌ Keyspace scan (KEYS *) trong production                │
│     → Blocking single thread, O(n) where n = all keys      │
│     → Use SCAN instead: SCAN 0 MATCH "pattern:*" COUNT 100 │
│                                                             │
│  ❌ Không handle Redis connection failure gracefully       │
│     → Circuit breaker pattern: fallback to DB on cache miss │
│     → Timeout và retry với backoff                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Redis vs Memcached — So sánh

| Feature | Redis | Memcached | Khi nào chọn |
|---------|-------|-----------|-------------|
| Data structures | ✅ String, Hash, List, Set, ZSet, Bitmap, etc. | ❌ Chỉ string | Redis khi cần complex ops (counter, set ops) |
| Persistence | ✅ RDB + AOF | ❌ Không | Redis khi cần data survive restart |
| Pub/Sub | ✅ Native | ❌ Không | Redis khi cần messaging |
| Atomic operations | ✅ INCR, DECR, MULTI/EXEC, Lua | ⚠️ Giới hạn (INC only) | Redis khi cần atomic compound ops |
| Complexity | Trung bình (nhiều tính năng) | Đơn giản (只做缓存) | Memcached khi chỉ cần simple cache |
| Memory management | Eviction policies (allkeys-lru, volatile-ttl...) | LRU only | Cả 2 đều efficient, Redis flexible hơn |
| Use case | Đa năng (cache, queue, lock, pub/sub) | Cache thuần túy | Memcached cho simple cache-only workloads |

**Khi nào chọn Memcached?**
- Chỉ cần key-value cache, không cần persistence
- Multi-threaded architecture (Memcached multi-threaded, Redis single-threaded)
- Đơn giản hóa ops — less features = less to configure
- Khi workload là pure read-through cache với predictable hit rate

**Khi nào chọn Redis?**
- Cần data structures beyond string (sorted set for leaderboard, hash for objects)
- Cần pub/sub messaging
- Cần persistence (session data, temporary state)
- Cần atomic operations (INCR, Lua scripting)
- Khi dùng Redis là caching layer kèm database (cache-aside pattern)

---

## 🔗 Liên Quan

- **10.5 Indexes** — Redis sorted set index tương đương database B-tree index
- **11.6 Rate Limiting** — Redis INCR + EXPIRE là implementation kinh điển của rate limiter
- **11.4 WebSockets** — Redis pub/sub dùng để broadcast WebSocket messages across multiple server instances

---

## 📚 Tài liệu tham khảo

- [Redis Documentation](https://redis.io/docs/) — Official docs, comprehensive
- [Redis Commands Cheat Sheet](https://redis.io/commands/) — Quick reference
- [Redis Labs Blog](https://redis.io/blog/) — Deep dives on patterns and internals
- [Redis from Scratch](https://github.com/graphgi/redis-from-scratch) — Implement Redis in Go for learning

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.6-redis
npx ts-node examples/index.ts
```

Demo bao gồm: cache-aside pattern, rate limiting, leaderboard (sorted set), pub/sub messaging, và distributed lock. Chú ý cách mỗi pattern sử dụng data structure phù hợp — String cho cache, Sorted Set cho leaderboard, List cho queue.

---

## ⏭️ Bạn đã hoàn thành nhóm Database! 🎉

Tiếp theo: [11. Networking & APIs](../11-networking-apis/README.md) — tìm hiểu cách các hệ thống giao tiếp qua network.
