# ⚙️ 5.1 Testing Techniques (Kỹ Nghiệm Kiểm Thử)

> **Testing** là quy trình kiểm tra code có **đúng** theo yêu cầu hay không, giúp phát hiện lỗi sớm, đảm bảo chất lượng sản phẩm. Nhưng thực tế sâu hơn: test là **bảo hiểm cho sự thay đổi** — không có test, mỗi lần refactor là một quả bom hẹn giờ có thể nổ bất cứ lúc nào.

---

## 🎯 Vấn đề chung

Test không chỉ là "kiểm tra bug". Nó phục vụ ba mục đích song song:

1. **Phát hiện lỗi** — bắt được regression trước khi đến tay user
2. **Tài liệu sống** — test case mô tả **hành vi kỳ vọng** của hệ thống, đọc test hiểu hơn đọc spec
3. **Tự tin thay đổi** — có test suite mạnh, bạn tự tin refactor; không có test suite = mỗi dòng code sửa là một canh động đất

**Chi phí sửa lỗi theo thời điểm phát hiện** (dựa trên nghiên cứu kinh điển của Barry Boehm và các nghiên cứu sau này của IBM SEI):

| Giai đoạn | Chi phí tương đối | Ví dụ | Thực tế đo được |
|-----------|-------------------|-------|-----------------|
| **Development** (viết test cùng code) | $1 | Unit test catch ngay trong IDE | Cost-fix trong dev thường < $50 cho 1 bug đơn giản |
| **Pre-production** (QA environment) | $10 | Integration test trong CI, phát hiện trước deploy | Bug found in staging: ~$500–$2000 do phải redeploy + retest |
| **Post-production** (user report) | $100+ | Hotfix + mất uy tín + support ticket | Bug in prod trung bình $10k+ (bao gồm incident response, rollback, mất revenue) |

> 📌 **Thực tế ngành:** Nghiên cứu của NIST (2002, cập nhật bởi nhiều study sau đó) ước tính lỗi phần mềm gây thiệt hại **31–75 tỷ USD/năm** tại Mỹ. Trong đó ~60% chi phí là do **thiếu test**, không phải do viết test sai.

**Test Pyramid (Martin Fowler, 2006):**

```
         ┌─────────────────────────┐
         │   E2E Testing           │  ← 10%: slow, expensive, high value
         │   (Playwright/Cypress)  │     Mỗi test chạy 5–30 giây, cần browser/DB
         ├─────────────────────────┤
         │   Integration Testing   │  ← 20%: medium speed & cost
         │   (Supertest, TestContainers)
         │   Mỗi test chạy 100ms–2s |
         ├─────────────────────────┤
         │   Unit Testing          │  ← 70%: fast, cheap, broad coverage
         │   (Jest, Vitest)        │     Mỗi test < 10ms; chạy hàng ngàn test
         └─────────────────────────┘
               Test Pyramid
```

**Tại sao hình tam giác chứ không phải cột bằng?**

- Unit test **rẻ nhất**: chạy trong micro-giây, không cần infrastructure, debug nhanh nhất (1 function broken → stack trace duy nhất)
- E2E test **đắt nhất**: cần server chạy, DB seed data, browser automation → failure rate cao hơn, debug phức tạp hơn nhiều
- Tam giác bảo vệ đúng: phần nhiều nhất (unit, rẻ nhất) nằm ở đáy; phần ít nhất (E2E, đắt nhất) ở đỉnh
- **Inverted pyramid** (nhiều E2E hơn unit) là dấu hiệu của test suite yếu: chậm, flaky, và tốn chi phí maintainer cao

> 💡 **Gần đúng hiện đại:** Martin Fowler sau này thừa nhận con số 70/20/10 là hướng dẫn, không quy luật vật lý. Quan trọng là **unit test > E2E test** về số lượng — không nhất thiết đúng tỷ lệ đó.

---

## 🎯 Unit Testing (Kiểm Thử Đơn Vị)

**Mô tả:** Kiểm thử từng **đơn vị nhỏ nhất** có thể tách rời (function, class, method) trong **cô lập hoàn toàn** — không phụ thuộc DB, network, filesystem, hay UI. Mục tiêu: verify **một hành vi** với **một input** cho ra **một output** dự kiến.

**Nguyên tắc unit test chuẩn (theo Gerard Meszaros — xUnit Test Patterns):**

| Nguyên tắc | Ý nghĩa | Hậu quả nếu bỏ qua |
|------------|---------|---------------------|
| **FAST** | Chạy < 10ms/test case | CI pipeline chậm → team không commit thường xuyên → merge conflict tích tụ |
| **INDEPENDENT** | Test này không ảnh hưởng test khác | Thứ tự chạy test quan trọng → "flaky test", fail ngẫu nhiên |
| **DETERMINISTIC** | Cùng input → cùng output, không flaky | Kết quả test thay đổi theo thời gian/network → cannot trust suite |
| **SELF-VALIDATING** | Tự động pass/fail, không cần đọc kết quả thủ công | Human review mỗi run → scale không được, QA bị nghẽn |

**Tự kiểm tra unit test có "unit" thật sự:**
- Không có `new HttpClient()`, `new PostgreSQLClient()`, `connectToDatabase()` trong test
- Không có `sleep`, `setTimeout`, hay random không seeded
- Không đọc/ghi file system thực
- Mock mọi external dependency

```typescript
// Function cần test — pure logic, không side effect
function calculateTotal(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// Test với Vitest (tương tự Jest API)
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

  // Edge case — thường bị bỏ sót:
  it('should handle negative prices (return promotion credit)', () => {
    const items = [{ price: -5000, qty: 2 }];
    expect(calculateTotal(items)).toBe(-10000);
  });

  it('should handle zero quantity', () => {
    const items = [{ price: 10000, qty: 0 }];
    expect(calculateTotal(items)).toBe(0);
  });
});
```

**Mocking — kỹ thuật quan trọng nhất của unit test:**

Unit test không thể gọi DB thật hay API thật — phải **thay thế bằng mock**. Mock là object giả lập interface của dependency thực, trả về giá trị định sẵn.

```typescript
// ❌ BAD: phụ thuộc real database, không thể unit test
async function createUser(name: string): Promise<User> {
  const db = await connectToDatabase(); // network call! side effect!
  return db.save({ name });
}

// ✅ GOOD: inject dependency → unit test được
class UserService {
  constructor(private repo: UserRepository) {}

  async createUser(name: string): Promise<User> {
    return this.repo.save({ name });
  }
}

// Test với mock — fake implementation của UserRepository
const mockRepo = { save: vi.fn().mockResolvedValue({ id: 1, name: 'John' }) };
const service = new UserService(mockRepo as unknown as UserRepository);

// Act & Assert
const result = await service.createUser('John');
expect(result.name).toBe('John');
expect(mockRepo.save).toHaveBeenCalledTimes(1);
expect(mockRepo.save).toHaveBeenCalledWith({ name: 'John' });
```

> 💡 **Phân biệt Mock vs Stub vs Spy:**
> - **Stub**: trả về giá trị cố định khi được gọi (dùng để cung cấp input)
> - **Mock**: kiểm tra cả **cách gọi** — xác nhận đã gọi đúng đối tượng với đúng đối số
> - **Spy**: wrapper quanh hàm thật, vừa chạy hàm thật vừa ghi lại các cuộc gọi

**Industry example:** Netflix dùng unit test với ~70.000 testcases, chạy dưới 2 phút trên CI. Mỗi service có interface rõ ràng, mock mọi RPC call. Chiến lược: "test at the edge" — kiểm tra contract giữa services bằng unit test thay vì integration test khắp nơi.

---

## 🔗 Integration Testing (Kiểm Thử Tích Hợp)

**Mô tả:** Kiểm thử **nhiều thành phần làm việc cùng nhau** — API + Database, Service + Queue, Frontend + Backend. Integration test chấp nhận gọi **real dependencies** (hoặc realistic replacements như testcontainers) để verify **interaction đúng**.

**Khi nào dùng integration test:**
- Kiểm tra interactions giữa các module mà unit test không chạm tới
- Validation database queries, ORM mappings, migration scripts
- API endpoints với real HTTP stack (routing, middleware, auth)
- End-to-end flow trong controlled environment (mock DB nhưng real API stack)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request } from 'supertest';
import { app } from './app';

describe('User API Integration', () => {
  it('should create and retrieve user in one flow', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);

    // Retrieve — gọi API thật, đi qua router + controller + DB
    const getRes = await request(app)
      .get(`/api/users/${createRes.body.id}`)
      .expect(200);

    expect(getRes.body.name).toBe('John');
    expect(getRes.body.email).toBe('john@test.com');
  });

  it('should reject duplicate email', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);

    await request(app)
      .post('/api/users')
      .send({ name: 'Jane', email: 'john@test.com' })
      .expect(409); // unique constraint violation → 409 Conflict
  });
});
```

**TestContainers pattern** — spin up real DB trong Docker cho integration test:

```typescript
import { GenericContainer } from 'testcontainers';
import { Pool } from 'pg';

describe('PostgreSQL integration', () => {
  let container: GenericContainer;
  let pool: Pool;

  beforeAll(async () => {
    // Spin up real PostgreSQL 15 instance
    container = new GenericContainer('postgres:15')
      .withExposedPorts(5432)
      .withEnvironment({ POSTGRES_PASSWORD: 'test' })
      .start();

    pool = new Pool({
      host: 'localhost',
      port: parseInt(container.getMappedPort(5432)),
      user: 'postgres',
      password: 'test',
      database: 'test_db',
    });
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  it('should execute real SQL queries', async () => {
    await pool.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT)');
    const result = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING id', ['Alice']);
    expect(result.rows[0].id).toBe(1);
  });
});
```

**Các mức độ integration test:**

| Mức | Mock? | Real DB? | Real API? | Mục đích |
|-----|-------|----------|-----------|----------|
| **Contract test** | Mock DB | Không | Mock HTTP | Kiểm tra data shape between services |
| **Component test** | Không | Có (testcontainer) | Mock HTTP | Kiểm tra một service hoàn chỉnh |
| **API integration** | Không | Có | Có | Kiểm tra routing + business + persistence |
| **End-to-end (E2E)** | Không | Có | Có | Kiểm tra toàn bộ flow qua UI |

> ⚠️ **Lưu ý:** Integration test chậm hơn unit test ~100–1000 lần vì có I/O. Giữ số lượng vừa phải và chạy song song trong CI.

---

## 🌐 End-to-End Testing (E2E)

**Mô tả:** Kiểm thử **toàn bộ flow** từ UI đến Database, mô phỏng người dùng thật trên browser thật. E2E test chạy trên **staging hoặc production-like environment** — không mock gì cả, trừ khi cần seed dữ liệu ban đầu.

**E2E vs Integration — điểm khác biệt then chốt:**
- **Integration:** test trong controlled environment (mock DB, test containers). Bạn điều khiển đầy đủ mọi component.
- **E2E:** test với real browser, real network, real deployment (staging/prod-like). Môi trường không dưới control của bạn — đúng là "test như user thật".

**Chi phí E2E (benchmarks ngành):**
- Thời gian chạy 1 test: **5–30 giây** (browser warm-up + navigate + interactions)
- Flaky rate: **10–30%** test E2E thất bại không phải vì bug thật (do timing, network)
- Maintenance cost: **2–5x** so với unit test (schema đổi → locator đổi → test rewrite)

```typescript
// Playwright E2E Test — chạy trên Chromium/Firefox/WebKit thật
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register a new user and show dashboard', async ({ page }) => {
    // Arrange: navigate to real staging URL
    await page.goto('https://staging.example.com/register');

    // Act: fill form và submit
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="register-button"]');

    // Assert: URL chuyển, UI hiện thông báo
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, John!')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('https://staging.example.com/register');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');

    await expect(page.getByText('Password must be at least 8 characters'))
      .toBeVisible();
  });

  test('should persist registration across browser restart', async ({ browser }) => {
    // Test account persistence — đăng ký trên browser A, đăng nhập trên browser B
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('https://staging.example.com/register');
    await pageA.fill('[data-testid="email-input"]', 'persist@test.com');
    await pageA.fill('[data-testid="password-input"]', 'Password123!');
    await pageA.click('[data-testid="register-button"]');
    await contextA.storageState({ path: 'state.json' }); // lưu session

    const contextB = await browser.newContext({ storageState: 'state.json' });
    const pageB = await contextB.newPage();
    await pageB.goto('https://staging.example.com/dashboard');
    await expect(pageB.getByText('persist@test.com')).toBeVisible();
  });
});
```

**Playwright vs Cypress so sánh:**

| Đặc điểm | Playwright | Cypress |
|----------|-----------|---------|
| Browser support | Chromium, Firefox, WebKit (real multi-browser) | Chromium-based (Chrome, Edge, Firefox experimental) |
| Multi-tab testing | ✅ Native | ❌ Cần plugin |
| Auto-wait | ✅ Smart retries tự động, không cần `.wait()` thủ công | ⚠️ Tự động retry trong một số trường hợp |
| Network mocking | ✅ Route interception, fixture files | ✅ Interception qua Cypress intercept |
| Parallel execution | ✅ Multi-process native, chạy song song tự nhiên | ⚠️ Cần Cypress Dashboard cho parallel |
| Test isolation | ✅ Mỗi test có context riêng, không share state | ⚠️ Dễ bị state leak giữa tests |
| Learning curve | Trung bình (API tương tự Puppeteer) | Thấp hơn (jQuery-style DOM manipulation) |
| Mã nguồn | MIT, Microsoft maintain | MIT, Cypress.io maintain |
| Thực tế ngành | Tăng nhanh, được Airbnb, Google, Netflix dùng | Ổn định, cộng đồng lớn, plugin phong phú |

> 💡 **Mẹo viết E2E bền:** Dùng `data-testid` attributes thay vì CSS selector nhạy cảm layout. Mỗi test nên tự setup teardown (seed data, cleanup), không phụ thuộc nhau.

---

## 🔄 TDD (Test-Driven Development)

**Mô tả:** Viết **test trước** → Viết code để pass test → Refactor. TDD không chỉ là "viết test sớm" — nó là **phương pháp thiết kế**: test đóng vai trò **specification** và **constraint** đồng thời.

**TDD cycle — Red → Green → Refactor:**

```
┌─────────────────────────────────────────────────────────────┐
│                     TDD CYCLE                               │
│                                                             │
│   1. 🔴 RED                                                 │
│      - Viết test case cho behavior MỚI                      │
│      - Chạy test → chắc chắn FAIL                           │
│      - Nếu PASS → test đó đã có sẵn, viết test khác          │
│                                                             │
│   2. 🟢 GREEN                                               │
│      - Viết code TỐI THIỂU để test pass                     │
│      - Không thêm tính năng khác                             │
│      - Chấp nhận code "xấu" miễn pass                         │
│                                                             │
│   3. 🔵 REFACTOR                                            │
│      - Làm sạch code (rename, extract, simplify)            │
│      - Đảm bảo TẤT CẢ test VẪN pass                          │
│      - Không thay đổi behavior — chỉ cải thiện structure     │
│                                                             │
│   Lặp lại cho từng behavior nhỏ nhất                        │
└─────────────────────────────────────────────────────────────┘
```

**Ví dụ chi tiết — TDD cho function tính discount:**

```typescript
// ===== STEP 1: RED — viết test TRƯỚC khi có implementation =====
import { describe, it, expect } from 'vitest';
import { calculateDiscount } from './discount';

describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over $100', () => {
    // Test này sẽ FAIL vì calculateDiscount chưa tồn tại
    expect(calculateDiscount(150)).toBe(135);
  });

  it('should not apply discount for orders under $100', () => {
    expect(calculateDiscount(50)).toBe(50);
  });

  it('should apply discount exactly at threshold ($100 → 10% off)', () => {
    // Boundary case
    expect(calculateDiscount(100)).toBe(90);
  });

  it('should not break on zero amount', () => {
    expect(calculateDiscount(0)).toBe(0);
  });
});

// ===== STEP 2: GREEN — minimum code to make tests pass =====
function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  return amount;
}

// ===== STEP 3: REFACTOR — improve readability, keep tests green =====
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

function calculateDiscount(amount: number): number {
  return amount >= DISCOUNT_THRESHOLD
    ? amount * (1 - DISCOUNT_RATE)
    : amount;
}
```

**TDD mang lại design gì?** (khác biệt so với viết test sau)

- Hàm ngắn, 1 trách nhiệm — vì mỗi test chỉ test 1 behavior
- Dependency injection tự nhiên — vì bạn phải inject mock để test
- Interface rõ ràng — vì bạn phải định nghĩa contract trước khi implement
- **Không bao giờ có "dead code"** — mọi line code đều được test bao phủ

**Nhược điểm TDD cần thật lòng nhìn nhận:**
- **Learning curve 3–6 tháng** để thành thạo — tuần đầu viết code chậm hơn 40–60%
- **Không phù hợp exploration/prototype** — khi domain chưa rõ, test-driven writing là waste
- **Maintenance cost cao** — mỗi lần đổi contract, hàng chục test phải update
- **False sense of security** — test pass ≠ không có bug (chỉ bảo vệ những gì bạn viết test)

> 💡 **Mẹo thực hành:** Đừng TDD toàn bộ codebase cùng lúc. Bắt đầu với **business logic layer** (pure function, không side effect) — phần dễ test nhất. UI và DB integration để sau.

---

## 🎭 BDD (Behavior-Driven Development)

**Mô tả:** Viết test theo **câu chuyện hành vi**, dễ đọc cho cả dev, QA, và business stakeholder. BDD mở rộng TDD bằng ngôn ngữ chung: **Gherkin** (Given/When/Then).

**Gherkin syntax** — ngôn ngữ chung giữa dev, QA, product:

```gherkin
# feature file: user_login.feature
Feature: User Login
  As a registered user
  I want to login with email and password
  So that I can access my account features

  Background:
    Given a user "john@example.com" exists with password "Password123!"

  Scenario: Successful login with valid credentials
    When I enter "john@example.com" as email
    And I enter "Password123!" as password
    And I click the "Login" button
    Then I should be redirected to the dashboard
    And I should see "Welcome, John!"

  Scenario: Login with invalid password
    When I enter "john@example.com" as email
    And I enter "WrongPassword" as password
    And I click the "Login" button
    Then I should see "Invalid credentials"
    And I should remain on the login page

  Scenario: Login with non-existent email
    When I enter "nobody@example.com" as email
    And I enter "AnyPassword" as password
    And I click the "Login" button
    Then I should see "Invalid credentials"
    And I should remain on the login page
```

**BDD vs TDD — phân biệt rõ:**

| | TDD | BDD |
|---|---|---|
| **Target audience** | Developer | Dev + QA + Business |
| **Language** | Code (TypeScript/JS) | Gherkin (Given/When/Then) |
| **Granularity** | Unit/function level | Feature/scenario level |
| **Khi nào viết** | Trước khi implement function | Trước khi implement feature |
| **Độ chi tiết** | Cao — test từng edge case | Thấp hơn — tập trung vào behavior |
| **Công cụ** | Jest, Vitest, Mocha | Cucumber, Behave, Gherkin |
| **Ví dụ assertion** | `expect(add(2,3)).toBe(5)` | `Then I should see "5"` |

**Workflow BDD thực tế:**
1. **Khởi tạo:** Dev + PO + QA ngồi together, viết scenario Gherkin
2. **Code step definitions:** Developer viết mapping giữa Gherkin step và code thực thi
3. **Chạy test:** Cucumber runner chạy tất cả scenario, báo pass/fail
4. **Iteration:** Thêm scenario mới mỗi khi có requirement mới

```typescript
// Step definitions — bridge between Gherkin and code
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

Given('a user {string} exists with password {string}', async (email: string, password: string) => {
  await db.users.create({ email, password: hash(password) });
});

When('I enter {string} as email', async (email: string) => {
  await page.fill('[data-testid="email-input"]', email);
});

When('I enter {string} as password', async (password: string) => {
  await page.fill('[data-testid="password-input"]', password);
});

When('I click the {string} button', async (buttonText: string) => {
  await page.click(`button:has-text("${buttonText}")`);
});

Then('I should be redirected to the {string}', async (url: string) => {
  await expect(page).toHaveURL(url);
});

Then('I should see {string}', async (text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});
```

> 💡 **Lưu ý quan trọng:** BDD không thay thế TDD — chúng bổ sung nhau. Dùng BDD cho **feature-level behavior** (giao tiếp với stakeholder), dùng TDD cho **unit-level implementation** (đảm bảo code đúng).

---

## 🧬 Mutation Testing

**Mô tả:** Kỹ thuật **đánh giá chất lượng test suite** bằng cách tự động **thay đổi (mutate)** code rồi kiểm tra test có **phát hiện** sự thay đổi đó không. Khác với coverage — mutation testing hỏi "test có đủ nhạy không?" chứ không phải "code có được chạy qua không?"

**Tại sao mutation testing quan trọng?**

- **Coverage 100% ≠ chất lượng cao** — bạn có thể có 100% coverage với test chỉ check `expect(true).toBe(true)` ở mọi branch
- **Mutation score đo khả năng phát hiện lỗi THẬT** của test suite
- Mỗi mutant đại diện cho **một kiểu lỗi thực tế** mà developer có thể vô tình introduce

```typescript
// Original code
function isEven(n: number): boolean {
  return n % 2 === 0;
}

// Các mutant thường gặp:
// Mutant 1: === becomes !== (logic inversion)
function isEven_MUTANT_1(n: number): boolean {
  return n % 2 !== 0; // ❌ Logic bị đảo ngược!
}

// Mutant 2: % becomes * (operator change)
function isEven_MUTANT_2(n: number): boolean {
  return n * 2 === 0; // ❌ Hoàn toàn sai logic
}

// Mutant 3: 0 becomes 1 (boundary shift)
function isEven_MUTANT_3(n: number): boolean {
  return n % 2 === 1; // ❌ Chỉ chấp nhận số lẻ
}

// Mutant 4: remove the function body (kill signal)
function isEven_MUTANT_4(n: number): boolean {
  return true; // ❌ Luôn return true
}

// Nếu test catch được mutant → test ĐỦ MẠNH
// Nếu test không catch được mutant → test YẾU (blind spot)
```

**Các loại mutation phổ biến:**

| Category | Ví dụ | Epsilon | Description |
|----------|-------|---------|-------------|
| **Boolean** | `===` → `!==`, `&&` → `||` | Cao | Đảo logic, thường do typo |
| **Arithmetic** | `+` → `-`, `%` → `/` | Trung bình | Sai toán học |
| **Boundary** | `0` → `1`, `<` → `<=` | Cao | Lỗi off-by-one |
| **String** | `"true"` → `"false"`, `""` → `"x"` | Thấp | Ít gặp trong thực tế |
| **Return value** | `return x` → `return 0`, `return null` | Cao | Return sai giá trị |

**Công cụ chính:**

| Công cụ | Ngôn ngữ | Mutation score target | Tốc độ |
|---------|----------|----------------------|--------|
| **Stryker** | JS/TS | 80%+ | Trung bình (1–5 phút/project) |
| **PIT** | Java | 80%+ | Nhanh (native bytecode) |
| **Mutant** | Python | 70%+ | Chậm (AST manipulation) |
| **Cargo-mutators** | Rust | 75%+ | Phụ thuộc crate |

**Interpretation mutation score:**
- **90%+** = test suite rất mạnh, blind spots rất ít
- **80–90%** = tốt, nên hướng tới
- **60–80%** = khá, cần cải thiện edge cases
- **< 60%** = test weak, nhiều blind spots chưa được bảo vệ

> ⚠️ **Giới hạn:** Mutation testing làm chậm CI pipeline đáng kể (2–10x). Nên chạy **định kỳ** (nightly), không phải mỗi commit.

---

## 📊 Testing Trophy (thay vì Pyramid)

Mike Cohn đề xuất **Testing Trophy** như cách nhìn hiện đại hơn:

```
            ┌──────────┐
            │  API     │  ← contracts giữa các services
            │  Tests   │
     ┌──────┴──────┐
     │ Component   │  ← kiểm tra UI component độc lập (React Testing Library)
     │  Tests      │
     └──────┬──────┘
  ┌──────────┴──────────┐
  │   Unit Tests        │  ← foundation, fast, cheap
  └─────────────────────┘
```

> 💡 **Xu hướng hiện đại:** Giảm E2E, tăng **component tests** và **contract tests** — cân bằng giữa tốc độ và độ tin cậy.

---

## 🎯 Khi nào dùng cái nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Test function/method đơn lẻ, pure logic | ✅ Unit Testing | Chạy trong micro-giây, cách ly hoàn toàn, feedback nhanh nhất |
| Test interaction giữa các module (service ↔ repo) | ✅ Integration Testing | Unit test không kiểm tra được ORM mapping, query chaining, transaction boundary |
| Test full user flow trên browser thật | ✅ E2E Testing | Chỉ E2E mới phát hiện được vấn đề routing, CORS, cookie, browser compatibility |
| Team muốn viết test trước code để design rõ hơn | ✅ TDD | Test-driven design tự nhiên emerge interface và boundary |
| Stakeholder muốn đọc được test, QA muốn tham gia spec | ✅ BDD | Gherkin là ngôn ngữ chung, PO có thể viết/đọc scenario |
| Đánh giá chất lượng test suite hiện có | ✅ Mutation Testing | Coverage báo "code đã chạy", mutation score báo "test đủ nhạy để bắt lỗi" |
| Test contract giữa microservices | ✅ Contract Testing (Pact) | Phát hiện breaking change giữa service A và B mà không cần deploy cả hệ |
| Kiểm tra performance/throughput | ⚠️ Load Testing (khác topic) | Không phải functional test — dùng k6, Locust, JMeter |
| Kiểm tra UI accessibility | ⚠️ A11y Testing (khác topic) | Dùng axe-core, Lighthouse CI — riêng với functional test |

---

## 🔧 Tools phổ biến

| Tool | Loại | Ngôn ngữ | Điểm mạnh | Time/test |
|------|------|----------|-----------|-----------|
| **Jest** | Unit/Integration | JS/TS | Fast, built-in mock, snapshot, watch mode | ~1ms |
| **Vitest** | Unit/Integration | JS/TS | Cực nhanh (esbuild), Vite-native, close đến Jest API | ~0.5ms |
| **Playwright** | E2E | JS/TS | Multi-browser native, auto-wait, trace UI | ~5–30s |
| **Cypress** | E2E | JS/TS | Real-time reload, DOM inspection, recording | ~10–60s |
| **Supertest** | Integration | JS/TS | HTTP API testing đơn giản, chainable | ~50–200ms |
| **TestContainers** | Integration | Nhiều ngôn ngữ | Real DB trong container, closest to prod | ~2–10s/setup |
| **Stryker** | Mutation | JS/TS | Đánh giá chất lượng test suite thực sự | 1–10 phút |
| **Cucumber** | BDD | Nhiều ngôn ngữ | Gherkin syntax, business-readable | ~5–60s |
| **Pact** | Contract | JS/Java/etc | Consumer-driven contract testing | ~1–5s |
| **axe-core** | A11y | JS | WCAG automated testing, integrates CI | ~1–5s |

---

## ✅ Best Practices

| Practice | Giải thích | Hậu quả nếu bỏ qua |
|----------|------------|---------------------|
| **AAA Pattern** | Arrange → Act → Assert — 3 bước rõ ràng trong mỗi test | Test đọc khó, khó debug khi fail |
| **One assertion per test** | Mỗi test chỉ kiểm tra 1 điều | Khi fail, không biết nguyên nhân thật |
| **Descriptive names** | `it("should reject negative quantity")` thay vì `it("test1")` | Đọc test như đọc tài liệu; bug khó reproduce |
| **Fast & isolated** | Unit test < 10ms, không phụ thuộc nhau | CI chậm, flaky test, không trust được suite |
| **Mock external deps** | Fake DB, fake API, fake filesystem | Test chậm, phụ thuộc network, flaky |
| **Cover edge cases** | Null, empty, boundary values, overflow | Bug production từ trường hợp chưa nghĩ tới |
| **Don't over-test implementation details** | Test behavior, không test internal state | Refactor phá nhiều test không liên quan |
| **Test the contract, not the implementation** | Đổi implementation được, contract bất biến | Code hard to change vì test quá tightly coupled |
| **Keep test data close to tests** | Seed data inline hoặc fixture files | Test phụ thuộc data trong DB thật → flaky |
| **Use test doubles wisely** | Spy khi cần verify call, stub khi cần return value | Test viết rối, khó đọc, khó maintain |

> 💡 **Mẹo viết test maintainable:** Tên test nên đọc như câu tiếng Việt: `it("should return 404 when user not found")`. Khi đọc danh sách test, phải hiểu được hệ thống hoạt động ra sao.

---

## 🔗 Liên quan

- **5.2 Development Methodologies** — TDD/BDD là practice trong XP, Scrum
- **5.3 Performance Optimization** — Test performance, benchmarking với Stryker/Vitest benchmark
- **5.4 Security Techniques** — Security testing, penetration testing, SAST/DAST
- **5.6 Error Handling Techniques** — Test error paths, edge case coverage
- **01 Architecture** — Testable architecture: dependency injection, separation of concerns

---

## 📚 Tài liệu tham khảo

- 📖 [Test Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- 📖 [xUnit Test Patterns - Gerard Meszaros](https://xunitpatterns.com/)
- 📖 [Growing Object-Oriented Software, Guided by Tests - Steve Freeman & Nat Pryce](https://www.gossamer-threads.com/scripts/goos/)
- 📖 [Stryker Mutator Docs](https://stryker-mutator.io/)
- 📖 [Playwright Docs](https://playwright.dev/)
- 📖 [Testing Trophy - Mike Cohn](https://www.mountaingoatsoftware.com/articles/the-testing-trophy)
- 📖 [The Art of Unit Testing - Roy Osherove](https://www.amazon.com/Art-Unit-Testing-2nd-Roy/dp/1617292552)

---

## ⏭️ Bài tiếp theo

→ [5.2 Development Methodologies](../5.2-development-methodologies/README.md)
