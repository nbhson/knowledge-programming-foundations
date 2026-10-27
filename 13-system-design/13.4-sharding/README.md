# 🗂️ 13.4 Sharding (Phân Dữ Liệu)

> **Sharding** chia dữ liệu lớn thành các phần nhỏ hơn, phân phối đều trên nhiều database instances — tăng throughput và giảm single point of failure.

---

## 🎯 Tại Sao Sharding?

Single database instance có các ceiling cứng:

| Ceiling | Con số tham chiếu | Giải pháp |
|---------|------------------|-----------|
| **Storage** | SSD ~100 TB/node | Sharding hoặc archive |
| **Read QPS** | ~20k–50k (tuned PostgreSQL) | Read replicas |
| **Write QPS** | ~1k–5k (single primary) | Sharding writes |
| **Connections** | ~500–1000 per PG instance | Connection pooling + sharding |
| **Memory (buffer pool)** | RAM-bound cache size | Shard nhỏ hơn = cache effective hơn |

**Trade-off cốt lõi:** sharding đổi **đơn giản** lấy **throughput**. Hệ thống shards phức tạp hơn đáng kể: cross-shard query, rebalancing, distributed transaction.

> ⚠️ **Hiểu lầm phổ biến:** "sharding là giải pháp đầu tiên khi DB chậm". **Sai.** Thứ tự ưu tiên thực tế: (1) index đúng, (2) query optimize, (3) read replica, (4) caching, **(5) sharding**. Sharding là phương án cuối cùng trước khi rewrite kiến trúc.

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

**Query router** (application-level hoặc proxy như Vitess/Citus) xác định shard dựa trên **shard key** — thường là `user_id`, `tenant_id`, `organization_id`. Query không có shard key → scatter-gather (gửi đến mọi shard, merge kết quả) — chậm và đắt.

---

## 13.4.1 Sharding Strategies

| Strategy | Cách hoạt động | Ưu điểm | Nhược điểm | Khi nào dùng |
|----------|---------------|---------|------------|-------------|
| **Range** | Chia theo khoảng giá trị (ID, date) | Dễ query range, contiguous data locality | Hotspot (đầu shard quá tải), rebalancing phức tạp | Time-series data, log; nơi query theo range là chính |
| **Hash** | `shard = hash(key) % N` | Phân phối đều, không hotspot | Khó query range, complex rebalancing | User-centric data, random access patterns |
| **Directory** | Lookup table: key → shard | Linh hoạt, dễ debug, mapping thay đổi được | Single point of failure (directory); latency thêm 1 hop | Khi cần dynamic re-sharding transparent |
| **Consistent Hashing** | Virtual nodes trên vòng tròn | Rebalancing tối thiểu khi thêm/bớt shard | Complexity cao, cần tuning virtual node count | Distributed caches (Redis Cluster), DynamoDB |

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

**Chọn shard key đúng là quan trọng nhất quyết định sharding có hoạt động hay không.** Nguyên tắc:
1. **High cardinality** — tránh hot key (user_id tốt, country xấu vì vài shard overload).
2. **Query locality** — query thường có shard key trong WHERE → đi thẳng tới shard, không scatter.
3. **Stable** — shard key không thay đổi thường xuyên (dễ rebalancing).

> 💡 **Quy tắc ngón tay cái:** shard key = entity được truy cập nhiều nhất, có query pattern rõ ràng theo entity đó.

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

**Vấn đề chính khi sharding:**

| Problem | Mô tả | Solution |
|---------|-------|----------|
| **Split Brain** | Shard partitioned, cả 2 node nghĩ mình là primary | Quorum-based elections (Raft, Paxos); fencing token |
| **Inconsistent Reads** | Read từ stale replica | Read-your-writes consistency; sticky session to same shard/replica |
| **Cross-Shard Transaction** | Cần atomicity across shards | 2PC (Two-Phase Commit) hoặc Saga pattern; trade-off latency vs consistency |
| **Skewed Data** | Một shard chứa quá nhiều data | Rebalancing tự động; hash key tốt hơn range |
| **Hot Key** | 1 key được truy cập cực nhiều (celebrity user) | Local cache per shard; special handling (circuit breaker, rate limit per key) |
| **Scatter-Gather** | Query không có shard key phải quét tất cả | Denormalization; materialized views; search index (Elasticsearch) |

**Cross-shard transaction:**

| Approach | Latency | Complexity | Consistency |
|----------|---------|------------|-------------|
| **2PC** | Cao (2 round-trip + lock) | Thấp (DB native) | Strong |
| **Saga (orchestration)** | Trung bình | Trung bình (state machine) | Eventual |
| **Saga (choreography)** | Trung bình | Cao (event coupling) | Eventual |
| **Outbox + CDC** | Thấp | Trung bình | Eventual with retry |

> 💡 **Thực tiễn:** 2PC hiếm khi dùng production-scale vì blocking lock. Saga pattern (compensating transactions) phổ biến hơn trong microservices + sharded DB.

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

**Migration strategy an toàn (zero-downtime):**

1. **Copy phase:** copy range/data từ hot → cold shard song song, đánh dấu both-primary.
2. **Backfill:** đồng bộ incremental changes (CDC log) từ hot sang cold.
3. **Dual-read:** query route tới cả 2 shard, so sánh consistency.
4. **Cut-over:** chuyển write traffic sang cold shard, de-commission hot shard.

> 💡 **Chi phí rebalancing:** trong production, migration 1TB data qua network nội bộ (~10 Gbps) tốn ~15–20 phút. Trong window đó, cả 2 shard vẫn phục vụ — nhưng chi phí I/O và network có thể ảnh hưởng latency.

---

## 📊 Sharding vs Replication

| Aspect | Sharding | Replication | Giải thích sâu |
|--------|----------|-------------|----------------|
| **Data distribution** | Mỗi shard giữ 1 phần | Mỗi replica giữ full data | Shard giảm storage per node; replica nhân bản toàn bộ |
| **Write throughput** | Tăng (parallel writes) | Không tăng (primary chỉ có 1) | Write luôn về primary; replica chỉ nhận từ primary stream |
| **Read throughput** | Tăng (parallel reads) | Tăng (read từ replica) | Replica cho read scale; shard cho cả read+write scale |
| **Storage per node** | Giảm (1/N data) | Không đổi (full data) | Shard phù hợp khi data lớn hơn capacity 1 node |
| **Complexity** | High (rebalancing, cross-shard) | Low (auto failover) | Replica gần như "free scale read"; shard là last-resort |

**Kết hợp cả hai:** production pattern phổ biến nhất là **sharded primary + replicated replica per shard**. Mỗi shard cluster có 1 primary (viết) + N replica (đọc). Khi primary down, replica lên làm primary (automatic failover).

---

## 🎯 Khi nào dùng Sharding?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Write QPS > 5k trên 1 PostgreSQL node | ✅ Cân nhắc | Single primary bottleneck rõ; sharding chia write load |
| Storage > 50% RAM node (buffer pool không cache hết) | ✅ Phù hợp | Query từ disk chậm gấp 100× RAM; shard nhỏ = cache hit rate cao |
| Multi-tenant SaaS (tenant isolation) | ✅ Rất phù hợp | Shard theo tenant_id — audit, compliance, scaling độc lập per tenant |
| Time-series logs/metrics (> 1B rows) | ✅ Phù hợp | Range sharding theo time partition; archival dễ dàng |
| Read-heavy, data fits in 1 node | ❌ Không cần | Replica + caching đủ; sharding chỉ thêm complexity |
| Query pattern scatter nhiều shard | ❌ Tránh | Cross-shard join/query rất chậm; thiết kế lại schema/data model |

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
| Vitess (MySQL sharding) | https://vitess.io/ |

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.4-sharding
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [13.5 CAP Theorem](../13.5-cap-theorem/README.md)
