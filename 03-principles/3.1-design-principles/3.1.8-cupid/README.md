# 🧩 3.1.8 CUPID (Composable, Unix philosophy, Predictable, Idiomatic, Domain-based)

> **CUPID** là 5 phẩm chất của code "vui vẻ" (joyful code) — code dễ ghép nối,
> làm một việc tốt, hành xử đoán được, viết theo phong cách cộng đồng, và nói ngôn ngữ domain.

---

## 🎯 Vấn đề

Code "chạy đúng" nhưng vẫn khổ:

- **Hàm khổng lồ** — 1 hàm làm 5 việc, không tái dùng được mảnh nào
- **Hàm "làm 2 việc"** — `getUserAndSendEmail()` — muốn lấy user thôi cũng bị gửi email
- **Bất ngờ** — hàm tên `getUsers()` lại ghi database; `sort()` tự đổi mảng gốc
- **Lạ lẫm** — codebase TS nhưng viết kiểu Java 2005, dev mới không nhận ra idiom quen
- **Ngôn ngữ kỹ thuật** — `processData(d1, d2)` trong khi domain gọi là `checkout(order, payment)`

```
❌ CODE KHÓ CHỊU                    ✅ CODE VUI VẺ (CUPID)
┌─────────────────────┐            ┌─────────────────────┐
│ getUserAndSendEmail │            │ getUser()           │
│ sortInPlace(?)      │  ──CUPID─▶ │ sendEmail()         │
│ processData(d1, d2) │            │ checkout(order)     │
│ 200 dòng/hàm        │            │ hàm nhỏ, ghép được  │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 5 phẩm chất CUPID

| Chữ | Tên | Ý tưởng + ví dụ JS/TS |
|-----|-----|----------------------|
| **C** | **Composable** (có thể ghép nối) | Hàm nhỏ, nhận input → trả output, ghép bằng `map/filter/reduce` hoặc pipe. Ví dụ: `users.filter(isActive).map(toName)` thay vì 1 vòng lặp làm hết. |
| **U** | **Unix philosophy** (làm một việc tốt) | Mỗi hàm/chương trình làm **1 việc và làm tốt**. Ví dụ: `validateEmail()` chỉ validate, không vừa validate vừa lưu DB. |
| **P** | **Predictable** (đoán được) | Tên nói gì làm đúng đó; không có side-effect ẩn; cùng input → cùng output. Ví dụ: hàm `get*` không ghi DB; `sort` trả mảng mới thay vì đổi mảng gốc. |
| **I** | **Idiomatic** (đúng phong cách cộng đồng) | Viết theo **idiom** của ngôn ngữ/cộng đồng: TS dùng `Optional Chaining`, `Array.map`, `async/await` thay vì callback lồng nhau hay vòng lặp thủ công. |
| **D** | **Domain-based** (dựa trên domain) | Tên và cấu trúc code **nói ngôn ngữ của nghiệp vụ** (domain): `checkout(order)`, `OrderLine.subtotal()` thay vì `process(d1, d2)`. |

```
BẢN ĐỒ NHANH
│
├─ Hàm to, khó tái dùng? → Composable + Unix philosophy (chẻ nhỏ, 1 việc/hàm)
├─ Đọc tên đoán sai hành vi? → Predictable (tên đúng việc, không side-effect ẩn)
├─ Dev mới "không quen tay"? → Idiomatic (viết như cộng đồng TS vẫn viết)
└─ Phải dịch "d1, d2 là gì"? → Domain-based (đặt tên theo nghiệp vụ)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: 1 hàm làm nhiều việc, tên gây hiểu lầm, đổi input gốc
function processData(users: any[]) {
  users.sort((a, b) => a.age - b.age); // side-effect ẩn: đổi mảng gốc!
  const result = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
      result.push(users[i].name.toUpperCase()); // lọc + biến đổi + viết hoa dồn 1 chỗ
    }
  }
  return result;
}

// ✅ GOOD: CUPID — nhỏ, 1 việc, đoán được, idiomatic, nói ngôn ngữ domain
interface User {
  name: string;
  age: number;
  active: boolean;
}

const isActive = (user: User): boolean => user.active;       // Unix: 1 việc
const toDisplayName = (user: User): string => user.name.toUpperCase();
const byAge = (a: User, b: User): number => a.age - b.age;

function getActiveNames(users: readonly User[]): string[] {
  return [...users]              // Predictable: không đổi mảng gốc
    .sort(byAge)                // Idiomatic: comparator tách riêng, tái dùng được
    .filter(isActive)           // Composable: ghép như ống nước
    .map(toDisplayName);
}
```

> 💡 **Liên hệ với các nguyên tắc khác:** Unix philosophy ≈ SRP/SoC ở cấp hàm;
> Predictable ≈ Principle of Least Astonishment; Domain-based ≈ Ubiquitous Language của DDD.

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🧩 **Tái dùng cao** | Hàm nhỏ, 1 việc → ghép lại thành flow mới không cần viết lại |
| 🔍 **Đoán được** | Đọc tên hiểu hành vi, không sợ side-effect ẩn |
| 🤝 **Dễ onboard** | Code idiomatic + tên domain → dev mới đọc hiểu nhanh |
| 🧪 **Dễ test** | Hàm thuần túy (pure), input → output rõ ràng |

---

## ⚠️ Lưu ý

| Vấn đề | Ví dụ |
|--------|-------|
| **Chẻ quá nhỏ** | Hàm 1 dòng dùng đúng 1 lần → thêm lớp indirection vô ích, khó lần theo |
| **Idiomatic mù quáng** | Ép dùng `reduce` 1 dòng khó đọc trong khi vòng lặp rõ hơn — idiomatic nhưng vẫn phải đọc được |
| **Tên domain mơ hồ** | Domain chưa rõ mà vội đặt tên nghiệp vụ → tên sai còn tệ hơn tên chung chung |

> 💡 **Quy tắc:** Chẻ hàm đến mức **mỗi hàm nói được 1 câu đơn giản** ("lọc user active").
> Nhỏ hơn nữa mà câu đó không còn nghĩa → dừng lại.

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Hàm dài > 20 dòng làm nhiều việc | ✅ Chẻ theo Unix philosophy + Composable |
| Hàm có side-effect ẩn (đổi input, ghi DB lén) | ✅ Predictable: tách side-effect ra, tên phải lộ rõ |
| Codebase mỗi người 1 phong cách | ✅ Idiomatic: thống nhất theo style cộng đồng TS |
| Biến/tên kiểu `d1`, `data`, `process` | ✅ Domain-based: đặt lại theo ngôn ngữ nghiệp vụ |
| One-liner "khoe" nhưng khó đọc | ❌ Đừng đánh đổi readability lấy cleverness |

---

## 🔗 Liên quan

- **3.1.4 SoC** — Unix philosophy là SoC ở cấp hàm
- **3.2.1 SRP** — 1 hàm 1 lý do thay đổi
- **3.1.2 KISS** — Hàm nhỏ, đoán được chính là đơn giản
- **1.7 Domain-Driven Design** — Domain-based chính là Ubiquitous Language

---

## 📁 Cấu trúc thư mục

```
3.1.8-cupid/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.8-cupid
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [CUPID — Dan North](https://dannorth.net/cupid-the-back-story/)
- 📖 [Joyful Code with CUPID](https://dannorth.net/2022/02/10/cupid-for-joyful-coding/)

---

## ⏭️ Bài tiếp theo

→ [3.1.9 Postel's Law](../3.1.9-postel-law/README.md)
