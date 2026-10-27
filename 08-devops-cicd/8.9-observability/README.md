# 🔭 8.9 Observability (Metrics, Logs, Traces)

> **Observability** trả lời "tại sao lỗi" bằng 3 trụ cột: **metrics** (hệ thống đang thế nào), **logs** (điều gì đã xảy ra), **traces** (request đi đâu, tốn bao lâu) — cộng RED/USE để chọn metric đúng.

---

## 🎯 Vấn đề

Production lỗi mà chỉ có `console.log("error here")`: không biết lỗi ảnh hưởng bao nhiêu user, bắt đầu khi nào, request nào chậm ở đâu:

```
user: "checkout chậm!"
dev: mở log 10GB grep tay... 2 tiếng sau vẫn chưa biết service nào chậm 💥
```

Observability biến "đoán" thành "truy vấn": traceId nối mọi log/span của 1 request.

---

## 💻 Code ví dụ

Mô phỏng structured log + trace context lan truyền qua services, tính RED metrics.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface Span { traceId: string; service: string; operation: string; durationMs: number; error?: string }

// Logger có trace context: mọi dòng log đều mang traceId
function log(span: Span, level: string, msg: string): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, traceId: span.traceId, service: span.service, op: span.operation, msg }));
}

// RED: Rate (req/s), Errors (%), Duration (p50/p99)
function red(spans: Span[]): { rate: number; errorRate: number; p99: number } {
  const durs = spans.map((s) => s.durationMs).sort((a, b) => a - b);
  return {
    rate: spans.length, // /window
    errorRate: spans.filter((s) => s.error).length / spans.length,
    p99: durs[Math.min(durs.length - 1, Math.floor(durs.length * 0.99))],
  };
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Debug nhanh 10x | traceId → thấy ngay request đi qua service nào, span nào chậm |
| Alert đúng | RED (user-facing) + USE (infra) → alert khi user đau, không phải khi CPU nhảy vô hại |
| Hiểu unknown-unknowns | Không cần đoán trước câu hỏi — query tự do trên dữ liệu có cấu trúc |

---

## ⚠️ Lưu Ý

- Log dạng JSON có cấu trúc ngay từ đầu; log text tự do không query được.
- Trace sampling: giữ 100% error traces, sample 1–10% success — không lưu hết (tốn tiền).
- Không log PII/secrets (password, token, thẻ): redaction ở tầng logger.
- Cardinality: label có hàng triệu giá trị (userId) làm nổ metrics backend — dùng logs/traces cho chi tiết đó.

---

## 🎯 Khi nào dùng

- Mọi production service: metrics RED cho API, USE cho host/container, traces cho call-chain.
- RED (Rate/Errors/Duration): cho services user-facing. USE (Utilization/Saturation/Errors): cho tài nguyên (CPU, disk, queue).

---

## 🚀 Đi Sâu Thêm

**3 trụ cột → 1 chuẩn duy nhất: OpenTelemetry (OTel).** Năm 2020 mỗi backend (Prometheus, Jaeger, ELK...) có SDK riêng; tới 2026 OTel đã là standard de-facto: 1 SDK instrument cho cả metrics + logs + traces, xuất ra backend nào cũng được.

- **Collector:** agent nhận telemetry từ app (OTLP protocol), rồi xử lý pipeline: `receive → process (batch, tail-sampling, redact PII) → export` tới Prometheus/Jaeger/Loki. Đổi backend không phải sửa code app — chỉ đổi config collector.
- **Semantic conventions:** quy ước đặt tên thuộc tính chuẩn (`http.method`, `db.system`, `service.name`...) — mọi service nói cùng ngôn ngữ, dashboard/alert tái sử dụng được.

**Correlation trace ↔ log:** log luôn mang `trace_id` (+ `span_id`) — khi trace chỉ ra span DB chậm, 1 cú click lọc log theo trace_id là thấy câu lệnh/lỗi cụ thể. Điều này bắt buộc logger nhận context từ tracer (OTel baggage/context propagation).

**SLO burn-rate alerting:** thay vì alert "error rate > 1%", alert theo tốc độ đốt error budget — burn rate 14× trong 1h (nhanh, cấp cứu) + 6× trong 6h (chậm, hôm nay xử lý) để vừa bắt được sự cố vừa tránh nhiễu. Chi tiết multi-window burn-rate → xem **8.10 SRE & SLO**.

**eBPF observability — nhìn tầng kernel, không cần instrument:**
- **Cilium Hubble:** flow service-to-service, network policy drops, DNS/L7 insight tự động từ K8s.
- **Pixie:** auto-collect latency HTTP/SQL các loại, không sửa code, không sidecar.
- Phù hợp: tìm "ai gọi ai, chậm ở đâu" khi chưa kịp instrument OTel, hoặc debug tầng network.

---

## 🔗 Liên quan

- **7.11 Chaos Testing** — không có observability thì chaos mù.
- **8.10 SRE/SLO** — SLI chính là metrics RED được chọn làm chỉ báo.
- **10.6 Redis** — log aggregation và metrics thường qua pipeline tương tự cache/queue.

---

## 📚 Tài liệu

- OpenTelemetry Docs — https://opentelemetry.io/docs/
- Google SRE Book (Monitoring) — https://sre.google/sre-book/monitoring-distributed-systems/
- *Observability Engineering* — Charity Majors et al.

---

## ▶️ Chạy ví dụ

```bash
cd 08-devops-cicd/8.9-observability
npx ts-node examples/index.ts
```

Demo: request đi qua 3 services với traceId → structured logs → tính RED → phát hiện span DB chậm.

---

## ⏭️ Bài tiếp theo

→ [8.10 SRE & SLO](../8.10-sre-slo/README.md)
