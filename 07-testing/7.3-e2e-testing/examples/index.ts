/**
 * 7.3 E2E Testing — Mô phỏng luồng người dùng (User Flow)
 *
 * Minh họa E2E Test:
 * - Giả lập trình duyệt (browser) thực hiện các bước: open → fill → click → chờ.
 * - Toàn bộ hệ thống: UI session + API layer + database (in-memory).
 * - Ghi lại từng bước (step) như một test case E2E.
 */

// ──────────────────── Các entity của "shop" ────────────────────
interface E2eProduct {
  id: string;
  name: string;
  price: number;
}

interface E2eUser {
  email: string;
  password: string;
}

interface E2eCartLine {
  product: E2eProduct;
  quantity: number;
}

// ──────────────────── Backend giả (API + DB) ────────────────────
class E2eBackendApp {
  private users = new Map<string, E2eUser>();
  private products = new Map<string, E2eProduct>();
  private orders: string[] = [];

  seed(): void {
    this.users.set("buyer@test.com", { email: "buyer@test.com", password: "secret123" });
    this.products.set("p1", { id: "p1", name: "Laptop", price: 1500 });
    this.products.set("p2", { id: "p2", name: "Mouse", price: 25 });
  }

  async login(email: string, password: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 20));
    const u = this.users.get(email);
    return u !== undefined && u.password === password;
  }

  async getProduct(id: string): Promise<E2eProduct | undefined> {
    await new Promise((r) => setTimeout(r, 15));
    return this.products.get(id);
  }

  async placeOrder(customerEmail: string, lines: E2eCartLine[]): Promise<void> {
    await new Promise((r) => setTimeout(r, 25));
    const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
    this.orders.push(`${customerEmail} → ${lines.length} item(s), total $${total}`);
  }

  async getOrderCount(email: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 10));
    return this.orders.filter((o) => o.startsWith(email)).length;
  }
}

// ──────────────────── Trình duyệt giả (Browser session) ────────────────────
type E2eStep = { action: string; detail: string; ok: boolean };

class E2eBrowserSession {
  private steps: E2eStep[] = [];
  private loggedIn = false;
  private cart: E2eCartLine[] = [];
  private lastPage = "/";
  private visibleMessage = "";

  constructor(private app: E2eBackendApp) {}

  private record(action: string, detail: string, ok: boolean): void {
    this.steps.push({ action, detail, ok });
    console.log(`  ${ok ? "✅" : "❌"} [E2E] ${action} — ${detail}`);
  }

  async open(path: string): Promise<void> {
    this.lastPage = path;
    this.visibleMessage = "";
    this.record("navigate", `Mở trang ${path}`, true);
  }

  fill(selector: string, value: string): void {
    this.record("fill", `Điền ${selector} = "${value}"`, true);
  }

  async clickLogin(email: string, password: string): Promise<void> {
    const ok = await this.app.login(email, password);
    this.loggedIn = ok;
    if (ok) {
      this.lastPage = "/dashboard";
      this.visibleMessage = "Chào mừng, Buyer!";
    } else {
      this.visibleMessage = "Invalid credentials";
    }
    this.record("click", `Nhấn nút Login (${email})`, true);
  }

  async clickAddToCart(productId: string): Promise<void> {
    const p = await this.app.getProduct(productId);
    const ok = p !== undefined;
    if (ok && p) {
      const line = this.cart.find((l) => l.product.id === p.id);
      if (line) line.quantity += 1;
      else this.cart.push({ product: p, quantity: 1 });
    }
    this.record("click", `Thêm ${productId} vào giỏ hàng`, ok);
  }

  async clickPlaceOrder(): Promise<void> {
    await this.app.placeOrder("buyer@test.com", this.cart);
    this.visibleMessage = "Order Confirmed";
    this.lastPage = "/confirmation";
    this.record("click", "Nhấn Place Order", true);
  }

  assertPage(pagePath: string, stepName: string): void {
    const ok = this.lastPage === pagePath;
    this.record("assert", `${stepName}: đang ở ${this.lastPage}`, ok);
  }

  assertVisible(text: string, stepName: string): void {
    const ok = this.visibleMessage.includes(text);
    this.record("assert", `${stepName}: thấy "${text}"`, ok);
  }

  getStepCount(): number {
    return this.steps.length;
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== E2E Test Demo ===");
console.log("Mô phỏng người dùng thật: UI → API → Database.\n");

async function runUserFlow(): Promise<void> {
  const app = new E2eBackendApp();
  app.seed();
  const browser = new E2eBrowserSession(app);

  console.log("Scenario: User có thể đặt hàng trọn vẹn từ login đến confirm\n");

  // 1. Mở trang login & đăng nhập
  await browser.open("/login");
  browser.fill("#email", "buyer@test.com");
  browser.fill("#password", "secret123");
  await browser.clickLogin("buyer@test.com", "secret123");
  browser.assertPage("/dashboard", "chuyển hướng dashboard");
  browser.assertVisible("Chào mừng", "hiện lời chào");

  // 2. Xem sản phẩm & thêm vào giỏ
  await browser.open("/products/p1");
  await browser.clickAddToCart("p1");
  await browser.clickAddToCart("p1");

  // 3. Thanh toán
  await browser.open("/cart");
  await browser.clickPlaceOrder();
  browser.assertPage("/confirmation", "chuyển trang xác nhận");
  browser.assertVisible("Order Confirmed", "hiện Order Confirmed");

  // 4. Verify trong database
  const orderCount = await app.getOrderCount("buyer@test.com");
  const okDb = orderCount === 1;
  console.log(`  ${okDb ? "✅" : "❌"} [E2E] assert — Database ghi đúng ${orderCount} đơn hàng`);

  console.log(`\n📋 Tổng cộng ${browser.getStepCount()} bước E2E đã chạy hết luồng: login → xem SP → giỏ hàng → đặt hàng → verify DB`);
}

runUserFlow();

export {};