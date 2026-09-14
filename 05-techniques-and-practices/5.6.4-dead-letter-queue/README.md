# ⚰️ 5.6.4 Dead Letter Queue (DLQ)

> **Dead Letter Queue (Hàng đợi tin chết)** là queue đặc biệt chứa các message **không thể xử lý thành công dù đã retry hết giới hạn** — để đội phát triển **phân tích, sửa lỗi và xử lý thủ công** mà không làm tắc nghẽn hay mất message.

---

## 🎯 Vấn đề

Trong hệ thống message queue (RabbitMQ, Kafka, SQS...), một message có thể fail mãi mãi:

- **Payload sai định dạng** (malformed JSON) — retry bao nhiêu cũng fail
- **Business rejection** — order không tồn tại, user không hợp lệ
- **Dependency hỏng lâu dài** — DB mất, service không bao giờ hồi phục

Nếu message fail **mãi nằm ở đầu queue**, nó sẽ **chặn toàn bộ hàng đợi** (head-of-line blocking) và consumer.bị treo.

```
✅ Vòng đời message

Producer ─▶ Main Queue ─▶ Consumer
                             │ fail #1
                             ▼ retry (3 lần, backoff)
                             │ vẫn fail
                             ▼
                      [DLQ] ──▶ message có metadata: lý do, attempt count,
                                raw body → dev xử lý thủ công (replay / drop / fix)
```

---

## 🧩 Các thành phần

| Thành phần | Ý nghĩa |
|------------|---------|
| **Main queue** | Nơi consumer nhận & xử lý tin bình thường |
| **Max retries** | Số lần thử lại trước khi vứt tin sang DLQ |
| **DLQ** | Queue riêng chứa tin hỏng + metadata (retry count, lý do, timestamp) |
| **DLQ consumer** | Tool/script riêng để inspect, replay, hoặc drop tin |
| **Alerting** | Cảnh báo khi DLQ dài → có vấn đề cần xử lý |

### Luồng hoạt động

```
message → consumer →
  ├── OK ──────────────▶ ack, xoá khỏi queue ✅
  ├── fail + còn retry ─▶ requeue, đến lượt lại (backoff)
  └── fail + hết retry ─▶ publish vào DLQ + log ⚰️
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
type Message = { id: number; payload: string; attempts?: number };

const DLQ: Message[] = [];

class Worker {
  constructor(
    private readonly maxRetries = 3,
    private readonly process: (m: Message) => boolean,
  ) {}

  handle(m: Message): void {
    m.attempts = (m.attempts ?? 0) + 1;

    if (this.process(m)) {
      console.log(`✅ #${m.id} xử lý thành công (attempt ${m.attempts})`);
      return;
    }

    if (m.attempts < this.maxRetries) {
      console.log(`  🔁 #${m.id} fail — reinqueue (attempt ${m.attempts}/${this.maxRetries})`);
      setImmediate(() => this.handle({ ...m })); // thử lại
    } else {
      DLQ.push(m);
      console.log(`⚰️ #${m.id} hết retry — chuyển sang DLQ`);
    }
  }
}

// Message payload "corrupt" sẽ force fail mãi mãi
const worker = new Worker(3, (m) => m.payload !== "corrupt");
worker.handle({ id: 1, payload: "ok" });        // ✅ thành công
worker.handle({ id: 2, payload: "corrupt" });   // → ⚰️ DLQ sau 3 lần
console.log("DLQ:", DLQ.map((m) => m.id));      // [2]
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 💾 **Không mất message** | Tin hỏng vẫn được giữ để xử lý sau |
| 🚦 **Không chặn queue** | Tin xấu được tách khỏi main queue, consumer chạy tiếp |
| 🔍 **Dễ điều tra** | Metadata lưu lý do fail, đếm retry, thời gian |
| 📊 **Signal tốt** | DLQ dài = có bug cần chú ý |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧹 **Cần vận hành** | Tin trong DLQ không tự biến mất — cần xử lý thủ công định kỳ |
| ☁️ **Chi phí** | Lưu trữ + tooling cho DLQ |
| 🕳️ **Im lặng** | Không ai xem → lỗi nằm im trong DLQ |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Hệ thống event/message queue | ✅ Nên có DLQ cho main queue |
| Job queue thanh toán / order | ✅ Bắt buộc — mất tin = mất tiền |
| Hệ thống nhỏ, message hiếm khi hỏng | ⚠️ Có cũng được, đảm bảo có alert |

---

## 🔗 Liên quan

- **5.6.2 Retry Pattern** — retry hết giới hạn rồi mới đưa sang DLQ
- **5.6.1 Circuit Breaker** — ngăn consumer gọi mãi service đang chết
- **5.6.3 Saga Pattern** — bước fail không bù trừ được → báo vào DLQ để theo dõi

---

## 📁 Cấu trúc thư mục

```
5.6.4-dead-letter-queue/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.6-error-handling-techniques/5.6.4-dead-letter-queue
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Dead Letter Queue - AWS SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- 📖 [Implementing DLQ - Google Cloud](https://cloud.google.com/pubsub/docs/subscription-message-ordering)

---

## ⏭️ Bài tiếp theo

→ Đã hết series **5.6 Error Handling Techniques**. Quay lại [5.6 Mục lục](../README.md) hoặc sang [5.7 Refactoring Techniques](../5.7-refactoring-techniques/README.md).