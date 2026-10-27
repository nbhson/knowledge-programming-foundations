# 📦 5.9.1 Barrel Exports

> Tạo một file `index.ts` trong folder để **re-export** tất cả thành viên public → consumer chỉ cần **import 1 điểm**, không cần biết đường dẫn sâu bên trong.

---

## 🎯 Vấn đề

```
📁 CÓ barrel:
   domain/
   ├── user.model.ts
   ├── user.repository.ts
   ├── user.service.ts
   └── index.ts        ← `export * from './user.model'` ...
   Consumer: import { UserService, User } from './domain'

📁 KHÔNG barrel:
   import { UserService } from './domain/user.service'
   import { User } from './domain/user.model'
   import { UserRepository } from './domain/user.repository'
   → đổi cấu trúc folder là sửa khắp nơi
```

---

## 💻 Code ví dụ

Folder `examples/domain/` trong demo:

```typescript
// domain/index.ts — BARREL
export * from "./user.model";
export * from "./user.repository";
export * from "./user.service";
```

```typescript
// ✅ Consumer — 1 dòng import
import { UserRepository, UserService, makeUser } from "./domain";
```

---

## ✅ Ưu / ⚠️ Nhược

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Single import point** | Consumer không cần biết cấu trúc sâu |
| 🔧 **Dễ refactor** | Đổi file bên trong, không vỡ import ngoài |
| 📖 **Tự tài liệu API** | `index.ts` liệt kê đúng thứ "public" |

| Nhược điểm | Cách tránh |
|------------|------------|
| ⭕ **Circular dependency** | Chỉ re-export những gì là public API |
| 📦 **Nặng nếu quá rộng** | Barrel theo nhóm chức năng, không gom cả app |

---

## ❌ BAD — thêm 1 case: barrel "ôm cả thế giới" gây cycle

```typescript
// ❌ BAD — root barrel re-export mọi thứ, 2 module import chéo qua nó
// index.ts ở root:
//   export * from "./orders"; export * from "./customers";
// orders.ts: import { Customer } from "../index";   // vòng: index → orders → index
// customers.ts: import { Order } from "../index";   // 💥 cycle, load order khó đoán

// ✅ GOOD — barrel theo nhóm chức năng, import sâu khi cần tránh cycle
// domain/orders/index.ts chỉ export thứ public của orders
// customers.ts: import { Order } from "../orders/order.model"; // trực tiếp, không qua root
```

> 2 luật sống còn: **barrel theo nhóm nhỏ** (không gom cả app) và **không import barrel từ chính file nó export** (vòng tròn số 1 của cycle).

---

## ⚖️ Trade-off: barrel vs import sâu

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Public API của 1 nhóm (domain, ui-kit) | ✅ Barrel | Consumer 1 dòng import, refactor nội bộ tự do |
| File nội bộ trong cùng nhóm | ⚖️ Import sâu trực tiếp | Tránh cycle qua barrel, bundler tree-shake tốt hơn |
| Barrel root gom cả app | 🚫 Không | Mất tree-shaking, cycle, IDE chậm |
| Library publish ra ngoài | ✅ Barrel + `package.json` exports | Định nghĩa rõ public API, giấu file nội bộ |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Circular dependency qua barrel | `undefined` lúc runtime, lỗi chỉ hiện khi đổi thứ tự import | Lint rule `no-cycle` (eslint-plugin-import), barrel nhỏ |
| `export *` 2 file trùng tên | Tên bị ghi đè lặng lẽ, import nhầm implementation | Export tường minh (`export { X } from ...`), alias khi trùng |
| Barrel re-export cả thứ nội bộ | Đổi file nội bộ thành breaking change ngoài ý muốn | Chỉ export thứ public; nội bộ import sâu trực tiếp |
| Side effect trong file được barrel load | Import 1 thứ kéo cả file có side effect chạy | File trong barrel phải side-effect free |

---

## ✅ Checklist khi review

- [ ] Barrel chỉ gom 1 nhóm chức năng (không root-barrel cả app)?
- [ ] Không file nào import barrel mà chính nó là thành viên (cycle)?
- [ ] Không `export *` gây trùng tên lặng lẽ?
- [ ] Chỉ export public API (nội bộ import sâu)?
- [ ] Lint `no-cycle` xanh?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.1-barrel-exports
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9.2 Feature-based Organization](../5.9.2-feature-based-organization/README.md)