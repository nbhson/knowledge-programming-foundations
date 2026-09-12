# ⛓️ 2.3.8 Chain of Responsibility Pattern

> Cho phép request đi qua chuỗi handler — mỗi handler quyết định xử lý hoặc chuyền tiếp cho handler kế tiếp.

---

## 🎯 Vấn đề

Bạn có nhiều handler có thể xử lý request, nhưng không biết trước ai sẽ xử lý, và muốn tránh `if/else` chọn handler:

```
❌ if (amount <= 500) manager.handle(); else if (amount <= 5000) director.handle(); ...

✅ GIẢI PHÁP: Xếp handler thành chuỗi, request tự trôi tới người xử lý được
Manager → Director → CEO
  $300 → Manager duyệt
  $2000 → Manager chuyền → Director duyệt
  $20000 → Manager → Director → CEO duyệt
```

**Scenario điển hình:** Approval flow, middleware (Express/Koa), event bubbling, validation chain.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Handler (interface)                                 │
│  ─ setNext(handler): Handler, handle(amount)        │
│                  ▲                                   │
│          BaseHandler (abstract)                      │
│          ─ next: Handler | null                     │
│          ─ setNext(), passToNext()                  │
│                  ▲                                   │
│   ┌──────────────┼──────────────┐                    │
│ ┌─┴──────┐ ┌────┴────┐ ┌───────┴──┐                 │
│ │Manager │ │Director │ │   CEO    │                 │
│ │≤500    │ │≤5000    │ │  còn lại │                 │
│ └────────┘ └─────────┘ └──────────┘                 │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
manager.setNext(director).setNext(ceo) // xây chuỗi fluent
manager.handle(2000)
  → Manager: 2000 > 500 → passToNext(2000)
  → Director: 2000 ≤ 5000 → duyệt
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Handler {
  setNext(handler: Handler): Handler;
  handle(amount: number): void;
}

abstract class BaseHandler implements Handler {
  private next: Handler | null = null;
  setNext(handler: Handler): Handler { this.next = handler; return handler; }
  protected passToNext(amount: number): void {
    if (this.next) this.next.handle(amount);
    else console.log("  ⚠️ Không có handler xử lý — cần log/catch");
  }
  abstract handle(amount: number): void;
}

class Manager extends BaseHandler {
  handle(amount: number): void {
    if (amount <= 500) console.log(`  ✅ Manager duyệt $${amount}`);
    else { console.log(`  ⏩ Manager: quá $500 → chuyền lên...`); this.passToNext(amount); }
  }
}

class Director extends BaseHandler {
  handle(amount: number): void {
    if (amount <= 5000) console.log(`  ✅ Director duyệt $${amount}`);
    else { console.log(`  ⏩ Director: quá $5000 → chuyền lên...`); this.passToNext(amount); }
  }
}

class CEO extends BaseHandler {
  handle(amount: number): void { console.log(`  ✅ CEO duyệt $${amount} (cuối chuỗi)`); }
}

// Xây chuỗi fluent
const manager = new Manager();
manager.setNext(new Director()).setNext(new CEO());
manager.handle(300);   // Manager
manager.handle(2000);  // Director
manager.handle(20000); // CEO
```

> 💡 `passToNext` nên log khi không có `next` để tránh request rơi im lặng.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 **Tách người gửi/khỏi người xử lý** | Sender chỉ biết đầu chuỗi |
| 🔄 **Dễ reorder/thêm handler** | Thêm VP, đổi thứ tự không sửa client |
| 🧩 **Single Responsibility** | Mỗi handler 1 ngưỡng |
| ⛓️ **Chain linh hoạt runtime** | Xây chuỗi động |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🕳️ **Request có thể không được xử lý** | Nếu chuỗi không có handler cuối catch-all |
| 🐢 **Chậm nếu chuỗi dài** | Duyệt tuyến tính |
| 🧠 **Khó debug** | Không rõ ai xử lý |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nhiều handler, không biết trước ai xử lý | ✅ Phù hợp |
| Muốn handler quyết định chuyền tiếp | ✅ Phù hợp |
| Middleware, filter chain | ✅ Phù hợp |
| Chỉ 1 handler cố định | ❌ Gọi trực tiếp |

---

## 🔗 Liên quan

- **2.3.3 Command** — Command đóng gói request, Chain chuyền request
- **2.3.7 Mediator** — Mediator tập trung, Chain tuyến tính
- **2.3.1 Strategy** — Strategy chọn 1 thuật toán, Chain thử từng handler

---

## 📁 Cấu trúc thư mục

```
2.3.8-chain-of-responsibility/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.8-chain-of-responsibility
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Chain of Responsibility - Refactoring Guru](https://refactoring.guru/design-patterns/chain-of-responsibility)
- 📖 [Chain of Responsibility - Source Making](https://sourcemaking.com/design_patterns/chain-of-responsibility)

---

## 📚 Tổng kết Behavioral

→ Tiếp theo: [03 Principles](../../03-principles/README.md)
