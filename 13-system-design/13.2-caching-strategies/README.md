# 🚀 13.2 Caching Strategies (Chiến Lược Cache)

> **Caching** lưu trữ dữ liệu thường truy cập ở vị trí nhanh hơn — giảm latency, giảm tải DB.

---

## 🎯 Cache Patterns

```
┌─────────────────────────────────────────────────────────┐
│  Client                                                 │
│       │                                                 │
│       ▼                                                 │
│  ┌─────────┐     Hit      ┌─────────┐                 │
│  │  Cache  │◀────────────│ (Redis) │                  │
│  │(Memory) │              └────┬────┘                 │
│  └────┬────┘     Miss         │                      │
│       │                      ▼                      │
│       └────────────▶ ┌─────────────┐                │
│                      │  Database   │                │
│                      └─────────────┘                │
└─────────────────────────────────────────────────────────┘
```

**Số liệu thực tế:**
- Cache (RAM local): ~0.1 ms/read
- Redis (same AZ): ~0.2–1 ms
- PostgreSQL (same machine SSD): ~5–10 ms
- PostgreSQL (remote): ~20–100 ms

Cache hit ratio 90% có thể giảm latency trung bình từ 30ms xuống ~3.9ms (`0.9×0.5 + 0.1×30`).

---

## 13.2.1 Cache-Aside (Pattern Phổ Biến Nhất)

**App tự kiểm cache trước khi vào DB.**

```typescript
async function getUserCacheAside(userId: string): Promise<User> {
  // 1. Check cache
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    console.log('Cache HIT');
    return JSON.parse(cached);
  }

  // 2. Cache MISS — fetch from DB
  console.log('LOG MISS');
  const user = await db.users.findById(userId);

  // 3. Store in cache (with TTL)
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  return user;
}
```

✅ **Ưu điểm:** Đơn giản, dễ implement, không phụ thuộc DB write
❌ **Nhược điểm:** Cache stampede (xem 13.2.5); stale read trong window miss→populate

**Stampede (thundering herd):** Khi key hot TTL expire cùng lúc, 1000 request cùng miss → 1000 query DB cùng lúc → DB sập. Giải pháp:

| Giải pháp | Cơ chế | Độ phức tạp |
|-----------|--------|-------------|
| **Jittered TTL** | TTL ngẫu nhiên xung quanh giá trị base | Thấp |
| **Single-flight (request coalescing)** | Lần miss đầu "giữ lock", các request khác chờ result | Trung bình |
| **Probabilistic early expiration** | Randomly expire early để rải TTL | Thấp |
| **Cache null values** | Cache cả "not found" với TTL ngắn | Thấp — tránh DB query cho dữ liệu không tồn tại |

**Single-flight mẫu:**

```typescript
const inflight = new Map<string, Promise<User>>();

async function getUserSafe(userId: string): Promise<User> {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  if (inflight.has(userId)) {
    return inflight.get(userId)!; // nhiều caller cùng chờ 1 query
  }

  const promise = (async () => {
    try {
      const user = await db.users.findById(userId);
      if (user) await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
      return user;
    } finally {
      inflight.delete(userId);
    }
  })();

  inflight.set(userId, promise);
  return promise;
}
```

---

## 13.2.2 Write-Through

**Viết đồng thời vào cache và DB.**

```typescript
async function updateUserWriteThrough(userId: string, data: Partial<User>): Promise<User> {
  const updated = await db.users.update(userId, data);

  // Đồng bộ write vào cache — luôn consistent với DB
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(updated));

  return updated;
}
```

✅ Data luôn đồng bộ giữa cache và DB
❌ Write latency cao (phải chờ cache + DB); nếu cache lỗi, write DB vẫn OK nhưng cache stale

**Khi nào dùng:** financial, billing, inventory — nơi consistency quan trọng hơn latency.

**Pitfall:** write-through không đảm bảo **read-your-writes** trong window ngắn (DB commit trước cache set, replica lag). Cần read từ primary hoặc cache-first-read.

---

## 13.2.3 Write-Behind (Write-Back)

**Viết vào cache trước, async sync xuống DB.**

```typescript
async function updateUserWriteBehind(userId: string, data: Partial<User>): Promise<void> {
  // Read current from cache hoặc DB
  const cached = await redis.get(`user:${userId}`);
  const user = cached ? JSON.parse(cached) : await db.users.findById(userId);

  Object.assign(user, data);

  // Update cache ngay — response nhanh
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  // Async batch write to DB — không chờ
  queueMicrotask(() => db.users.update(userId, data).catch(err => logError(err)));
}
```

✅ Write latency rất thấp (chỉ cache write ~0.5ms)
❌ Risk mất data nếu crash trước khi sync DB; không đảm bảo durability

**Khi nào dùng:** analytics, logs, metrics — nơi chấp nhận eventual consistency và có thể regenerate/reingest data.

---

## 13.2.4 So Sánh Strategies

| Pattern | Read latency | Write latency | Consistency | Use Case | Giải thích sâu |
|---------|-------------|---------------|-------------|----------|----------------|
| **Cache-Aside** | Fast (hit) / Slow (miss) | Fast (DB write only) | Eventually | Most cases | Simplest; developer phải tự invalidate. Risk: stale data trong window miss-populate. |
| **Write-Through** | Fast | Slow (DB + cache) | Strong | Financial, inventory | Guarantee freshness; write path phức tạp hơn, DB write phải thành công trước cache set. |
| **Write-Behind** | Fast | Very fast | Weak | Analytics, logs | Tách write path — cache response ngay, DB sau. Mất data risk khi crash; cần durable queue (Kafka) để safe. |
| **Refresh-Around** | Fast | Fast | Eventual | Hot data with refresh | Load trước khi expire TTL để tránh stampede; không invalidate, chỉ refresh background. |

---

## 13.2.5 Cache Invalidation

**Invalidation khó nhất trong distributed systems** — Martin Kleppmann: *"There are only two hard things in Computer Science: cache invalidation and naming things."*

```typescript
// Strategy 1: TTL (Time-To-Live) — đơn giản nhất
await redis.setex('key', 3600, value); // Tự expire sau 1 giờ

// Strategy 2: Manual invalidation — rõ ràng
await redis.del('user:123'); // Xóa khi data thay đổi

// Strategy 3: Cache-Aside với versioning — tránh stale read
await redis.set(`user:123:v${version}`, value);
// reader đọc version; nếu khác với DB → cache miss
```

**So sánh strategies:**

| Strategy | Cách hoạt động | Khi nào dùng | Nhược điểm |
|----------|---------------|-------------|------------|
| **TTL Expiry** | Tự expire sau thời gian | Content thay đổi định kỳ (product catalog mỗi ngày) | Dữ liệu stale đến TTL |
| **Cache Purge** | Xóa thủ công cache entry | Content thay đổi đột ngột (flash sale, breaking news) | Phải theo dõi dependency graph (cache nhiều key) |
| **Versioning** | Đổi filename/key khi update | Static assets (CSS, JS) — hash từ nội dung | Client cần hỗ trợ versioned URL |
| **Stale-While-Revalidate** | Serve cached + refresh background | High availability ưu tiên latency | User có thể thấy dữ liệu cũ 1–2s |
| **Write-Through/Back** | Database source of truth quyết định | Consistency quan trọng | Complexity thêm |

> 💡 **Thực hành tốt nhất:** kết hợp TTL ngắn (60–300s) + manual invalidation khi write. TTL là safety net; invalidation là main path.

**Cache dependency tracking:** nếu `user:123` cache, và `user:123:orders` cache — khi user update profile, phải invalidate cả 2. Dùng **cache tag/group** hoặc **key prefix convention** để bulk invalidate.

---

## 🎯 Khi nào dùng Caching?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|-----------|
| Read-heavy endpoint (> 90% reads) | ✅ Cache-Aside | DB query repeated nhiều lần — cache hit rate cao, tiết kiệm đáng kể |
| Expensive computation (sort/filter large) | ✅ Result cache | memoization pattern; hash input → cache output |
| Low-QPS admin dashboard | ❌ Không cần | Overhead cache management > lợi ích |
| Real-time stock availability | ⚠️ TTL cực ngắn + write-through | Stale seconds không được; write-through + TTL 5–10s |
| Personalized dynamic content | ❌ Khoan cache | User-specific, high variance; nếu cache thì per-user key (phức tạp, memory lớn) |

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — LB có thể cache response (nginx proxy_cache)
- **13.6 Scalable Architecture** — Cache là lớp đầu tiên trong hierarchy system design

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| Redis Documentation | https://redis.io/docs/ |
| Designing Data-Intensive Apps Ch. 6 (Caching) | https://dataintensive.net/ |

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.2-caching-strategies
npx tsx examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.3 CDN](../13.3-cdn/README.md)
