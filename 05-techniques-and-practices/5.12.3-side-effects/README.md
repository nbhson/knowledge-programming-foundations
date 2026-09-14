# 🌀 5.12.3 Side Effects (Hiệu Ứng Phụ)

> **Side effect** = mọi thao tác hàm "chạm" ra ngoài scope của nó — đọc biến toàn cục, ghi DB, gửi network, log ra console, đọc clock... FP **không cấm**, mà **cô lập + đẩy ra biên** (program boundary).

---

## 🎯 Side effect thường gặp

| Side Effect | Ví dụ |
|-------------|-------|
| 🖥️ **Console/IO** | `console.log`, `process.stdout.write` |
| 🗄️ **DB / File** | `fs.writeFile`, `db.insert` |
| 🌐 **Network** | `fetch()`, HTTP request |
| ⏰ **Clock** | `Date.now()`, `new Date()` |
| 🎲 **Randomness** | `Math.random()`, crypto |

```
 Pure core logic          ──(effect)──▶   I/O bus
 (tính toán)                              console / DB / network / clock
                                          ├─ always injectable
                                          └─ tách ra → core TEST được
```

---

## 💻 Cách quản lý — Dependency Injection

```typescript
interface Clock { now(): number; }
interface Logger { info(msg: string): void; }

// Core logic GIỮ PURE — mọi thứ inject vào
function createOrderService(repo: Repo, clock: Clock, logger: Logger) {
  return (req: OrderRequest) => {
    const order = { ...req, createdAt: clock.now() };   // IO qua abstraction
    repo.save(order);                                    // IO qua abstraction
    logger.info(`Saved #${order.id}`);                   // IO qua abstraction
    return order;
  };
}

// 🔌 Production — inject IO thật
createOrderService(db, systemClock, consoleLogger);

// 🧪 Test — inject fake, core logic CHẠY như cũ
createOrderService(fakeRepo, fakeClock, silentLogger);
```

Demo đầy đủ: [`examples/index.ts`](examples/index.ts)

---

## 🎯 Bố cục: Core + Boundary

```
┌─────────────────────────────┐        ┌─────────────────────┐
│  CORE (pure, thuần)         │  ◀──   │  BOUNDARY (side effects)│
│  - business rules           │  inject │  - repositories         │
│  - validations              │        │  - http/fetch           │
│  - calculations             │        │  - loggers/clocks       │
│                            │        │  - random               │
└─────────────────────────────┘        └─────────────────────────┘
          dễ test  ←──────────────────→  đặc ở biên, mock dễ
```

---

## ✅ Cách test demo

| Cách | Mô tả |
|------|-------|
| 🔌 **Inject fake clock** | `FixedClock.now() → 1_700_000_000_000` deterministic |
| 🤐 **Fake logger** | Ghi vào mảng trong memory, không console |
| 🧪 **Fake repo** | List trong memory — không cần DB |

→ core logic chạy y hệt production, nhưng **0 IO thật**.

---

## 🔗 Liên quan

- **5.12.2 Pure Functions** — Khái niệm đối lập
- **5.12.4 Currying** — Tách effect khỏi core bằng partial application
- **5.5 State Management** — Side effect tập trung ở middleware

---

## 📚 Tài liệu tham khảo

- 📖 [Side Effect — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Side_effect)
- 📖 [Functional Core, Imperative Shell](https://blog.ploeh.dk/2022/03/21/decomposing-small/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.3-side-effects
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.4 Currying](../5.12.4-currying/README.md)
