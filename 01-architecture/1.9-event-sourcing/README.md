# 📜 1.9 Event Sourcing

> Lưu trữ **toàn bộ thay đổi trạng thái** dưới dạng chuỗi **Event** bất biến. State = replay(events). Cho phép audit, time-travel, rebuild read models.

---

## 🎯 Kiến trúc này là gì?

Event Sourcing (Martin Fowler) **không lưu trạng thái hiện tại** mà lưu **mọi sự kiện đã xảy ra**. Trạng thái hiện tại được tính bằng cách **replay** toàn bộ sự kiện.

```
CÁCH LƯU TRỮ THÔNG THƯỜNG (State-based):
┌────────────┐   ┌────────────┐   ┌────────────┐
│ Wallet:    │   │ Wallet:    │   │ Wallet:    │
│ balance: 0 │──▶│ balance:100│──▶│ balance: 50│
└────────────┘   └────────────┘   └────────────┘
   (ghi đè)         (ghi đè)         (mất lịch sử)

CÁCH LƯU CỦA EVENT SOURCING (Event-based):
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ WalletCreated│──▶│ Deposited 100│──▶│ Withdrawn 50 │
│ (event 1)    │   │ (event 2)    │   │ (event 3)    │
└──────────────┘   └──────────────┘   └──────────────┘
   (append-only, bất biến, không xóa)

State hiện tại = replay(3 events) → balance = 50
```

> 📌 **Event = sự thật đã xảy ra, không thể sửa/xóa.** State chỉ là "view" tạm thời của event stream.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Append-only** | Event chỉ thêm, không sửa, không xóa |
| **Event bất biến** | Event đã ghi không thay đổi |
| **State = replay** | Trạng thái hiện tại tính từ chuỗi event |
| **Snapshot (tùy chọn)** | Lưu state định kỳ để replay nhanh hơn |
| **Event Store** | DB chuyên lưu event (EventStoreDB, Kafka, hoặc table events) |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Wallet**:

```
┌─────────────────────────────────────────────────────────────┐
│  EVENT STORE (append-only)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. WalletCreated (id: w1, owner: Alice)               │  │
│  │ 2. Deposited    (id: w1, amount: 100)                 │  │
│  │ 3. Withdrawn    (id: w1, amount: 50)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Wallet (Aggregate)                                         │
│  ├── apply(WalletCreated) → state khởi tạo                  │
│  ├── apply(Deposited)     → balance += 100                  │
│  └── apply(Withdrawn)     → balance -= 50                   │
│                                                             │
│  WalletState (rebuilt từ events) → balance = 50             │
└─────────────────────────────────────────────────────────────┘
```

- **Events:** `WalletCreated`, `Deposited`, `Withdrawn`
- **Aggregate:** `Wallet` (applies events để cập nhật state)
- **Event Store:** `InMemoryEventStore`
- **State:** `WalletState` (rebuilt từ events)

> 💡 Muốn biết lịch sử giao dịch? Chỉ cần đọc event stream. Muốn biết balance lúc nào? Replay đến thời điểm đó.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📋 **Audit trail đầy đủ** | Mọi thay đổi đều có lịch sử |
| ⏪ **Time-travel** | Tái dựng state tại bất kỳ thời điểm nào |
| 🔄 **Rebuild read model** | Xóa read model, replay events để dựng lại |
| 🧩 **Tách biệt write/read** | Kết hợp CQRS rất tự nhiên |
| 🐛 **Debug dễ** | Biết chính xác event nào gây lỗi |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧠 **Learning curve cao** | Tư duy khác hẳn CRUD truyền thống |
| 📦 **Event schema khó đổi** | Event cũ không sửa được, cần versioning/migration |
| 🐢 **Replay chậm khi event nhiều** | Cần snapshot để tăng tốc |
| 🔀 **Eventual consistency** | Read model cập nhật sau khi event xảy ra |
| 🏗️ **Phức tạp** | Overkill cho CRUD đơn giản |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cần audit trail đầy đủ (tài chính, tuân thủ) | ✅ Rất phù hợp |
| Cần time-travel / rebuild state | ✅ Phù hợp |
| Kết hợp CQRS + Event-Driven | ✅ Rất phù hợp |
| CRUD đơn giản, không cần lịch sử | ❌ Overkill |
| Team chưa quen event-driven | ⚠️ Cần đào tạo |

---

## 🔗 Liên quan

- **1.8 CQRS** — Cặp bài trùng: Event Sourcing cung cấp event cho read model
- **1.10 Event-Driven Architecture** — Event Sourcing dùng event bus để phát tán event
- **1.2 Microservices** — Mỗi service có event store riêng

---

## 📁 Cấu trúc thư mục ví dụ

```
1.9-event-sourcing/
├── README.md           # File này
└── examples/
    └── index.ts        # Wallet demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.9-event-sourcing
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- 📖 [Event Sourcing - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- 📖 [EventStoreDB Docs](https://developers.eventstore.com/)

---

## ⏭️ Bài tiếp theo

→ [1.10 Event-Driven Architecture](../1.10-event-driven-architecture/README.md)