# 📁 5.9 Code Organization (Tổ Chức Mã Nguồn)

> **Code Organization** là cách sắp xếp cấu trúc folder, module, export để code dễ navigate, maintain và scale. Đây không phải là "guilty pleasure" thẩm mỹ — cách bạn tổ chức code ảnh hưởng trực tiếp đến **tốc độ debug, tần suất merge conflict, và khả năng onboarding developer mới**.

---

## 📚 Mục Lục

| # | Kỹ Thuật | Mô Tả |
|---|----------|-------|
| 5.9.1 | [Barrel Exports](../5.9.1-barrel-exports/README.md) | Re-export từ index.ts |
| 5.9.2 | [Feature-based Organization](../5.9.2-feature-based-organization/README.md) | Gom theo feature |
| 5.9.3 | [Layered Organization](../5.9.3-layered-organization/README.md) | Gom theo layer |

---

## 5.9.1 Barrel Exports

**Mô tả:** Tạo `index.ts` để re-export tất cả từ một folder, giúp import gọn gàng và định nghĩa public API của module.

```
src/
└── users/
    ├── index.ts        ← Barrel file (public API)
    ├── user.model.ts
    ├── user.service.ts
    └── user.repository.ts
```

```typescript
// src/users/index.ts — NAMED exports (preferred)
export { User } from './user.model';
export { UserService } from './user.service';
export { UserRepository } from './user.repository';

// ❌ WILDCARD exports — gây vấn đề với tree-shaking
// export * from './user.model';  // export tất cả symbol, kể cả internal helpers
// export * from './user.service';
```

```typescript
// ✅ Usage — import gọn từ "feature root"
import { UserService, User } from '@/users';

// ❌ Không có barrel — phải import từng cái (dài, dễ miss, khó refactor)
import { UserService } from '@/users/user.service';
import { User } from '@/users/user.model';
```

### Tại sao cần Barrel?

Barrel file giải quyết **3 vấn đề thực tế**:

1. **Centralized public API**: Bạn muốn một module "tiết lộ" những gì ra ngoài? Barrel file là contract. Developer bên ngoài chỉ import từ `@/users`, không biết bạn có bao nhiêu file bên trong. Đổi tên file = chỉ sửa barrel, không sửa caller.

2. **Import paths ngắn gọn**: Thay vì nhớ `@/features/auth/auth.repository` hay `@/infrastructure/persistence/postgres/user.repository`, bạn chỉ cần `@/users`. Đường dẫn thay đổi khi refactor folder nhưng barrel giữ nguyên entry point.

3. **IDE auto-import tốt hơn**: VS Code / WebStorm tự động gợi ý từ barrel file khi bạn gõ `import {` — nó biết bạn export gì mà không cần đọc toàn bộ folder.

### Vấn đề Barrel — circular dependency và tree-shaking

> ⚠️ **Misconception phổ biến:** "Barrel file nào cũng như nhau." Thực tế có hai loại và trade-off khác nhau:

| Loại export | Ưu điểm | Nhược điểm |
|-------------|---------|------------|
| `export { X } from './x'` (named) | Tree-shaking hoạt động — bundler loại bỏ symbol không dùng | Phải update thủ công khi thêm symbol mới |
| `export * from './x'` (wildcard) | Tự động include tất cả, không phải maintenance | Bundle size lớn hơn, IDE không gợi ý được symbol nội bộ, tăng risk circular dependency |

**Circular dependency risk:** Barrel file re-export tất cả, tạo vòng khép kín. Ví dụ:

```
users/index.ts → export { UserService } from './user.service'
user.service.ts → import { UserRepository } from './user.repository'
user.repository.ts → export { User } from './user.model'
user.model.ts → import type { UserService } from './user.service'  // ← DANGER
```

TypeScript `import type` (import kiểu chỉ tại compile-time) không gây circular runtime, nhưng nếu nhầm lẫn thành `import` giá trị → runtime circular break. **Giải pháp:** giữ barrel file ở mức interface, không chứa logic nghiệp vụ; module chỉ import `type` từ nhau nếu bắt buộc.

### Khi nào KHÔNG dùng Barrel

- Module có < 3 file: overhead barrel không đáng giá
- Thư viện nội bộ (internal utils): không cần privacy boundary
- File đang phát triển mạnh (daily churn): barrel thêm bước maintenance vô lý

---

## 5.9.2 Feature-based Organization

**Gom tất cả related code của 1 feature vào cùng folder.** Đây là pattern phổ biến nhất trong các codebase lớn hiện đại (Shopify, Stripe, Google Chrome extensions).

```
src/
├── features/
│   ├── auth/
│   │   ├── auth.model.ts          ← Domain entity
│   │   ├── auth.service.ts        ← Business logic
│   │   ├── auth.repository.ts     ← Data access interface + impl
│   │   ├── auth.controller.ts     ← HTTP layer
│   │   ├── auth.dto.ts            ← Request/Response shapes
│   │   ├── auth.middleware.ts     ← Auth guard
│   │   └── index.ts               ← Barrel
│   ├── users/
│   │   ├── user.model.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.controller.ts
│   │   └── index.ts
│   └── products/
│       ├── product.model.ts
│       ├── product.service.ts
│       └── ...
├── shared/
│   ├── utils/
│   │   ├── date.helpers.ts
│   │   └── validators.ts
│   └── types/
│       └── common.types.ts
└── app.ts
```

### Tại sao Feature-based thắng thế?

Ba lý do cốt lõi:

1. **Locality of behavior:** Khi bạn sửa bug "auth login fails on expired token", mọi thứ bạn cần (model, service, controller, test) nằm trong cùng folder. Không phải nhảy từ `models/` → `services/` → `controllers/` để hiểu một tính năng.

2. **Team ownership rõ ràng:** Mỗi feature có **một hoặc hai owner** — họ chịu trách nhiệm toàn bộ stack của feature đó. Điều này giảm "ai sửa file này?" debates và tăng velocity.

3. **Portability:** Feature folder có thể cắt ra thành package riêng (monorepo) hoặc di chuyển sang service khác nếu hệ thống chia nhỏ. Folder = boundary tự nhiên.

### Đặc trưng triển khai Feature-based

Một feature folder đúng chuẩn nên có **5 thành phần**:

```
feature-name/
├── index.ts              ← Public API (barrel)
├── feature.model.ts      ← Domain entities/types
├── feature.service.ts    ← Business logic orchestration
├── feature.repository.ts ← Data access (interface + optional impl)
├── feature.controller.ts ← HTTP/route handlers (NestJS-style)
└── feature.dto.ts        ← Request/Response validation schemas
```

**Rule vàng:** `service` được phép gọi `repository` và `model`. `controller` được phép gọi `service`. Nhưng `model` KHÔNG được import gì từ feature khác — model thuộc về domain layer trong suốt.

### So sánh Feature-based vs Layered (table mở rộng)

| | Feature-based | Layered |
|---|---|---|
| Tìm một tính năng | 1 folder | Phải nhảy 3–4 folder |
| Thêm tính năng mới | Copy folder template | Tạo 5–6 file ở các folder khác nhau |
| Team collision | Thấp (mỗi team 1–2 features) | Cao (cùng folder service gặp conflict) |
| Shared logic | `shared/` riêng, rõ ràng | Rò rỉ vào `services/` dưới dạng utils |
| Feature reuse | Dễ port sang dự án khác | Khó — code tan khắp nơi |

---

## 5.9.3 Layered Organization

**Gom code theo technical layer, không theo business feature.** Đây là pattern truyền thống của MVC / N-tier architecture.

```
src/
├── models/
│   ├── user.model.ts
│   ├── product.model.ts
│   └── order.model.ts
├── services/
│   ├── user.service.ts
│   ├── payment.service.ts
│   └── notification.service.ts
├── controllers/
│   ├── user.controller.ts
│   ├── auth.controller.ts
│   └── product.controller.ts
├── repositories/
│   ├── user.repository.ts
│   └── product.repository.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── rate-limit.middleware.ts
└── utils/
    ├── helpers.ts
    └── validators.ts
```

### Khi nào Layered phù hợp?

- **Dự án nhỏ** (< 10K LOC, < 5 developer): overhead feature organization không đáng giá
- **CRUD-heavy apps** (admin panel, CMS, internal tools): ít business rules phức tạp, feature boundaries mờ
- **Team học việc**: developer mới hiểu "layer này làm gì" nhanh hơn hiểu "feature này là gì"
- **Codebase legacy** đang chuyển đổi: refactor từ layer sang feature là công việc lớn, nên giữ layer trong quá trình chuyển tiếp

### Nhược điểm nghiêm trọng của Layered

| Vấn đề | Biểu hiện | Hậu quả |
|--------|-----------|---------|
| **Feature fragmentation** | Sửa bug checkout cần mở 5 file ở 5 folder khác nhau | Debug chậm, dễ miss logic |
| **Cross-feature coupling** | `notification.service.ts` gọi `user.service.ts` và `order.service.ts` | Bất kỳ thay đổi nào ở user/order đều ảnh hưởng notification |
| **Testability kém** | Controller gọi service, service gọi repository — test unit requires mock toàn bộ chain | Test coverage thấp, regression cao |
| **Onboarding chậm** | "File nào chứa logic tính phí ship?" — không ai biết chính xác | Thời gian hiểu codebase dài gấp 2x |

### Mixed approach (Thực tế nhất)

Hầu hết enterprise app hiện đại dùng **hybrid**: feature-based cho business logic, layered cho infrastructure:

```
src/
├── features/              ← Feature-based: business logic + model + service
│   ├── auth/
│   ├── orders/
│   └── users/
├── infrastructure/        ← Layered: shared technical layers
│   ├── database/
│   │   ├── postgres/
│   │   └── redis/
│   ├── http/
│   │   ├── middleware/
│   │   └── routes.ts
│   └── logging/
└── shared/                ← Cross-cutting concerns
    ├── types/
    └── utils/
```

Cách này tận dụng lợi ích của cả hai: business logic đóng gói theo feature, infrastructure dùng lại chung.

---

## 🧭 Chọn cách tổ chức nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Dự án nhỏ (< 10K LOC, team < 5) | **Layered** | Đơn giản hơn = ít quyết định sai. Developer mới học được khái niệm layer nhanh hơn feature boundary. |
| Dự án vừa (5–15 developer, 15K–100K LOC) | **Feature-based** | Lợi ích locality >> overhead. Mỗi feature owner có full stack ownership → velocity tăng. |
| Dự án lớn enterprise (> 15 developer, > 100K LOC) | **Feature + Infrastructure (hybrid)** | Business logic cần feature isolation; infrastructure shared cần layered reuse. Phân tách rõ 2 concern. |
| Modular monolith | **Feature-based** | Mỗi module = 1 feature group, dễ tách thành service riêng khi cần (wall of load/tech). |
| Library / npm package | **Barrel exports** | Public API contract quan trọng nhất; tree-shaking ảnh hưởng bundle size khách hàng. |
| Internal tool / admin panel | **Layered hoặc Feature** | Nếu CRUD thuần túy → Layered đủ. Nếu có business rules phức tạp → Feature. |
| Frontend React/Next.js app | **Feature-based (component-level)** | Mỗi feature có folder `components/`, `hooks/`, `api/`, `types/` — pattern "component-driven architecture". |
| Mobile app (React Native/Flutter) | **Feature-based** | Mỗi màn hình/tính năng là feature; shared UI component library ở `shared/`. |

**Quy tắc thực hành 3 câu hỏi:**
1. Ai sẽ đọc code này sau 6 tháng? (Developer hiện tại hay người mới?)
2. Có bao nhiêu developer cùng touch một tính năng? (> 2 → cân nhắc feature)
3. Có bao nhiêu lần bạn phải mở 3+ folder để sửa 1 bug? (Nếu thường xuyên → đổi sang feature-based)

> 💡 **Misconception:** "Feature-based organization là tối ưu cho mọi project." Không phải vậy. Với dự án 500 dòng code CRUD, feature-based chỉ thêm boilerplate vô lý. Hãy chọn theo **scale của team và độ phức tạp nghiệp vụ**, không phải trend.

---

## 🔗 Liên quan

- **1.4 Layered Architecture** — Organize code theo layers
- **1.3 Clean Architecture** — Organize theo domains và use cases
- **1.14 Modular Monolith** — Feature-based là nền tảng của modular monolith

---

## 📚 Tài liệu tham khảo

- 📖 [Barrel Files in TypeScript](https://www.typescriptlang.org/docs/handbook/modules.html)
- 📖 [Feature Sliced Design](https://feature-sliced.design/)
- 📖 [Clean Architecture — Dependency Rule](https://blog.cleancoder.com/uncle-bob/2020-10-18/TheDependenceRule.html)
- 📖 [The Big Ball of Mud (Fowler)](https://martinfowler.com/bliki/BigBallOfMud.html)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9-code-organization
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10 API Design Techniques](../5.10-api-design/README.md)
