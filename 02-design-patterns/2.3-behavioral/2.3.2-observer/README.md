# 📡 2.3.2 Observer Pattern

> Định nghĩa quan hệ **1-nhiều**: khi 1 object thay đổi trạng thái, tất cả observer phụ thuộc được thông báo và cập nhật tự động.

---

## 🎯 Vấn đề

1 object thay đổi → nhiều object khác phải cập nhật, nhưng không muốn chúng phụ thuộc chặt (coupling) lẫn nhau:

```
❌ Polling / gọi trực tiếp từng nơi — cứng nhắc, khó thêm subscriber
Stock.setPrice() → email.send(); app.refresh(); bot.check();

✅ GIẢI PHÁP: Subject duy trì danh sách observer, notify tự động
┌──────────┐  subscribe/notify  ┌──────────┐
│  Subject │───────────────────▶│ Observer │
│  Stock   │◀──────────────────│ Email/App│
└──────────┘   update(price)    └──────────┘
```

**Scenario điển hình:** Newsletter, stock price, DOM events, event bus — 1 thay đổi cần lan tới nhiều nơi mà các bên không biết nhau.

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
│    ┌─────────────┼─────────────┐                    │
│ ┌──┴─────┐ ┌────┴────┐ ┌──────┴────┐                │
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
  unsubscribe(o: Observer): void { this.observers = this.observers.filter(x => x !== o); }
  setPrice(price: number): void {
    this.price = price;
    this.notifyAll();
  }
  private notifyAll(): void { for (const o of this.observers) o.update(this.price); }
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

> ⚠️ **Lưu ý:** Quên `unsubscribe` gây memory leak. Trong JS/DOM cần cleanup.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 **Loose coupling** | Subject không biết chi tiết observer |
| ➕ **Thêm/hủy runtime** | `subscribe/unsubscribe` linh hoạt |
| 📡 **Tự động lan tỏa** | 1 thay đổi → N nơi cập nhật |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐛 **Khó debug** | Không rõ ai nhận, thứ tự nào |
| 💧 **Memory leak** | Quên unsubscribe giữ reference |
| 🌪️ **Cập nhật bão** | Nhiều observer → cascaded updates |
| 🔀 **Thứ tự không đảm bảo** | Observer nhận không theo thứ tự đăng ký (tuỳ implement) |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| 1 thay đổi → nhiều nơi cần biết | ✅ Phù hợp |
| Event bus, pub/sub | ✅ Phù hợp |
| UI binding, reactive | ✅ Phù hợp |
| Chỉ 1-1, không cần lan tỏa | ⚠️ Dùng callback đơn giản |

---

## 🔗 Liên quan

- **2.3.7 Mediator** — Mediator điều phối tập trung, Observer lan tỏa 1→N
- **1.10 Event-Driven Architecture** — Dùng Observer ở tầng hệ thống
- **2.3.1 Strategy** — Observer thay đổi subscriber, Strategy thay đổi thuật toán

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

---

## ⏭️ Bài tiếp theo

→ [2.3.3 Command](../2.3.3-command/README.md)
