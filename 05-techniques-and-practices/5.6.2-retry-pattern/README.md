# 🔁 5.6.2 Retry Pattern

> **Retry Pattern** thử thực hiện lại một thao tác có khả năng **thất bại tạm thời** (network, timeout, 5xx) — kèm **exponential backoff** để không dồn tải, và **giới hạn số lần** để không retry mãi.

---

## 🎯 Vấn đề

Truyền dữ liệu qua mạng **không đáng tin cậy**: lúc network chập chờn, service quá tải, timeout ngắn. Nếu gọi 1 lần rồi bỏ cuộc, ta mất request đáng lẽ thành công nếu thử lại.

Nhưng retry **sai cách** còn tệ hơn:

- Retry **ngay lập tức** → dồn thêm tải lên service vốn đang quá tải
- Retry **không giới hạn** → tài nguyên cạn, request chết không minh bạch
- Retry **thao tác không idempotent** → gửi email 2 lần, trừ tiền 2 lần

```
❌ Retry dồn dập                         ✅ Retry + exponential backoff
fail ─▶ retry ─▶ fail ─▶ retry           fail ─▶ chờ 200ms ─▶ fail ─▶ chờ 400ms
cùng lúc, tải tăng vọt                   ─▶ chờ 800ms ─▶ OK (target có thời gian thở)
```

---

## 🧩 Các thành phần

| Thành phần | Ý nghĩa |
|------------|---------|
| **Max attempts** | Giới hạn số lần thử (vd 3-5) |
| **Backoff** | Khoảng chờ giữa các lần: `baseDelay × 2^(attempt)` (200ms, 400ms, 800ms...) |
| **Jitter** | Cộng ngẫu nhiên để nhiều client không retry đồng loạt |
| **Retryable errors** | Chỉ retry lỗi tạm thời (timeout, 5xx, network); không retry 4xx/validation |
| **Idempotency** | Đảm bảo chạy lại nhiều lần cho cùng kết quả (dùng `idempotency-key`) |

### Luồng hoạt động

```
call()
 │
 ├── thành công ──────────────▶ trả kết quả ✅
 └── lỗi tạm thời?
       ├── còn attempts? ──▶ chờ backoff ──▶ gọi lại
       └── hết attempts ───▶ trả lỗi cuối cùng ❌
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelay = 200 }: { attempts?: number; baseDelay?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === attempts) break;
      const backoff = baseDelay * 2 ** (i - 1); // 200, 400, 800...
      const jitter = Math.random() * 100;        // tránh thundering herd
      console.log(`  🔁 Lần ${i} fail — chờ ${backoff + jitter}ms (backoff)`);
      await sleep(backoff + jitter);
    }
  }
  throw lastError;
}

// Service chỉ hồi phục sau 2 lần fail
let attempt = 0;
const flaky = async () => {
  attempt++;
  if (attempt < 3) throw new Error("Tạm thời quá tải (503)");
  return "✅ API thành công";
};

withRetry(flaky).then(console.log); // → ✅ API thành công
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔁 **Tăng độ tin cậy** | Vượt qua lỗi tạm thời, ít fail hơn người dùng thấy |
| ⏳ **Tránh dồn tải** | Backoff + jitter cho target thời gian hồi phục |
| 🎯 **Chọn lọc** | Chỉ retry lỗi tạm thời, tránh làm tệ hơn |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| ⏱️ **Tăng latency** | Mỗi lần retry cộng thêm thời gian chờ |
| 🧾 **Side effect lặp** | Nếu không idempotent → hành động bị làm 2 lần |
| 🌊 **Thundering herd** | Không có jitter → nhiều client retry cùng lúc |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Network call / third-party API | ✅ Chuẩn |
| Transient 5xx / timeout | ✅ Chuẩn |
| Payload lớn, dễ bị timeout dài | ✅ Cân nhắc tăng timeout thay vì retry |
| Cập nhật DB bị lỗi nghiêm trọng | ⚠️ Không retry bừa — kiểm tra idempotency |

---

## 🔗 Liên quan

- **5.6.1 Circuit Breaker** — retry vài lần, quá ngưỡng thì ngắt mạch
- **5.6.4 Dead Letter Queue** — message fail hết retry → đưa sang DLQ
- **11.5 Rest Clients** — client library có sẵn retry/timeout thường đi kèm nhau

---

## 📁 Cấu trúc thư mục

```
5.6.2-retry-pattern/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.6-error-handling-techniques/5.6.2-retry-pattern
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Retry Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)
- 📖 [Backoff & Jitter - AWS](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

---

## ⏭️ Bài tiếp theo

→ [5.6.3 Saga Pattern](../5.6.3-saga-pattern/README.md)