# 🧪 Lớp 7: Testing & Quality Assurance (Kiểm Thử & Đảm Bảo Chất Lượng)

> **Testing** là quá trình **kiểm chứng** rằng phần mềm hoạt động đúng như mong đợi,
> phát hiện lỗi sớm, và đảm bảo chất lượng sản phẩm trong suốt vòng đời phát triển.

---

## 📑 Mục Lục

- [🧪 Lớp 7: Testing \& Quality Assurance (Kiểm Thử \& Đảm Bảo Chất Lượng)](#-lớp-7-testing--quality-assurance-kiểm-thử--đảm-bảo-chất-lượng)
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
  - [9. Mocking, Stubbing \& Faking](#9-mocking-stubbing--faking)
    - [So Sánh](#so-sánh)
    - [Ví Dụ](#ví-dụ)
  - [10. Testing Best Practices](#10-testing-best-practices)
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

| Thế Giới Thực | Trong Lập Trình |
|---|---|
| Kiểm tra an toàn xe trước khi xuất xưởng | Unit test kiểm tra từng function |
| Thử nghiệm thuốc qua nhiều giai đoạn (Phase 1→4) | Testing pyramid (Unit → Integration → E2E) |
| Kiểm định chất lượng sản phẩm (QC) | Automated test suite chạy trên CI/CD |
| Diễn tập phòng cháy chữa cháy | Chaos testing / Disaster recovery testing |

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

| Lợi ích | Mô tả |
|---|---|
| 🐛 Phát hiện bug sớm | Giảm chi phí sửa lỗi |
| 🔄 Refactor tự tin | Test là "lưới an toàn" khi thay đổi code |
| 📖 Documentation sống | Test mô tả behavior của hệ thống |
| 🚀 Deploy tự tin | Automated tests trong CI/CD pipeline |
| 💰 Giảm chi phí bảo trì | Ít regression bugs hơn |

---

## 3. Phân Loại Testing

### Theo Phương Pháp

| Loại | Mô tả | Ví dụ |
|---|---|---|
| **Manual Testing** | Con người thực hiện test thủ công | Exploratory testing, Usability testing |
| **Automated Testing** | Máy thực hiện test tự động | Unit tests, Integration tests, E2E tests |

### Theo Mức Độ Hiểu Biết

| Loại | Mô tả |
|---|---|
| **White-box Testing** | Tester biết code bên trong, test dựa trên logic nội bộ |
| **Black-box Testing** | Tester không biết code, test dựa trên input/output |
| **Grey-box Testing** | Kết hợp cả hai: biết một phần kiến trúc |

### Theo Mục Đích

| Loại | Mô tả |
|---|---|
| **Functional Testing** | Kiểm tra chức năng có đúng yêu cầu không |
| **Non-functional Testing** | Kiểm tra hiệu năng, bảo mật, khả năng mở rộng |
| **Regression Testing** | Đảm bảo thay đổi mới không phá vỡ tính năng cũ |
| **Smoke Testing** | Kiểm tra nhanh các chức năng cốt lõi |
| **Sanity Testing** | Kiểm tra có hợp lý không sau khi sửa bug |

---

## 4. Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲          ← Ít nhất, chậm nhất, đắt nhất
                 ╱ Tests╲
                ╱────────╲
               ╱Integration╲     ← Vừa phải
              ╱    Tests     ╲
             ╱────────────────╲
            ╱    Unit Tests    ╲  ← Nhiều nhất, nhanh nhất, rẻ nhất
           ╱────────────────────╲
```

| Tầng | Số lượng | Tốc độ | Chi phí | Scope |
|---|---|---|---|---|
| **Unit Tests** | ~70% | ⚡ Rất nhanh (ms) | 💲 Rẻ | 1 function/class |
| **Integration Tests** | ~20% | 🚗 Trung bình (s) | 💲💲 Vừa | Nhiều module |
| **E2E Tests** | ~10% | 🐢 Chậm (min) | 💲💲💲 Đắt | Toàn hệ thống |

---

## 5. Các Loại Test Chi Tiết

### 5.1 Unit Test

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

| Loại | Mô tả |
|---|---|
| **Penetration Testing** | Mô phỏng tấn công để tìm lỗ hổng |
| **SAST** (Static Analysis) | Phân tích source code tìm lỗ hổng |
| **DAST** (Dynamic Analysis) | Test ứng dụng đang chạy |
| **Dependency Scanning** | Kiểm tra thư viện có lỗ hổng |

---

## 6. Test-Driven Development (TDD)

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

| Mức Coverage | Đánh giá |
|---|---|
| < 50% | ❌ Rất thấp, nhiều rủi ro |
| 50-70% | ⚠️ Chấp nhận được cho prototype |
| 70-85% | ✅ Tốt cho hầu hết dự án |
| 85-95% | 🎯 Rất tốt |
| > 95% | 🤔 Cân nhắc: có đang test quá nhiều trivial code? |

---

## 9. Mocking, Stubbing & Faking

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

| Mục đích | Công cụ |
|---|---|
| Performance Testing | JMeter, k6, Locust, Gatling |
| API Testing | Postman, REST Assured, httpx |
| Code Coverage | Istanbul (JS), coverage.py, JaCoCo |
| Mutation Testing | Stryker (JS), mutmut (Python), PIT (Java) |
| Contract Testing | Pact, Spring Cloud Contract |

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

---

## 13. Tài Liệu Tham Khảo

| Tài liệu | Tác giả |
|---|---|
| *Test-Driven Development: By Example* | Kent Beck |
| *Growing Object-Oriented Software, Guided by Tests* | Steve Freeman, Nat Pryce |
| *The Art of Unit Testing* | Roy Osherove |
| *xUnit Test Patterns* | Gerard Meszaros |
| *Working Effectively with Legacy Code* | Michael Feathers |

---

> **"Testing shows the presence, not the absence of bugs."** — Edsger W. Dijkstra

> **"If you don't like testing your product, most likely your customers won't like to test it either."** — Anonymous