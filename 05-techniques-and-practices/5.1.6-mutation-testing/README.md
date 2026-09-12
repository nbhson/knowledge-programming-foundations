# 🔬 5.1.6 Mutation Testing

> **Mutation Testing** là kỹ thuật đánh giá chất lượng test suite bằng cách **tự động thay đổi (mutate)** code rồi kiểm tra test có **phát hiện** sự thay đổi không.

```
❌ VẤN ĐỀ: Test coverage cao ≠ test chất lượng cao
Coverage: 95% → vẫn có thể bỏ sót logic quan trọng
→ Test chạy qua nhưng không phát hiện bug thực sự

✅ GIẢI PHÁP: Mutation Testing
Đưa ra "mutant" (code bị biến đổi) → nếu test vẫn pass
→ Mutant "sống" = test YẾU, không phát hiện được bug
```

---

## 🎯 Vấn Đề

Test coverage cao không đảm bảo test mạnh:
- **False confidence**: Coverage 100% nhưng test không kiểm tra logic đúng/sai
- **Trivial tests**: Test chỉ check null/undefined, không check business logic
- **Same output tests**: Mutant cho cùng output nhưng logic sai

```
MUTATION TESTING PROCESS
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Original │    │  Mutant  │    │   Run    │
│   Code   │───>│ (biến    │───>│  Tests   │
│          │    │  đổi)    │    │          │
└──────────┘    └──────────┘    └──────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              Test FAIL              Test PASS
              (KILLED)               (SURVIVED)
              → Mutant bị phát      → Test yếu,
                hiện                  cần test mới
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: Test weak — không phát hiện mutation
// ─────────────────────────────────────────────
function isEven(n: number): boolean {
  return n % 2 === 0;
}

describe('isEven (weak test)', () => {
  it('should work', () => {
    expect(isEven(4)).toBe(true); // ← Chỉ test 1 case
  });
});

// Mutations không bị phát hiện:
// - === thành !==  → isEven(4) vẫn true (vì không test số lẻ)
// - % thành *      → isEven(4) vẫn true (vì 4*2=8 vẫn even)

// ─────────────────────────────────────────────
// ✅ GOOD: Test strong — phát hiện mutation
// ─────────────────────────────────────────────
function isEven(n: number): boolean {
  return n % 2 === 0;
}

describe('isEven (strong test)', () => {
  it('should return true for even numbers', () => {
    expect(isEven(4)).toBe(true);
  });

  it('should return false for odd numbers', () => {
    expect(isEven(3)).toBe(false); // ← Catch mutant === → !==
  });
});

// ─────────────────────────────────────────────
// ✅ GOOD: Mutation Score concept
// ─────────────────────────────────────────────
interface MutationResult {
  total: number;
  killed: number;
  survived: number;
  score: number; // killed / total * 100
}

function calculateMutationScore(results: MutationResult[]): number {
  const total = results.reduce((sum, r) => sum + r.total, 0);
  const killed = results.reduce((sum, r) => sum + r.killed, 0);
  return total > 0 ? (killed / total) * 100 : 0;
}

const report: MutationResult[] = [
  { total: 10, killed: 8, survived: 2, score: 80 },
  { total: 5,  killed: 5, survived: 0, score: 100 },
];

console.log(`Mutation Score: ${calculateMutationScore(report).toFixed(1)}%`);
// → Mutation Score: 85.7%
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **Đánh giá thực** | Đo chất lượng test, không chỉ coverage |
| 🔍 **Tìm blind spots** | Phát hiện test không check logic đúng/sai |
| 📈 **Cải tiến liên tục** | Mục tiêu: mutation score > 80% |
| 💪 **Test mạnh hơn** | Bắt buộc viết test catch được mutant |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Chậm** | Chạy trên CI, không chạy mỗi lần build |
| **Chi phí cao** | Chỉ chạy cho core business logic |
| **Mutant vô nghĩa** | Bỏ qua等价 mutants (không đổi behavior) |
| **Khó setup** | Dùng tools: Stryker (JS/TS), PIT (Java) |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Core business logic quan trọng | ✅ Rất phù hợp |
| Test suite đã có coverage cao | ✅ Đánh giá chất lượng thực |
| Financial/payments code | ✅ Cần độ tin cậy cao |
| Quick scripts, protypes | ⚠️ Không cần thiết |
| Test coverage < 50% | ⚠️ Ưu tiên viết test trước |

---

## 🔗 Liên quan

- **5.1.1 Unit Testing** — Nền tảng cho mutation testing
- **5.1.4 TDD** — TDD + mutation testing = test suite mạnh
- **5.1.5 BDD** — BDD scenarios cũng có thể mutation test

---

## 📚 Tài liệu tham khảo

- 📖 [Stryker Mutator](https://stryker-mutator.io/)
- 📖 [Mutation Testing - Wikipedia](https://en.wikipedia.org/wiki/Mutation_testing)
- 📖 [Quality vs Coverage](https://blog.christian-streeck.de/2018/08/mutation-testing.html)

---

## ⏭️ Bài tiếp theo

→ [5.2 Development Methodologies](../5.2-development-methodologies/README.md)
