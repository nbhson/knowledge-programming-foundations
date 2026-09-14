# 🧪 Lớp 7: Testing & Quality Assurance (Kiểm Thử & Đảm Bảo Chất Lượng)

> **Testing** là quá trình **kiểm chứng** rằng phần mềm hoạt động đúng như mong đợi,
> phát hiện lỗi sớm, và đảm bảo chất lượng sản phẩm trong suốt vòng đời phát triển.

---

## 📚 Mục lục

| # | Chủ đề | Giải thích | Link |
|---|--------|-----------|------|
| 7.1 | Unit Testing | Kiểm thử từng đơn vị nhỏ nhất (function/method) | [7.1-unit-testing](7.1-unit-testing/README.md) |
| 7.2 | Integration Testing | Kiểm thử nhiều module hoạt động cùng nhau | [7.2-integration-testing](7.2-integration-testing/README.md) |
| 7.3 | E2E Testing | Mô phỏng toàn bộ luồng người dùng từ UI đến DB | [7.3-e2e-testing](7.3-e2e-testing/README.md) |
| 7.4 | TDD | Viết test trước, Red → Green → Refactor | [7.4-tdd](7.4-tdd/README.md) |
| 7.5 | BDD | Mô tả hành vi bằng Gherkin (Given/When/Then) | [7.5-bdd](7.5-bdd/README.md) |
| 7.6 | Performance Testing | Đo latency, load, stress của hệ thống | [7.6-performance-testing](7.6-performance-testing/README.md) |
| 7.7 | Mocking & Stubbing | Giả lập dependency để test cô lập | [7.7-mocking-stubbing](7.7-mocking-stubbing/README.md) |

---

## 📑 Mục Lục

- [🧪 Lớp 7: Testing & Quality Assurance (Kiểm Thử & Đảm Bảo Chất Lượng)](#-lớp-7-testing--quality-assurance-kiểm-thử--đảm-bảo-chất-lượng)
  - [📑 Mục Lục](#-mục-lục)
  - [1. Testing Là Gì?](#1-testing-là-gì)
    - [🏠 Ví Dụ Thực Tế](#-ví-dụ-thực-tế)
  - [2. Tại Sao Testing Quan Trọng?](#2-tại-sao-testing-quan-trọng)
  - [3. Phân Loại Testing](#3-phân-loại-testing)
    - [Theo Phương Pháp](#theo-phương-pháp)
    - [Theo Mức Độ Hiểu Biết](#theo-mức-độ-hiểu-biết)
    - [Theo Mục Đích](#theo-mục-đích)
  - [4. Testing Pyramid](#4-testing-pyramid)
  - [5. Các Loại Test Chi Tiết](#5-các-loại-test-chi-tiết)
    - [5.1 Unit Test](#51-unit-test)
    - [5.2 Integration Test](#52-integration-test)
    - [5.3 End-to-End (E2E) Test](#53-end-to-end-e2e-test)
    - [5.4 Performance Test](#54-performance-test)
    - [5.5 Security Test](#55-security-test)
  - [6. Test-Driven Development (TDD)](#6-test-driven-development-tdd)
    - [Chu Trình Red-Green-Refactor](#chu-trình-red-green-refactor)
    - [Ví Dụ TDD](#ví-dụ-tdd)
  - [7. Behavior-Driven Development (BDD)](#7-behavior-driven-development-bdd)
    - [Format Given-When-Then](#format-given-when-then)
    - [BDD vs TDD](#bdd-vs-tdd)
  - [8. Code Coverage](#8-code-coverage)
  - [9. Mocking, Stubbing & Faking](#9-mocking-stubbing--faking)
    - [So Sánh](#so-sánh)
    - [Ví Dụ](#ví-dụ)
  - [10. Testing Best practices](#10-testing-best-practices)
    - [Nguyên Tắc F.I.R.S.T](#nguyên-tắc-first)
    - [Cấu Trúc AAA (Arrange-Act-Assert)](#cấu-trúc-aaa-arrange-act-assert)
    - [Naming Convention](#naming-convention)
  - [11. Công Cụ Testing Phổ Biến](#11-công-cụ-testing-phổ-biến)
  - [12. Anti-Patterns Trong Testing](#12-anti-patterns-trong-testing)
  - [13. Tài Liệu Tham Khảo](#13-tài-liệu-tham-khảo)

---

## 1. Testing Là Gì?

**Testing** là hoạt động thực thi phần mềm với mục đích **tìm ra lỗi** (bugs/defects) và **xác minh** rằng hệ thống đáp ứng đúng yêu cầu.

### 🏠 Ví Dụ Thực Tế

| Thế Giới Thực | Trong Lập Trình | Giải thích sâu |
|---|---|---|
| Kiểm tra an toàn xe trước khi xuất xưởng | Unit test kiểm tra từng function | Mỗi bộ phận (phanh, động cơ) được test riêng trước khi lắp ráp |
| Thử nghiệm thuốc qua nhiều giai đoạn (Phase 1→4) | Testing pyramid (Unit → Integration → E2E) | Phase 1: an toàn trên tế bào (unit); Phase 3: hiệu quả trên hàng nghìn người (e2e) |
| Kiểm định chất lượng sản phẩm (QC) | Automated test suite chạy trên CI/CD | Phát hiện regression trước khi shipping, không chờ user report |
| Diễn tập phòng cháy chữa cháy | Chaos testing / Disaster recovery testing | Cố ý gây lỗi (kill random pod) để kiểm tra resilience |
| Kiểm tra cửa trước khi bán | Smoke test | "Ứng dụng có khởi động được không?" — chạy trước khi deploy |

> 💡 **Misconception phổ biến:** "Testing làm chậm development." — Ngược lại, **không có test mới làm chậm**. Khi không có test suite, mỗi lần sửa code phải test manual toàn bộ hệ thống. Với 1000 unit tests chạy trong 10 giây, bạn có confidence để refactor mà không sợ break cái gì.

### Testing vs Quality Assurance (QA)

| Aspect | Testing | QA |
|--------|---------|-----|
| Focus | Tìm lỗi trong sản phẩm | Ngăn ngừa lỗi từ quy trình |
| Khi nào | Trong và sau development | Suốt vòng đời project |
| Cách tiếp cận | Reactive (phát hiện bug) | Proactive (cải thiện process) |
| Ví dụ | Chạy test suite, ghi bug report | Code review, định nghĩa standards, training team |

> 📌 **Peter Norvig's insight:** "Testing leads to failure, and failure leads to understanding." — Viết test bắt buộc bạn phải hiểu deeply về code bạn đang viết. Nếu không hiểu cách function hoạt động, bạn không thể viết test cho nó.

---

## 2. Tại Sao Testing Quan Trọng?

```
Chi phí sửa lỗi theo giai đoạn:

Requirement  ████ ($1x)
Design       ████████ ($5x)
Coding       ████████████ ($10x)
Testing      ████████████████████ ($20x)
Production   ████████████████████████████████████████ ($100x)

→ Phát hiện lỗi càng sớm → Chi phí sửa càng thấp!
```

| Lợi ích | Mô tả | Giải thích sâu |
|---|---|---|
| 🐛 Phát hiện bug sớm | Giảm chi phí sửa lỗi | Bug phát hiện ở dev stage ≈ $10; phát hiện ở production ≈ $10,000 (bao gồm incident response, hotfix, loss of trust) |
| 🔄 Refactor tự tin | Test là "lưới an toàn" khi thay đổi code | Bạn có thể tái cấu trúc codebase hoàn toàn mà vẫn biết behavior không đổi — test suite là contract sống |
| 📖 Documentation sống | Test mô tả behavior của hệ thống | Đọc test file ≈ đọc spec. `test_calculateDiscount_withNegativePercent_raisesError()` tự giải thích edge case mà comment không làm được |
| 🚀 Deploy tự tin | Automated tests trong CI/CD pipeline | 1000+ test pass trong 2 phút = tự động approve deploy. Human approval = bottleneck + fatigue errors |
| 💰 Giảm chi phí bảo trì | Ít regression bugs hơn |每 lần release mới không phải test manual again — regression suite đảm bảo cái cũ vẫn hoạt động |
| 👥 Team scaling | Dev mới hiểu system nhanh hơn | Test suite = onboarding document tự động. Clone repo, chạy test, xem cái nào fail → hiểu ngay phần mình cần sửa |
| 📊 Compliance & audit | Chứng minh quality cho khách hàng | Fintech, healthcare cần test coverage report để meet regulatory requirements |

> 📌 **ROI của testing:** Nghiên cứu của NIST (National Institute of Standards and Technology) cho thấy mỗi $1 đầu tư vào testing tiết kiệm được $4-$10 trong chi phí sửa lỗi post-deployment. Với project 2 năm, testing ROI có thể lên đến 500%.

---

## 3. Phân Loại Testing

### Theo Phương Pháp

| Loại | Mô tả | Ví Dụ | Khi nào dùng |
|---|---|---|---|
| **Manual Testing** | Con người thực hiện test thủ công | Exploratory testing, Usability testing, A/B test validation | UX review, one-time validation, exploratory |
| **Automated Testing** | Máy thực hiện test tự động | Unit tests, Integration tests, E2E tests chạy trong CI | Regression suites, performance tests, every build |

**Khi nào manual vẫn cần?** Khi test về UX (looks good?), accessibility (screen reader works?), hoặc exploratory testing để tìm edge cases mà automated test không cover được.

### Theo Mức Độ Hiểu Biết

| Loại | Mô tả | Khi nào dùng |
|---|---|---|
| **White-box Testing** | Tester biết code bên trong, test dựa trên logic nội bộ | Unit tests, code coverage analysis, security audit |
| **Black-box Testing** | Tester không biết code, test dựa trên input/output | E2E tests, QA acceptance testing, user acceptance testing (UAT) |
| **Grey-box Testing** | Kết hợp cả hai: biết một phần kiến trúc | Integration tests — biết DB schema nhưng không test internal logic |

### Theo Mục Đích

| Loại | Mô tả | Ví dụ | Depth |
|---|---|---|---|
| **Functional Testing** | Kiểm tra chức năng có đúng yêu cầu không | "Login với đúng credentials → redirect to dashboard" | Core — phải có |
| **Non-functional Testing** | Kiểm tra hiệu năng, bảo mật, khả năng mở rộng | Load test: "API chịu được 1000 req/s" |重要 — phụ thuộc project |
| **Regression Testing** | Đảm bảo thay đổi mới không phá vỡ tính năng cũ | Chạy toàn bộ test suite trước mỗi release | Bắt buộc cho mọi project |
| **Smoke Testing** | Kiểm tra nhanh các chức năng cốt lõi | "App có khởi động được không?" — chạy trước khi deploy | Bắt buộc cho CI/CD |
| **Sanity Testing** | Kiểm tra có hợp lý không sau khi sửa bug | "Bug fix này có thực sự解决 vấn đề không?" | Sau mỗi bug fix |
| **Boundary Testing** | Test tại ranh giới giá trị | Input max integer, empty string, null, negative numbers | Quan trọng cho input validation |
| **Exploratory Testing** | Tester tự do khám phá, không theo script | QA tester dùng app như user thật | Bổ sung cho automated tests |
| **Load Testing** | Test với tải bình thường | 100 concurrent users, check response time | Pre-launch mandatory |
| **Stress Testing** | Test quá tải để tìm giới hạn | Tăng dần đến khi system crash | Find breaking point |
| **Soak/Endurance Testing** | Test chạy dài hạn (giờ/ngày) | Chạy 24h với 50 users, check memory leak | Important cho long-running services |

---

## 4. Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          ← Ít nhất, chậm nhất, đắt nhất
                 ╱── Tests ──╲
                ╱───────────────╲
               ╱  Integration     ╲    ← Vừa phải
              ╱      Tests         ╲
             ╱────────────────────────╲
            ╱     Unit Tests           ╲  ← Nhiều nhất, nhanh nhất, rẻ nhất
           ╱──────────────────────────────╲
```

| Tầng | Số lượng | Tốc độ | Chi phí | Scope | Khi nào write | Why important |
|---|---|---|---|---|---|---|
| **Unit Tests** | ~70% | ⚡ Rất nhanh (ms) | 💲 Rẻ | 1 function/class | Khi implement logic | Fast feedback, cheap to fix, isolate bugs |
| **Integration Tests** | ~20% | 🚗 Trung bình (s) | 💲💲 Vừa | Nhiều module + DB/API | Khi tích hợp components | Catch integration bugs that unit tests miss |
| **E2E Tests** | ~10% | 🐢 Chậm (min) | 💲💲💲 Đắt | Toàn hệ thống | Cho critical user flows | Verify real user workflows end-to-end |

> 💡 **Testing Ice-Cone Anti-Pattern:** Quá nhiều E2E, không đủ unit tests. Pyramid bị lật ngược. Hệ quả: test suite chậm (giờ thay vì phút), flaky, khó debug. Luôn ưu tiên unit tests trước.

> 📌 **Real-world adjustment:** Nhiều team hiện đại dùng **Test Sphinx** (thêm tầng Contract Tests giữa Unit và E2E) hoặc **Diamond** (thêm API tests). Pyramid là guideline, không phải rule cứng.

### Testing Sphinx (Modern Approach)

```
                    ╱╲
                   ╱BDD╲        ← Few (business-critical paths)
                  ╱───────╲
                 ╱Contract ╲     ← Medium (API contracts between services)
                ╱   Tests    ╲
               ╱────────────────╲
              ╱  Integration      ╲   ← Medium
             ╱      Tests          ╲
            ╱────────────────────────╲
           ╱     Unit Tests           ╲ ← Many
          ╱──────────────────────────────╲
```

**Lý do thêm Contract Tests:** Trong microservice architecture, service A có thể thay đổi API mà không làm service B biết. Contract test đảm bảo both sides agree on the interface.

---

## 5. Các Loại Test Chi Tiết

### 5.1 Unit Test

Xem chi tiết: [7.1 Unit Testing](7.1-unit-testing/README.md)

Kiểm tra **một đơn vị nhỏ nhất** (function, method, class) hoạt động đúng.

```python
# Function cần test
def calculate_discount(price, discount_percent):
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    return price * (1 - discount_percent / 100)

# Unit Tests
import pytest

class TestCalculateDiscount:
    def test_normal_discount(self):
        assert calculate_discount(100, 10) == 90.0

    def test_zero_discount(self):
        assert calculate_discount(100, 0) == 100.0

    def test_full_discount(self):
        assert calculate_discount(100, 100) == 0.0

    def test_negative_discount_raises_error(self):
        with pytest.raises(ValueError):
            calculate_discount(100, -10)

    def test_over_100_discount_raises_error(self):
        with pytest.raises(ValueError):
            calculate_discount(100, 150)
```

### 5.2 Integration Test

Xem chi tiết: [7.2 Integration Testing](7.2-integration-testing/README.md)

Kiểm tra **nhiều module/component** hoạt động cùng nhau đúng cách.

```python
# Integration test: Service + Repository + Database
class TestOrderService:
    def setup_method(self):
        self.db = TestDatabase()  # Test database thật
        self.repo = OrderRepository(self.db)
        self.service = OrderService(self.repo)

    def test_create_order_saves_to_database(self):
        order = self.service.create_order(
            customer_id=1,
            items=[{"product_id": 101, "quantity": 2}]
        )

        # Verify order was saved in DB
        saved_order = self.repo.find_by_id(order.id)
        assert saved_order is not None
        assert saved_order.customer_id == 1
        assert len(saved_order.items) == 1

    def test_create_order_updates_inventory(self):
        initial_stock = self.repo.get_stock(product_id=101)
        self.service.create_order(
            customer_id=1,
            items=[{"product_id": 101, "quantity": 2}]
        )
        updated_stock = self.repo.get_stock(product_id=101)
        assert updated_stock == initial_stock - 2
```

### 5.3 End-to-End (E2E) Test

Xem chi tiết: [7.3 E2E Testing](7.3-e2e-testing/README.md)

Kiểm tra **toàn bộ luồng** từ UI đến database.

```python
# E2E test with Playwright
from playwright.sync_api import sync_playwright

def test_user_can_place_order():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Login
        page.goto("https://shop.example.com/login")
        page.fill("#email", "user@test.com")
        page.fill("#password", "password123")
        page.click("#login-button")

        # 2. Add to cart
        page.goto("https://shop.example.com/products/101")
        page.click("#add-to-cart")

        # 3. Checkout
        page.click("#checkout-button")
        page.fill("#address", "123 Main St")
        page.click("#place-order")

        # 4. Verify
        assert page.text_content("#order-status") == "Order Confirmed"

        browser.close()
```

### 5.4 Performance Test

Xem chi tiết: [7.6 Performance Testing](7.6-performance-testing/README.md)

```
Các loại Performance Testing:

┌─────────────────────────────────────────────────┐
│                                                 │
│  Load Testing     → Test với tải bình thường    │
│  Stress Testing   → Test quá tải để tìm giới hạn│
│  Spike Testing    → Test tăng đột ngột          │
│  Soak Testing     → Test chạy dài hạn (giờ/ngày)│
│  Scalability Test → Test khả năng scale         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.5 Security Test

| Loại | Mô tả | Công cụ phổ biến | Khi nào chạy |
|---|---|---|---|
| **Penetration Testing** | Mô phỏng tấn công để tìm lỗ hổng | Burp Suite, OWASP ZAP | Pre-launch, annually |
| **SAST** (Static Analysis) | Phân tích source code tìm lỗ hổng | SonarQube, Semgrep, ESLint security | Mỗi commit/PR |
| **DAST** (Dynamic Analysis) | Test ứng dụng đang chạy | OWASP ZAP, Acunetix | Pre-production |
| **Dependency Scanning** | Kiểm tra thư viện có lỗ hổng | npm audit, Snyk, Dependabot | Mỗi ngày (CI) |
| **IAST** (Interactive) | Kết hợp SAST + DAST | Veracode, Checkmarx | Pre-production |

> 📌 **Thực tế ngành:** OWASP Top 10 là checklist bắt buộc cho web app security. Mỗi release nên có ít nhất automated SAST scan + dependency check trong CI.

---

## 6. Test-Driven Development (TDD)

Xem chi tiết: [7.4 TDD](7.4-tdd/README.md)

### Chu Trình Red-Green-Refactor

```
    ┌──────────┐
    │  🔴 RED  │ ← Viết test FAIL trước
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ 🟢 GREEN │ ← Viết code tối thiểu để test PASS
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ 🔵 REFACT│ ← Tối ưu code, giữ test PASS
    └────┬─────┘
         │
         └──────→ Lặp lại ↑
```

### Ví Dụ TDD

```python
# Bước 1: 🔴 RED — Viết test trước (test FAIL)
def test_stack_push():
    stack = Stack()
    stack.push(42)
    assert stack.peek() == 42
    assert stack.size() == 1
# → NameError: name 'Stack' is not defined ❌

# Bước 2: 🟢 GREEN — Viết code tối thiểu
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def peek(self):
        return self._items[-1]

    def size(self):
        return len(self._items)
# → Test PASS ✅

# Bước 3: 🔵 REFACTOR — Cải thiện
class Stack:
    def __init__(self):
        self._items: list = []

    def push(self, item) -> None:
        self._items.append(item)

    def peek(self):
        if self.is_empty():
            raise IndexError("peek from empty stack")
        return self._items[-1]

    def size(self) -> int:
        return len(self._items)

    def is_empty(self) -> bool:
        return len(self._items) == 0
# → Test vẫn PASS ✅ + code tốt hơn
```

---

## 7. Behavior-Driven Development (BDD)

Xem chi tiết: [7.5 BDD](7.5-bdd/README.md)

### Format Given-When-Then

```gherkin
Feature: User Login
  Scenario: Successful login with valid credentials
    Given a registered user with email "user@test.com"
    And the user has password "password123"
    When the user logs in with email "user@test.com" and password "password123"
    Then the user should be redirected to the dashboard
    And a welcome message "Hello, User!" should be displayed

  Scenario: Failed login with invalid password
    Given a registered user with email "user@test.com"
    When the user logs in with email "user@test.com" and password "wrong"
    Then an error message "Invalid credentials" should be displayed
    And the user should remain on the login page
```

### BDD vs TDD

| Khía cạnh | TDD | BDD |
|---|---|---|
| Ngôn ngữ | Code (developer) | Tự nhiên (Gherkin) |
| Focus | How (implementation) | What (behavior) |
| Người viết | Developer | Dev + QA + Business |
| Mức độ | Unit/Integration | Acceptance/Feature |

---

## 8. Code Coverage

```
                    Code Coverage Metrics
┌─────────────────────────────────────────────────┐
│  Line Coverage     = Lines executed / Total lines│
│  Branch Coverage   = Branches taken / Total      │
│  Function Coverage = Functions called / Total    │
│  Statement Coverage = Statements exec / Total    │
└─────────────────────────────────────────────────┘

⚠️  100% coverage ≠ Bug-free code!
    Coverage đo lường "code nào đã chạy",
    KHÔNG đo lường "code có chạy ĐÚNG không".
```

| Mức Coverage | Đánh giá | Ghi chú |
|---|---|---|
| < 50% | ❌ Rất thấp, nhiều rủi ro | Chỉ nên chấp nhận cho prototype cực sớm |
| 50-70% | ⚠️ Chấp nhận được cho prototype | Cần cải thiện trước production |
| 70-85% | ✅ Tốt cho hầu hết dự án | Target phổ biến cho startups |
| 85-95% | 🎯 Rất tốt | fintech, healthcare, enterprise |
| > 95% | 🤔 Cân nhắc: có đang test quá nhiều trivial code? | Test boilerplate không có giá trị |

> 💡 **Misconception:** "Coverage cao = code tốt." — Không. Bạn có thể đạt 100% coverage với tests như `expect(add(1,2)).toBe(3)` (trivial) và không test một single edge case thực sự quan trọng. Focus vào **branch coverage** và **meaningful assertions** hơn là line coverage số.

### Coverage Types Deep Dive

| Type | What it measures | Why it matters |
|------|------------------|----------------|
| **Line** | % of lines executed | Easy to understand, but misses logic gaps |
| **Branch** | % of if/else paths taken | Catches missed conditionals (the "and" in "if X and Y") |
| **Function** | % of functions called | Ensures no function is completely untested |
| **Statement** | % of statements executed | Similar to line but more precise with minified code |

> 📌 **Recommendation:** Target **branch coverage > 80%** for critical paths. Branch coverage catches bugs that line coverage misses (e.g., an `else` branch that was never exercised).

---

## 9. Mocking, Stubbing & Faking

Xem chi tiết: [7.7 Mocking & Stubbing](7.7-mocking-stubbing/README.md)

### So Sánh

| Kỹ thuật | Mô tả | Khi nào dùng |
|---|---|---|
| **Mock** | Giả lập object + verify interaction | Kiểm tra function có gọi đúng method không |
| **Stub** | Trả về giá trị cố định | Cần data giả, không cần verify |
| **Fake** | Implementation đơn giản thay thế | In-memory database thay real DB |
| **Spy** | Wrap object thật + ghi lại calls | Giữ behavior thật + verify calls |

### Ví Dụ

```python
from unittest.mock import Mock, patch

# === MOCK ===
def test_order_service_sends_email():
    email_service = Mock()
    order_service = OrderService(email_service=email_service)

    order_service.place_order(order_id=1)

    # Verify: email_service.send() được gọi đúng 1 lần
    email_service.send.assert_called_once_with(
        to="customer@email.com",
        subject="Order Confirmed"
    )

# === STUB ===
def test_get_user_returns_data():
    user_repo = Mock()
    user_repo.find_by_id.return_value = User(id=1, name="John")  # Stub

    service = UserService(user_repo)
    user = service.get_user(1)

    assert user.name == "John"

# === FAKE ===
class FakeUserRepository:
    """In-memory implementation thay thế real database"""
    def __init__(self):
        self._users = {}

    def save(self, user):
        self._users[user.id] = user

    def find_by_id(self, user_id):
        return self._users.get(user_id)

def test_with_fake():
    repo = FakeUserRepository()
    service = UserService(repo)
    service.create_user(name="John")
    assert repo.find_by_id(1).name == "John"
```

---

## 10. Testing Best Practices

### Nguyên Tắc F.I.R.S.T

| Chữ | Nguyên tắc | Mô tả |
|---|---|---|
| **F** | Fast | Test phải chạy nhanh (ms, không phải giây) |
| **I** | Independent | Mỗi test độc lập, không phụ thuộc test khác |
| **R** | Repeatable | Chạy lại luôn cho ra cùng kết quả |
| **S** | Self-validating | Tự động pass/fail, không cần người đọc log |
| **T** | Timely | Viết test kịp thời (trước hoặc cùng lúc với code) |

### Cấu Trúc AAA (Arrange-Act-Assert)

```python
def test_transfer_money():
    # Arrange — Chuẩn bị dữ liệu
    sender = Account(balance=1000)
    receiver = Account(balance=500)

    # Act — Thực hiện hành động
    transfer(sender, receiver, amount=200)

    # Assert — Kiểm tra kết quả
    assert sender.balance == 800
    assert receiver.balance == 700
```

### Naming Convention

```
# ❌ Tên không rõ ràng
def test_1():
def test_calculate():

# ✅ Tên mô tả rõ ràng: Method_Scenario_ExpectedResult
def test_calculate_discount_with_valid_percent_returns_discounted_price():
def test_calculate_discount_with_negative_percent_raises_error():
def test_login_with_expired_token_redirects_to_login_page():
```

---

## 11. Công Cụ Testing Phổ Biến

| Ngôn ngữ | Unit Test | Integration | E2E | Mocking |
|---|---|---|---|---|
| **Python** | pytest, unittest | pytest | Playwright, Selenium | unittest.mock, pytest-mock |
| **JavaScript** | Jest, Vitest | Jest, Supertest | Cypress, Playwright | Jest mocks, Sinon |
| **Java** | JUnit 5, TestNG | Spring Boot Test | Selenium | Mockito, WireMock |
| **Go** | testing (built-in) | testcontainers | Rod | gomock, testify |
| **C#** | xUnit, NUnit | — | Selenium | Moq, NSubstitute |

| Mục đích | Công cụ | Ghi chú |
|---|---|---|
| Performance Testing | JMeter, k6, Locust, Gatling | k6 recommended for JS teams |
| API Testing | Postman, REST Assured, httpx | Postman cho manual, REST Assured cho Java |
| Code Coverage | Istanbul (JS), coverage.py, JaCoCo | Istanbul standard cho JS |
| Mutation Testing | Stryker (JS), mutmut (Python), PIT (Java) | Tests test quality, not just code quality |
| Contract Testing | Pact, Spring Cloud Contract | Essential for microservices |
| Chaos Engineering | Chaos Monkey, LitmusChaos | Test resilience, not just correctness |

---

## 12. Anti-Patterns Trong Testing

| Anti-Pattern | Vấn đề | Giải pháp |
|---|---|---|
| **Flaky Tests** | Test lúc pass lúc fail ngẫu nhiên | Loại bỏ dependency vào time, network, random |
| **Slow Tests** | Test suite chạy quá lâu | Song song hóa, mock external services |
| **Testing Implementation** | Test chi tiết implementation thay vì behavior | Test input/output, không test private methods |
| **God Test** | 1 test quá lớn, test quá nhiều thứ | Tách thành nhiều test nhỏ, focused |
| **No Assertions** | Test không có assert → luôn pass | Mỗi test phải có ít nhất 1 assertion |
| **Copy-Paste Tests** | Duplicate test code | Dùng parameterized tests, fixtures |
| **Ice Cream Cone** | Quá nhiều E2E, ít unit tests | Tuân theo Testing Pyramid |
| **Over-Mocking** | Mock mọi thứ → test không có giá trị | Chỉ mock boundary (external deps) |
| **Hardcoded data** | Data test hardcode cứng nhắc | Dùng factory, fixture, parameterized tests |
| **Assertion Rot** | Tăng dần số assertions trong 1 test | Tách thành nhiều test nhỏ |
| **Integration Test in Unit** | Unit test đang access DB/network | Mock dependencies, keep unit tests pure |

---

## 13. Tài Liệu Tham Khảo

| Tài liệu | Tác giả | Level |
|---|---|---|
| *Test-Driven Development: By Example* | Kent Beck | Beginner |
| *Growing Object-Oriented Software, Guided by Tests* | Steve Freeman, Nat Pryce | Intermediate |
| *The Art of Unit Testing* | Roy Osherove | Intermediate |
| *xUnit Test Patterns* | Gerard Meszaros | Advanced reference |
| *Working Effectively with Legacy Code* | Michael Feathers | Advanced (legacy code) |
| *Secrets of the JavaScript Ninja* | (testing chapters) | JS-specific |

---

> **"Testing shows the presence, not the absence of bugs."** — Edsger W. Dijkstra

> **"If you don't like testing your product, most likely your customers won't like to test it either."** — Anonymous
