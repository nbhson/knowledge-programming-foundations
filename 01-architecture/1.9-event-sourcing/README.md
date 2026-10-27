# 📜 1.9 Event Sourcing

> Lưu trữ **toàn bộ thay đổi trạng thái** dưới dạng chuỗi **Event** bất biến. State = replay(events). Cho phép audit, time-travel, rebuild read models.

---

## 🎯 Kiến trúc này là gì?

Event Sourcing (Martin Fowler) **không lưu trạng thái hiện tại** mà lưu **mọi sự kiện đã xảy ra**. Trạng thái hiện tại được tính bằng cách **replay** toàn bộ sự kiện.

**So sánh trực quan với CRUD thông thường — để thấy sự khác biệt cốt lõi:**

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

**Sự khác biệt không chỉ là "lưu lịch sử" — nó là sự đảo ngược tư duy về dữ liệu:**
- **CRUD:** lưu "kết quả cuối cùng", quá khứ bị đè mất.
- **Event Sourcing:** lưu "những gì đã xảy ra", kết quả hiện tại là **phụ**.

**Điều này cho phép những thứ CRUD không bao giờ làm được:**
1. **Audit trail miễn phí:** mọi thay đổi đều có event → trả lời "ai thay đổi giá từ 100 thành 90 lúc 14:32?" chỉ bằng một query.
2. **Time-travel:** `wallet.at(new Date('2024-01-01'))` = replay đến event cuối trước thời điểm đó.
3. **Rebuild state:** nếu state bị sai (bug trong logic tính toán), fix bug rồi **replay toàn bộ event** → state mới đúng, không cần migrate dữ liệu.
4. **Causal analysis:** biết chính xác event nào gây ra lỗi hiện tại.

> 📌 **Event = sự thật đã xảy ra, không thể sửa/xóa.** State chỉ là "view" tạm thời của event stream.

**Event Sourcing là kiến trúc lưu trữ, không phải kiến trúc ứng dụng:** nó chỉ quy định **"lưu thế nào"**. Bạn vẫn cần (a) command side xử lý business rule, (b) read model phục vụ UI, (c) projection để build view. Đó là lý do CQRS + Event Sourcing đi cùng nhau như một cặp: ES cung cấp event stream; CQRS cung cấp 2 mô hình riêng cho đọc/ghi.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả | Giải thích sâu |
|----------|-------|----------------|
| **Append-only** | Event chỉ thêm, không sửa, không xóa | Bảng `events` chỉ có `INSERT`. Không có `UPDATE`, không có `DELETE`. Đây là **journal** của hệ thống — nếu bạn có thể rollback hoặc xóa lịch sử, bạn đang không dùng Event Sourcing. Đây cũng là lý do audit compliance dễ: dữ liệu không bị "soft-delete" hay "sửa sau lưng". |
| **Event bất biến** | Event đã ghi không thay đổi | `Deposited(100)` mãi mãi là `Deposited(100)`. Nếu bạn cần "sửa" một event → **append một event bù** (`DepositedCorrection(-100)`). State cuối cùng vẫn đúng, và lịch sử vẫn cho thấy điều gì đã xảy ra lúc đầu. |
| **State = replay** | Trạng thái hiện tại tính từ chuỗi event | Mỗi lần cần state hiện tại của `Wallet#w1` → lấy toàn bộ event của `w1`, sắp xếp theo thứ tự, apply lần lượt. Tốc độ: O(n) với n = số event. Với tài khoản 2 năm (700k events) → cần tối ưu. |
| **Snapshot (tùy chọn)** | Lưu state định kỳ để replay nhanh hơn | Mỗi 1000 event hoặc mỗi ngày → lưu snapshot của aggregate. Lần đọc tiếp theo chỉ replay từ snapshot gần nhất. Tiết kiệm từ giây xuống miligiây. Chiến lược: snapshot theo **kích thước event stream** hoặc **thời gian**. |
| **Event Store** | DB chuyên lưu event (EventStoreDB, Kafka, hoặc table events) | Không nhất thiết dùng EventStoreDB. Postgres table `events (id, aggregate_id, event_type, event_data, version, occurred_at)` cũng đủ cho majority use case. Điểm mấu chốt là append-only + ordering by version — bạn có thể tự xây với SQL cơ bản. |

**Event versioning — vấn đề thực tế số 1:** schema event thay đổi theo thời gian (thêm field, đổi tên). Vì event cũ không sửa được, projector mới phải đọc cả 2 version. Chiến lược phổ biến: **upcasting** (transform event cũ → event mới khi đọc từ store), hoặc **dual write** (ghi cả 2 format trong giai đoạn chuyển tiếp), hoặc **event migration job** (rebuild stream). Chọn chiến lược khi event đầu tiên được ghi, không phải lúc version 5 cần đổi.

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

**Code mô tả event apply (xem examples/index.ts):**

```ts
// Aggregate — không lưu state trong DB, chỉ nhận events
class Wallet {
  private state = { balance: 0 };

  apply(event: WalletEvent) {
    switch (event.type) {
      case 'WalletCreated':
        this.state.balance = 0;
        break;
      case 'Deposited':
        this.state.balance += event.payload.amount;
        break;
      case 'Withdrawn':
        this.state.balance -= event.payload.amount;
        break;
    }
  }
}

// Đọc state hiện tại
const wallet = new Wallet();
for (const evt of eventStore.load(walletId))
  wallet.apply(evt);
console.log(wallet.state.balance);  // 50
```

**Thứ tự event phải được đảm bảo** — dùng version số (optimistic concurrency) hoặc timestamp + vector clock. EventStoreDB dùng version; Kafka dùng partition key. Sai thứ tự → state sai → bug khó tìm.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 📋 **Audit trail đầy đủ** | Mọi thay đổi đều có lịch sử | Không cần bảng `audit_log` riêng — event stream **bản thân đã là** audit log, và nó **không thể sửa**. Cho compliance, fraud detection, reconciliation. |
| ⏪ **Time-travel** | Tái dựng state tại bất kỳ thời điểm nào | Hỏi "số dư tài khoản lúc 20:00 tối qua?" → replay đến event cuối trước 20:00. Không cần bảng snapshot thủ công, không cần "AS OF" query phức tạp. |
| 🔄 **Rebuild read model** | Xóa read model, replay events để dựng lại | Read model bị lệch do bug projection? Xóa, replay lại — không cần revert DB, không cần re-run batch. **This is the "undo" button for data pipelines.** |
| 🧩 **Tách biệt write/read** | Kết hợp CQRS rất tự nhiên | Event stream → nhiều projector → nhiều read model (dashboard, search, analytics). Thêm một góc nhìn mới = thêm một projector, không đổi gì write side. |
| 🐛 **Debug dễ** | Biết chính xác event nào gây lỗi | Lỗi "số dư âm" → tìm event `Withdrawn` thứ N nào đẩy qua ngưỡng. Không cần so sánh row cũ và mới, không cần "đoán transaction nào sai". Event là **sự thật**; state là **hệ quả**. |
| 📈 **Performance ghi tốt** | Ghi event = insert đơn giản | Insert append-only có thể batch, không cần update (không lock row). Phù hợp high-throughput write. |
| 🧬 **Event là API bền vững** | (Ưu điểm chiến lược) | Event được thiết kế theo ngôn ngữ nghiệp vụ, không phụ thuộc schema DB. Event `OrderShipped` có thể sống 10 năm dù schema DB đổi 5 lần. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧠 **Learning curve cao** | Tư duy khác hẳn CRUD truyền thống | Dev quen "SELECT * FROM wallets WHERE id = ?" phải chuyển sang "event này apply vào state sao?" → thay đổi mental model hoàn toàn. Đừng bắt cả team nhảy; giới thiệu từng module. |
| 📦 **Event schema khó đổi** | Event cũ không sửa được, cần versioning/migration | Thêm field mới → projector mới biết đọc, projector cũ bỏ qua. Đổi tên field → cần upcaster. Xóa field → vẫn phải đọc vì event cũ có. **Event contract là public API** — breaking change cần migration song song. |
| 🐢 **Replay chậm khi event nhiều** | Cần snapshot để tăng tốc | 1 aggregate với 1 triệu events → rebuild state mất 10–30s. Không phải thử thách kỹ thuật mà là **một cấu trúc quản trị**: snapshot strategy (khi nào, ở đâu, expire thế nào). |
| 🔀 **Eventual consistency** | Read model cập nhật sau khi event xảy ra | User gửi tiền → event `Deposited` được ghi → **projector chưa chạy** → query "số dư" vẫn thấy cũ. *Giảm thiểu:* read-your-own-writes bằng cách load state trực tiếp từ aggregate (hoặc snapshot fresh), không đi qua read model. |
| 🏗️ **Phức tạp** | Overkill cho CRUD đơn giản | Nếu nghiệp vụ chỉ là CRUD admin panel, bạn trả gấp đôi chi phí vì "có thể xem lịch sử". |
| 🔍 **Query phức tạp hơn** | Không query trực tiếp trên event stream | "Tìm tất cả wallet có giao dịch > 1 triệu trong tháng 3" → cần **projection** phù hợp. Không thể `WHERE amount > 1000000` được. |
| 🛠️ **Tooling hạn chế** | Không có sẵn như relational DB | EventStoreDB tốt nhưng startup; Kafka phổ biến nhưng cần tự quản lý version + ordering; Postgres table = tự làm. Setup project, team training, và troubleshooting lần đầu tốn sức. |
| 🧵 **Debug projection** | (Vấn đề vận hành bị bỏ sót) | Khi 2 projector cùng consume 1 event stream, một projector bị lỗi silent → read model lệch mà không có ai biết. Cần **projection health check** + lag metric + alert. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Cần audit trail đầy đủ (tài chính, tuân thủ, medical) | ✅ Rất phù hợp | Event stream **bản thân là** source of truth cho audit — không cần bổ sung thêm gì. |
| Cần time-travel / rebuild state | ✅ Phù hợp | "State hôm qua thế nào?" → replay đến thời điểm đó. |
| Kết hợp CQRS + Event-Driven | ✅ Rất phù hợp | ES là **ứng viên tự nhiên** cho write side của CQRS. |
| Domain có **nhiều trạng thái**, cần causal analysis | ✅ Phù hợp | Vấn đề "chuyển từ trạng thái A sang B nhưng thiếu bước X" → nằm ngay trong event stream. |
| Cần nhiều projection khác nhau | ✅ Rất phù hợp | Dashboard, search, analytics, report — mỗi cái một projector, cùng nguồn event. |
| CRUD đơn giản, không cần lịch sử | ❌ Overkill | Trả giá cho tính năng bạn sẽ không dùng. |
| High-throughput write cần tối ưu | ⚠️ Cân nhắc | Append-only nhanh, nhưng replay + snapshot cũng có chi phí. Đo lường trước. |
| Team chưa quen event-driven | ⚠️ Cần đào tạo | Áp dụng kiến trúc mà team không hiểu → đạo nhỏ, thất bại lớn. |

**Checklist trước khi quyết định:**
1. Có bằng chứng cần audit/time-travel không (hoặc có thể biến nó thành competitive advantage)?
2. Domain có các transition state phức tạp mà state hiện tại không đủ hiển thị causal chain?
3. Có nhu cầu nhiều projection từ cùng event stream (analytics, search, audit dashboard)?
4. Team đã quen async/event-driven và có event store infrastructure?

Nếu 3/4 trả lời YES → ES là lựa chọn đúng. Nếu 0–1 → bắt đầu bằng CRUD đơn giản.

---

## 🔗 Liên quan

- **1.8 CQRS** — Cặp bài trùng: Event Sourcing cung cấp event cho read model
- **1.10 Event-Driven Architecture** — Event Sourcing dùng event bus để phát tán event
- **1.2 Microservices** — Mỗi service có event store riêng

| | CQRS | Event Sourcing |
|---|---|---|
| Trả lời câu hỏi | **Tách** model đọc và ghi | **Lưu trữ** state bằng cách nào |
| Bắt buộc nhau? | Không | Không |
| Kết hợp | Write side = ES, Read side = projections → cặp phổ biến nhất |

---

## 📁 Cấu trúc thư mục ví dụ

```
1.9-event-sourcing/
├── README.md           # File này
└── examples/
    └── index.ts        # Wallet demo (chạy: npx ts-node examples/index.ts)
```

Layout kết hợp CQRS:

```text
src/wallet/
├── commands/          # DepositCommand, WithdrawCommand, handlers
├── queries/           # GetBalanceQuery, TransactionHistoryQuery
├── domain/            # Wallet aggregate (apply events)
├── events/            # WalletCreated, Deposited, Withdrawn (immutable)
├── projections/       # WalletBalanceProjector, TransactionHistoryProjector
└── infrastructure/    # EventStore, EventBus
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.9-event-sourcing
npx ts-node examples/index.ts
```

Hãy để ý output: sau khi replay 3 events, `balance = 50`. Nếu bạn comment 1 dòng trong demo (event thứ 3), balance sẽ là 100 → event thứ 3 đã gây ra thay đổi -50. Đó chính là "event = source of truth".

---

## 📚 Tài liệu tham khảo

- 📖 [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- 📖 [Event Sourcing - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)
- 📖 [EventStoreDB Docs](https://developers.eventstore.com/)

---

## ⏭️ Bài tiếp theo

→ [1.10 Event-Driven Architecture](../1.10-event-driven-architecture/README.md)
