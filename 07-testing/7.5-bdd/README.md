# 🧪 7.5 Behavior-Driven Development (BDD)

> **BDD** là kỹ thuật viết test dựa trên **hành vi mong đợi** của hệ thống, dùng ngôn ngữ tự nhiên (Gherkin) để mọi người cùng hiểu — không chỉ developer.

---

## 🎯 BDD Là Gì?

BDD mở rộng từ TDD, tập trung vào **WHAT** (hệ thống làm gì) thay vì **HOW** (code hoạt động thế nào).

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD vs BDD                                │
│                                                             │
│   TDD: Developer-centric                                     │
│         "Cho input A, function trả về B"                     │
│         test.add(2, 3).toBe(5)                              │
│                                                             │
│   BDD: Business-centric                                      │
│         "Khi user thanh toán, hệ thống xác nhận đơn hàng"   │
│         WHEN user pays THEN order is confirmed              │
└─────────────────────────────────────────────────────────────┘
```

### BDD sinh ra từ vấn đề gì?

| Vấn đề | TDD giải quyết | BDD giải quyết |
|--------|----------------|----------------|
| Dev và QA hiểu khác spec | ✅ (test là spec) | ✅✅ (Gherkin đọc được bởi mọi stakeholder) |
| Business không đọc được test code | ❌ | ✅ Scenario file = tài liệu sống |
| Test implementation details | ❌ | ✅ Test behavior, không implementation |
| Thiếu communication giữa team | ❌ | ✅ Collaborative: Dev + QA + Product viết scenario |

> 💡 **Misconception:** "BDD thay thế TDD." — Sai. BDD và TDD **bổ sung** nhau. TDD ở tầng unit (dev-focused), BDD ở tầng acceptance (business-focused). Trong Testing Pyramid, BDD scenarios nằm ở đỉnh (few), TDD tests chiếm phần lớn (many).

---

## 📝 Gherkin Syntax (Given-When-Then)

Gherkin là ngôn ngữ mô tả behavior dưới dạng **Scenario** đọc được bởi cả business và tech.

### Ví Dụ: Feature Login

```gherkin
# features/login.feature
Feature: User Login
  As a registered user
  I want to log in with my credentials
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given a registered user with email "user@test.com"
    And the user has password "password123"
    When the user logs in with email "user@test.com" and password "password123"
    Then the user should be redirected to "/dashboard"
    And a welcome message "Hello, User!" should be displayed

  Scenario: Failed login with invalid password
    Given a registered user with email "user@test.com"
    When the user logs in with email "user@test.com" and password "wrong"
    Then an error message "Invalid credentials" should be displayed
    And the user should remain on "/login"

  Scenario: Empty credentials
    When the user logs in with empty email and password
    Then validation errors should be shown for both fields
```

### Cấu Trúc Gherkin

```
┌─────────────────────────────────────────────────────────────┐
│  Feature        → Mô tả tính năng tổng thể                   │
│  Scenario       → Một trường hợp sử dụng cụ thể             │
│  Given          → Điều kiện ban đầu (setup)                 │
│  When           → Hành động xảy ra                          │
│  Then           → Kết quả mong đợi                          │
│  And            → Thêm điều kiện/kết quả (giống Given/Then) │
│  But            → Điều kiện ngược                           │
│  Examples       → Data table cho Scenario Outline           │
└─────────────────────────────────────────────────────────────┘
```

### Scenario Outline (tránh lặp)

```gherkin
Scenario Outline: Add various quantities
  Given the product "<product>" costs $<price>
  When I add "<product>" with quantity <qty>
  Then total should be $<total>

  Examples:
    | product | price | qty | total |
    | Laptop  | 1500  | 1   | 1500  |
    | Laptop  | 1500  | 2   | 3000  |
    | Mouse   | 25    | 4   | 100   |
```

> 📌 **Quy tắc viết Scenario tốt:**
> 1. Mỗi scenario là **một câu chuyện độc lập** — không phụ thuộc scenario khác
> 2. Dùng **active voice**: "When user clicks..." thay vì "When click is performed..."
> 3. Không mô tả UI details: "When user fills email" ✅, "When user types in input#email-field" ❌
> 4. Mỗi scenario nên có **business value** — trả lời "tại sao test này quan trọng?"

---

## 🔧 Cucumber Implementation

### Cài đặt

```bash
npm install -D @cucumber/cucumber
```

### Step Definitions

```typescript
// step-definitions/login.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "chai";

let userEmail = "";
let userPassword = "";
let loginResult: { status: number; redirect?: string; message?: string };

Given("a registered user with email {string}", function (email: string) {
  userEmail = email;
  // seed user trong test DB
});

Given("the user has password {string}", function (password: string) {
  userPassword = password;
});

When(
  'the user logs in with email "{string}" and password "{string}"',
  function (email: string, password: string) {
    // gọi API login
    loginResult = mockLogin(email, password);
  },
);

Then('the user should be redirected to "{string}"', function (path: string) {
  expect(loginResult.status).toBe(302);
  expect(loginResult.redirect).toBe(path);
});

Then(
  'an error message "{string}" should be displayed',
  function (message: string) {
    expect(loginResult.message).toBe(message);
  },
);
```

### Chạy Test

```bash
npx cucumber-js features/login.feature --format progress
```

---

## ✅ BDD vs TDD Comparison

| Khía cạnh | TDD | BDD |
|-----------|-----|-----|
| **Ngôn ngữ** | Code (TypeScript/JS) | Tự nhiên (Gherkin) |
| **Focus** | How (implementation) | What (behavior) |
| **Người viết** | Developer | Dev + QA + Product |
| **Mức độ** | Unit/Integration | Acceptance/Feature |
| **Đọc được bởi** | Developer | Mọi stakeholder |
| **Công cụ** | Jest, Vitest | Cucumber, Behave |
| **Output** | Pass/Fail tests | Business-readable report |
| **Timing** | Viết trước implementation | Viết trước hoặc cùng lúc với feature |

```
┌─────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID với BDD                      │
│                                                             │
│                        ╱ BDD ╲     ← Few (business rules)   │
│                       ╱──────────╲                          │
│                      ╱ Integration╲   ← More                │
│                     ╱    Tests     ╲                        │
│                    ╱────────────────╲                       │
│                   ╱   Unit Tests     ╲ ← Most               │
│                  ╱────────────────────╲                     │
│                                                             │
│  BDD nằm trên đỉnh: ít nhất, bao phủ business-critical path │
└─────────────────────────────────────────────────────────────┘
```

### Khi nào dùng cái nào?

| Trường hợp | Chọn | Lý do |
|------------|------|-------|
| Test logic nội bộ, algorithm | TDD | Developer-centric, fast feedback |
| Test API contract, unit function | TDD | Detailed, precise assertions |
| Test user flow, acceptance criteria | BDD | Business-readable, collaborative |
| Cần business team tham gia viết test | BDD | Gherkin không cần technical knowledge |
| Quick feedback loop cho dev | TDD | Chạy nhanh, inline với coding |
| Compliance/Audit requirements | BDD | Scenario file = audit trail |

---

## 📋 Example: Full BDD Flow

### Feature file

```gherkin
# features/cart.feature
Feature: Shopping Cart
  As a customer
  I want to add items to cart
  So that I can checkout later

  Scenario: Add item to cart
    Given I am logged in as "buyer@test.com"
    And the product "Laptop" costs $1500
    When I add "Laptop" to cart with quantity 1
    Then my cart should contain 1 item
    And the total should be $1500

  Scenario: Remove item from cart
    Given my cart has 2 items worth $100 total
    When I remove the first item
    Then my cart should contain 1 item
    And the total should be $50
```

### Step Definition

```typescript
import { Given, When, Then } from "@cucumber/cucumber";
import { Cart } from "../src/cart";

const cart = new Cart();
let currentUser: string;

Given("I am logged in as {string}", (email: string) => {
  currentUser = email;
  cart.login(currentUser);
});

Given("the product {string} costs ${int}", (name: string, price: number) => {
  cart.addProduct(name, price);
});

When("I add {string} to cart with quantity {int}", (name: string, qty: number) => {
  cart.addItem(name, qty);
});

Then("my cart should contain {int} item(s)", (expected: number) => {
  expect(cart.itemCount()).toBe(expected);
});

Then("the total should be ${int}", (expectedTotal: number) => {
  expect(cart.total()).toBe(expectedTotal);
});
```

---

## ⚠️ Lưu Ý Quan Trọng

| Pitfall | Cách tránh |
|---------|------------|
| Scenario quá chi tiết (implementation) | Giữ ở mức business — không nói "click button #id" |
| Quá nhiều scenarios lặp lại | Dùng Scenario Outline + Examples table |
| Step definition dài, phức tạp | Tách thành helper functions, mỗi step ~1 dòng logic |
| Không có business value | Mỗi scenario phải trả lời "why" — tại sao feature này quan trọng? |
| Scenario phụ thuộc nhau | Mỗi scenario self-contained, không rely state từ scenario khác |
| Gherkin viết bởi dev chỉ | Involve product/QA trong writing session (specification by example) |

> 📌 **Best practice:** Tổ chức **3 Amigos session** — Dev + QA + Product cùng ngồi viết Gherkin scenarios. Ba bên có perspective khác nhau: Product biết business rule, QA biết edge cases, Dev biết technical feasibility. Kết quả: scenarios chất lượng cao, ít phải sửa sau này.

---

## ▶️ Chạy ví dụ

Chạy demo mini spec runner (Feature/Scenario/Given/When/Then), không cần Cucumber:

```bash
cd 07-testing/7.5-bdd
npx tsx examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|----------|
| Cucumber Docs | https://cucumber.io/docs/ |
| Gherkin Reference | https://cucumber.io/docs/gherkin/ |
| BDD vs TDD | https://smartbear.com/learn/bdd/ |
| Behavior-Driven Development | Michael Feathers |

---

## ⏭️ Bài tiếp theo → [7.6 Performance Testing](../7.6-performance-testing/README.md)
