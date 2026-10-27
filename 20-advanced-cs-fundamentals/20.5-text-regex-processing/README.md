# 🔍 20.5 Text & Regex Processing (Xử Lý Text & Regex)

> **Regex là "ngôn ngữ con" để chỉ ra chuỗi pattern.** Mạnh đến mức mọi editor, log
> parser, router, validator đều dùng — và nguy hiểm đến mức có cả lớp lỗ hổng riêng
> (ReDoS). Hiểu regex internals giúp bạn viết pattern nhanh, an toàn, dễ đọc.

> Liên quan: `23.3-regex-internals` (engine hoạt động thế nào — leaf này đi sâu hơn),
> `06.7-string-algorithms` (thuật toán matching), `20.1-discrete-mathematics` (automata).

---

## 🎯 Vấn Đề

Validate email? Tách thời gian từ log? Đổi định dạng ngày? Regex làm được trong 1 dòng
nhưng sai một dấu là lệnh tấn công vô hạn (catastrophic backtracking). Ví dụ kinh điển:

```js
/^(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaX")  // treo O(2^n)!
// Nested quantifier (a+)+ khiến backtracking bùng nổ
// → attacker gửi chuỗi "aaaaaaaaaaaaX" và CPU của bạn chết
```

---

## 🧠 2 Cách Hiểu Regex

```
1. NHƯ NGÔN NGỮ:      chuỗi mẫu mô tả "tập chuỗi" khớp
2. NHƯ AUTOMATON:     regex ⇔ NFA ⇔ DFA (thuyết automata)
   ├─ DFA: quét input 1 lần, O(n) — RE2, Rust regex dùng cách này (an toàn ReDoS)
   └─ Backtracking engine (JS/PCRE): nhanh trong common case,
      nhưng có thể EXPONENTIALLY chậm (catastrophic backtracking)
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Kỹ thuật cốt lõi =====
const text = "Contact: son@example.com, 0912-345-678";

// . = bất kỳ 1 ký tự trừ newline; \d số; \w chữ/số/_; \s khoảng trắng
// * 0+; + 1+; ? 0 hoặc 1; {2,4} từ 2 đến 4
const email = /^[\w.+-]+@[\w-]+\.[\w.]+$/; // đơn giản hóa — email thật phức tạp hơn nhiều

// Capture group: trích xuất, không chỉ check
const logLine = "2026-10-28 14:32:01 ERROR payment failed order=8899";
const pattern = /(?<date>\S+)\s+(?<level>ERROR|WARN|INFO)\s+(?<msg>.*)/;
const m = logLine.match(pattern);
if (m?.groups) console.log(m.groups.date, m.groups.level); // named group

// Lookahead/lookbehind: khớp nhưng KHÔNG "ăn" ký tự
const prices = "1000 VND, $50 USD, €40";
console.log(prices.match(/\$(\d+)/)?.[1]); // "50"

// ===== Greedy vs Lazy — bẫy số 1 của regex =====
const html = '<div>hello</div><div>world</div>';
console.log(html.match(/<div>(.*)<\/div>/)?.[1]);  // "world</div><div>world"? Không:
// Greedy `.*` ăn TỐI ĐA → chỉ match 1 lần, capture cả "</div><div>"
console.log(html.match(/<div>(.*?)<\/div>/)?.[1]); // "hello" — lazy `*?` ăn ÍT NHẤT

// ===== ReDoS: backtracking nổ theo cấp số nhân =====
const evil = /^(a+)+$/.test("aaaaaaaaaaaaaaaaaaaaaaaaaaX"); // O(2^n) — treo!
// An toàn: giới hạn nesting, dùng possessive quantifier (nếu ngôn ngữ hỗ trợ),
// hoặc dùng engine thời gian tuyến tính (RE2, Rust regex)

// ===== Thay thế: transform theo pattern =====
const camel = "user-profile-page";
const PascalCase = camel.replace(/(^|-)([a-z])/g, (_, c) => c.toUpperCase());
console.log(PascalCase); // "UserProfilePage"

// ===== Escape ký tự đặc biệt khi dựng regex động =====
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const userInput = "price: (100$)";
new RegExp(escapeRegex(userInput)); // an toàn — không bị hiểu ( ) như group
```

---

## ⚖️ Kỹ Thuật Xử Lý Text

| Nhu cầu | Regex | Thuật toán / Tool |
|---|---|---|
| Match đơn giản | regex thường | đủ dùng |
| Match hàng GB | — | Aho-Corasick (đa pattern), trie |
| Fuzzy tìm kiếm | — | Levenshtein, fuzzy search lib |
| Parse có ngữ nghĩa | regex SHY | tokenizer + parser (xem 23.2) |
| Tokenize theo từ | `\w+` (chậm) | split + cache |

---

## ⚠️ Bẫy Thường Gặp

1. **Nested quantifier `(a+)+`** — backtracking bùng nổ (ReDoS). Luôn test với chuỗi dài.
2. **Regex là stateless nhưng có trạng thái lastIndex** — flag `g` làm `.exec()` nhớ vị trí giữa các lần gọi → bug khó debug.
3. **XSS qua regex input chưa escape** — dựng `new RegExp(userInput)` không escape = injection (xem 5.4).
4. **Regex KHÔNG parse HTML** — nesting không regex-able. Dùng DOM parser.
5. **Unicode:** `.` mặc định không match emoji/composed char — cần flag `u` (Unicode) và nhìn boundary rune.
6. **Regex validate email "đúng tuyệt đối"** — không tồn tại regex hoàn hảo; dùng chấm/regex + gửi mail xác nhận.

---

## 📝 Bài Tập Tự Vấn

1. Viết regex tách timestamp, level, message từ format log `[2026-10-28 14:32:01] ERROR: xyz`.
2. Đếm tổng số từ có trong text (không tính dấu câu) chỉ dùng regex.
3. Tại sao `/^(a|a)*$/` với input "aaaaaaaaaaaaaaaaaaaaaaaaab" chậm kinh khủng?

---

*Leaf thuộc [Lớp 20 — Advanced CS Fundamentals](../README.md)*
