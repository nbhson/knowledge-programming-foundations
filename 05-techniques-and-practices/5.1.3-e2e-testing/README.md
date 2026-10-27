# 🔬 5.1.3 End-to-End Testing (E2E)

> **E2E Testing** là kiểm thử **toàn bộ flow từ đầu đến cuối** — mô phỏng người dùng thật tương tác với ứng dụng trên trình duyệt, từ UI đến database.

```
❌ VẤN ĐỀ: Chỉ test từng phần riêng lẻ
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  UI    │──>│ Server │──>│  DB    │──>│  Auth  │
│  test  │  │  test  │  │  test  │  │  test  │
└────────┘  └────────┘  └────────┘  └────────┘
   ✅           ✅           ✅           ✅
→ Từng phần OK nhưng flow tổng thể bị lỗi!
(Ví dụ: redirect sai, session mất, timeout)

✅ GIẢI PHÁP: E2E Testing
┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
│Browser│───>│Server │───>│ Database│──>│Third  │
│(thật)  │    │(thật) │    │(thật)  │    │party │
└───────┘    └───────┘    └───────┘    └───────┘
→ Kiểm tra toàn bộ hệ thống hoạt động đúng
```

---

## 🎯 Vấn Đề

Unit và integration test không phát hiện được:
- **Routing sai**: URL không match, redirect loop
- **Session/Auth flow**: login → cookie → protected route bị lỗi
- **Browser compatibility**: CSS layout vỡ trên mobile
- **Third-party integration**: Google Pay, Stripe webhook
- **Race conditions**: timing issues giữa UI và API

```
KIỂM THỬ E2E ĐÚNG CÁCH
│
├─ Chạy trên browser thật (Chrome, Firefox)
│
├─ Mô phỏng hành vi người dùng thật
│
├─ Test critical user journeys (không phải mọi case)
│
└─ Chạy chậm hơn unit test → chỉ test quan trọng
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Không test user flow
// ─────────────────────────────────────────────
test('user can login', () => {
  // Chỉ test mock function — bỏ qua thực tế
  const mockLogin = vi.fn().mockReturnValue(true);
  expect(mockLogin()).toBe(true); // ← Không test real flow
});

// ─────────────────────────────────────────────
// ✅ GOOD: E2E test với Playwright
// ─────────────────────────────────────────────
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register new user and show dashboard', async ({ page }) => {
    // Step 1: Navigate to register page
    await page.goto('/register');

    // Step 2: Fill form
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');

    // Step 3: Submit
    await page.click('[data-testid="register-button"]');

    // Step 4: Verify redirect and welcome message
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, John!')).toBeVisible();
  });

  test('should show validation errors for weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');

    await expect(
      page.getByText('Password must be at least 8 characters')
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// ✅ GOOD: E2E test với Cypress
// ─────────────────────────────────────────────
describe('Shopping Cart Flow', () => {
  it('should add item to cart and checkout', () => {
    cy.visit('/products/123');

    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-count"]').should('contain', '1');

    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();

    cy.url().should('include', '/checkout');
    cy.get('[data-testid="order-total"]').should('contain', '$49.99');
  });
});
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎭 **Thực tế** | Mô phỏng đúng hành vi người dùng |
| 🔍 **Phát hiện lỗi integration** | Tìm ra vấn đề giữa UI + server + DB |
| 📱 **Test cross-browser** | Đảm bảo hoạt động trên mọi browser |
| 🛡️ **Regression safety** | Bảo vệ các critical flows |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Chậm** | Chỉ test critical paths (3-5 flows quan trọng) |
| **Flaky** | Dùng auto-wait, thêm explicit waits, không hardcode sleep |
| **Maintenance** | Dùng data-testid thay vì CSS selector fragile |
| **Chi phí chạy** | Chạy E2E trong CI chỉ khi merge, không phải mỗi commit |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Critical user flows (login, checkout, payment) | ✅ E2E Testing |
| Test trên nhiều browser | ✅ E2E Testing |
| Validate UI/UX thực tế | ✅ E2E Testing |
| Test function/method đơn lẻ | ⚠️ Dùng Unit Testing |
| Test API + DB interaction | ⚠️ Dùng Integration Testing |

---

## 🔗 Liên quan

- **5.1.1 Unit Testing** — Nền tảng, test từng đơn vị
- **5.1.2 Integration Testing** — Bridge giữa unit và e2e
- **5.1.4 TDD** — Viết test trước (thường dùng unit test)
- **5.1.5 BDD** — E2E + business-readable scenarios

---

## 📚 Tài liệu tham khảo

- 📖 [Playwright Docs](https://playwright.dev/)
- 📖 [Cypress Docs](https://docs.cypress.io/)
- 📖 [Test Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## ⏭️ Bài tiếp theo

→ [5.1.4 Test-Driven Development](../5.1.4-tdd/README.md)
