# 🔢 18.4 Numbers & Math (Số Học Máy Tính)

> **Số trong máy tính là xấp xỉ:** `0.1 + 0.2 !== 0.3` không phải bug ngôn ngữ
> mà là bản chất IEEE-754 — hiểu nó để tính tiền không sai một đồng.

---

## 🎯 Vấn Đề

Số thập phân vô hạn (0.1) không biểu diễn chính xác được bằng nhị phân hữu hạn, nên `number`
(JS double 64-bit) luôn có sai số làm tròn. Cộng dồn sai số trong tính tiền/vật lý mô phỏng sẽ lệch
dần. Ngoài ra còn có overflow (`Number.MAX_SAFE_INTEGER`), chia cho 0, `NaN` lan truyền âm thầm.

```
0.1 ─► nhị phân vô hạn 0.0001100110011... ─► cắt 64-bit ─► 0.1000000000000000055
0.1 + 0.2 = 0.30000000000000004  →  so sánh === 0.3 → false!
```

---

## 💻 Code Ví Dụ

```typescript
// So sánh float: KHÔNG dùng ===, dùng epsilon
function floatEqual(a: number, b: number, eps = Number.EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

// Tiền tệ: tính bằng đơn vị nhỏ nhất (xu/cents, số nguyên) rồi format khi hiển thị
function addMoney(centsA: number, centsB: number): number {
  return centsA + centsB; // 1000 + 2000 = 3000 xu = 30.00đ — chính xác tuyệt đối
}

function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2)}đ`;
}

// Số nguyên lớn vượt MAX_SAFE_INTEGER (2^53 - 1): dùng BigInt
function bigFactorial(n: bigint): bigint {
  let result = 1n;
  for (let i = 2n; i <= n; i++) result *= i;
  return result;
}

// Bẫy overflow: phát hiện trước khi vượt ngưỡng an toàn
function isSafeInteger(n: number): boolean {
  return Number.isSafeInteger(n);
}
```

> Demo đầy đủ (0.1+0.2, epsilon, cents, BigInt, overflow, NaN) trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Thực hành | Lợi ích |
|---|---|
| `floatEqual` với epsilon | So sánh số thực không còn "lúc đúng lúc sai" |
| Tính tiền bằng cents | Không bao giờ lệch 1 đồng do làm tròn nhị phân |
| BigInt | Tính toán nguyên lớn (mã, hash, giai thừa) chính xác |
| Hiểu NaN/Infinity | Bắt lỗi lan truyền âm thầm trước khi ra report sai |

---

## ⚠️ Lưu Ý

- `toFixed()` trả về **string** và làm tròn — đừng dùng nó để tính tiếp.
- BigInt **không trộn** với number (`1n + 1` ném TypeError) — convert tường minh.
- `0.1 + 0.2` chỉ là triệu chứng: mọi phép float đều có sai số — vòng lặp cộng dồn càng nguy hiểm.
- Tiền tệ production: dùng thư viện Decimal (dinero.js/big.js) thay vì tự chế khi có chia/phần trăm phức tạp.

---

## 🎯 Khi Nào Dùng

- Mọi code tính tiền, thuế, discount: cents/Decimal, cấm float trực tiếp.
- So sánh kết quả đo lường, vật lý, đồ họa: epsilon thay vì `===`.
- ID/hash/số seri vượt 2^53: BigInt hoặc giữ dạng string.

---

## 🔗 Liên Quan

- [18.3 Encoding Data](../18.3-encoding-data/README.md) — số cũng là byte (endianness, DataView).
- [06-data-structures-and-algorithms](../../06-data-structures-and-algorithms/README.md) — độ chính xác trong thuật toán số.
- [14-clean-code](../../14-clean-code/README.md) — đặt tên/hàm tiền tệ rõ ràng tránh nhầm đơn vị.

---

## 📚 Tài Liệu

- 📖 [What Every Computer Scientist Should Know About Floating-Point](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) — Goldberg
- 📖 [MDN: Number / BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- 📖 [IEEE 754 Visualizer](https://www.h-schmidt.net/FloatConverter/IEEE754.html)

---

## ⏭️ Bài Tiếp Theo

→ [18.5 Compilers & Interpreters](../18.5-compilers-interpreters/README.md)
