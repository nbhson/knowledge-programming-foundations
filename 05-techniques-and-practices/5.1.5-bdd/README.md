# 🔬 5.1.5 Behavior-Driven Development (BDD)

> **BDD (Behavior-Driven Development)** là phương pháp viết test theo **ngôn ngữ business** (Gherkin: Given/When/Then), giúp dev và stakeholder cùng đọc hiểu được.

```
❌ VẤN ĐỀ: Test chỉ dev mới đọc được
it('shouldReturnExpectedValue', () => {
  expect(service.calculate(100, 0.1)).toBe(90);
});
→ PO không hiểu test này nói gì

✅ GIẢI PHÁP: BDD với Gherkin
Feature: Calculate Discount
  As a customer
  I want to get 10% discount on orders over $100
  So that I can save money

  Scenario: Order above $100 gets 10% off
    Given I have items totaling $150
    When I apply a discount
    Then I should pay $135
→ PO và dev đều hiểu!
```

---

## 🎯 Vấn Đề

Unit test truyền thống khó chia sẻ với business:
- **Kỹ thuật quá mức**: `expect(service.calculate(100, 0.1)).toBe(90)`
- **PO không đọc được**: Không hiểu test mô tả behavior gì
- **Spec thiếu rõ ràng**: Yêu cầu business viết thành câu chuyện
- **Communication gap**: Dev và PO nói khác ngôn ngữ

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Test chỉ dev đọc được
// ─────────────────────────────────────────────
describe('discount', () => {
  it('test1', () => {
    expect(calculateDiscount(150)).toBe(135);
  });
  it('test2', () => {
    expect(calculateDiscount(50)).toBe(50);
  });
});

// ─────────────────────────────────────────────
// ✅ GOOD: BDD với Gherkin feature file
// ─────────────────────────────────────────────
/*
# feature file: calculate_discount.feature

Feature: Discount Calculation
  As a customer
  I want to get discount based on order amount
  So that I can save money on purchases

  Scenario: Order over $100 gets 10% discount
    Given I have items totaling $150
    When I apply discount
    Then I should pay $135

  Scenario: Order under $50 gets no discount
    Given I have items totaling $30
    When I apply discount
    Then I should pay $30

  Scenario: Order between $50 and $100 gets 5% discount
    Given I have items totaling $80
    When I apply discount
    Then I should pay $76
*/

// Step definitions (bind Gherkin to code)
import { describe, it, expect } from 'vitest';

let orderTotal = 0;
let expectedPayment = 0;

function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  if (amount > 50) return amount * 0.95;
  return amount;
}

describe('BDD: Discount Calculation', () => {
  it('Scenario: Order over $100 gets 10% discount', () => {
    // Given
    orderTotal = 150;
    // When
    expectedPayment = calculateDiscount(orderTotal);
    // Then
    expect(expectedPayment).toBe(135);
  });

  it('Scenario: Order under $50 gets no discount', () => {
    orderTotal = 30;
    expectedPayment = calculateDiscount(orderTotal);
    expect(expectedPayment).toBe(30);
  });
});
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 💬 **Business-readable** | PO đọc được test, xác nhận đúng yêu cầu |
| 🤝 **Communication** | Dev và PO cùng ngôn ngữ |
| 📝 **Living documentation** | Test file = tài liệu đặc tả sống |
| ✅ **Clear scenarios** | Mỗi scenario mô tả 1 behavior rõ ràng |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Feature file quá dài** | Chia nhỏ thành nhiều feature file |
| **Binding phức tạp** | Dùng framework hỗ trợ (Cucumber, Behave) |
| **Không thay thế unit test** | BDD bổ sung, không thay unit test |
| **Maintenance overhead** | Chỉ viết cho critical business flows |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Cần PO đọc & xác nhận test | ✅ BDD |
| Business logic phức tạp cần spec rõ | ✅ BDD |
| Team muốn communication tốt hơn | ✅ BDD |
| Unit test đơn giản | ⚠️ Không cần BDD |
| Quick prototype | ⚠️ Không cần overhead |

---

## 🔗 Liên quan

- **5.1.4 TDD** — Nền tảng, BDD mở rộng từ TDD
- **5.1.1 Unit Testing** — BDD vẫn dùng unit test làm base
- **5.1.6 Mutation Testing** — Đánh giá chất lượng test suite

---

## 📚 Tài liệu tham khảo

- 📖 [Cucumber Documentation](https://cucumber.io/docs/bdd/)
- 📖 [Gherkin Reference](https://cucumber.io/docs/gherkin/reference/)
- 📖 [BDD vs TDD - Martin Fowler](https://martinfowler.com/bliki/BehavioralDrivenDevelopment.html)

---

## ⏭️ Bài tiếp theo

→ [5.1.6 Mutation Testing](../5.1.6-mutation-testing/README.md)
