# 🗂️ 13.4 Sharding (Phân Dữ Liệu)

> **Sharding** chia dữ liệu lớn thành các phần nhỏ hơn, phân phối đều trên nhiều database instances — tăng throughput và giảm single point of failure.

---

## 🎯 Sharding Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                     Query Router (Shard Key)                │
│                    hash(user_id) mod N                      │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
        ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
        │  Shard 1    │ │ Shard 2  │ │  Shard 3   │
        │  (VN North) │ │(VN South)│ │ (SG Central)│
        │  Users 1-33 │ │Users 34-66│ │Users 67-100│
        └─────────────┘ └──────────┘ └────────────┘
```

---

## 13.4.1 Sharding Strategies

| Strategy | Cách hoạt động | Ưu điểm | Nhược điểm |
|----------|---------------|---------|------------|
| **Range** | Chia theo khoảng giá trị (ID, date) | Dễ query range, contiguous data | Hotspot (đầu shard quá tải) |
| **Hash** | `shard = hash(key) % N` | Phân phối đều, không hotspot | Khó query range, complex rebalancing |
| **Directory** | Lookup table: key → shard | Linh hoạt, dễ debug | Single point of failure (directory) |

```typescript
// Range Sharding
const getShard = (userId: number): number => {
  const ranges = [
    { min: 1, max: 33, shard: 0 },
    { min: 34, max: 66, shard: 1 },
    { min: 67, max: 100, shard: 2 },
  ];
  return ranges.find(r => userId >= r.min && userId <= r.max)!.shard;
};

// Hash Sharding
const getHashShard = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3;
};

// Directory Sharding (MongoDB-style)
const directory: Record<string, number> = {
  'user-001': 0,
  'user-002': 1,
  // ...
};
```

---

## 13.4.2 Consistency Challenges

```
           Shard 1          Shard 2
             │                  │
    User A ──┤ write            │
             │ ─────────────────┤ write
             ▼                  ▼
         Commit?              Commit?
             │                  │
    ┌────────┴────────┐  ┌─────┴─────────┐
    │  Write OK       │  │  Write OK     │
    │  BUT: other     │  │  other shard  │
    │  shard failed   │  │  not yet ack  │
    └─────────────────┘  └───────────────┘
```

| Problem | Mô tả | Solution |
|---------|-------|----------|
| **Split Brain** | Shard partitioned, both think they're primary | Quorum-based elections |
| **Inconsistent Reads** | Read from stale replica | Read-your-writes consistency |
| **Cross-Shard Transaction** | Cần atomicity across shards | 2PC (Two-Phase Commit) hoặc Saga pattern |
| **Skewed Data** | Một shard chứa quá nhiều data | Rebalancing tự động |

---

## 13.4.3 Rebalancing

```
Before Rebalancing:
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Shard A │ │  Shard B │ │  Shard C │
│  95%     │ │  40%     │ │  65%     │
│  🔴 Hot  │ │  🟢 Cool │ │  🟡 Warm │
└──────────┘ └──────────┘ └──────────┘

After Rebalancing:
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Shard A │ │  Shard B │ │  Shard C │
│  65%     │ │  68%     │ │  67%     │
│  🟢 Balanced                 │
└──────────┘ └──────────┘ └──────────┘
```

```typescript
// Trigger rebalancing when skew > threshold
const THRESHOLD = 0.2; // 20%

function shouldRebalance(shards: ShardStats[]): boolean {
  const sizes = shards.map(s => s.size);
  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const maxDeviation = Math.max(...sizes.map(s => Math.abs(s - avg) / avg));
  return maxDeviation > THRESHOLD;
}

async function rebalance(shards: Shard[]): Promise<void> {
  const sorted = [...shards].sort((a, b) => b.count - a.count);
  const hottest = sorted[0];
  const coldest = sorted[sorted.length - 1];
  
  // Migrate 10% data from hot to cold shard
  const migrateCount = Math.floor(hottest.count * 0.1);
  await migrateRange(hottest, coldest, migrateCount);
}
```

---

## 📊 Sharding vs Replication

| Aspect | Sharding | Replication |
|--------|----------|-------------|
| Data distribution | Mỗi shard giữ 1 phần | Mỗi replica giữ full data |
| Write throughput | Tăng (parallel writes) | Không tăng (primary chỉ có 1) |
| Read throughput | Tăng (parallel reads) | Tăng (read từ replica) |
| Storage | Giảm per-node | Không đổi |
| Complexity | High (rebalancing, cross-shard) | Low |

---

## 🔗 Liên Quan

- **13.2 Caching Strategies** — Shard cache để tránh hot key
- **13.5 CAP Theorem** — Sharding hy sinh Consistency cho Partition tolerance

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| MongoDB Sharding | https://docs.mongodb.com/manual/sharding/ |
| Cassandra Sharding | https://cassandra.apache.org/doc/latest/architecture/dynamo.html |

---

## ⏭️ Bài tiếp theo → [13.5 CAP Theorem](../13.5-cap-theorem/README.md)