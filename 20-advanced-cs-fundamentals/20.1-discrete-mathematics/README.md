# 🧮 20.1 Discrete Mathematics (Toán Rời Rạc)

> **Toán rời rạc là "ngôn ngữ pháp lý" của CS:** thay vì "thuật toán này có lẽ nhanh",
> bạn chứng minh được "thuật toán này CHẮC CHẮN nhanh". Mọi chứng minh độ phức tạp,
> tính đúng đắn của giao thức, và định lý trong papers đều viết bằng ngôn ngữ này.

> Liên quan: `18.4-numbers-math` (số học máy), `6.1-time-complexity` (Big-O),
> `20.2-bit-manipulation` (logic bit = đại số Boole).

---

## 🎯 Vấn Đề

Lập trình viên thường suy luận "chạy thử vài case đúng là ổn". Nhưng distributed lock,
giao thức consensus, hay cấu trúc dữ liệu cần **chứng minh** — vì vài case test không phủ
được vô hạn input. Toán rời rạc cung cấp công cụ nói và chứng minh chính xác:

```
Sai:   "Sort này nhanh."
Đúng:  "∀ mảng n phần tử, merge sort chạy trong Θ(n log n) phép so sánh."
       ─────► được CHỨNG MINH, không phụ thuộc input may mắn
```

---

## 🧠 5 Khối Tư Duy Cốt Lõi

### 1. Logic (Logic mệnh đề & vị từ)

```
¬ (không), ∧ (và), ∨ (hoặc), → (kéo theo), ⇔ (khi và chỉ khi)
∀ (với mọi - universal), ∃ (tồn tại - existential)

Ví dụ: chứng minh thuật toán đúng cho mọi input:
  "∀ mảng A: sau khi chạy sort(A), ∃ i<j ⇒ A[i] ≤ A[j]"
  → có mệnh đề gì đó sai ở đây? i<j nên là i≤j... chính việc viết ký hiệu
    buộc bạn phát hiện bug trước khi code!
```

Bảng chân truth cho ¬, ∧, ∨ là nền của mọi mạch số học và điều kiện if:

| A | B | A ∧ B | A ∨ B | A → B |
|---|---|-------|-------|-------|
| 0 | 0 |   0   |   0   |   1   |
| 0 | 1 |   0   |   1   |   1   |
| 1 | 0 |   0   |   1   |   0   |
| 1 | 1 |   1   |   1   |   1   |

⚠️ Note: `A → B` đúng khi A SAI — cái này bịa ngược trực giác, nhưng rất quan trọng
khi viết unit test cho logic điều kiện.

### 2. Sets, Relations, Functions

- **Set:** nhóm phần tử, không lặp, không thứ tự. `{a, b, c}`
- **Relation:** R ⊆ A×B — nền của khóa ngoại trong DB (`10.7-normalization`)
- **Function:** mỗi input → đúng 1 output. Function "thuần" (pure) trong FP
  chính là toán học: `4.2-functional` và `5.12.2-pure-functions`

### 3. Đếm (Counting / Combinatorics)

```
Quy tắc nhân:   làm X có a cách, rồi làm Y có b cách → a × b cách
Quy tắc cộng:   hoặc X hoặc Y (không giao nhau) → a + b cách
Hoán vị:        P(n,k) = n!/(n-k)!   — sắp xếp CÓ thứ tự
Tổ hợp:         C(n,k) = n!/(k!(n-k)!) — chọn KHÔNG quan tâm thứ tự
```

Ứng dụng thực: ước lượng không gian key. AES-128 có 2¹²⁸ key — tại sao brute force
vô vọng? Vì 2¹²⁸ ≈ 3.4 × 10³⁸, sử supercomputer hàng tỉ năm cũng không quét xong
(xem `26-cryptography-advanced`).

### 4. Đồ Thị (Graphs)

Đồ thị G = (V, E) — nền của `6.6-graph-algorithms`. Toán rời rạc cung cấp các
định lý nền: chu trình Euler (mỗi cạnh đi đúng 1 lần ⟺ mọi đỉnh có bậc chẵn),
định lý bốn màu, cây có đúng n−1 cạnh.

### 5. Chứng Minh

| Kỹ thuật | Ý tưởng | Ví dụ kinh điển |
|---|---|---|
| Direct | A ⇒ B đi trực tiếp | tổng 2 số chẵn là chẵn |
| Contradiction | giả sử NOT B → mâu thuẫn | √2 vô tỉ; ∞ số nguyên tố |
| Induction | base case + bước n → n+1 | chứng minh công thức tổng 1..n |
| Contrapositive | ¬B → ¬A thay vì A → B | nếu n² chẵn thì n chẵn |

---

## 💻 Code Ví Dụ

```typescript
// ===== Induction trong code: đệ quy = quy nạp // 
function sumTo(n: number): number {
  if (n === 0) return 0;        // base case: n = 0 đúng
  return n + sumTo(n - 1);      // giả sử đúng cho n-1, chứng minh đúng cho n
}

// ===== Đếm: số subset của tập n phần tử = 2^n (quy tắc nhân, mỗi phần tử: chọn/không)
const subsets = <T>(arr: T[]): T[][] =>
  arr.reduce<T[][]>(
    (acc, item) => [...acc, ...acc.map((s) => [item, ...s])],
    [[]],
  );
console.log(subsets([1, 2, 3]).length); // 8 = 2³

// ===== Pigeonhole (định lý chuồng bồ câu): n+1 vật vào n chuồng → có chuồng ≥ 2 vật
// Dùng để chứng minh "trong 13 người luôn có 2 người sinh cùng tháng"
function hasSharedBirthday(birthMonths: number[]): boolean {
  return new Set(birthMonths).size < birthMonths.length; // 13 tháng? không thể
}

// ===== Pigeonhole ứng dụng thật: birthday paradox
// 23 người → khả năng 2 người trùng sinh nhật > 50%. Sao? 365 ngày, C(23,2)=253 cặp
// mỗi cặp trùng xác suất 1/365 → xác suất có trùng ≈ 1 − (364/365)^253 ≈ 50.7%
function birthdayParadox(n: number, days = 365): number {
  let noMatch = 1;
  for (let i = 0; i < n; i++) noMatch *= (days - i) / days;
  return 1 - noMatch;
}
console.log(birthdayParadox(23).toFixed(2)); // 0.51
```

---

## ⚖️ So Sánh Kỹ Thuật Chứng Minh

| Kỹ thuật | Trực giác | Dùng khi |
|---|---|---|
| Direct | A ⟹ B | Bằng dựng rõ ràng được |
| Contradiction | ¬B → vô lý | B khó chứng minh trực tiếp |
| Induction | domino đổ | Mọi n tự nhiên, có bước n → n+1 |
| Contrapositive | ¬B ⟹ ¬A | B là dạng "không tồn tại" |

---

## ⚠️ Bẫy Thường Gặp

1. **Induction thiếu base case** — domino không có viên đầu tiên.
2. **Off-by-one trong quy nạp:** chứng minh cho n, quên nối n → n+1.
3. **Đếm thiếu/gặp trùng:** đếm tổ hợp phải chia trường hợp rời rạc (mutually exclusive).
4. **Quy nạp "mạnh" vs "yếu":** strong induction giả sử đúng cho MỌI k < n, không chỉ n-1.

---

## 📝 Bài Tập Tự Vấn

1. Chứng minh: tổng 1+2+...+n = n(n+1)/2 bằng quy nạp.
2. Trong 1 phòng có 30 người, chứng minh có 2 người số lượng bạn chung trong phòng chẵn.
3. Đếm số cách tô 4 vùng bản đồ bằng 3 màu sao cho vùng kề nhau khác màu.

---

*Leaf thuộc [Lớp 20 — Advanced CS Fundamentals](../README.md)*
