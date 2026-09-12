# ⚙️ 5.1 Testing Techniques (Kỹ Nghiệm Kiểm Thử)

> **Testing** là quy trình kiểm tra code có **đúng** theo yêu cầu hay không, giúp phát hiện lỗi sớm, đảm bảo chất lượng sản phẩm.

```
Chi phí sửa lỗi càng cao khi phát hiện muộn:
Bug phát hiện ở Dev → $1 sửa
Bug phát hiện ở QA  → $10 sửa
Bug phát hiện ở Prod → $100+ sửa + mất uy tín
```

---

## 🎯 Unit Testing (Kiểm Thử Đơn Vị)

**Mô tả:** Kiểm thử từng **đơn vị nhỏ nhất** (function, class) trong **cô lập**, không phụ thuộc DB/API.

```typescript
// Function cần test
function calculateTotal(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// Test với Jest
import { describe, it, expect } from 'vitest';
import { calculateTotal } from './cart';

describe('calculateTotal', () => {
  it('should return 0 when cart is empty', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should sum item prices correctly', () => {
    const items = [{ price: 10000, qty: 2 }, { price: 5000, qty: 3 }];
    expect(calculateTotal(items)).toBe(35000);
  });

  it('should handle single item', () => {
    expect(calculateTotal([{ price: 50000, qty: 1 }])).toBe(50000);
  });
});
```

**Nguyên tắc:**
- Fast, deterministic, cô lập
- Mock external dependencies (DB, API, filesystem)
- Tên test mô tả hành vi: `it("should throw when invalid email")`

---

## 🔗 Integration Testing (Kiểm Thử Tích Hợp)

**Mô tả:** Kiểm thử **nhiều thành phần làm việc cùng nhau** (API + Database, Service + Queue).

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request } from 'supertest';
import { app } from './app';

describe('User API Integration', () => {
  it('should create and retrieve user', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);

    // Retrieve
    const getRes = await request(app)
      .get(`/api/users/${createRes.body.id}`)
      .expect(200);

    expect(getRes.body.name).toBe('John');
    expect(getRes.body.email).toBe('john@test.com');
  });
});
```

**Khi nào dùng Integration Testing:**
- Kiểm tra interactions giữa các module
- Validation database queries
- API endpoints với real dependencies

---

## 🌐 End-to-End Testing (E2E)

**Mô tả:** Kiểm thử **toàn bộ flow** từ UI đến Database, mô phỏng người dùng thật.

```typescript
// Playwright E2E Test
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register a new user and show dashboard', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="register-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, John!')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');

    await expect(page.getByText('Password must be at least 8 characters'))
      .toBeVisible();
  });
});
```

**Công cụ phổ biến:**
- **Playwright** — Microsoft, multi-browser, fast
- **Cypress** — Developer-friendly, real-time reload
- **Puppeteer** — Google, low-level control

---

## 🔄 TDD (Test-Driven Development)

**Mô tả:** Viết **test trước** → Viết code để pass test → Refactor.

```
Red → Green → Refactor

1. 🔴 RED:    Viết test (sẽ fail vì chưa có code)
2. 🟢 GREEN:  Viết code tối thiểu để test pass
3. 🔵 REFACTOR: Làm sạch code mà vẫn pass test
```

```typescript
// Step 1: RED — write failing test first
import { describe, it, expect } from 'vitest';
import { calculateDiscount } from './discount';

describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over $100', () => {
    expect(calculateDiscount(150)).toBe(135);
  });
  it('should not apply discount for orders under $100', () => {
    expect(calculateDiscount(50)).toBe(50);
  });
});

// Step 2: GREEN — minimum code to pass
function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  return amount;
}

// Step 3: REFACTOR — improve code readability
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

function calculateDiscount(amount: number): number {
  return amount > DISCOUNT_THRESHOLD
    ? amount * (1 - DISCOUNT_RATE)
    : amount;
}
```

---

## 🎭 BDD (Behavior-Driven Development)

**Mô tả:** Viết test theo **câu chuyện hành vi**, dễ đọc cho dev và business.

```gherkin
# feature file: user_login.feature
Feature: User Login
  As a registered user
  I want to login with email and password
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter "john@example.com" as email
    And I enter "Password123!" as password
    And I click the "Login" button
    Then I should be redirected to the dashboard
    And I should see "Welcome, John!"

  Scenario: Login with invalid password
    Given I am on the login page
    When I enter "john@example.com" as email
    And I enter "WrongPassword" as password
    And I click the "Login" button
    Then I should see "Invalid credentials"
    And I should remain on the login page
```

**Công cụ:** Cucumber, Behave, Cypress BDD

---

## 🧬 Mutation Testing

**Mô tả:** Tự động **thay đổi (mutate)** code rồi kiểm tra test có **phát hiện** không.

```typescript
// Original code
function isEven(n: number): boolean {
  return n % 2 === 0;
}

// Mutant 1: === becomes !==
function isEven(n: number): boolean {
  return n % 2 !== 0; // ❌ Logic reversed!
}

// Mutant 2: % becomes *
function isEven(n: number): boolean {
  return n * 2 === 0; // ❌ Completely different!
}

// Nếu test catch được mutant → test ĐỦ MẠNH
// Nếu test không catch được mutant → test YẾU
```

**Công cụ:** Stryker, PIT (Java), Mutant

---

## 📊 Levels of Testing (Thang đo)

```
        ┌─────────────────────────┐
        │   E2E Testing           │  ← Slow, expensive, high value
        │   (Playwright/Cypress)  │
        ├─────────────────────────┤
        │   Integration Testing   │  ← Medium speed & cost
        │   (Supertest, TestContainers)
        ├─────────────────────────┤
        │   Unit Testing          │  ← Fast, cheap, broad coverage
        │   (Jest, Vitest)        │
        └─────────────────────────┘
              Test Pyramid
```

---

## 🎯 Khi nào dùng cái nào?

| Scenario | Khuyến nghị |
|----------|-------------|
| Test function/method đơn lẻ | ✅ Unit Testing |
| Test interaction giữa các module | ✅ Integration Testing |
| Test full user flow trên browser | ✅ E2E Testing |
| Team muốn viết test trước code | ✅ TDD |
| Stakeholder muốn đọc được test | ✅ BDD |
| Đánh giá chất lượng test suite | ✅ Mutation Testing |
| Test performance/speed | ⚠️ Load Testing (khác topic) |

---

## 🔧 Tools phổ biến

| Tool | Loại | Ngôn ngữ | Điểm mạnh |
|------|------|----------|-----------|
| **Jest** | Unit/Integration | JS/TS | Fast, built-in mock, snapshot |
| **Vitest** | Unit/Integration | JS/TS |极速, Vite-native, close đến Jest |
| **Playwright** | E2E | JS/TS | Multi-browser, auto-wait, trace |
| **Cypress** | E2E | JS/TS | Real-time reload, DOM inspection |
| **Supertest** | Integration | JS/TS | HTTP API testing đơn giản |
| **TestContainers** | Integration | Nhiều ngôn ngữ | Real DB trong container |
| **Stryker** | Mutation | JS/TS | Đánh giá chất lượng test |
| **Cucumber** | BDD | Nhiều ngôn ngữ | Gherkin syntax, business-readable |

---

## 📁 Cấu trúc thư mục

```
tests/
├── unit/
│   ├── calculateTotal.test.ts
│   └── userValidator.test.ts
├── integration/
│   └── userApi.test.ts
└── e2e/
    ├── login.spec.ts
    └── registration.spec.ts
```

---

## ✅ Best Practices

| Practice | Giải thích |
|----------|------------|
| **AAA Pattern** | Arrange → Act → Assert — 3 bước rõ ràng |
| **One assertion per test** | Mỗi test chỉ kiểm tra 1 điều |
| **Descriptive names** | `it("should reject negative quantity")` thay vì `it("test1")` |
| **Fast & isolated** | Unit test < 10ms, không phụ thuộc nhau |
| **Mock external deps** | Fake DB, fake API, fake filesystem |
| **Cover edge cases** | Null, empty, boundary values |
| **Don't over-test** | Test behavior, không implement chi tiết |

---

## 🔗 Liên quan

- **5.3 Performance Optimization** — Test performance, benchmarking
- **5.4 Security Techniques** — Security testing, penetration testing
- **5.6 Refactoring Techniques** — Test-driven refactoring

---

## 📚 Tài liệu tham khảo

- 📖 [Jest Docs](https://jestjs.io/docs/getting-started)
- 📖 [Playwright Docs](https://playwright.dev/)
- 📖 [Test Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- 📖 [Mutation Testing](https://stryker-mutator.io/)

---

## ⏭️ Bài tiếp theo

→ [5.2 Development Methodologies](../5.2-development-methodologies/README.md)
