/**
 * 5.1.3 E2E Testing — Mô phỏng toàn bộ user flow trên "browser giả"
 *
 * Demo TS thuần tự chứa: mini test-runner (record + assertEqual/assertTrue),
 * KHÔNG dùng Playwright/Cypress. Dùng FakePage mô phỏng trình duyệt
 * (navigate, fill, click, đọc màn hình/URL) để kiểm thử luồng người dùng:
 * 1. Đăng ký (register) → dashboard
 * 2. Đăng nhập / đăng xuất
 * 3. Mua hàng trọn vẹn: sản phẩm → giỏ → checkout → xác nhận đơn
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ────────────────────────── Mini Test Runner ──────────────────────────

type MiniTestFn = () => void | Promise<void>;

class MiniTestRunner {
  private tests: Array<{ name: string; fn: MiniTestFn }> = [];
  private passed = 0;
  private failed = 0;

  constructor(private group: string) {}

  record(name: string, fn: MiniTestFn): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log(`\n── ${this.group} ──`);
    for (const t of this.tests) {
      try {
        await t.fn();
        this.passed++;
        console.log(`  ✅ PASS  ${t.name}`);
      } catch (err) {
        this.failed++;
        console.log(`  ❌ FAIL  ${t.name}`);
        console.log(`      └─ ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`  ── Kết quả: ${this.passed} passed / ${this.tests.length} total ──`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg = ""): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} ⇒ expect ${b}, got ${a}`);
}

function assertTrue(actual: boolean, msg = ""): void {
  if (actual !== true) throw new Error(`${msg} ⇒ expect true, got ${actual}`);
}

// ─────────────────────── Browser / App giả ────────────────────────────

type Screen = "register" | "login" | "dashboard" | "products" | "cart" | "checkout" | "confirmation";

interface RegisteredUser {
  name: string;
  email: string;
  password: string;
}

class FakeApp {
  users: RegisteredUser[] = [];
  cart: string[] = [];
  orderNumber = 0;
}

/** Mô phỏng 1 trang trình duyệt: URL, nội dung hiển thị, form input, click */
class FakePage {
  screen: Screen = "login";
  private visible: string[] = [];
  private inputs = new Map<string, string>();

  constructor(private app: FakeApp) {}

  goto(screen: Screen): void {
    this.screen = screen;
    this.visible = [screenTitle(screen)];
  }

  currentUrl(): string {
    return `/${this.screen}`;
  }

  fill(testId: string, value: string): void {
    this.inputs.set(testId, value);
  }

  see(text: string): boolean {
    return this.visible.some((v) => v.includes(text));
  }

  click(testId: string): void {
    switch (testId) {
      case "register-button":
        this.reactToRegistration();
        break;
      case "login-button":
        this.reactToLogin();
        break;
      case "logout-button":
        this.goto("login");
        break;
      case "add-to-cart-1":
        this.app.cart.push("Product A");
        this.visible.push("Added to cart");
        break;
      case "cart-button":
        this.goto("cart");
        this.app.cart.forEach((item) => this.visible.push(item));
        break;
      case "checkout-button":
        this.goto("checkout");
        break;
      case "place-order-button":
        this.app.orderNumber += 1;
        this.goto("confirmation");
        this.visible.push(`Order confirmed! Order #${1000 + this.app.orderNumber}`);
        break;
      default:
        break;
    }
  }

  private reactToRegistration(): void {
    const name = this.inputs.get("name-input") ?? "";
    const email = this.inputs.get("email-input") ?? "";
    const password = this.inputs.get("password-input") ?? "";

    if (password.length < 8) {
      this.visible.push("Password must be at least 8 characters");
      return;
    }
    if (this.app.users.some((u) => u.email === email)) {
      this.visible.push("Email already exists");
      return;
    }
    this.app.users.push({ name, email, password });
    this.goto("dashboard");
    this.visible.push(`Welcome, ${name.split(" ")[0]}!`);
  }

  private reactToLogin(): void {
    const email = this.inputs.get("email-input") ?? "";
    const password = this.inputs.get("password-input") ?? "";
    const user = this.app.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      this.visible.push("Invalid credentials");
      return;
    }
    this.goto("dashboard");
    this.visible.push(`Welcome, ${user.name.split(" ")[0]}!`);
  }
}

function screenTitle(screen: Screen): string {
  const titles: Record<Screen, string> = {
    register: "Register",
    login: "Login",
    dashboard: "Dashboard",
    products: "Products",
    cart: "Cart",
    checkout: "Checkout",
    confirmation: "Order confirmation",
  };
  return titles[screen];
}

// ────────────────────────── Demo chạy ─────────────────────────────────

async function runAll(): Promise<void> {
  console.log("=== 5.1.3 E2E Testing Demo (mô phỏng browser giả — không cần Playwright/Cypress) ===\n");

  // 1️⃣ User Registration Flow
  const reg = new MiniTestRunner("1️⃣ User Registration Flow");
  reg.record("đăng ký hợp lệ → vào dashboard + welcome", () => {
    const page = new FakePage(new FakeApp());
    page.goto("register");
    page.fill("name-input", "John Doe");
    page.fill("email-input", "john@example.com");
    page.fill("password-input", "Password123!");
    page.click("register-button");
    assertEqual(page.currentUrl(), "/dashboard");
    assertTrue(page.see("Welcome, John!"));
  });
  reg.record("mật khẩu yếu → hiển thị lỗi, ở lại register", () => {
    const page = new FakePage(new FakeApp());
    page.goto("register");
    page.fill("password-input", "123");
    page.click("register-button");
    assertTrue(page.see("Password must be at least 8 characters"));
    assertEqual(page.currentUrl(), "/register");
  });
  reg.record("email trùng → hiển thị lỗi", () => {
    const app = new FakeApp();
    app.users.push({ name: "Old", email: "existing@test.com", password: "Password123!" });
    const page = new FakePage(app);
    page.goto("register");
    page.fill("email-input", "existing@test.com");
    page.fill("password-input", "Password123!");
    page.click("register-button");
    assertTrue(page.see("Email already exists"));
  });
  await reg.run();

  // 2️⃣ Login & Logout Flow
  const login = new MiniTestRunner("2️⃣ Login and Logout Flow");
  login.record("đăng nhập đúng → dashboard; sai → báo lỗi", () => {
    const app = new FakeApp();
    app.users.push({ name: "John Doe", email: "john@example.com", password: "Password123!" });
    const page = new FakePage(app);

    page.goto("login");
    page.fill("email-input", "john@example.com");
    page.fill("password-input", "Password123!");
    page.click("login-button");
    assertEqual(page.currentUrl(), "/dashboard");
    assertTrue(page.see("Welcome, John!"));

    page.goto("login");
    page.fill("email-input", "wrong@test.com");
    page.fill("password-input", "WrongPass");
    page.click("login-button");
    assertTrue(page.see("Invalid credentials"));
    assertEqual(page.currentUrl(), "/login");
  });
  login.record("đăng xuất → về login, mất welcome", () => {
    const app = new FakeApp();
    app.users.push({ name: "John Doe", email: "john@example.com", password: "Password123!" });
    const page = new FakePage(app);

    page.goto("login");
    page.fill("email-input", "john@example.com");
    page.fill("password-input", "Password123!");
    page.click("login-button");
    assertEqual(page.currentUrl(), "/dashboard");

    page.click("logout-button");
    assertEqual(page.currentUrl(), "/login");
    assertTrue(!page.see("Welcome"));
  });
  await login.run();

  // 3️⃣ Complete Purchase Flow
  const purchase = new MiniTestRunner("3️⃣ Complete Purchase Flow");
  purchase.record("sản phẩm → giỏ → checkout → xác nhận đơn", () => {
    const app = new FakeApp();
    const page = new FakePage(app);

    page.goto("products");
    assertTrue(page.see("Products"));

    page.click("add-to-cart-1");
    assertTrue(page.see("Added to cart"));

    page.click("cart-button");
    assertEqual(page.currentUrl(), "/cart");
    assertTrue(page.see("Product A"));

    page.click("checkout-button");
    assertEqual(page.currentUrl(), "/checkout");

    page.click("place-order-button");
    assertEqual(page.currentUrl(), "/confirmation");
    assertTrue(page.see("Order confirmed!"));
    assertEqual(app.orderNumber, 1);
  });
  await purchase.run();

  console.log("\n✅ E2E Testing Demo hoàn tất — luồng người dùng từ đầu đến cuối (UI → nghiệp vụ → xác nhận) chạy đúng.");
}

void runAll();

export {};