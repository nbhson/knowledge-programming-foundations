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

## ❌ BAD — thêm 1 case: "feature" giả — mọi slice đều import chéo nhau

```
❌ BAD — feature chỉ là folder, phụ thuộc chằng chịt:
   features/auth/      → import { calcShip } from "../products/service"
   features/products/  → import { login } from "../auth/service"
   → tách folder mà không tách phụ thuộc: đổi auth vỡ products (y như type-based)

✅ GOOD — feature tự chứa, giao tiếp qua shared/ hoặc event:
   features/auth/      → chỉ dùng shared/crypto + shared/types
   features/products/  → chỉ dùng shared/money + shared/types
   → xóa 1 feature không vỡ feature khác (test: xóa folder, app còn build?)
```

> Kiểm tra "feature thật": **xóa cả folder feature, các feature khác vẫn build/test xanh**. Không qua được test này thì mới chỉ đổi tên folder.

---

## ⚖️ Trade-off: feature-based vs layered (5.9.3)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Team mỗi người 1 feature, deploy độc lập | ✅ Feature-based | Ít conflict, xóa/thêm feature an toàn |
| Project nhỏ, team 1–3 người | ⚖️ Layered đủ | Feature-based thêm boilerplate folder |
| Logic dùng chung nhiều (> 30% code) | ⚖️ Feature + `shared/` kỷ luật | Shared phình = feature rỗng ruột → review shared kỹ |
| Muốn tách microservice/micro-frontend sau này | ✅ Feature-based | Mỗi slice là ứng viên tách sẵn |
| Nhiều dự án lớn kết hợp | ✅ Feature ở ngoài, layer ở trong | `features/auth/{model,service,handler}` — best of both |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Import chéo giữa features | Feature giả — đổi 1 vỡ 2 | Luật: feature chỉ import `shared/`; chéo nhau phải qua event/interface |
| `shared/` thành bãi rác | Mọi thứ "dùng chung 1 lần" cũng vào shared | Shared chỉ chứa thứ ≥ 2 features dùng + có owner review |
| Mỗi feature 1 cách đặt tên khác nhau | Tìm code khó hơn cả type-based | Template/schematic chung cho mọi slice mới |
| Feature quá to (cả "admin" 1 slice) | Slice mới = monolith mini | Tách tiếp theo sub-feature khi folder > ~10 file |

---

## ✅ Checklist khi review

- [ ] Feature mới tự chứa (model + service + handler trong 1 slice)?
- [ ] Không import chéo feature↔feature (chỉ qua `shared/`)?
- [ ] Test "xóa folder": các feature khác vẫn xanh?
- [ ] Code dùng chung đặt đúng `shared/`, không copy-paste mỗi slice?
- [ ] Slice tuân thủ template đặt tên chung?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.2-feature-based-organization
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9.3 Layered Organization](../5.9.3-layered-organization/README.md)