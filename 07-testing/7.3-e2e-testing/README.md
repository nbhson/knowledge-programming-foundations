# 🧪 7.3 E2E Testing (Kiểm Thử End-to-End)

> **E2E Test** mô phỏng người dùng thật, chạy **toàn bộ ứng dụng** từ UI đến database — kiểm tra cả hệ thống hoạt động đúng.

---

## 🎯 E2E Testing Là Gì?

E2E test xác nhận ứng dụng hoạt động đúng từ đầu đến cuối: **user input → UI → API → Database → Response**.

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E TEST FLOW                             │
│                                                             │
│  Browser              Server              Database           │
│  ┌──────┐            ┌──────┐            ┌──────┐           │
│  │ UI   │ ──HTTP──▶ │ API  │ ──SQL──▶   │  DB  │           │
│  │ Enter│            │      │            │      │           │
│  │ form │            │      │ ◀──JSON──  │      │           │
│  │Click │            │      │            │      │           │
│  └──────┘            └──────┘            └──────┘           │
│       │                                                      │
│       ▼  Kiểm tra: trang kết quả, dữ liệu hiển thị đúng     │
│                                                             │
│  "Người dùng có đặt hàng thành công không?"                  │
└─────────────────────────────────────────────────────────────┘
```

| So sánh | Unit Test | Integration Test | E2E Test |
|---------|-----------|-----------------|----------|
| Phạm vi | 1 function | 2+ component | Toàn bộ hệ thống |
| Chạy qua browser? | ❌ | ❌ | ✅ |
| Tốc độ | ⚡ ms | 🚗 giây | 🐢 phút |
| Chi phí | Thấp | Trung bình | Cao |
| Độ tin cậy | Cao | Cao | Thấp hơn (flaky) |

---

## 🎮 Playwright Examples

### Cài đặt

```bash
npm install -D @playwright/test
npx playwright install
```

### Basic E2E Test

```typescript
// tests/login.spec.ts
import { test, expect } from "@playwright/test";

test.describe("User Login Flow", () => {
  test("đăng nhập thành công với thông tin hợp lệ", async ({ page }) => {
    // Navigate
    await page.goto("https://shop.example.com/login");

    // Fill form
    await page.getByLabel("Email").fill("user@test.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    // Assert
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome, User!")).toBeVisible();
  });

  test("hiển thị lỗi khi sai mật khẩu", async ({ page }) => {
    await page.goto("https://shop.example.com/login");
    await page.getByLabel("Email").fill("user@test.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
```

### Playwright Config (`playwright.config.ts`)

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🧩 Page Object Model (POM)

POM giúp **tách biệt** logic giao diện khỏi test logic — khi UI thay đổi, chỉ sửa 1 nơi.

```
┌─────────────────────────────────────────────────────────────┐
│                    PAGE OBJECT MODEL                         │
│                                                             │
│  tests/                        src/                         │
│  ├── pages/                   ├── pages/                    │
│  │   ├── LoginPage.ts          │   ├── LoginPage.ts          │
│  │   └── DashboardPage.ts      │   └── DashboardPage.ts      │
│  └── specs/                   └── tests/                    │
│      ├── login.spec.ts         │   ├── login.spec.ts         │
│      └── checkout.spec.ts      │   └── checkout.spec.ts      │
│                               │                              │
│  Test KHÔNG biết chi tiết UI   UI details ẩn trong page obj  │
└─────────────────────────────────────────────────────────────┘
```

### LoginPage.ts

```typescript
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.errorMessage = page.getByText("Invalid credentials");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

// DashboardPage.ts
export class DashboardPage {
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;

  constructor(private page: Page) {
    this.welcomeMessage = page.getByText(/Welcome,/);
    this.logoutButton = page.getByRole("link", { name: "Logout" });
  }

  async waitForLoaded() {
    await this.welcomeMessage.waitFor();
  }
}
```

### Sử Dụng POM Trong Test

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

test("đăng nhập thành công", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login("user@test.com", "password123");
  await dashboardPage.waitForLoaded();

  await expect(dashboardPage.welcomeMessage).toBeVisible();
});

test("đăng nhập sai mật khẩu", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("user@test.com", "wrong");

  await expect(loginPage.errorMessage).toBeVisible();
});
```

---

## ⚙️ Test Fixtures, Setup & Teardown

### Custom Fixtures (Playwright)

```typescript
// tests/fixtures.ts
import { test as base } from "@playwright/test";
import { LoginPage } from "../src/pages/LoginPage";
import { DashboardPage } from "../src/pages/DashboardPage";

export const test = base.extend<{
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  adminUser: { email: string; password: string };
}>({
  adminUser: { email: "admin@test.com", password: "admin123" },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});
```

### Setup/Teardown Patterns

```typescript
import { test, expect, chromium } from "@playwright/test";

test.describe("E2E Test Suite", () => {
  let browser;
  let context;
  let page;

  // Setup: chạy 1 lần trước tất cả test
  test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    page = await context.newPage();
  });

  // Setup: chạy trước mỗi test (mỗi test có trang mới)
  test.beforeEach(async () => {
    await page.goto("http://localhost:3000");
    await page.context().clearCookies();
  });

  // Teardown: chạy sau tất cả test
  test.afterAll(async () => {
    await browser.close();
  });

  test("example test", async () => {
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveTitle(/Dashboard/);
  });
});
```

### Test với Database Seed

```typescript
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.beforeEach(async () => {
  // Xóa dữ liệu cũ trước mỗi test
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
});

test.afterEach(async () => {
  await prisma.$disconnect();
});

test("checkout flow complete", async ({ page }) => {
  // Seed user trong DB
  const user = await prisma.user.create({
    data: { email: "buyer@test.com", name: "Buyer" },
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill("test123");
  await page.getByRole("button", { name: "Login" }).click();

  // Add to cart
  await page.goto("/products/1");
  await page.getByRole("button", { name: "Add to Cart" }).click();

  // Checkout
  await page.goto("/cart");
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByLabel("Address").fill("123 Main St");
  await page.getByRole("button", { name: "Place Order" }).click();

  // Verify order created in DB
  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
  });
  expect(orders.length).toBeGreaterThan(0);
  await expect(page.getByText("Order Confirmed")).toBeVisible();
});
```

---

## ✅ Best Practices

| Nguyên tắc | Giải thích |
|------------|------------|
| **Test behavior, không implementation** | Focus vào user flow, không click chi tiết |
| **Sử dụng stable selectors** | `getByRole`, `getByText` tốt hơn `getByTestId` phức tạp |
| **Timeout hợp lý** | Không set timeout quá cao, để test fail nhanh |
| **Parallel execution** | Chạy song song để tiết kiệm thời gian |
| **Retry thông minh** | Retry 1-2 lần cho network flaky, không retry vô hạn |
| **Tránh sleep()** | Dùng `waitFor` thay vì `setTimeout` |

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.3-e2e-testing
npx playwright test
# hoặc với CI: npx playwright test --project=chromium
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|----------|
| Playwright Docs | https://playwright.dev/ |
| Page Object Model Pattern | https://martinfowler.com/bliki/PageObject.html |
| Cypress Docs | https://docs.cypress.io/ |
| Testing Library | https://testing-library.com/ |

---

## ⏭️ Bài tiếp theo → [7.4 TDD](../7.4-tdd/README.md)
