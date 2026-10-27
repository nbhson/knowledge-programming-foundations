# 💱 20.3 Floating Point Precision (Số Học Dấu Phẩy Động)

> **Máy tính không biểu diễn được 0.1.** IEEE-754 lưu số thực dạng nhị phân,
> mà 0.1 trong hệ nhị phân là số thập phân vô hạn tuần hoàn — nên bị làm tròn.
> Kết quả: `0.1 + 0.2 === 0.30000000000000004`. Đây KHÔNG phải bug, là bản chất
> của format. Hiểu nó để viết code tiền tệ, khoa học không sai vài xu/độ chính xác.

> Liên quan: `18.4-numbers-math` (nền tảng IEEE-754 cơ bản — leaf này đi sâu hơn),
> `9-security` (precision loss ở crypto = lỗ hổng thật).

---

## 🎯 Vấn Đề

```
console.log(0.1 + 0.2);           // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);   // false (!)
console.log(0.1 + 0.7);           // 0.7999999999999999

// Ứng dụng tiền tệ:
0.1 + 0.2 === 0.3           // false
(0.3 * 3) === 0.9           // false → hầm hơi vài xu mỗi giao dịch
```

Vì sao? IEEE-754 double = 64 bit: 1 bit dấu, 11 bit mũ, 52 bit mantissa.
Mantissa nhị phân 53 bit có nghĩa chỉ ~15-17 chữ số thập phân chính xác.
Số 0.1 nhị phân là 0.000110011001100... (vô hạn tuần hoàn) → không thể biểu diễn chính xác.

---

## 🧠 Cấu Trúc IEEE-754 Double

```
  1 bit      11 bits        52 bits
┌─────────┬──────────────┬───────────────────┐
│  sign   │  exponent    │  mantissa (fraction)│
│ (dấu)   │  (mũ, bias)  │  (phần lẻ 1.xxxx)  │
└─────────┴──────────────┴───────────────────┘
Giá trị = (-1)^sign × 1.mantissa × 2^(exponent - 1023)

Đặc trưng đáng nhớ:
- Number.MAX_SAFE_INTEGER = 2^53 − 1  = 9,007,199,254,740,991
- Number.EPSILON = 2.52 × 10⁻¹⁶ — sai số tương đối nhỏ nhất
- Infinity khi tràn, NaN khi 0/0, ∞−∞
```

---

## 💻 Code Ví Dụ

```typescript
// ===== So sánh float: KHÔNG dùng ===, dùng epsilon =====
const EPSILON = 1e-9;
const nearlyEqual = (a: number, b: number, eps = EPSILON) =>
  Math.abs(a - b) < Math.max(EPSILON, Math.max(Math.abs(a), Math.abs(b)) * eps);
// Tương đối epsilon (scale theo độ lớn) quan trọng hơn tuyệt đối:
// 1e-10 khác biệt là "bằng" cho số ~1e-6, nhưng là SAI cho số ~1e6

// ===== Tiền tệ: dùng integer cents, KHÔNG dùng float =====
const toCents = (dollars: number): number => Math.round(dollars * 100);
const fromCents = (cents: number): number => cents / 100;
// VND thì đơn giản hơn: số nguyên VND, không cần cents
// NHƯNG cents/100 vẫn là phép chia float — chỉ dùng để hiển thị

// ===== Decimal: chuỗi chữ số — chính xác tuyệt đối (minh họa nguyên lý cộng cột) =====
function addDecimalStrings(a: string, b: string): string {
  const len = Math.max(a.length, b.length);
  const A = a.padStart(len, "0");
  const B = b.padStart(len, "0");
  let carry = 0;
  const out: string[] = [];
  for (let i = len - 1; i >= 0; i--) {
    const s = Number(A[i]) + Number(B[i]) + carry;
    out.unshift(String(s % 10));
    carry = Math.floor(s / 10);
  }
  if (carry > 0) out.unshift(String(carry));
  return out.join("");
}
console.log(addDecimalStrings("999", "1")); // "1000" — chính xác, không làm tròn
// Production: dùng thư viện decimal.js, big.js, hoặc BigDecimal (Java), decimal (Python)

// ===== Kahan summation: cộng dồn float chính xác hơn (thuần thuật toán, không thư viện) =====
function kahanSum(nums: number[]): number {
  let sum = 0, c = 0; // c = "phần mất" được bù lại vòng sau
  for (const x of nums) {
    const y = x - c;            // c là "bù" sai số trước đó
    const t = sum + y;
    c = t - sum - y;            // phần bị làm tròn mất
    sum = t;
  }
  return sum;
}
// Cộng [1e16, 1, 1]: naive = 1e16, kahan = 1e16 + 2 (chính xác hơn)

// ===== BigInt: số nguyên vô hạn — dùng cho crypto, blockchain =====
const x = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 1
console.log(x + 1n); // 9007199254740994n — chính xác
// ⚠️ BigInt KHÔNG trộn được với Number, và KHÔNG hỗ trợ số thực

// ===== Math.fround: làm tròn về float32 — hữu ích khi xử lý GPU/shader =====
console.log(0.1 + 0.2);             // 0.30000000000000004
console.log(Math.fround(0.1 + 0.2)); // 0.30000001192092896 (float32 còn tệ hơn)
```

---

## ⚖️ Lựa Chọn Đại Diện Số Thực

| Cách | Chính xác | Nhanh | Dùng cho |
|---|---|---|---|
| Float64 (JS number) | ~15-17 số | ✓ | tính khoa học, đồ họa |
| Float32 | ~7 số | ✓ (nhỏ hơn) | game, GPU |
| BigInt | chính xác vô hạn | chậm | crypto, ID lớn |
| Decimal (lib) | chính xác thập phân | chậm nhất | tiền tệ, hóa đơn |
| Chuỗi | chính xác | chậm nhất | parse config, JSON lớn |

---

## ⚠️ Bẫy Thường Gặp

1. **Dùng `===` cho float** — luôn dùng epsilon (như trên).
2. **Tính tiền bằng float** — 0.1% sai lệch hàng triệu giao dịch = bồi thường.
3. **Accumulate error trong vòng lặp:** cộng 1.1 hàng triệu lần ≠ 1.1 triệu × 1.1.
4. **parseInt float:** `parseInt("0.000001")` = 0 (parseInt chỉ nhìn phần trước dấu `.`), dùng `Number.parseFloat`.
5. **Toán phức tạp trước nhân chia:** `a*b/c` sai số khác `a/c*b` — sắp xếp phép tính để tránh intermediate quá lớn/nhỏ.
6. **JSON round-trip:** `JSON.parse(JSON.stringify(0.1+0.2))` vẫn sai — lỗi ở tầng giá trị, không phải serialize.

---

## 📝 Bài Tập Tự Vấn

1. Tại sao `0.1 + 0.2 !== 0.3` nhưng `0.5 + 0.25 === 0.75`? (gợi ý: dạng nhị phân hữu hạn)
2. Viết hàm `formatMoney(amount: number, currency: string)` an toàn precision.
3. Tại sao `Number.MAX_SAFE_INTEGER + 1` vẫn đúng, nhưng `+2` lại mất chính xác?

---

*Leaf thuộc [Lớp 20 — Advanced CS Fundamentals](../README.md)*
