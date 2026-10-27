# 🔬 5.1.4 Test-Driven Development (TDD)

> **TDD (Test-Driven Development)** là quy trình viết **test trước** → viết code tối thiểu để pass test → refactor. Chu kỳ Red → Green → Refactor lặp lại suốt quá trình phát triển.

```
❌ VẤN ĐỀ: Viết code trước rồi mới test
Bước 1: Viết hàm tính discount (có thể có bug)
Bước 2: Viết test rồi mới phát hiện bug
Bước 3: Sửa code → tạo bug mới
→ Code không đảm bảo, test thiếu coverage

✅ GIẢI PHÁP: TDD Red → Green → Refactor
Bước 1: 🔴 RED   — Viết test (sẽ fail vì chưa có code)
Bước 2: 🟢 GREEN — Viết code tối thiểu để test pass
Bước 3: 🔵 REFACTOR — Làm sạch code, vẫn pass test
→ Luôn có test bao phủ, code sạch sẽ
```

---

## 🎯 Vấn Đề

Phát triển không có TDD thường gặp:
- **Bug ẩn**: Code chạy được nhưng có logic sai
- **Không dám refactor**: Sợ hỏng vì không có test bao phủ
- **Test sau cùng**: Đội thời gian, thường bị bỏ qua
- **Coverage thấp**: Chỉ test happy path

```
TDD CYCLE
┌─────────┐     ┌─────────┐     ┌─────────┐
│   RED   │ ──> │  GREEN  │ ──> │REFACTOR │
│ Viết    │     │ Code    │     │ Làm     │
│ test    │     │ tối     │     │ sạch    │
│ (fail)  │     │ thiểu    │     │ mà pass │
└─────────┘     └─────────┘     └─────────┘
     ▲                                     │
     └────────────── Loop ─────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────
// ❌ BAD: Viết code trước, không có test
// ─────────────────────────────────────────────
function calculateDiscount(amount: number): number {
  // Logic phức tạp, khó đọc, nhiều bug tiềm ẩn
  if (amount > 100) return amount * 0.9;
  if (amount > 50) return amount * 0.95;
  return amount;
}
// ← Không có test bao phủ

// ─────────────────────────────────────────────
// ✅ GOOD: TDD — Red → Green → Refactor
// ─────────────────────────────────────────────

// STEP 1: RED — Viết test trước (sẽ fail)
describe('calculateDiscount (TDD)', () => {
  it('should apply 10% discount for orders over $100', () => {
    expect(calculateDiscount(150)).toBe(135);
  });

  it('should apply 5% discount for orders over $50', () => {
    expect(calculateDiscount(80)).toBe(76);
  });

  it('should return full price for orders under $50', () => {
    expect(calculateDiscount(30)).toBe(30);
  });
});

// STEP 2: GREEN — Viết code tối thiểu để pass
function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  if (amount > 50) return amount * 0.95;
  return amount;
}

// STEP 3: REFACTOR — Cải thiện readability
const DISCOUNT_Tiers = [
  { min: 100, rate: 0.1 },
  { min: 50, rate: 0.05 },
] as const;

function calculateDiscount(amount: number): number {
  const tier = DISCOUNT_Tiers.find((t) => amount > t.min);
  const rate = tier ? tier.rate : 0;
  return amount * (1 - rate);
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **Thiết kế tốt hơn** | Viết test trước giúp nghĩ rõ về API design |
| 🛡️ **Refactor an toàn** | Test suite bảo vệ khỏi regression |
| ✅ **Coverage cao** | Luôn có test cho mọi feature |
| 📝 **Documentation** | Test đọc được như tài liệu đặc tả |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Test over-engineering** | Chỉ test public interface, không test implementation |
| **Test phức tạp khó đọc** | Dùng AAA pattern (Arrange-Act-Assert) |
| **Khó TDD với legacy code** | Bắt đầu với unit test đơn giản trước |
| **TDD quá chậm** | Áp dụng cho business logic quan trọng, không phải UI trivial |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Business logic phức tạp | ✅ Rất phù hợp |
| Cần refactor code cũ | ✅ TDD giúp an toàn |
| Team mới bắt đầu | ✅ Dễ theo dõi tiến độ |
| UI prototyping nhanh | ⚠️ Không phù hợp (vội vàng) |
| Script một lần dùng | ⚠️ Không cần thiết |

---

## 🔗 Liên quan

- **5.1.1 Unit Testing** — Công cụ chính của TDD
- **5.1.5 BDD** — Mở rộng TDD sang business-readable
- **5.1.6 Mutation Testing** — Đánh giá chất lượng test
- **5.2.3 XP** — TDD là one of core practices

---

## 📚 Tài liệu tham khảo

- 📖 [Test-Driven Development - Kent Beck](https://en.wikipedia.org/wiki/Test-driven_development)
- 📖 [Red-Green-Refactor](https://developers.redhat.com/blog/2019/07/08/tdd-red-green-refactor)
- 📖 [Vitest Docs](https://vitest.dev/)

---

## ⏭️ Bài tiếp theo

→ [5.1.5 Behavior-Driven Development](../5.1.5-bdd/README.md)
