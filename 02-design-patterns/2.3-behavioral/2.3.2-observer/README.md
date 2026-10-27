# 📡 2.3.2 Observer Pattern

> Định nghĩa quan hệ **1-nhiều**: khi 1 object thay đổi trạng thái, tất cả observer phụ thuộc được thông báo và cập nhật tự động.

---

## 🎯 Vấn đề

1 object thay đổi → nhiều object khác phải cập nhật, nhưng không muốn chúng phụ thuộc chặt (coupling) lẫn nhau.

**Observer là foundation của reactive programming.** Hiểu Observer = hiểu RxJS, React useState, Angular signals, DOM events, pub/sub systems.

```
❌ Polling / gọi trực tiếp từng nơi — cứng nhắc, khó thêm subscriber
Stock.setPrice() → email.send(); app.refresh(); bot.check();

✅ GIẢI PHÁP: Subject duy trì danh sách observer, notify tự động
┌──────────┐  subscribe/notify  ┌──────────┐
│  Subject │───────────────────▶│ Observer │
│  Stock   │◀──────────────────│ Email/App│
└──────────┘   update(price)    └──────────┘
```

**2 kiến trúc Observer:**
- **Push model (classic):** Subject gửi toàn bộ state mới cho observer (`update(price)`). Observer nhận dữ liệu đầy đủ.
- **Pull model (reactive):** Subject emit event, observer **pull** state khi cần (`state$.subscribe(s => this.price = s.price)`). Observer chủ động lấy data.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Subject (Stock)                                     │
│  ─ observers: Observer[]                             │
│  ─ subscribe(o), unsubscribe(o), notifyAll()        │
│                  │                                   │
│                  │ update(price)                     │
│                  ▼                                   │
│            Observer (interface)                      │
│                  ▲                                   │
│    ┌─────────────┼──────────────┐                    │
│ ┌──┴─────┐ ┌────┴────┐ ┌───────┴────┐                │
│ │Email   │ │MobileApp│ │TradingBot │                │
│ └────────┘ └─────────┘ └───────────┘                │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
aapl.subscribe(email); aapl.subscribe(app);
aapl.setPrice(145) → notifyAll() → email.update(145), app.update(145), bot.update(145)
aapl.unsubscribe(email) → lần sau không nhận nữa
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Observer { update(price: number): void; }

class Stock {
  private observers: Observer[] = [];
  subscribe(o: Observer): void { this.observers.push(o); }
  unsubscribe(o: Observer): void { 
    this.observers = this.observers.filter(x => x !== o); 
  }
  setPrice(price: number): void {
    this.price = price;
    this.notifyAll();
  }
  private notifyAll(): void { 
    for (const o of this.observers) o.update(this.price); 
  }
}

class EmailAlert implements Observer {
  update(price: number): void { console.log(`📧 Email: $${price}`); }
}
class TradingBot implements Observer {
  update(price: number): void { if (price < 150) console.log(`🤖 Mua $${price}`); }
}

const aapl = new Stock();
aapl.subscribe(new EmailAlert());
aapl.subscribe(new TradingBot());
aapl.setPrice(145); // cả 2 nhận
```

> ⚠️ **Lưu ý quan trọng:** Quên `unsubscribe` gây memory leak. Observer giữ reference đến Subject, Subject giữ reference đến Observer → cycle. Trong browser (DOM events) và Node.js phải cleanup.

**Real-world Observer implementations:**
- `EventTarget.addEventListener/removeEventListener` (browser DOM)
- `RxJS Subject/Observable`
- `Node.js EventEmitter`
- `React useEffect cleanup`
- `Angular BehaviorSubject/Subject`
- `Vue 3 ref/watch` (reactive system)

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔗 **Loose coupling** | Subject không biết chi tiết observer | Subject chỉ biết Observer interface, không import concrete classes. |
| ➕ **Thêm/hủy runtime** | `subscribe/unsubscribe` linh hoạt | Dynamic plugin system, hot-reload behavior. |
| 📡 **Tự động lan tỏa** | 1 thay đổi → N nơi cập nhật | Push model eliminates polling waste. |
| 🧪 **Testable** | Test Subject và Observer riêng | Mock Observer, verify Subject behavior. |
| 🧬 **Async-friendly** | Observer có thể xử lý async | Streaming, background processing. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🐛 **Khó debug** | Không rõ ai nhận, thứ tự nào | Stack trace qua nhiều observer level. *Gi giảm thiểu:* log subscribe/unsubscribe events. |
| 💧 **Memory leak** | Quên unsubscribe giữ reference | Observer ↔ Subject cycle. *Gi giảm thiểu:* luôn có cleanup, dùng WeakRef khi appropriate. |
| 🌪️ **Cascading updates** | Nhiều observer → cascaded chain | `A.notify → B.update → B.notify → C.update...` infinite loop risk. *Gi giảm thiểu:* `notifyLock` flag, or limit depth. |
| 🔀 **Thứ tự không đảm bảo** | Observer nhận không theo thứ tự đăng ký | Implementation-dependent order. *Gi giảm thiểu:* document expected order, use ordered observers when needed. |
| 👻 **Error propagation** | Error trong observer có thể kill tất cả | `catch` all observers, hoặc isolate mỗi observer. *Gi giảm thiểu:* wrap each `o.update()` in try/catch. |
| 🧨 **Event storm** | Nhiều event cùng lúc → performance degradation | Observer soup. *Gi giảm thiểu:* throttle/debounce, batched updates. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| 1 thay đổi → nhiều nơi cần biết | ✅ Rất phù hợp | Notification, alerting, UI updates. |
| Event bus, pub/sub | ✅ Phù hợp | Cross-cutting concern. |
| UI binding, reactive | ✅ Phù hợp | Observable data flow (React/Vue/Angular). |
| Chỉ 1-1, không cần lan tỏa | ⚠️ Dùng callback đơn giản | Observer overkill. |
| Observer count không biết trước (dynamic) | ✅ Phù hợp | Runtime plugin system. |
| Performance-critical tight loop | ⚠️ Inline call có thể tốt hơn | Observer overhead ~microseconds. |

---

## 🔗 Liên quan

- **2.3.7 Mediator** — Mediator điều phối tập trung, Observer lan tỏa 1→N.
- **1.10 Event-Driven Architecture** — Dùng Observer ở tầng hệ thống (event bus).
- **2.3.1 Strategy** — Observer thay đổi subscriber, Strategy thay đổi thuật toán.
- **12.6 Observables** — RxJS extended Observer pattern.
- **5.5.5 Event Emitter** — Node.js EventEmitter implementation.

**Observer vs Pub/Sub (EDA) — phân biệt tinh tế:**
- **Observer:** Subject duy trì list của Observer — tight coupling ở mức interface.
- **Pub/Sub (EDA):** Broker trung gian decouple producer khỏi consumer hoàn toàn.
- Thực tế: Event Bus là Observer pattern + broker layer.

---

## 📁 Cấu trúc thư mục

```
2.3.2-observer/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.2-observer
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Observer - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- 📖 [Observer - Source Making](https://sourcemaking.com/design_patterns/observer)
- 📖 [Reactive Extensions (RxJS)](https://rxjs.dev/)

---

## ⏭️ Bài tiếp theo

→ [2.3.3 Command](../2.3.3-command/README.md)
