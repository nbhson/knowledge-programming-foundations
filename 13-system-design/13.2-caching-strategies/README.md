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
  console.log('Cache MISS');
  const user = await db.users.findById(userId);
  
  // 3. Store in cache
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  return user;
}
```

✅ **Ưu điểm:** Đơn giản, dễ implement
❌ **Nhược điểm:** Cache stampede (nhiều request cùng miss)

---

## 13.2.2 Write-Through

**Viết đồng thời vào cache và DB.**

```typescript
async function updateUserWriteThrough(userId: string, data: Partial<User>) {
  const updated = await db.users.update(userId, data);
  
  // Đồng bộ write vào cache
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(updated));
  
  return updated;
}
```

✅ Data luôn一致 giữa cache và DB
❌ Write latency cao (phải chờ cache + DB)

---

## 13.2.3 Write-Behind (Write-Back)

**Viết vào cache trước, async sync xuống DB.**

```typescript
async function updateUserWriteBehind(userId: string, data: Partial<User>) {
  // Update cache ngay
  const cached = await redis.get(`user:${userId}`);
  const user = cached ? JSON.parse(cached) : await db.users.findById(userId);
  
  Object.assign(user, data);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  // Async write to DB (không chờ)
  setImmediate(async () => {
    await db.users.update(userId, data);
  });
}
```

✅ Write nhanh (async)
❌ Risk mất data nếu crash trước khi sync DB

---

## 13.2.4 So Sánh Strategies

| Pattern | Read | Write | Consistency | Use Case |
|---------|------|-------|-------------|----------|
| **Cache-Aside** | Fast (hit) / Slow (miss) | Fast | eventually | Most cases |
| **Write-Through** | Fast | Slow | Strong | Financial apps |
| **Write-Behind** | Fast | Very fast | Weak | Analytics, logs |
| **Refresh-Around** | Fast | Fast | eventual | Hot data |

---

## 13.2.5 Cache Invalidation

```typescript
// Strategy 1: TTL (Time-To-Live)
await redis.setex('key', 3600, value); // Tự expire sau 1 giờ

// Strategy 2: Manual invalidation
await redis.del('user:123'); // Xóa khi data thay đổi

// Strategy 3: Cache-Aside với versioning
await redis.set(`user:123:v${version}`, value);
```

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — LB có thể cache response
- **5.3 Performance Optimization** — Memoization, caching patterns

---

## ⏭️ Bài Tiếp Theo

→ [13.3 CDN](../13.3-cdn/README.md)
