# 🔢 20.2 Bit Manipulation (Thao Tác Bit)

> **Ở tầng thấp nhất, máy tính chỉ hiểu 0 và 1.** Thao tác bit = nói chuyện trực tiếp
> với tầng đó: nhanh hơn phép nhân/chia, tốn ít bộ nhớ hơn mảng boolean, và là nền
> của permission system, hash function, codec, embedded.

> Liên quan: `18.3-encoding-data` (endianness, hex), `20.3-floating-point-precision`
> (bit bên trong float), `26.1-hashing` (hash dùng xoay bit rất nhiều).

---

## 🎯 Vấn Đề

Cần biểu diễn 32 quyền truy cập? Cách "bình thường" là mảng 32 boolean (32 byte+).
Cách bit: 1 số int 32-bit là đủ. Cần kiểm tra chẵn/lẻ, swap 2 biến không biến tạm,
tìm phần tử xuất hiện 1 lần trong mảng mà các phần tử khác xuất hiện 2 lần?
Tất cả đều là 1-2 dòng bit operation.

---

## 🧠 Các Phép Toán Nền Tảng

| Phép | Ký hiệu | Kết quả | Ghi nhớ |
|---|---|---|---|
| AND | `a & b` | 1 chỉ khi cả 2 là 1 | "lọc mask" |
| OR | `a \| b` | 1 nếu có 1 là 1 | "bật bit" |
| XOR | `a ^ b` | 1 khi 2 bit khác nhau | "toggle", a^a=0, a^0=a |
| NOT | `~a` | đảo tất cả bit | ~n = -n-1 |
| Shift trái | `a << k` | nhân 2^k | bit tràn ra trái mất |
| Shift phải | `a >> k` | chia nguyên 2^k (giữ dấu) | signed |
| Shift phải logic | `a >>> k` | chia nguyên, điền 0 | unsigned |

---

## 💻 Code Ví Dụ

```typescript
// ===== Kỹ thuật cơ bản =====
const isEven = (n: number) => (n & 1) === 0;          // bit cuối = 0 → chẵn
const setBit = (n: number, k: number) => n | (1 << k);  // bật bit thứ k
const clearBit = (n: number, k: number) => n & ~(1 << k); // tắt bit thứ k
const toggleBit = (n: number, k: number) => n ^ (1 << k); // đảo bit thứ k
const getBit = (n: number, k: number) => (n >> k) & 1;    // đọc bit thứ k
const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0; // 2^k có đúng 1 bit 1
const abs = (n: number) => {
  const mask = n >> 31;  // 0 nếu dương, -1 nếu âm (2's complement)
  return (n ^ mask) - mask; // âm: (a ^ -1) - (-1) = -a-1+1 = -a
};

// ===== Đếm số bit 1 (Kernighan): x &= x-1 xóa bit 1 thấp nhất mỗi vòng =====
function popcount(n: number): number {
  let count = 0;
  while (n !== 0) { n &= n - 1; count++; }
  return count;
}
console.log(popcount(0b1011)); // 3

// ===== XOR: tìm phần tử xuất hiện 1 lần, các phần tử khác xuất hiện 2 lần =====
// a^a = 0 nên các cặp tự triệt tiêu, chỉ còn "kẻ cô đơn"
function singleNumber(nums: number[]): number {
  return nums.reduce((acc, n) => acc ^ n, 0);
}
console.log(singleNumber([4, 1, 2, 1, 2])); // 4

// ===== Swap không biến tạm (trò chơi trí tuệ, tránh dùng trong production) =====
let a = 5, b = 7;
a ^= b; b ^= a; a ^= b; // a=7, b=5

// ===== Permission bitmask — pattern thực chiến =====
const PERMS = { READ: 1 << 0, WRITE: 1 << 1, DELETE: 1 << 2, ADMIN: 1 << 3 } as const;
type Perms = number;
const grant = (p: Perms, ...flags: Perms[]) => flags.reduce((acc, f) => acc | f, p);
const revoke = (p: Perms, ...flags: Perms[]) => flags.reduce((acc, f) => acc & ~f, p);
const can = (p: Perms, flag: Perms) => (p & flag) !== 0;

let user: Perms = PERMS.READ;
user = grant(user, PERMS.WRITE | PERMS.DELETE);
console.log(can(user, PERMS.WRITE)); // true
user = revoke(user, PERMS.DELETE);
console.log(can(user, PERMS.DELETE)); // false

// ===== Endianness: cùng 1 số, byte khác thứ tự (xem 18.3) =====
// Little-endian (x86): 0x1234 lưu [0x34, 0x12]; Big-endian (network): [0x12, 0x34]
```

---

## ⚖️ Bitmask vs Mảng Boolean

| Tiêu chí | Bitmask (int) | Mảng boolean |
|---|---|---|
| Bộ nhớ | 1 int cho 32 flag | ≥ 32 byte |
| Kiểm tra 1 flag | O(1), 1 phép AND | O(1), index |
| Gán/serialize | truyền 1 số | truyền mảng |
| Độ dễ đọc | thấp (cần tên hằng số) | cao |
| Giới hạn | số lượng flag ≤ bit của kiểu | không giới hạn |

---

## ⚠️ Bẫy Thường Gặp

1. **JS bitwise là 32-bit SIGNED** — `1 << 31` cho ra số âm. Cần unsigned? dùng `>>>`.
2. **`a ^ b ^ a` = b** — hợp lệ, nhưng đừng dùng trong team không rành bit (khó review).
3. **Shift quá 31:** JS giữ lại mod 32 — `1 << 32 === 1`. Kinh hoàng nếu không biết.
4. **Endian khi serialize** — cùng mã hex, khác thứ tự byte là mất dữ liệu (xem 20.4).
5. **`&` có precedence thấp hơn `==`** — trong C/Java `(x & 1 == 0)` là bug kinh điển; TS bắt buộc phải có ngoặc.

---

## 📝 Bài Tập Tự Vấn

1. Đếm số bit cần đổi để chuyển a thành b (a XOR b rồi popcount).
2. Tìm 2 phần tử xuất hiện 1 lần (mọi phần tử khác xuất hiện 2 lần) — chỉ dùng O(1) bộ nhớ.
3. Nhân số với 7 chỉ dùng shift và cộng.

---

*Leaf thuộc [Lớp 20 — Advanced CS Fundamentals](../README.md)*
