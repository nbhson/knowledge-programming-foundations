# ⚡ 5.11.3 Serverless (Run Code Không Quản Lý Server)

> **Serverless** (FaaS) chạy từng hàm đơn khi có sự kiện — nền tảng lo toàn bộ hạ tầng, **tự scale** và chỉ tính tiền theo thời gian chạy thật.

---

## 🎯 Cách hoạt động

```
Event → Runtime → invoke handler(event) → Response
        │
   ├─ lần đầu  : COLD START — load runtime (chậm hơn)
   └─ lần sau  : WARM — container tái sử dụng (nhanh)

Billing: memory (GB) × duration (giây) × giá
```

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Handler** | Hàm: `(event) => { statusCode, body }` |
| **Event** | HTTP request, queue message, cron... |
| **Cold start** | Lần gọi đầu sau khi scale-in |
| **Warm container** | Tái sử dụng sau lần gọi trước |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Handler như deploy lên Lambda
function serverlessHandler(event: ServerlessEvent): ServerlessResponse {
  const id = event.pathParameters["orderId"] ?? "";
  const order = orders.find((o) => o.orderId === id);
  if (!order) return { statusCode: 404, body: JSON.stringify({ error: "Không tồn tại" }) };
  return { statusCode: 200, body: JSON.stringify(order) };
}

// Runtime mô phỏng cold/warm + billing
class MiniLambdaRuntime {
  invoke(handler, event): { durationMs; response; wasCold } {
    const wasCold = !this.warm;
    const durationMs = (wasCold ? this.coldStartMs : 0) + this.dryRunMs;
    this.warm = true;
    return { durationMs, response: handler(event), wasCold };
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📈 **Auto-scale** | Từ 0 → hàng nghìn request, không cấu hình |
| 💸 **Pay-per-use** | Thời gian rảnh = 0 chi phí |
| 👷 **Zero ops** | Không VM, không cluster, không patch |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| ❄️ **Cold start** | Độ trễ lần đầu (đặc biệt là non-JS runtime) |
| 🔗 **Vendor lock-in** | Triển khai phụ thuộc nền tảng (AWS/Vercel/Cloudflare) |
| ⏱️ **Giới hạn** | Timeout, memory, payload có trần cứng |

---

## 🔗 Liên quan

- **5.11.1 Docker** — Container bạn tự quản lý
- **5.11.2 Kubernetes** — Cluster bạn tự vận hành
- **5.11.4 Feature Flags** — Cần bật/tắt hàm mà không redeploy

---

## 📚 Tài liệu tham khảo

- 📖 [Serverless Framework](https://www.serverless.com/)
- 📖 [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.11.3-serverless
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11.4 Feature Flags](../5.11.4-feature-flags/README.md)