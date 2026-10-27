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

**Bản chất CoR:** tách **sender** khỏi **receiver** bằng cách để nhiều object có cơ hội xử lý request, theo thứ tự. Sender chỉ gửi cho **đầu chuỗi**, không biết ai sẽ xử lý cuối cùng.

**Scenario điển hình:** Approval flow, middleware (Express/Koa), event bubbling, validation chain, exception handling.

**2 biến thể CoR:**
- **Pure Chain:** request đi tới khi được xử lý, **dừng lại** ở handler đầu tiên xử lý (approval flow).
- **Impure Chain:** mọi handler đều có cơ hội xử lý (middleware chain — Express `next()`).

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

**Middleware chain (Impure CoR — Express/Koa):**

```typescript
// Mỗi middleware là 1 handler, next() = passToNext
app.use((req, res, next) => {
  console.log('Auth check');
  if (!req.user) return res.status(401).send();  // xử lý, dừng
  next();  // chuyền tiếp
});
app.use((req, res, next) => {
  console.log('Logging');
  next();
});
app.use((req, res) => {
  res.send('OK');  // cuối chuỗi
});
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔗 **Tách người gửi khỏi người xử lý** | Sender chỉ biết đầu chuỗi | Không cần biết ai xử lý cuối cùng. |
| 🔄 **Dễ reorder/thêm handler** | Thêm VP, đổi thứ tự không sửa client | Insert `VicePresident` giữa Director và CEO — chỉ wiring. |
| 🧩 **Single Responsibility** | Mỗi handler 1 ngưỡng | Manager chỉ biết ngưỡng $500, không biết quy tắc others. |
| ⛓️ **Chain linh hoạt runtime** | Xây chuỗi động | Chain được compose theo config/runtime. |
| 🎯 **Open/Closed** | Thêm handler mới, không sửa cũ | New approval level = new class. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🕳️ **Request có thể không được xử lý** | Nếu chuỗi không có handler cuối catch-all | Request trôi hết chuỗi, không ai xử lý → silent failure. *Giảm thiểu:* luôn có default/terminal handler. |
| 🐢 **Chậm nếu chuỗi dài** | Duyệt tuyến tính O(n) | 20 handlers = 20 function calls trước khi xử lý. *Gi giảm thiểu:* reorder (frequently-hit first). |
| 🧠 **Khó debug** | Không rõ ai xử lý | Request đi qua chain, breakpoint ở đâu? *Giảm thiểu:* log mỗi hop, correlation id. |
| 👻 **Hidden control flow** | Logic phân tán qua nhiều handler | Rất khó trả lời "request này xử lý thế nào?". *Gi giảm thiểu:* document chain order, visualize. |
| 🔀 **Order dependency** | Thứ tự handler quan trọng | Sai order → behavior sai (auth sau business logic = leak). *Giảm thiểu:* explicit chain definition. |
| 🧱 **Nhiều class** | Mỗi handler 1 class | *Gi giảm thiểu:* function-based middleware. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Nhiều handler, không biết trước ai xử lý | ✅ Rất phù hợp | Approval flow, support escalation. |
| Muốn handler quyết định chuyền tiếp | ✅ Phù hợp | Mỗi handler know its own threshold. |
| Middleware, filter chain | ✅ Rất phù hợp | Express/Koa/Nest pipes. |
| Validation pipeline | ✅ Phù hợp | Chained validators. |
| Exception handling | ✅ Phù hợp | try/catch bubbling. |
| Chỉ 1 handler cố định | ❌ Gọi trực tiếp | Chain overkill. |
| Cần biết chính xác handler nào xử lý | ⚠️ Cân nhắc | CoR hides selection — explicit routing better. |

---

## 🔗 Liên quan

- **2.3.3 Command** — Command đóng gói request, Chain chuyền request.
- **2.3.7 Mediator** — Mediator tập trung, Chain tuyến tính.
- **2.3.1 Strategy** — Strategy chọn 1 thuật toán, Chain thử từng handler.
- **2.3.2 Observer** — Observer broadcast tới tất cả, Chain pass until handled.

**CoR vs Mediator vs Observer — so sánh 3 pattern xử lý giao tiếp:**

| Pattern | Flow | Khi nào dùng |
|---------|------|--------------|
| **Chain of Responsibility** | Tuyến tính, pass until handled | Escalation, middleware |
| **Mediator** | Star topology, qua trung tâm | Complex coordination N↔N |
| **Observer** | Broadcast 1→N | State propagation |

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
