# 🔬 5.3.1 Caching

> **Caching** là kỹ thuật lưu trữ dữ liệu đã xử lý ở vị trí truy xuất **nhanh hơn** để giảm latency và tải cho hệ thống.

```
❌ VẤN ĐỀ: Không có cache
Client → Server → Database → (chậm, mỗi request đều query)
                    ↑
                 Tải DB tăng, response chậm

✅ GIẢI PHÁP: Cache-Aside
Client → Server → [Cache HIT?] → (nhanh, trả cached)
                    → (MISS) → Database → Lưu cache → Trả kết quả
```

---

## 🎯 Vấn Đề

Không dùng caching:
- **DB overload**: Mỗi request đều query database
- **Latency cao**: Response chậm do chờ I/O
- **Chi phí tăng**: Cloud DB cost theo query count
- **Scalability kém**: Không scale được khi traffic tăng

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Không cache — mỗi lần query DB
// ─────────────────────────────────────────────
async function getUser(userId: string): Promise<User> {
  // Database call every single time
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  return user;
}

// ─────────────────────────────────────────────
// ✅ GOOD: Cache-Aside Pattern
// ─────────────────────────────────────────────
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

async function getUserWithCache(
  userId: string,
  cache: Cache,
  db: Database
): Promise<User> {
  // 1. Check cache first
  const cached = await cache.get<User>(`user:${userId}`);
  if (cached) {
    console.log('Cache HIT');
    return cached;
  }

  // 2. Cache MISS — fetch from DB
  console.log('Cache MISS — fetching from DB');
  const user = await db.findById(userId);

  // 3. Store in cache for 1 hour
  await cache.set(`user:${userId}`, user, 3600);
  return user;
}

// ─────────────────────────────────────────────
// ✅ GOOD: LRU Cache Implementation
// ─────────────────────────────────────────────
class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, V>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict least recently used (first item)
      const lruKey = this.map.keys().next().value;
      this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }

  size(): number {
    return this.map.size;
  }
}

// Usage
const cache = new LRUCache<string, User>(100);
cache.put('user:1', { id: '1', name: 'John' });
const user = cache.get('user:1'); // { id: '1', name: 'John' }
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **Nhanh hơn** | Truy xuất cache ms thay vì seconds |
| 💰 **Giảm chi phí** | Giảm DB/API calls |
| 📈 **Scale tốt** | Chịu được traffic cao |
| 🔌 **Resilient** | Fallback khi DB down (cache stale) |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Stale data** | Set TTL hợp lý, invalidate khi update |
| **Cache stampede** | Dùng lock/refresh-ahead khi cache miss |
| **Memory overflow** | Dùng LRU eviction, giới hạn kích thước |
| **Inconsistent cache** | Chọn strategy phù hợp (Write-Through vs Cache-Aside) |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Dữ liệu đọc nhiều, viết ít | ✅ Cache-Aside |
| Dữ liệu cần consistency cao | ✅ Write-Through |
| Dữ liệu thay đổi hiếm | ✅ Cache với TTL dài |
| Real-time data (stock, chat) | ❌ Không nên cache |
| Dữ liệu cực lớn (10GB+) | ⚠️ Cân nhắc distributed cache |

---

## 🔗 Liên quan

- **5.3.2 Lazy Loading** — Kết hợp cache + lazy load
- **5.3.3 Memoization** — Cache function results
- **5.8 Data Handling** — Pagination + caching strategies

---

## 📚 Tài liệu tham khảo

- 📖 [Redis Documentation](https://redis.io/docs/)
- 📖 [Caching Strategies - AWS](https://aws.amazon.com/caching/)
- 📖 [LRU Cache Algorithm](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU))

---

## ⏭️ Bài tiếp theo

→ [5.3.2 Lazy Loading](../5.3.2-lazy-loading/README.md)
