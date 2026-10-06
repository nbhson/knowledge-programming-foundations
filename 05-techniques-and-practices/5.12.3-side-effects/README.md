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

## ❌ BAD — thêm 1 case: side effect ẩn trong core tính toán

```typescript
// ❌ BAD — hàm "tính tổng" lén ghi log + trừ kho trong cùng 1 chỗ
function checkoutTotalBad(cart: Cart): number {
  const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  console.log(`[audit] total=${total}`); // IO ẩn
  stockDb.decrement(cart.items);           // ghi DB ẩn — gọi 2 lần trừ kho 2 lần!
  return total;
}

// ✅ GOOD — core chỉ tính (pure), mọi effect ra biên qua abstraction
function checkoutTotalPure(cart: Cart): number {
  return cart.items.reduce((s, i) => s + i.price * i.qty, 0);
}
// caller (boundary): const total = checkoutTotalPure(cart); repo.save(...); logger.info(...);
```

> Luật ngửi mùi: hàm tên "tính/cộng/kiểm tra" mà **import DB/logger/clock** → effect đang trốn trong core. Core chỉ được nhận effect qua tham số inject.

---

## ⚖️ Trade-off: cô lập effect vs để lẫn (mở rộng bảng Core + Boundary)

| Cách | Khi nào chọn | Giá phải trả |
|------|--------------|--------------|
| Core pure + boundary mỏng | ✅ Mặc định cho business logic | Thêm lớp inject/fake lúc đầu |
| Effect lẫn trong logic | ⚖️ Script 1 lần, prototype vứt đi | Không test được, không tái dùng |
| Mọi thứ qua abstraction nặng | 🚫 Overkill | 1–2 port là đủ, đừng 6 interface cho 1 hàm |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Quên effect trong code path phụ (nhánh catch cũng ghi DB) | Test fake không cover nhánh đó → prod mới lộ | Fake phải assert cả nhánh lỗi |
| Random/clock không seed được | Test flaky, debug không tái hiện | Inject RNG/clock có seed cố định trong test |
| Boundary dày lên thành business thứ 2 | Logic rò sang shell, core rỗng | Boundary chỉ dịch IO (parse/format/gọi), quyết định nằm ở core |

---

## ✅ Checklist khi review

- [ ] Liệt kê được mọi side effect của hàm (IO/clock/random/global)?
- [ ] Core không import trực tiếp DB/network/console/clock?
- [ ] Test dùng fake inject (không mock module toàn cục nếu tránh được)?
- [ ] Fake cover cả nhánh lỗi (throw/timeout) chứ không chỉ đường vui?
- [ ] Random/clock trong test là deterministic (seed/fixed)?

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
