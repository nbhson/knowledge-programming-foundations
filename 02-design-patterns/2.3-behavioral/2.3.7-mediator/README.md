# 💬 2.3.7 Mediator Pattern

> Định nghĩa object trung gian điều phối giao tiếp giữa nhiều object — giảm coupling N:N xuống N:1.

---

## 🎯 Vấn đề

Nhiều object giao tiếp trực tiếp với nhau → coupling chằng chịt, khó thêm/bớt.

**Bài toán N×N dependency graph:** với N object, nếu mỗi object giao tiếp trực tiếp với mọi object khác, số kết nối = `N×(N-1)/2`. Với 5 object = 10 kết nối. Với 20 object = 190 kết nối. Đó là **"spaghetti communication"** — thay đổi 1 object có thể làm hỏng nhiều object khác, không thể đoán trước.

```
❌ Mỗi User giữ reference tới mọi User khác — N:N
UserA → UserB, UserC, UserD ...

✅ GIẢI PHÁP: Giao tiếp qua Mediator trung tâm
┌──────────┐         ┌──────────┐
│  User A  │────────▶│          │
│  User B  │────────▶│ Mediator │
│  User C  │◀────────│ ChatRoom │
└──────────┘         └──────────┘
      User chỉ biết Mediator, không biết nhau
```

**Mediator giảm coupling bằng cách:** các object (colleagues) **không tham chiếu trực tiếp** lẫn nhau. Tất cả tương tác đi qua 1 mediator trung tâm. Kết quả: coupling giảm từ N:N → N:1, và logic điều phối tập trung vào một chỗ.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Mediator (interface)                                │
│  ─ send(message, from: User)                        │
│                  ▲                                   │
│                  │ implement                          │
│            ChatRoom                                  │
│            ─ users: User[]                           │
│            ─ addUser(), send() → broadcast          │
│                  │                                   │
│            User                                      │
│            ─ name, mediator: Mediator               │
│            ─ send(), receive()                      │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
alice.send("Chào") → chat.send(msg, alice)
  → chat duyệt users, gọi user.receive() cho Bob, Carol (trừ Alice)
Bob, Carol nhận — không biết Alice trực tiếp
```

**Phân biệt 2 vai trò:**
- **Colleague (User):** biết mediator, gửi/nhận message qua mediator, **không biết** colleagues khác.
- **Mediator (ChatRoom):** biết tất cả colleagues, điều phối — chứa **logic giao tiếp** tập trung.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Mediator { send(message: string, from: User): void; }

class ChatRoom implements Mediator {
  private users: User[] = [];
  addUser(u: User): void { this.users.push(u); }
  send(message: string, from: User): void {
    for (const u of this.users) 
      if (u !== from) u.receive(message, from.getName());
  }
  // Có thể thêm removeUser() để lifecycle đầy đủ
}

class User {
  constructor(private name: string, private mediator: Mediator) {}
  getName(): string { return this.name; }
  send(message: string): void {
    console.log(`💬 ${this.name} gửi: "${message}"`);
    this.mediator.send(message, this);
  }
  receive(message: string, from: string): void {
    console.log(`  📥 ${this.name} nhận từ ${from}: "${message}"`);
  }
}

const chat = new ChatRoom();
const alice = new User("Alice", chat);
const bob = new User("Bob", chat);
chat.addUser(alice); chat.addUser(bob);
alice.send("Chào mọi người!");
```

**Real-world examples:**
- **Event bus:** tất cả components giao tiếp qua event bus, không biết nhau.
- **Redux:** components dispatch actions qua store (mediator), không gọi component khác.
- **API Gateway:** điều phối giao tiếp giữa client và services.
- **MVC Controller:** điều phối giữa Model và View (là mediator).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔗 **Giảm coupling N:N → N:1** | Mỗi User chỉ biết Mediator | Colleagues không import lẫn nhau → refactor một colleague không ảnh hưởng others. |
| ➕ **Dễ thêm/bớt** | Thêm User không sửa User cũ | Open/Closed principle — new colleague = register with mediator. |
| 🧩 **Tập trung điều phối** | Logic phối hợp 1 chỗ | Muốn hiểu "message flow ra sao?" → đọc 1 class Mediator. |
| 🎯 **Encapsulate interaction** | Ẩn chi tiết giao tiếp | Complex interaction protocol được đóng gói. |
| 🔧 **Centralized control** | Dễ thay đổi behavior | Đổi broadcast → DM routing = sửa mediator, không sửa colleagues. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Mediator phình to** | God object nếu nhồi quá nhiều logic | Failure mode kinh điển: ChatRoom chứa hết business logic → **Mediator God Object**. *Giảm thiểu:* tách nhiều mediator, delegate sang services. |
| 🧠 **Phức tạp hơn gọi trực tiếp** | Chỉ đáng khi N lớn | 2 object nói chuyện → direct call đơn giản hơn mediator. *Gi giảm thiểu:* rule "N ≥ 3 + chằng chịt → Mediator". |
| 🔀 **Khó test mediator** | Nhiều nhánh điều phối | Mediator có thể 500 dòng → test matrix phức tạp. *Giảm thiểu:* unit test từng interaction rule. |
| 👻 **Single point of failure** | Mediator chết = tất cả dừng | Mediator là central coordinator. *Gi giảm thiểu:* stateless mediator, error handling. |
| 📉 **Performance bottleneck** | Mọi giao tiếp đi qua 1 điểm | Hot path qua mediator → contention. *Giảm thiểu:* mediator lightweight. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều object giao tiếp chằng chịt | ✅ Rất phù hợp | Chat, dashboard widgets, complex forms. |
| Cần trung tâm điều phối (chat, ATC) | ✅ Phù hợp | Central coordination required. |
| Chỉ 2-3 object, ít giao tiếp | ❌ Gọi trực tiếp | Mediator overkill. |
| Communication logic phức tạp hay đổi | ✅ Phù hợp | Isolate changing logic in mediator. |
| Need centralized state of interactions | ✅ Phù hợp | Track "who talked to whom" in one place. |

---

## 🔗 Liên quan

- **2.3.2 Observer** — Observer 1→N lan tỏa, Mediator N:1 tập trung.
- **2.2.3 Facade** — Facade đơn giản hóa interface, Mediator điều phối hành vi giữa các object.
- **2.3.8 Chain of Responsibility** — Chain chuyền tuyến tính, Mediator điều phối mạng lưới.

**Observer vs Mediator — điểm khác nhau quan trọng:**
| | Observer | Mediator |
|---|---|---|
| Chiều | 1 → N (broadcast) | N ↔ N (through mediator) |
| Coupling | Subject không biết Observer details | Colleagues không biết nhau, mediator biết hết |
| Khi nào dùng | State change cần propagate | Multiple objects need to coordinate |

---

## 📁 Cấu trúc thư mục

```
2.3.7-mediator/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.7-mediator
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Mediator - Refactoring Guru](https://refactoring.guru/design-patterns/mediator)
- 📖 [Mediator - Source Making](https://sourcemaking.com/design_patterns/mediator)

---

## ⏭️ Bài tiếp theo

→ [2.3.8 Chain of Responsibility](../2.3.8-chain-of-responsibility/README.md)
