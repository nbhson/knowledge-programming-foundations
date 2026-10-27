# 📋 22.2 Logging Best Practices (Log Chuẩn Nghề)

> **Log là "băng ghi âm" của hệ thống.** Sự cố 3 giờ sáng, không ai đợi bạn debug —
> chỉ có log để đọc. Log kém: không đủ thông tin hoặc là biển nhiễu không đọc nổi.
> Log tốt: đủ ngữ cảnh, tìm được theo correlation ID, có level đúng đắn.

> Liên quan: `08.9-observability` (log + metric + tracing), `22.4-error-monitoring`
> (nơi log được tổng hợp), `9.9-secrets-management` (redact secret trong log).

---

## 🎯 Vấn Đề

```ts
console.log("error");                 // đọc vào cũng không biết gì
console.log(JSON.stringify(data));    // in hết, kể cả password!
console.log("đã xử lý " + id);        // requestId đâu? user nào? môi trường nào?
```

Log kém = khi sự cố xảy ra: không đủ dữ kiện, không tìm được request tương ứng,
không lọc được theo severity, secret bị in ra hàng nghìn dòng.

---

## 🧠 Log Level: Hợp Đồng Đúng Nghĩa

| Level | Khi nào dùng | Ví dụ |
|---|---|---|
| `ERROR` | yêu cầu thất bại, CẦN can thiệp | thanh toán fail, DB disconnect |
| `WARN` | bất thường nhưng tự phục hồi được | retry lần 3, cache miss cao |
| `INFO` | sự kiện kinh doanh đáng chú ý | order created, user login |
| `DEBUG` | chi tiết để dev điều tra | request payload, intermediate state |

Quy tắc vàng: **prod ≥ info** (debug tắt), bật DEBUG động khi điều tra, không đổi code.

---

## 💻 Code Ví Dụ

```typescript
// ===== Structured logging: log là DỮ LIỆU, không phải văn xuôi =====
// ❌ Văn bản: "User 42 đặt đơn 8899 thành công" — machine khó lọc
// ✅ Structured: JSON field rõ ràng
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

logger.info(
  { event: "order.created", userId: 42, orderId: "ORD-8899", total: 250000 },
  "Đơn hàng đã được tạo",
);
// Truy vấn như DB: { event: "order.created" AND total > 100000 }

// ===== Correlation ID: nối các log của CÙNG 1 request =====
// 1 request đi qua 3 service → 3 log rời rạc. Correlation ID khâu lại thành 1 câu chuyện
function withRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) ?? crypto.randomUUID();
  res.setHeader("x-request-id", requestId);
  req.log = logger.child({ requestId }); // mọi log sau tự gắn ID
  next();
}

// ===== Redact secret trước khi log =====
const redactLogger = pino({
  redact: ["req.headers.authorization", "*.password", "*.token"],
});
// log không bao giờ rò mật khẩu, kể cả khi dev vô tình log cả object request

// ===== Log LỖI đúng cách: giữ stack + context =====
try {
  await chargeCard(order);
} catch (err) {
  logger.error({ err, orderId: order.id }, "Thanh toán thất bại");
  // ✅ object ở tham số đầu → pino/winston giữ stack trace đầy đủ
  // ❌ logger.error(`Failed: ${err.message}`) — mất stack, mất context
}

// ===== Không log trong vòng lặp nóng =====
for (const item of millionItems) {
  logger.debug({ item }, "processing"); // 1 triệu serialize + I/O!
}
// → log batch/tổng số, hoặc check: logger.isLevelEnabled("debug")
```

---

## ⚖️ Log vs Metric vs Trace

| | Log | Metric | Trace |
|---|---|---|---|
| Câu trả lời | "chuyện gì xảy ra" | "bao nhiêu, tốc độ nào" | "đường đi qua các service" |
| Kích thước | lớn nhất | nhỏ nhất | trung bình |
| Dùng khi | điều tra chi tiết 1 sự kiện | dashboard, alert | hỏi "chậm ở service nào" |

---

## ⚠️ Bẫy Thường Gặp

1. **Log secrets (password, token, PII)** — vi phạm pháp lý về dữ liệu. Luôn redact.
2. **Log trong loop nóng** — I/O mỗi iteration → chậm + tràn disk.
3. **String interpolation dù DEBUG tắt** — template string vẫn build chuỗi. Dùng structured object.
4. **Không có correlation ID** — sự cố multi-service không ghép được luồng. Truyền `x-request-id` xuyên suốt.
5. **console.log trong prod** — không level, không structured. Dùng logger thật (pino, winston).
6. **Log file không rotate** — disk đầy lúc 3h sáng. Rotation hoặc ship đi (Loki, ELK).

---

## 📝 Bài Tập Tự Vấn

1. Thiết kế log schema cho service thanh toán: trường nào bắt buộc? data nào không bao giờ log?
2. Correlation ID xuyên 3 service — truyền bằng gì (header? message payload? context)?
3. Log volume 200GB/ngày, chi phí nổ. Giảm ở đâu mà vẫn không mất khả năng debug?

---

*Leaf thuộc [Lớp 22 — Debugging, Logging & Profiling](../README.md)*
