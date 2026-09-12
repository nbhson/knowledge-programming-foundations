# 📁 5.9 Code Organization (Tổ Chức Mã Nguồn)

> **Code Organization** là cách sắp xếp cấu trúc folder, module, export để code dễ navigate, maintain và scale.

---

## 📚 Mục Lục

| # | Kỹ Thuật | Mô Tả |
|---|----------|-------|
| 5.9.1 | [Barrel Exports](#591-barrel-exports) | Re-export từ index.ts |
| 5.9.2 | [Feature-based Organization](#592-feature-based-organization) | Gom theo feature |
| 5.9.3 | [Layered Organization](#593-layered-organization) | Gom theo layer |

---

## 5.9.1 Barrel Exports

**Mô tả:** Tạo `index.ts` để re-export tất cả từ một folder, giúp import gọn gàng.

```
src/
└── users/
    ├── index.ts        ← Barrel file
    ├── user.model.ts
    ├── user.service.ts
    └── user.repository.ts
```

```typescript
// src/users/index.ts
export { User } from './user.model';
export { UserService } from './user.service';
export { UserRepository } from './user.repository';

// Hoặc wildcard export
export * from './user.model';
export * from './user.service';
```

```typescript
// ✅ Usage — import gọn
import { UserService, User } from '@/users';

// ❌ Không có barrel — phải import từng cái
import { UserService } from '@/users/user.service';
import { User } from '@/users/user.model';
```

✅ **Ưu điểm:** Single import point, dễ refactor internal structure
❌ **Nhược điểm:** Circular dependency risk nếu không cẩn thận

---

## 5.9.2 Feature-based Organization

**Gom tất cả related code của 1 feature vào cùng folder.**

```
src/
├── features/
│   ├── auth/
│   │   ├── auth.model.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.controller.ts
│   │   └── index.ts
│   ├── users/
│   │   ├── user.model.ts
│   │   ├── user.service.ts
│   │   └── ...
│   └── products/
│       ├── product.model.ts
│       └── ...
├── shared/
│   └── utils/
└── app.ts
```

**Thuận:**
- Mỗi feature tự contain everything
- Dễ port feature sang project khác
- Team working trên features khác nhau ít conflict

**Phụ:**
- Code similar nằm rải rác (user service ở nhiều chỗ)
- Khó tìm shared utilities

---

## 5.9.3 Layered Organization

**Gom code theo technical layer, không theo business feature.**

```
src/
├── models/
│   ├── user.model.ts
│   └── product.model.ts
├── services/
│   ├── user.service.ts
│   └── payment.service.ts
├── controllers/
│   ├── user.controller.ts
│   └── auth.controller.ts
├── repositories/
│   ├── user.repository.ts
│   └── product.repository.ts
├── middleware/
│   └── auth.middleware.ts
└── utils/
    └── helpers.ts
```

**Thuận:**
- Cùng layer dễ tìm, dễ reuse
- Rõ ràng về responsibility
- Phù hợp team nhỏ, project đơn giản

**Phụ:**
- Một feature code bị spread ra nhiều folder
- Khó navigate khi project lớn

---

## 🧭 Chọn cách tổ chức nào?

| Scenario | Khuyến nghị |
|----------|-------------|
| Project nhỏ (< 10 developers) | Layered Organization |
| Project lớn, nhiều team | Feature-based + Barrel Exports |
| Modular monolith | Feature-based |
| Library / package | Barrel Exports |
| Mixed (enterprise app) | Feature-based cho business logic, Layered cho infrastructure |

---

## 🔗 Liên quan

- **1.4 Layered Architecture** — Organize code theo layers
- **1.3 Clean Architecture** — Organize theo domains và use cases

---

## 📚 Tài liệu tham khảo

- 📖 [Barrel Files in TypeScript](https://www.typescriptlang.org/docs/handbook/modules.html)
- 📖 [Feature Sliced Design](https://feature-sliced.design/)

---

## ⏭️ Bài tiếp theo

→ [5.10 API Design Techniques](../5.10-api-design/README.md)
