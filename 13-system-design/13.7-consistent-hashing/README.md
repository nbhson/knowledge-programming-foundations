# 🍩 13.7 Consistent Hashing (Băm Nhất Quán)

> **Consistent Hashing** ánh xạ keys và nodes lên cùng một vòng băm — thêm/bớt node chỉ di chuyển ~K/N keys thay vì gần như toàn bộ như mod-N.

---

## 🎯 Vấn Đề

Sharding (13.4) cần một hàm quyết định "key này thuộc về node nào". Cách ngây thơ nhất là mod-N:

```
node = hash(key) % N
```

Vấn đề: **N thay đổi thì gần như mọi key remap**. Thêm 1 cache node vào cluster 3 node → ~75% keys đổi chỗ → cache stampede, DB bị dội traffic, tail latency tăng vọt.

```
Mod-N (N = 3 → 4):              Consistent hashing (N = 3 → 4):

key:  A B C D E F G H            key:  A B C D E F G H
trước: 1 2 3 1 2 3 1 2            trước: 1 2 3 1 2 3 1 2
sau:   2 3 4 1 2 3 4 1  ← 6/8     sau:   1 2 3 4 2 3 1 2  ← 2/8
đổi chỗ (75%)                     đổi chỗ (~25% = 1/N)
```

**Yêu cầu:** một scheme mà khi cluster thay đổi, chỉ keys "thuộc về" node mới/cũ phải di chuyển — còn lại đứng yên.

---

## 13.7.1 Hash Ring: Ý Tưởng Cốt Lõi

Bỏ phép chia `% N`. Đặt **cả node và key lên cùng một vòng** `[0, 2^32)`:

```
                key B (hash=250)
                     ●
                 /       \
   node-1 ●                 ● node-2
   (hash=10)               (hash=400)
                 \       /
                  ● ──▶ ● key A (hash=520)
               node-3      đi clockwise, key thuộc về
               (hash=500)  node ĐẦU TIÊN gặp được
```

Quy tắc: key thuộc về **node đầu tiên khi đi clockwise** từ vị trí hash(key). Thêm node-4 (hash=300): chỉ keys nằm trong đoạn `(250, 300]` đổi chủ (từ node-2 sang node-4) — còn lại đứng yên. Xóa node: chỉ keys của node đó trôi sang neighbour kế tiếp.

## 13.7.2 Virtual Nodes: Chống Lệch Phân Phối

Ring "trần" có 2 bệnh:

| Vấn đề | Triệu chứng | Giải pháp |
|--------|-------------|-----------|
| **Phân phối lệch** | Random placement → đoạn vòng dài/ngắn khác nhau, node nhận 40% keys, node nhận 10% | Virtual nodes: mỗi node vật lý = 100–200 điểm trên vòng → luật số lớn làm phẳng |
| **Heterogeneous capacity** | Node mạnh/yếu nhận tải như nhau | Node mạnh gán nhiều virtual nodes hơn (weight) |
| **Hot spot khi failover** | Keys node chết dồn hết vào 1 neighbour | Virtual nodes của node chết rải khắp vòng → tải failover chia đều |

```typescript
// Mỗi node vật lý chiếm N điểm trên vòng
ring.set(hash("cache-1#vn0"), "cache-1");
ring.set(hash("cache-1#vn1"), "cache-1");
// ...
ring.set(hash("cache-1#vn99"), "cache-1");

// Lookup: binary search virtual node đầu tiên có hash >= hash(key), wrap-around
function getNode(key: string): string {
  const h = hash(key);
  const idx = firstIndexGreaterOrEqual(sortedHashes, h); // O(log V)
  return ring.get(sortedHashes[idx % sortedHashes.length]);
}
```

> 💡 **Con số thực tế:** Dynamo/Cassandra dùng ~256 virtual nodes (vnodes) mỗi node vật lý. Với 100 vnodes, demo 1000 keys/3 nodes phân phối lệch < ±10% — xem `examples/index.ts` mục 4️⃣.

---

## 💻 Code/Khái Niệm Ví Dụ

Demo đầy đủ trong `examples/index.ts` (FNV-1a + ring + binary search, không deps ngoài). Kết quả điển hình với 1000 keys:

```
Mod-N (3 → 4 nodes):          keys di chuyển ~750/1000 (75%)
Consistent (3 → 4 nodes):     keys di chuyển ~250/1000 (~25% = K/N)
Consistent (xóa 1 node):      chỉ keys của node đó remap sang neighbour
```

**Back-of-envelope — khi nào consistent hashing "đáng tiền":**

| Kịch bản | Mod-N cost | Consistent cost |
|----------|-----------|-----------------|
| Thêm 1 node vào cluster N=10, K=100M keys | ~90M keys remap (miss storm) | ~10M keys remap |
| Cache miss penalty 30ms × 90M | DB hứng ~45k QPS spike phút đầu | DB hứng ~5k QPS |
| Tần suất reshard | Mỗi lần scale | Mỗi lần scale |

Quy tắc ngón tay cái: **tần suất thay đổi membership × số keys × miss penalty** càng lớn → consistent hashing càng bắt buộc.

```typescript
// Dùng ở đâu trong stack? Ví dụ: chọn cache shard cho session
const shard = ring.getNode(`session:${userId}`); // ổn định qua nhiều lần scale
await redisCluster[shard].get(`session:${userId}`);
```

---

## ✅ Lợi Ích

- **Minimal disruption:** thêm/bớt node chỉ di chuyển ~K/N keys (tối ưu lý thuyết cho remapping).
- **Decentralized lookup:** client tự tính `getNode(key)` — không cần directory service, không single point of metadata.
- **Heterogeneous-friendly:** weight bằng số virtual nodes, không cần node đồng cấu hình.
- **Failover graceful:** keys node chết chia đều khắp vòng (nhờ vnodes), không dồn 1 neighbour.

## ⚠️ Lưu Ý

- **Không giải quyết hot key:** key celebrity (10M req/s vào 1 key) vẫn dồn 1 node — cần replication/cache front (xem 13.2) hoặc key splitting.
- **Hash function phải đều:** dùng FNV/Murmur/xxHash; hash kém (ví dụ Java `hashCode` với key tuần tự) phá vỡ mọi đảm bảo.
- **Membership phải đồng thuận:** các client phải thấy cùng danh sách node — cần gossip/failure detector hoặc control plane (xem 13.10 Raft, 13.9 discovery).
- **Range query khó:** ring băm phá vỡ thứ tự key — cần range scan thì dùng ordered partitioning (Bigtable-style) thay vì hashing.

## 🎯 Khi Nào Dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Distributed cache (Memcached/Redis cluster) | ✅ Bắt buộc | Scale in/out liên tục; miss storm đắt |
| Dynamo/Cassandra-style KV store | ✅ Bắt buộc | Partition + replication đều dựa trên ring |
| Shard DB ít khi reshard (< 1 lần/quý) | ⚠️ Tùy chọn | Mod-N + offline reshard chấp nhận được |
| Cần range scan theo key prefix | ❌ Không dùng | Hash phá thứ tự — dùng range partitioning |
| Single node hoặc static N | ❌ Thừa | Không có membership change thì ring vô nghĩa |

---

## 🔗 Liên Quan

- **13.4 Sharding** — Consistent hashing là chiến lược placement cho shard
- **13.2 Caching Strategies** — Ring chọn cache node; miss storm là lý do tồn tại của bài này
- **13.1 Load Balancer** — Hash-based sticky routing là consistent hashing thu nhỏ
- **13.5 CAP Theorem** — Ring + replication (N/W/R quorum) là kiến trúc Dynamo

---

## 📚 Tài Liệu

- 📖 [Consistent Hashing and Random Trees (Karger et al., 1997)](https://dl.acm.org/doi/10.1145/258533.258660) — paper gốc
- 📖 [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) — ring + virtual nodes + quorum
- 📖 [Cassandra Architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.7-consistent-hashing
npx tsx examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.8 Message Queues](../13.8-message-queues/README.md)
