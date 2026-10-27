# ⚖️ 13.5 CAP Theorem (Định Lý CAP)

> **CAP Theorem** khẳng định: không hệ thống phân tán nào có thể đồng thời đảm bảo đầy đủ **Consistency**, **Availability** và **Partition Tolerance**. Phải chọn ít nhất 2 trong 3.

---

## 🎯 Ba Thành Phần Của CAP

```
              Consistency (C)
               /    \
              /      \
             /   ☐    \
            /  chosen  \
           /──────┼─────\
          │      │      │
          │   Partition   │
          │   Tolerance   │
          │    (P)        │
           \             /
            \    (D)    /
             \  choose  /
              \        /
               Availability (A)
```

| Thành Phần | Định Nghĩa Chính Xác | Ví Dụ Thực Tế |
|------------|---------------------|---------------|
| **Consistency** | Mọi read nhận được **giá trị mới nhất** của write gần nhất (linearizability) | Đọc balance sau khi chuyển tiền thấy số mới ngay lập tức |
| **Availability** | Mọi request đến **node không failed** nhận được response (không reject) — không guarantee correctness | Luôn trả về kết quả, dù có thể là data cũ (stale) |
| **Partition Tolerance** | Hệ thống tiếp tục hoạt động khi **network partition** xảy ra (2 nhóm node không liên lạc được) | 2 datacenter mất kết nối vẫn phục vụ user riêng |

> ⚠️ **Hiểu lầm kinh điển:** CAP không nói "chọn 2 trong 3 là lựa chọn vĩnh viễn". Nó nói: **trong điều kiện partition xảy ra**, bạn phải chọn giữa C và A. Khi không có partition (phần lớn thời gian), hệ thống có thể chạy cả C lẫn A — đó là PACELC.

---

## 13.5.1 Tại Sao Chọn Được 2 Trong 3?

```
Scenario: Network Partition giữa Node A và Node B

Case 1: CP (Consistency + Partition Tolerance)
  - Khi partition, Node A KHÔNG trả về response (hoặc reject)
  - Để đảm bảo consistency: phải reject writes/reads vì không chắc value mới nhất ở đâu
  - ❌ Giảm availability — user thấy 503/timeout

Case 2: AP (Availability + Partition Tolerance)
  - Khi partition, Node A vẫn trả về response
  - Nhưng data có thể stale (cũ) — Node A không biết write từ Node B đã commit chưa
  - ❌ Giảm consistency — user có thể đọc data cũ

Case 3: CA (Consistency + Availability)
  - Chỉ hoạt động khi KHÔNG có partition
  - ❌ Không thực tế trong distributed system — network partition là chuyện **sẽ xảy ra**, không phải **có thể**
```

> 💡 **Thực tế:** Partition tolerance là **bắt buộc** trong distributed system → phải chọn giữa **CP** hoặc **AP**. Hệ thống "CA" chỉ tồn tại trong single-node hoặc clustered không partition (như single DC với replicated storage nội bộ).

**Minimax chứng minh (Lamport):** không algorithm nào vừa consistency vừa availability trong face of partition. Chứng minh ngắn gọn: nếu partition xảy ra, nhóm A không biết write từ nhóm B có thành công không → nếu A vẫn accept write, có thể violate C; nếu A reject, vi phạm A.

---

## 13.5.2 PACELC Extension

**PACELC** mở rộng CAP bằng cách thêm **latency** factor — mô tả hành vi khi **không có partition**:

```
PACELC = If Partition then choose C or A, Else choose Latency or Consistency
```

| Hệ Thống | P/A Trade-off (khi partition) | E/L Trade-off (khi không partition) |
|----------|-------------------------------|--------------------------------------|
| **Cassandra** | AP (default, tunable) | Low latency, eventual consistency |
| **MongoDB** | CP (default; tunable readConcern) | Low latency, strong consistency khi local read |
| **MySQL** | CP (single primary) | Strong consistency, higher latency (lock/wait) |
| **DynamoDB** | AP (eventual default; Strong Eventually Consistent optional) | Low latency, eventual consistency |
| **PostgreSQL** | CP (single primary) | Strong consistency, higher latency |
| **Redis** | AP (single master) | Very low latency, eventual consistency (replica lag) |

> 💡 **PACELC quan trọng hơn CAP trong thực tế** — vì partition là rare event (thấp hơn 0.01%/năm per DC), còn E/L trade-off xảy ra **mỗi request**. Thiết kế nên tối ưu cho normal case (E/L), còn partition case phải có fallback plan.

---

## 13.5.3 CP vs AP — So Sánh

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CP vs AP Comparison                             │
├──────────────────────┬──────────────────────────────────────────────┤
│ Feature              │ CP                          │ AP            │
├──────────────────────┼──────────────────────────────────────────────┤
│ Khi partition        │ Reject request            │ Serve stale   │
│                      │ (guarantee C)             │ data          │
├──────────────────────┼──────────────────────────────────────────────┤
│ Latency (normal)     │ Cao (chờ majority)      │ Thấp          │
├──────────────────────┼──────────────────────────────────────────────┤
│ Use Case             │ Banking, payments       │ Social feed,  │
│                      │ Inventory management    │ analytics     │
├──────────────────────┼──────────────────────────────────────────────┤
│ Examples             │ MongoDB, ZooKeeper      │ DynamoDB,     │
│                      │                       │ Cassandra     │
├──────────────────────┼──────────────────────────────────────────────┤
│ Complexity           │ Trung bình (quorum)     │ Cao (conflict resolution) |
└──────────────────────┴──────────────────────────────────────────────┘
```

**CP điển hình — Quorum-based:**
- Viết cần `W > N/2` ack (majority)
- Đọc cần `R > N/2` ack
- `W + R > N` → đảm bảo overlap = đọc được giá trị mới nhất

**AP điển hình — All-replicas accept:**
- Viết broadcast tới mọi replica, không chờ ack
- Đọc từ replica gần nhất (có thể stale)
- Merge conflict sau khi partition heal (LWW, CRDT)

---

## 13.5.4 Thực Tế Trong Hệ Thống Phân Tán

```typescript
// CP: ZooKeeper (quorum-based)
async function writeWithZK(data: string): Promise<void> {
  const zk = new ZooKeeper('localhost:2181');
  // Cần majority ack trước khi commit
  await zk.create('/node', data, { acl: 'world:anyone' });
}

// AP: DynamoDB (eventual consistency)
async function writeWithDynamo(key: string, value: string): Promise<void> {
  const docClient = new DynamoDB.DocumentClient();
  // Write luôn thành công, replicate async
  await docClient.put({
    TableName: 'users',
    Item: { id: key, data: value }
  }).promise();
  // Không guarantee read ngay lập tức thấy
}

// CP: MongoDB (default writeConcern: majority)
async function writeWithMongo(data: Partial<User>): Promise<User> {
  const result = await db.users.updateOne(
    { _id: userId },
    { $set: data }
  );
  // Requires majority acknowledgment
  return result;
}
```

**Cảnh báo thực tế:**
- Nhiều hệ thống "CP mặc định" có thể tune thành AP (MongoDB `writeConcern: 1`, Cassandra `consistency: ONE`).
- "Eventual consistency" ≠ "no consistency" — thường converges trong ms–s.
- Read your own write guarantee có thể thêm vào AP system qua sticky session hoặc write-to-read path.

---

## 13.5.5 Chiến Lược Xử Lý

| Tình Huống | Chiến Lược | Giải Pháp |
|------------|-----------|-----------|
| **Read-your-writes** | CP cho user session | Sticky session, read từ same shard; hoặc write-read path đồng bộ |
| **Eventual consistency** | AP cho social feed | Merge trên conflict (CRDT); TTL cache |
| **Financial transaction** | CP bắt buộc | 2PC, Saga pattern với compensating transaction |
| **Low-latency app** | AP + TTL | Cache local, accept stale reads; UI spinner khi stale |
| **Hybrid** | CP writes, AP reads | Write qua quorum; read từ replica lag <100ms chấp nhận được |

**Hybrid pattern thực tế:** banking app thường:
- Write balance: CP (2PC hoặc local transaction)
- Read balance: CP (read từ primary hoặc quorum)
- Read transaction history: AP (replica acceptable)
- Read notifications: AP (eventual is fine)

---

## 13.5.6 Conflict Resolution (AP Systems)

```
Conflict khi 2 node update cùng data:

Node A: user.name = "Alice"   (update 1)
Node B: user.name = "Bob"     (update 2)
         └─── partition ───┘

Giải pháp:
├─ Last-Writer-Wins (LWW)    — dễ, nhưng có thể mất data
├─ Multi-Version Concurrency — giữ nhiều version
├─ CRDT (Conflict-free Replicated Data Type) — tự merge
└─ Vector Clocks             — phát hiện conflict
```

**So sánh conflict resolution:**

| Method | Ưu điểm | Nhược điểm | Ví dụ |
|--------|---------|------------|-------|
| **LWW** | Đơn giản, latency thấp | Mất data nếu clock lệch; không recover được | DynamoDB default |
| **Vector Clocks** | Phát hiện conflict chính xác | Metadata lớn; merge logic phức tạp | CouchDB |
| **CRDT** | Automatically convergent, no conflict | Chỉ áp dụng cho cấu trúc data cụ thể (counter, set, G-Counter) | AWS DynamoDB Streams, Yjs |
| **MVC (Multi-Version)** | Recover được mọi version | Storage cost cao; conflict resolve thủ công | Git, Versioned DB |

**CRDT mẫu — G-Counter (grow-only counter):**

```typescript
// Mỗi replica giữ map {replicaId: count}
// Increment: tăng count của replica mình
// Merge: element-wise max
class GCounter {
  private counts: Map<string, number> = new Map();

  increment(replicaId: string): void {
    this.counts.set(replicaId, (this.counts.get(replicaId) ?? 0) + 1);
  }

  merge(other: GCounter): void {
    other.counts.forEach((v, k) => {
      this.counts.set(k, Math.max(this.counts.get(k) ?? 0, v));
    });
  }

  value(): number {
    return Array.from(this.counts.values()).reduce((a, b) => a + b, 0);
  }
}
```

> 💡 CRDT cho phép AP system **tự động hội tụ** mà không cần conflict resolution thủ công — lý tưởng cho collaborative editing, IoT telemetry.

---

## 🎯 Khi nào chọn CP hay AP?

| Scenario | Khuyến Nghị | Lý Do |
|----------|-------------|-------|
| Giao dịch tài chính | ✅ CP | Không được mất data; consistency là bắt buộc |
| Inventory management | ✅ CP | Đúng số lượng là bắt buộc; over-selling gây tổn thất trực tiếp |
| Social media feed | ✅ AP | User chấp nhận data cũ 1–2s; latency quan trọng hơn freshness |
| Analytics/Logging | ✅ AP | Tốc độ ingest quan trọng; data có thể re-ingest |
| User profile (read-heavy) | ✅ AP | Fast reads, eventual sync; stale profile ít ảnh hưởng UX |
| Session/auth token | ✅ CP | Security-critical; stale token có thể bypass auth |
| Real-time leaderboard | ⚠️ Hybrid | Write CP (anti-cheat), read AP (latency) |

**Decision framework:**
1.-business impact của stale data? (tiền → CP; engagement → AP)
2.-latency target? (<100ms → AP thường dễ đạt hơn)
3.recovery cost của lost write? (cao → CP; thấp → AP + audit log)

---

## 🔗 Liên Quan

- **13.4 Sharding** — Sharding cần partition tolerance
- **13.6 Scalable Architecture** — Scale theo CP/AP requirements
- **5.6 Error Handling** — Saga pattern xử lý distributed transaction

---

## 📚 Tài Liệu Tham Khảo

- 📖 [CAP Theorem - Wikipedia](https://en.wikipedia.org/wiki/CAP_theorem)
- 📖 [PACELC Theorem](https://en.wikipedia.org/wiki/PACELC_theorem)
- 📖 [The CAP Theorem - MIT](https://pdos.csail.mit.edu/6.824/papers/flinke:cap.pdf)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.5-cap-theorem
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.6 Scalable Architecture](../13.6-scalable-arch/README.md)
