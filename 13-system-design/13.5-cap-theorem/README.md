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

| Thành Phần | Định Nghĩa | Ví Dụ |
|------------|-----------|-------|
| **Consistency** | Mọi read nhận được data mới nhất | Read sau write luôn thấy giá trị mới |
| **Availability** | Mỗi request nhận được response (không guarantee correctness) | Luôn trả về kết quả, dù có thể lỗi |
| **Partition Tolerance** | Hệ thống hoạt động khi network partition xảy ra | Tiếp tục hoạt động khi 2 node mất kết nối |

---

## 13.5.1 Tại Sao Chọn Được 2 Trong 3?

```
Scenario: Network Partition giữa Node A và Node B

Case 1: CP (Consistency + Partition Tolerance)
  - Khi partition, Node A KHÔNG trả về response
  - Để đảm bảo consistency: reject tất cả writes/reads
  - ❌ Giảm availability

Case 2: AP (Availability + Partition Tolerance)
  - Khi partition, Node A vẫn trả về response
  - Nhưng data có thể stale (cũ)
  - ❌ Giảm consistency

Case 3: CA (Consistency + Availability)
  - Chỉ hoạt động khi KHÔNG có partition
  - ❌ Không thực tế trong distributed system
```

> 💡 **Thực tế:** Partition tolerance là bắt buộc trong distributed system → phải chọn giữa **CP** hoặc **AP**.

---

## 13.5.2 PACELC Extension

**PACELC** mở rộng CAP bằng cách thêm **latency** factor:

```
PACELC = If Partition then choose C or A, Else choose Latency or Consistency
```

| Hệ Thống | P/A Trade-off | E/L Trade-off (khi không partition) |
|----------|---------------|-------------------------------------|
| **Cassandra** | AP | Low latency, eventual consistency |
| **MongoDB** | CP (default) | Low latency, strong consistency |
| **MySQL** | CP | Strong consistency, higher latency |
| **DynamoDB** | AP | Low latency, eventual consistency |
| **PostgreSQL** | CP | Strong consistency |

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
│ Latency              │ Cao (chờ majority)      │ Thấp          │
├──────────────────────┼──────────────────────────────────────────────┤
│ Use Case             │ Banking, payments       │ Social feed,  │
│                      │ Inventory management    │ analytics     │
├──────────────────────┼──────────────────────────────────────────────┤
│ Examples             │ MongoDB, ZooKeeper      │ DynamoDB,     │
│                      │                      │ Cassandra     │
└──────────────────────┴──────────────────────────────────────────────┘
```

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

// CP: MongoDB (default)
async function writeWithMongo(data: Partial<User>): Promise<User> {
  const result = await db.users.updateOne(
    { _id: userId },
    { $set: data }
  );
  // Requires majority acknowledgment
  return result;
}
```

---

## 13.5.5 Chiến Lược Xử Lý

| Tình Huống | Chiến Lược | Giải Pháp |
|------------|-----------|-----------|
| **Read-your-writes** | CP cho user session | Sticky session, read từ same shard |
| **Eventual consistency** | AP cho social feed | Merge trên conflict (CRDT) |
| **Financial transaction** | CP bắt buộc | 2PC, Saga pattern |
| **Low-latency app** | AP + TTL | Cache local, accept stale reads |

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

---

## 🎯 Khi nào chọn CP hay AP?

| Scenario | Khuyến Nghị | Lý Do |
|----------|-------------|-------|
| Giao dịch tài chính | ✅ CP | Không được mất data |
| Inventory management | ✅ CP | Đúng số lượng là bắt buộc |
| Social media feed | ✅ AP | User chấp nhận data cũ 1 chút |
| Analytics/Logging | ✅ AP | Tốc độ quan trọng hơn consistency |
| User profile (read-heavy) | ✅ AP | Fast reads, eventual sync |

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

## ⏭️ Bài Tiếp Theo

→ [13.6 Scalable Architecture](../13.6-scalable-arch/README.md)
