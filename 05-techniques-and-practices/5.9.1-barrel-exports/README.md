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

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.1-barrel-exports
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9.2 Feature-based Organization](../5.9.2-feature-based-organization/README.md)