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

## ❌ BAD — thêm 1 case: handler nặng + giữ state trong memory

```typescript
// ❌ BAD — load model 500MB mỗi invoke + đếm bằng biến global (container tái dùng/scale
// làm mất hoặc nhân đôi số đếm)
let totalOrders = 0; // 💥 state trong memory: scale ra 10 container = 10 số đếm khác nhau
export async function handlerBad(event: ServerlessEvent): Promise<ServerlessResponse> {
  const model = loadHeavyModel(); // 💥 cold start +500ms mỗi lần scale-out
  totalOrders++;
  return { statusCode: 200, body: JSON.stringify({ totalOrders }) };
}

// ✅ GOOD — handler gầy, state ra ngoài (DB/Redis), tài nguyên nặng cache ngoài handler
import { getCachedModel } from "./model";   // load 1 lần/container, tái dùng lúc warm
import { incrCounter } from "./store";       // counter trong Redis/DynamoDB
export async function handlerGood(event: ServerlessEvent): Promise<ServerlessResponse> {
  const total = await incrCounter("orders");
  return { statusCode: 200, body: JSON.stringify({ totalOrders: total }) };
}
```

> 2 luật serverless: **handler stateless** (state ra DB/cache) và **khởi tạo nặng để ngoài handler** (tận dụng warm container).

---

## ⚖️ Trade-off: Serverless vs Container (5.11.1) vs K8s (5.11.2)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Webhook/cron/xử lý event lẻ tẻ | ✅ Serverless | Rảnh = 0 đồng, scale tự động |
| API latency < 100ms ổn định, traffic đều | ⚖️ Container/K8s | Không cold start, không giới hạn timeout |
| Long-running (websocket, video encode 30 phút) | 🚫 Không serverless | Timeout/memory trần cứng |
| Vendor lock-in là rủi ro chính | ⚖️ Container | Handler serverless dính API từng nền tảng — bọc lớp adapter |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Cold start ở đường latency nhạy | P99 tăng vọt lúc scale-out | Provisioned concurrency / giữ warm cho API chính; runtime nhẹ |
| Quên giới hạn concurrency | 1 event storm (S3/retry) × 1000 invoke = hóa đơn sốc | Reserved concurrency + DLQ + alarm billing |
| Timeout mặc định quá ngắn/dài | Ngắn: job chết giữa chừng; dài: treo tốn tiền | Timeout theo job + client cũng timeout tương ứng |
| Lỗi retry vô hạn (queue → fail → queue) | Poison message đốt tiền vòng lặp | Max retries + dead-letter queue (xem 5.6.4) |

---

## ✅ Checklist khi review

- [ ] Handler stateless (không biến global giữ state nghiệp vụ)?
- [ ] Tài nguyên nặng khởi tạo ngoài handler (tái dùng lúc warm)?
- [ ] Có timeout + memory phù hợp từng hàm?
- [ ] Có giới hạn concurrency + DLQ cho trigger queue?
- [ ] Đã ước tính chi phí ở traffic đỉnh (không chỉ traffic trung bình)?

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
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11.4 Feature Flags](../5.11.4-feature-flags/README.md)