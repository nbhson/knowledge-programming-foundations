# 🔤 29.2 Unicode & Text Internals (Unicode Sâu)

> **"Ký tự" không đơn giản như bạn nghĩ.** "é" có thể là 1 codepoint (U+00E9) hoặc
> 2 codepoints (e + dấu kết hợp). Emoji "👨‍👩‍👧" = 5 codepoints! `string.length`
> đếm code units, không đếm ký tự con người thấy.

> Liên quan: `18.3-encoding-data` (nền tảng), `20.5-text-regex-processing` (regex với Unicode).

---

## 🎯 Bẫy Kinh Điển

```js
"👨‍👩‍👧".length            // 8 (!) — nhìn như 1 ký tự
[..."👨‍👩‍👧"].length        // 5 — vẫn không phải 1
new Intl.Segmenter().segment("👨‍👩‍👧")  // 1 grapheme — đúng cách đếm "người dùng thấy"

"café".length === "café".length   // false nếu 1 cái dùng composed, 1 cái decomposed!
// "café" (U+00E9) vs "café" (e + U+0301) — nhìn GIỐNG HẲN, bytes khác nhau
// → user search "café" không tìm thấy record lưu dạng khác → normalize bắt buộc!
```

---

## 🧠 Khái Niệm

```
CODE POINT   — một "vị trí" trong bảng Unicode (U+1F600 = 😀)
CODE UNIT    — đơn vị lưu: UTF-16 dùng 2 bytes (JS string là UTF-16!)
GRAPHEME     — "ký tự" người dùng thấy: có thể gồm nhiều codepoint (nhân tổ hợp)
NORMALIZATION— NFC (ghép): "é" = 1 codepoint; NFD (tách): "é" = e + combining
               → cùng hiển thị, khác byte → luôn normalize trước khi so sánh/lưu
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Normalize: bắt buộc trước khi so sánh/lưu =====
const a = "café";                 // NFC: é = U+00E9
const b = "cafe\u0301";           // NFD: e + combining acute
console.log(a === b);                              // false!
console.log(a.normalize("NFC") === b.normalize("NFC")); // true
// Quy tắc: luôn normalize("NFC") khi: lưu DB, so sánh, làm key map, search

// ===== Đếm grapheme (ký tự người dùng thấy) =====
function graphemeLength(s: string): number {
  const seg = new Intl.Segmenter("vi", { granularity: "grapheme" });
  return [...seg.segment(s)].length;
}
console.log(graphemeLength("👨‍👩‍👧")); // 1
console.log("👨‍👩‍👧".length);            // 8 (code units) — không phải 1!

// ===== Cắt chuỗi an toàn (không cắt giữa grapheme) =====
function safeSlice(s: string, max: number): string {
  const seg = new Intl.Segmenter("vi", { granularity: "grapheme" });
  let out = "";
  for (const { segment } of seg.segment(s)) {
    if ((out + segment).length > max) break;
    out += segment;
  }
  return out;
}

// ===== Regex với Unicode =====
console.log(/^\p{L}+$/u.test("Tiếng Việt"));  // true — \p{L} = letter, flag u bắt buộc
console.log(/\w+/.test("Sơn"));               // false match đầy đủ — \w chỉ [a-zA-Z0-9_]
```

---

## ⚠️ Bẫy Thường Gặp

1. **So sánh/lưu string không normalize** — search hỏng, duplicate record "giống nhau khác nhau". Normalize NFC mọi input.
2. **`length` và `slice` theo code unit** — cắt giữa emoji/composed char → ký tự hỏng. Dùng Intl.Segmenter.
3. **`\w` không khớp tiếng Việt có dấu** — dùng `\p{L}` với flag `u`.
4. **DB collation khác JS comparison** — MySQL utf8mb4_general_ci sắp khác `localeCompare`. Chọn collation theo ngôn ngữ chính của app.
5. **Đếm "ký tự" cho giới hạn input (Twitter 280)** — phải đếm grapheme, không phải length.

---

*Leaf thuộc [Lớp 29 — i18n & L10n](../README.md)*