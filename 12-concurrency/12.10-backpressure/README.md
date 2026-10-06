# 🌊 12.10 Backpressure (Áp Lực Ngược)

> Khi **producer nhanh hơn consumer**, data dồn tới OOM. **Backpressure** là cơ chế consumer báo ngược "chậm lại đi": queue bounded + chiến lược khi đầy (block, drop, sample) và **pull** thay vì **push** mù.

---

## 🎯 Vấn đề

Producer bắn 10k msg/s, consumer xử lý 1k/s, queue vô hạn:

```
phút 1: queue 540k msgs … phút 10: OOM, service chết 💥
```

Thiếu backpressure, hệ thống nhanh "ảo" lúc đầu rồi sập không báo trước.

---

## 💻 Code ví dụ

Mô phỏng producer nhanh/consumer chậm với queue bounded + 3 chiến lược overflow.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

type Overflow = "block" | "drop-newest" | "drop-oldest";

class BoundedQueue<T> {
  private items: T[] = [];
  drops = 0;
  constructor(private limit: number, private onFull: Overflow) {}

  push(x: T): boolean {
    if (this.items.length < this.limit) { this.items.push(x); return true; }
    // đầy: block (trả false → producer chờ), drop newest/oldest
    if (this.onFull === "drop-newest") { this.drops++; return false; }
    if (this.onFull === "drop-oldest") { this.items.shift(); this.items.push(x); this.drops++; return true; }
    return false; // block: producer tự chờ rồi thử lại
  }
  shift(): T | undefined { return this.items.shift(); }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Không OOM | Memory có biên — hệ thống degrade (chậm/drop có kiểm soát) thay vì chết |
| Tín hiệu lan ngược | Producer chậm lại tự nhiên (block) — cả pipeline tự cân bằng |
| Mất có chủ đích | Telemetry drop-oldest giữ data mới nhất; payment block không mất gì |

---

## ⚠️ Lưu Ý

- Pull (consumer xin `request(n)`) tốt hơn push mù: consumer kiểm soát nhịp (Reactive Streams, Kafka poll).
- Chọn overflow theo domain: payment/audit → block (không mất); metrics/log → drop (mất ít được); live video → drop-oldest (mới nhất quan trọng).
- Báo động khi drop/block tăng — đó là tín hiệu cần scale consumer, không phải trạng thái bình thường.
- Không "fix" bằng tăng queue vô tội vạ: queue lớn chỉ trì hoãn OOM và làm latency tăng vọt.

---

## 🎯 Khi nào dùng

- Mọi pipeline producer-consumer: message queue, stream processing, log pipeline, upload→process.
- Không dùng queue vô hạn ở bất kỳ đâu ngoài prototype vứt đi.

---

## 🔗 Liên quan

- **12.9 Thread Pools** — queue của pool đầy cũng cần policy (cùng họ backpressure).
- **12.6 Observables** — `bufferCount`/`throttle`/`sample` là backpressure ở tầng stream.
- **11.11 Realtime Protocols** — MQTT QoS + buffering khi subscriber chậm.

---

## 📚 Tài liệu

- Reactive Streams — https://www.reactive-streams.org/
- *Designing Data-Intensive Applications* ch.11 (backpressure) — Kleppmann

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.10-backpressure
npx ts-node examples/index.ts
```

Demo: producer 10x consumer với queue 5 → so sánh block / drop-newest / drop-oldest (drops + latency).

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm Concurrency — tiếp tục System Design:

→ [13.1 Load Balancer](../../13-system-design/13.1-load-balancer/README.md)
