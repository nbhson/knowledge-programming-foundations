# 💬 2.3.7 Mediator Pattern

> Định nghĩa object trung gian điều phối giao tiếp giữa nhiều object — giảm coupling N:N xuống N:1.

---

## 🎯 Vấn đề

Nhiều object giao tiếp trực tiếp với nhau → coupling chằng chịt, khó thêm/bớt:

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

**Scenario điển hình:** Chat room, air traffic control, form điều phối — nhiều bên cần phối hợp qua 1 trung tâm.

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

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Mediator { send(message: string, from: User): void; }

class ChatRoom implements Mediator {
  private users: User[] = [];
  addUser(u: User): void { this.users.push(u); }
  send(message: string, from: User): void {
    for (const u of this.users) if (u !== from) u.receive(message, from.getName());
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

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 **Giảm coupling N:N → N:1** | Mỗi User chỉ biết Mediator |
| ➕ **Dễ thêm/bớt** | Thêm User không sửa User cũ |
| 🧩 **Tập trung điều phối** | Logic phối hợp 1 chỗ |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Mediator phình to** | God object nếu nhồi quá nhiều logic |
| 🧠 **Phức tạp hơn gọi trực tiếp** | Chỉ đáng khi N lớn |
| 🔀 **Khó test mediator** | Nhiều nhánh điều phối |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều object giao tiếp chằng chịt | ✅ Phù hợp |
| Cần trung tâm điều phối (chat, ATC) | ✅ Phù hợp |
| Chỉ 2-3 object, ít giao tiếp | ❌ Gọi trực tiếp |

---

## 🔗 Liên quan

- **2.3.2 Observer** — Observer 1→N lan tỏa, Mediator N:1 tập trung
- **2.3.7 Facade** — Facade đơn giản hóa interface, Mediator điều phối hành vi
- **2.3.8 Chain of Responsibility** — Chain chuyền tuyến tính, Mediator điều phối mạng lưới

---

## 📁 Cấu trúc thư mục

```
2.3.7-mediator/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.7-mediator
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Mediator - Refactoring Guru](https://refactoring.guru/design-patterns/mediator)
- 📖 [Mediator - Source Making](https://sourcemaking.com/design_patterns/mediator)

---

## ⏭️ Bài tiếp theo

→ [2.3.8 Chain of Responsibility](../2.3.8-chain-of-responsibility/README.md)
