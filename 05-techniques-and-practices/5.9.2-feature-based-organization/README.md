# 🧩 5.9.2 Feature-based Organization

> Gom code theo **feature**, không theo kiểu dữ liệu. Mỗi feature (auth, users, products) là một "slice" tự chứa model + service + handler của riêng nó → thêm tính năng là **thêm 1 mảnh**, ít đụng code đang chạy.

---

## 🎯 So sánh

```
📁 TYPE-based (nhóm theo kiểu) — dễ conflict, phải mở 3 folder:
   models/       → user.model.ts, product.model.ts
   services/     → user.service.ts, product.service.ts
   controllers/  → user.controller.ts, product.controller.ts

📁 FEATURE-based:
   features/
   ├── auth/      → type FbSession, login(), logout()
   ├── users/     → type FbUser, create(), find()
   └── products/  → type FbProduct, add(), list()
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Mỗi feature là 1 slice tự chứa model + service + handler
class FbAuthFeature {
  readonly key = "auth";
  login(username: string, password: string): Session | null { /* ... */ }
}

class FbProductsFeature {
  readonly key = "products";
  add(title: string, price: number): Product { /* ... */ }
}

// App registry — nơi duy nhất khai báo feature nào có mặt
class FbFeatureApp {
  private features = new Map<string, FbAnyFeature>();
  register(feature: FbAnyFeature): void { this.features.set(feature.key, feature); }
}
```

---

## ✅ Thuận / ⚠️ Phụ

| Thuận | Phụ |
|-------|-----|
| Toàn bộ code 1 feature nằm 1 chỗ | Code dạng giống nhau nằm rải (mỗi slice 1 "repository") |
| Dễ port feature sang project khác | Cần `shared/` để gom utility dùng chung |
| Team làm feature khác nhau ít conflict | Khó tìm shared code khi project lớn |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.2-feature-based-organization
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9.3 Layered Organization](../5.9.3-layered-organization/README.md)