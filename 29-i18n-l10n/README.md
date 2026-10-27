# 🌍 Lớp 29: i18n & L10n (Quốc Tế Hóa & Bản Địa Hóa)

> **i18n (internationalization)** = thiết kế app để DỊCH được (tách text khỏi code).
> **L10n (localization)** = dịch + điều chỉnh cho từng địa phương (ngôn ngữ, tiền tệ,
> ngày, RTL). Làm sau khi app lớn = viết lại 70% code.

> Liên quan: `18.3-encoding-data` (Unicode cơ bản — leaf này đi sâu),
> `16-design-systems` (layout RTL), `19-frontend-performance` (load locale).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 29.1 | i18n Fundamentals | Tách string, ICU MessageFormat, plural | [29.1-i18n-fundamentals](29.1-i18n-fundamentals/README.md) |
| 29.2 | Unicode & Text Internals | UTF-8, NFC/NFD, emoji, RTL | [29.2-unicode-internals](29.2-unicode-internals/README.md) |

---

## 📖 Tổng Quan

```
❌_hardcode:  <h1>Welcome back!</h1>
✅ i18n:      <h1>{t("welcome.back")}</h1>
              en.json:  { "welcome.back": "Welcome back!" }
              vi.json:  { "welcome.back": "Chào mừng trở lại!" }

Ngoài text còn phải locale hóa:
  Ngày:    10/28/2026 (US) ≠ 28/10/2026 (VN)
  Tiền:    $1,234.56   ≠  1.234,56 €  ≠  1.234,56 ₫
  Số:      1,234.5     ≠  1.234,5
  RTL:     tiếng Ả Rập, Do Thái — layout LẬT NGƯỢC
  Số nhiều: English 2 forms (1 book, 2 books); tiếng Việt 1 form;
           tiếng Nga 3+ forms (1 книга, 2 книги, 5 книг)!
```

---

## 🔗 Liên Kết Chéo

- **Encoding nền tảng:** `18-cs-fundamentals/18.3-encoding-data`
- **Định dạng ngày/tiền:** `Intl` API chuẩn JS

---

## 📖 Tài Nguyên Tham Khảo

- ICU Message Format docs, MDN `Intl`
- W3C i18n guidelines
- *Unicode Standard* (unicode.org)