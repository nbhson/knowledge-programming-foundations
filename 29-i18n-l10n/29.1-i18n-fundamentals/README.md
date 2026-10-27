# 🌐 29.1 i18n Fundamentals (Nền Tảng Quốc Tế Hóa)

> **Tách mọi text khỏi code, đặt vào file ngôn ngữ, tra bằng key.** Nghe đơn giản
> nhưng có 4 bẫy lớn: số nhiều (plural), chèn biến, ngày/tiền, RTL layout.

---

## 💻 Code Ví Dụ

```typescript
// ===== i18next: thư viện phổ biến nhất JS =====
import i18next from "i18next";
await i18next.init({ lng: "vi", resources: { ... } });

// Cơ bản: key → text theo locale
i18next.t("welcome.back"); // "Chào mừng trở lại!"

// Chèn biến (interpolation)
i18next.t("order.total", { count: 5, total: "250.000₫" });
// "Bạn có {{count}} đơn, tổng {{total}}"

// ===== PLURAL — bẫy số 1 =====
// Tiếng Việt: 1 form duy nhất ("5 cuốn sách" = "1 cuốn sách")
// Tiếng Anh: 2 forms (1 book / 2 books)
// Tiếng Nga: 3+ forms (1 книга / 2-4 книги / 5+ книг) — quy tắc phức tạp!
en.json:  { "books": "You have one book_other: You have {{count}} books" }
// ICU MessageFormat giải quyết: CLDR plural rules tự chọn form theo locale

// ===== Ngày, số, tiền: dùng Intl (built-in, không thư viện) =====
const vi = "vi-VN", us = "en-US";
console.log(new Intl.DateTimeFormat(vi).format(new Date()));   // "28/10/2026"
console.log(new Intl.DateTimeFormat(us).format(new Date()));   // "10/28/2026"
console.log(new Intl.NumberFormat(vi, { style: "currency", currency: "VND" })
  .format(1234567));                                           // "1.234.567 ₫"
console.log(new Intl.NumberFormat(us, { style: "currency", currency: "USD" })
  .format(1234.56));                                           // "$1,234.56"

// ===== So sánh chuỗi theo locale (giọng đọc, thứ tự alphabet) =====
["Zebra", "apple", "Áo"].sort((a, b) => a.localeCompare(b, "vi"));
// locale-aware: "Áo" đứng đúng vị trí trong bảng chữ Việt

// ===== Kiểm tra tên key chưa dịch (CI check) =====
// missing-keys check: so key giữa en.json vs vi.json — thiếu = fail build
```

---

## ⚠️ Bẫy Thường Gặp

1. **Ghép chuỗi thay vì interpolation:** `"Hello " + name` — thứ tự từ khác nhau giữa ngôn ngữ. Luôn dùng template: `"hello.{{name}}"`.
2. **Plural hardcode:** `count === 1 ? "book" : "books"` — sai với Nga/Arabic. Dùng ICU MessageFormat.
3. **Layout không hỗ trợ RTL** — tiếng Ả Rập: mọi thứ lật ngược (margin-left ↔ margin-right). CSS logical properties (`margin-inline-start`).
4. **Độ dài text khác nhau** — tiếng Đức dài hơn tiếng Anh 35%. UI phải co giãn, không cố định width.
5. **Quên format ngày/tiền theo locale** — `new Date().toString()` cho US format mọi nơi. Luôn `Intl.DateTimeFormat(locale)`.
6. **Dịch mà không test** — AI/translator dịch sai ngữ cảnh ("book" là cuốn sách hay đặt phòng?). Test UI từng locale.

---

*Leaf thuộc [Lớp 29 — i18n & L10n](../README.md)*