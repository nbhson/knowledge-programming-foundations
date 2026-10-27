# ⛔ 5.6.1 Circuit Breaker Pattern

> **Ngắt mạch (Circuit Breaker)** bảo vệ hệ thống khỏi **cascade failure**: nếu service gọi ra liên tục fail, mạch sẽ **ngắt (OPEN)** để không gọi tiếp, trả lỗi nhanh thay vì chờ hết timeout.

---

## 🎯 Vấn đề

Khi một service phụ thuộc (DB, third-party API, microservice khác) bắt đầu fail, nếu client cứ **call tới tấp** sẽ:

- **Ép tài nguyên** — mỗi request chờ hết timeout, thread/connection bị giữ
- **Lan truyền lỗi** — failure từ 1 node kéo theo toàn mạng (cascade failure)
- **Không cho target hồi phục** — service yếu lại bị dồn thêm tải

```
❌ KHÔNG NGĂT MẠCH                           ✅ CÓ NGĂT MẠCH
Client ─▶ Service A ─▶ (fail)                Client ─▶ [⛔ Circuit Breaker] ─▶ Service A
Client ─▶ Service A ─▶ (fail) ── đè chết ──▶  Client ─▶ [trả lỗi ngay]   (không gọi)
Client ─▶ Service A ─▶ (fail)                Client ─▶ [trả lỗi ngay]
```

---

## 🧩 Cấu trúc — 3 trạng thái

```
┌─────────┐  liên tục fail > threshold   ┌─────────┐   timeout hết   ┌───────────┐
│ CLOSED  │────────────────────────────▶ │  OPEN   │ ───────────────▶ │ HALF_OPEN │
│ (bình   │                              │ (ngắt)  │                  │ (thử 1    │
│ thường) │◀─────────────────────────────│          │◀────────────────│  request) │
└─────────┘  request OK (reset đếm)      └─────────┘   request fail   └───────────┘
                                                       ▲
                                                       │ request OK
                                                       (quay về CLOSED)
```

| Trạng thái | Hành vi |
|------------|---------|
| **CLOSED** | Gọi bình thường. Đếm failure; nếu vượt `threshold` → OPEN |
| **OPEN** | Không gọi target, trả lỗi ngay. Chờ `resetTimeout` → HALF_OPEN |
| **HALF_OPEN** | Thử cho phép 1 request thăm dò: OK → CLOSED, fail → OPEN |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failures = 0;
  private readonly threshold = 3;
  private readonly resetTimeout = 2000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      console.log("⛔ Mạch đang OPEN — trả lỗi ngay (fast fail)");
      throw new Error("Circuit is OPEN");
    }

    try {
      const result = await fn();
      this.failures = 0;
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        console.log("✅ Thử thành công — đóng mạch lại (CLOSED)");
      }
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold || this.state === "HALF_OPEN") {
        this.state = "OPEN";
        console.log(`🔓 Quá ${this.threshold} lần fail — chuyển OPEN trong ${this.resetTimeout}ms`);
        setTimeout(() => {
          this.state = "HALF_OPEN";
          console.log("⏳ Hết timeout — mở thử nghiệm (HALF_OPEN)");
        }, this.resetTimeout);
      }
      throw err;
    }
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🛡️ **Chặn cascade failure** | Không để 1 service chết kéo sập toàn hệ thống |
| ⚡ **Fast fail** | Trạng thái OPEN trả lỗi ngay, không chờ timeout |
| 💾 **Tiết kiệm tài nguyên** | Không giữ connection/thread khi target đã hỏng |
| 🔁 **Tự phục hồi** | HALF_OPEN giúp hệ thống tự thăm dò và đóng mạch lại |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐛 **Phức tạp** | Thêm trạng thái & luồng điều khiển vào hệ thống |
| ⚖️ **Tuning khó** | Threshold / timeout quá nhỏ → từ chối request dù service ổn |
| 📊 **Cần quan sát** | Nên log/phản hồi để biết khi nào mạch OPEN |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Gọi third-party API / external service | ✅ Chuẩn |
| Gọi microservice phụ thuộc | ✅ Chuẩn |
| DB / cache (Redis) connecting | ✅ Nên có |
| Local function gọi trong cùng tiến trình | ⚠️ Không cần |

---

## 🔗 Liên quan

- **5.6.2 Retry Pattern** — thường kết hợp: Retry vài lần, rồi Circuit Breaker ngắt để tránh gọi tiếp
- **5.6.4 Dead Letter Queue** — message hỏng sau khi retry/breaker → đưa sang DLQ
- **5.1.2 Integration Testing** — test hành vi breaker với mock service

---

## 📁 Cấu trúc thư mục

```
5.6.1-circuit-breaker/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.6-error-handling-techniques/5.6.1-circuit-breaker
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Circuit Breaker Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- 📖 [Fowler - Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## ⏭️ Bài tiếp theo

→ [5.6.2 Retry Pattern](../5.6.2-retry-pattern/README.md)