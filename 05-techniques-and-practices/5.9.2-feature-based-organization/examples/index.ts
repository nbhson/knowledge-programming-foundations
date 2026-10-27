/**
 * 5.9.2 Feature-based Organization — Demo
 *
 * Gom code theo FEATURE, không theo kiểu dữ liệu.
 * Mỗi feature (auth, users, products) là một "slice" tự chứa
 * model + service + handler của riêng nó → thêm tính năng là THÊM 1 mảnh,
 * ít đụng code đang chạy.
 */

// ─── Feature: auth ───
type FbSession = { token: string; username: string; roles: string[] };

class FbAuthFeature {
  readonly key = "auth";
  private sessions = new Map<string, FbSession>();
  private tokenCounter = 100;

  login(username: string, password: string): FbSession | null {
    if (username === "admin" && password === "secret") {
      const session: FbSession = { token: `tok-${this.tokenCounter++}`, username, roles: ["admin"] };
      this.sessions.set(session.token, session);
      return session;
    }
    return null;
  }

  logout(token: string): boolean {
    return this.sessions.delete(token);
  }
}

// ─── Feature: users ───
type FbUser = { id: string; name: string; email: string };

class FbUsersFeature {
  readonly key = "users";
  private users = new Map<string, FbUser>();
  private seq = 1;

  create(name: string, email: string): FbUser {
    const user: FbUser = { id: `u${this.seq++}`, name, email };
    this.users.set(user.id, user);
    return user;
  }

  find(id: string): FbUser | undefined {
    return this.users.get(id);
  }
}

// ─── Feature: products ───
type FbProduct = { id: string; title: string; price: number };

class FbProductsFeature {
  readonly key = "products";
  private products = new Map<string, FbProduct>();

  add(title: string, price: number): FbProduct {
    const product: FbProduct = { id: `p${this.products.size + 1}`, title, price };
    this.products.set(product.id, product);
    return product;
  }

  list(): FbProduct[] {
    return [...this.products.values()];
  }
}

// ─── App registry — nơi duy nhất khai báo feature nào có mặt ───
type FbAnyFeature = FbAuthFeature | FbUsersFeature | FbProductsFeature;

class FbFeatureApp {
  private features = new Map<string, FbAnyFeature>();

  register(feature: FbAnyFeature): void {
    this.features.set(feature.key, feature);
  }

  get<T extends FbAnyFeature>(key: string): T | undefined {
    return this.features.get(key) as T | undefined;
  }

  featureKeys(): string[] {
    return [...this.features.keys()];
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Feature-based Organization Demo ===");
console.log("");

console.log("📁 TYPE-based (nhóm theo kiểu) — code của 1 feature bị rải rác:");
console.log("  models/   → user.model.ts, product.model.ts, order.model.ts");
console.log("  services/ → user.service.ts, product.service.ts, order.service.ts");
console.log("  controllers/ → user.controller.ts, product.controller.ts, order.controller.ts");
console.log("  💬 Để hiểu 'user' phải mở 3 folder; thêm feature chạm vào cả 3 tầng — dễ conflict");
console.log("");

console.log("📁 FEATURE-based — mỗi feature tự chứa model + service + handler:");
console.log("  features/");
console.log("  ├── auth/       → type FbSession, login/logout");
console.log("  ├── users/      → type FbUser,  create/find");
console.log("  └── products/   → type FbProduct, add/list");
console.log("  💬 Toàn bộ 'users' nằm trong 1 slice — đọc 1 nơi là hiểu hết");
console.log("");

const fbApp = new FbFeatureApp();
fbApp.register(new FbAuthFeature());
fbApp.register(new FbUsersFeature());
fbApp.register(new FbProductsFeature());

const fbAuth = fbApp.get<FbAuthFeature>("auth")!;
const fbUsers = fbApp.get<FbUsersFeature>("users")!;
const fbProducts = fbApp.get<FbProductsFeature>("products")!;

const fbSession = fbAuth.login("admin", "secret")!;
fbUsers.create("Alice", "alice@dev.com");
fbProducts.add("Laptop", 15000000);
fbProducts.add("Chuột", 250000);

console.log(`✅ App đã đăng ký features: ${fbApp.featureKeys().join(" · ")}`);
console.log(`  - auth: token=${fbSession.token} (${fbSession.username})`);
console.log(`  - users: ${JSON.stringify(fbUsers.find("u1"))}`);
console.log(`  - products: ${fbProducts.list().map((p) => `${p.title}=${p.price}`).join(" · ")}`);
console.log("");

console.log("➕ THÊM feature mới (reports) chỉ là thêm 1 slice + 1 dòng register:");
console.log("  class FbReportsFeature { readonly key='reports'; ... }");
console.log("  app.register(new FbReportsFeature());");
console.log("  → Không sửa auth/users/products, không ai bị đụng — dễ scale, dễ port feature sang project khác");
console.log("");
console.log("⚠️ NHƯỢC: code dạng giống nhau nằm rải (nhiều 'repository' ở mỗi slice) — cần shared/ để gom utility dùng chung");
console.log("");
console.log("✅ Feature-based: gom theo feature → thêm tính năng không chạm tính năng khác, dễ mở rộng quy mô nhóm");
console.log("");

export {};