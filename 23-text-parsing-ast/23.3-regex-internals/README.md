# ⚙️ 23.3 Regex Internals (Regex Hoạt Động Ra Sao)

> **Regex không phải "thần chú" — nó là máy trạng thái.** Hiểu NFA/DFA và
> backtracking giải thích mọi bí ẩn: vì sao một số regex treo CPU (ReDoS),
> vì sao engine khác nhau cho kết quả "match" khác nhau, vì sao capture
> group trả về thứ tự bất ngờ.

> Liên quan: `20.5-text-regex-processing` (sử dụng regex), `20.1-discrete-mathematics`
> (automata là định lý hình thức), `22.1-debugging-strategies` (chẩn đoán ReDoS).

---

## 🎯 Vấn Đề

2 regex trông giống nhau, 1 cái chạy 1ms, 1 cái treo 1 giờ — khác biệt nằm ở
**engine bên dưới**, không phải syntax. Hiểu engine giúp bạn:

1. Viết regex an toàn (tránh catastrophic backtracking)
2. Chọn đúng engine (backtracking vs DFA/automaton tuyến tính)
3. Biết giới hạn: regex KHÔNG parse được HTML lồng nhau (vì không có đếm tự do)

---

## 🧠 2 Kiểu Engine

```
1. BACKTRACKING (JS, PCRE, Python `re`, Ruby)
   └─ khi 1 nhánh thất bại, quay lại thử nhánh khác
      → nhanh trong case thường, NHƯNG có thể nổ theo cấp số nhân
      /^(a+)+$/ vs "aaaaaaaaaaaaaaaaaaaaX" → O(2^n) (ReDoS!)

2. AUTOMATON (DFA/NFA) — RE2 (Go/C++), Rust `regex`, Go `regexp`
   └─ biến regex thành NFA/DFA, quét input 1 lần — O(n) GUARANTEED
      → ReDoS vô nghĩa, nhưng không có lookbehind/backreference
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Backtracking nổ bùm: catastrophic backtracking =====
// /^(a+)+$/ với input "aaaaaaaaaaaaaaaaaaaaaaaaaaaaX"
// Engine thử MỌI cách chia chuỗi thành nhóm "(a+)" — 2^n đường!
// → attacker gửi 1 request → CPU 1 core chết vài phút (ReDoS)
// Mitigation:
//   - tránh lồng quantifier: (a+)+, (a*)*, (a|a)*
//   - dùng possessive quantifier (nếu engine hỗ trợ): ^(a++)+$
//   - dùng engine tuyến tính: RE2 (Go), Rust regex, Node regexp-tree check

// ===== Possessive quantifier: nuốt, không nhả =====
// a*+ — greedy thường: cố ăn nhiều, có thể "trả lại" khi fail (backtrack)
// possessive: ăn nhiều nhất CÓ THỂ rồi KHÔNG nhả → luôn tuyến tính

// ===== Lookaround nhìn chứ không "ăn" =====
"foo bar baz".match(/(?<=bar\s)\w+/)     // ["foo"? không — sau "bar "] 
"bar foo".match(/(?<=bar\s)(\w+)/)?.[1];  // "foo" — không tiêu "bar "
// lookahead (?=...) / lookbehind (?<=...) — zero-width, không "ăn" input

// ===== Capture group vs non-capturing =====
const re = /(\d{4})-(\d{2})-(\d{2})/;            // capture: tốn bộ nhớ
const reNon = /(?:\d{4})-(\d{2})/;                  // (?:...) chỉ gộp, không capture
console.log("2026-10-28".match(reNon)?.[1]);        // "10"

// ===== Named groups: dễ đọc hơn cháu [1], [2] =====
const logRe = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const m = "2026-10-28".match(logRe);
console.log(m?.groups); // { day: "28", month: "10", year: "2026" } — tự sắp tên
```

---

## ⚖️ Backtracking Engine vs Automaton Engine

| | Backtracking (JS/PCRE) | DFA/NFA tuyến tính (RE2) |
|---|---|---|
| Tốc độ common case | nhanh | nhanh |
| Worst case | O(2^n) — ReDoS | O(n) đảm bảo |
| Lookbehind, backreference | ✓ | không (RE2) |
| Khi nào dùng | pattern đơn giản, input tin cậy | input user, pattern phức tạp |

---

## ⚠️ Bẫy Thường Gặp

1. **Nested quantifier `(a+)+`** — backtracking bùng nổ. Test với "aaaa...X".
2. **ReDoS thật sự là CVE** — regex xử lý input user phải kiểm tra bằng công cụ (regexp-tree, re2).
3. **Flag `g` + lastIndex:** `.exec()` và `.test()` nhớ vị trí giữa các lần gọi → bug khó nhìn. Dùng `.matchAll` hoặc reset lastIndex.
4. **Unicode:** `\w` không khớp tiếng Việt có dấu → dùng flag `u` + `\p{L}` (letter).
5. **Catastrophic backtracking** — pattern lồng quantifier như `(a+)+$` với input thất bại ở cuối → nổ exponential. Ngược lại thành công thì nhanh — chỉ TREO khi fail.
6. **Backreference khiến engine chậm** — `(a+)\1` buộc backtracking. Thiết kế lại pattern nếu có thể.

---

## 📝 Bài Tập Tự Vấn

1. Tại sao `/^(a|a)*$/` với "aaaaaaaaaaaaaaaaaaaab" chậm kinh khủng? Vẽ cây backtracking.
2. RE2 không có backreference — quy trình viết lại regex dùng backreference thành automaton-compatible?
3. Test ReDoS: viết unit test phát hiện regex nguy hiểm trước khi lên production.

---

*Leaf thuộc [Lớp 23 — Text, Parsing & AST](../README.md)*
