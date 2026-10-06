# 📨 13.8 Message Queues (Hàng Đợi Thông Điệp)

> **Message Queue** tách producer khỏi consumer bằng bộ đệm bền bỉ — chịu spike, retry khi lỗi, và fan-out một event cho nhiều consumer độc lập.

---

## 🎯 Vấn Đề

Gọi synchronous (HTTP/RPC) giữa service A → B có 3 điểm yếu chí mạng:

```
Sync:  Order ──HTTP──▶ Payment ──HTTP──▶ Notification
       (chờ 300ms)     (chờ 200ms)       tổng latency cộng dồn
       Payment sập = order FAIL          coupling cứng, blast radius lan
       Flash sale 10× traffic = sập      không có chỗ đệm
```

Queue biến kiến trúc thành **decoupled + buffered + async**:

```
Async: Order ──▶ [Queue] ──▶ Payment worker ──▶ [Queue] ──▶ Notification worker
         └─ ack ngay (20ms)    └─ retry tự động      └─ scale worker độc lập
```

**Trade-off trung tâm:** latency mỗi message tăng (+1–10ms queue hop) đổi lấy throughput, resilience và khả năng scale consumer độc lập.

---

## 13.8.1 Queue (Point-to-Point) vs Pub/Sub (Fan-Out)

| Aspect | Queue (P2P) | Pub/Sub |
|--------|-------------|---------|
| Mô hình | 1 message → **đúng 1** consumer | 1 event → **mọi** subscriber |
| Ví dụ | RabbitMQ queue, Kafka consumer group, SQS | Kafka topic + nhiều group, Redis pub/sub, SNS |
| Ordering | Đảm bảo per-partition/queue | Mỗi subscriber thấy đủ thứ tự, nhưng xử lý độc lập |
| Use case | Chia việc (task distribution), load leveling | Thông báo sự kiện (order.created → notif + stock + analytics) |
| Scale | Thêm consumer trong group | Thêm subscriber không ảnh hưởng publisher |

```
Queue (competing consumers):        Pub/Sub (fan-out):

Producer ─▶ [orders] ─┬─▶ W1        order.created ─┬─▶ Notification svc
                       └─▶ W2                      ├─▶ Inventory svc
  (mỗi msg chỉ 1 worker)                           └─▶ Analytics svc
```

## 13.8.2 Kafka vs RabbitMQ: Chọn Cái Nào

| Tiêu chí | Kafka | RabbitMQ |
|----------|-------|----------|
| Mô hình lưu trữ | Distributed **log** (giữ message days/weeks, replay được) | **Broker queue** (ack → xóa, giữ ngắn) |
| Throughput | Rất cao (~100k–1M msg/s/cluster, sequential I/O) | Trung bình (~10–50k msg/s, routing phức tạp) |
| Routing | Đơn giản (topic + partition key) | Linh hoạt (exchange: direct/topic/fanout/headers) |
| Ordering | Mạnh per-partition (key → partition) | Per-queue (single consumer) |
| Replay | ✅ Seek offset đọc lại | ❌ Đã ack là mất |
| Khi dùng | Event streaming, log pipeline, replay/audit | Task queue, RPC phức tạp, routing linh hoạt, low latency |

## 13.8.3 Delivery Semantics + DLQ

| Semantics | Đảm bảo | Giá phải trả | Khi dùng |
|-----------|---------|--------------|----------|
| **At-most-once** | Không trùng, có thể mất | Mất message khi crash | Metrics, logs, tracking (mất vài điểm chấp nhận được) |
| **At-least-once** | Không mất, có thể trùng | Consumer phải **idempotent** | Default cho hầu hết hệ thống (retry tới khi ack) |
| **Exactly-once** | Đúng 1 lần có hiệu lực | Transactional producer + offset commit, phức tạp, chậm | Thanh toán, trừ kho (hoặc giả lập bằng at-least-once + idempotency key) |

```
Retry + DLQ (dead letter queue):

consumer fail lần 1 ──▶ requeue (retry, backoff tăng dần)
consumer fail lần N ──▶ [DLQ] ──▶ alert + xử lý tay / replay sau khi fix bug
                       (poison message không bao giờ block queue chính)
```

> 💡 **Thực tiễn:** 90% hệ thống dùng **at-least-once + idempotency key** (ví dụ `orderId` unique constraint) thay vì exactly-once "xịn". DLQ bắt buộc phải có alert — DLQ im lặng = mất tiền im lặng.

---

## 💻 Code/Khái Niệm Ví Dụ

Demo trong `examples/index.ts`: queue với retry (max 3) + DLQ, pub/sub 3 subscriber, chú thích semantics. Minh họa idempotency — pattern quan trọng nhất khi dùng queue:

```typescript
// Consumer idempotent: xử lý trùng message vẫn đúng (at-least-once an toàn)
const processedIds = new Set<string>();

async function handlePayment(msg: OrderPaid): Promise<void> {
  if (processedIds.has(msg.orderId)) return; // duplicate delivery → bỏ qua
  await db.charge(msg.orderId, msg.amount);  // + UNIQUE(orderId) ở DB làm rào cuối
  processedIds.add(msg.orderId);
}
```

**Back-of-envelope — sizing queue:**

| Tham số | Ví dụ flash sale | Suy ra |
|---------|------------------|--------|
| Peak ingress | 20k orders/s trong 10 phút | 12M messages |
| Consumer xử lý | 2k msg/s/instance | Cần ~10 instances để không tồn đọng |
| Tồn đọng nếu thiếu | (20k − 10×2k)... tính thiếu → backlog tăng 5k/s | Cần autoscale worker theo queue depth |
| Message size 1KB × 12M | ~12 GB retention | Kafka giữ thoải mái; RabbitMQ cần TTL + lazy queue |

Quy tắc: **consumer capacity phải ≥ peak ingress**, và alert trên queue depth (backlog tăng = scale signal rõ ràng nhất).

---

## ✅ Lợi Ích

- **Decoupling thời gian:** producer không cần consumer online — deploy/restart consumer không mất message.
- **Load leveling:** spike 10× được queue hấp thụ, consumer xử lý theo sức mình (backpressure tự nhiên).
- **Retry + durability:** fail tạm thời tự retry; fail vĩnh viễn vào DLQ thay vì mất.
- **Fan-out:** một event phục vụ N consumer độc lập, thêm consumer không sửa producer.

## ⚠️ Lưu Ý

- **Ordering chỉ per-partition/key:** scale consumer group vượt số partition không tăng parallelism cho cùng key — thiết kế partition key từ đầu (ví dụ `orderId`).
- **Poison message:** message lỗi vĩnh viễn retry vô hạn sẽ nghẽn queue — luôn set max retries + DLQ + alert.
- **Queue cũng là SPOF:** broker đơn node sập = mất message + tắc pipeline — production cần replication factor ≥ 3 (Kafka) hoặc mirrored queue/cluster.
- **Không dùng queue làm DB:** retention dài + query phức tạp trên queue là anti-pattern — message đã xử lý thì archive sang storage thật.

## 🎯 Khi Nào Dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Tác vụ nặng async (gửi mail, render PDF, encode video) | ✅ Bắt buộc | Không block request path; retry tự động |
| Flash sale / spike traffic | ✅ Bắt buộc | Buffer hấp thụ spike, worker scale theo backlog |
| Fan-out event (order.created → N service) | ✅ Pub/Sub | Thêm consumer không đụng producer |
| Cần replay/audit event history | ✅ Kafka-style log | Offset replay, không mất history |
| Request cần response ngay (< 100ms) + strong consistency | ❌ Không dùng | Dùng sync call; queue thêm latency và eventual consistency |

---

## 🔗 Liên Quan

- **13.6 Scalable Architecture** — Event-driven architecture là ứng dụng trực tiếp của message queue
- **13.5 CAP Theorem** — Queue là eventual consistency điển hình (producer ack trước khi consumer xử lý)
- **13.9 API Gateway & Discovery** — Gateway buffer + queue worker là cặp bảo vệ backend khỏi spike
- **13.10 Consensus & Raft** — Kafka partition leader election dùng consensus (ZooKeeper/KRaft)

---

## 📚 Tài Liệu

- 📖 [Kafka Documentation — Design](https://kafka.apache.org/documentation/#design)
- 📖 [RabbitMQ Tutorials (Work Queues, Pub/Sub, DLX)](https://www.rabbitmq.com/getstarted.html)
- 📖 [DDIA Ch.11 — Stream Processing](https://dataintensive.net/) — semantics & log-based messaging

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.8-message-queues
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.9 API Gateway & Discovery](../13.9-api-gateway-discovery/README.md)
