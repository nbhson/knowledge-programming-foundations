# ✂️ 23.1 Lexing & Tokenization (Tách Từ)

> **Lexer = máy cắt chuỗi thành "từ vựng" có nghĩa.** Trước khi hiểu ngữ pháp,
> phải phân biệt được đâu là số, đâu là tên biến, đâu là dấu ngoặc. Token là
> đơn vị nhỏ nhất có ý nghĩa của ngôn ngữ.

> Liên quan: `23.2-parsing-fundamentals` (bước tiếp theo), `20.5-text-regex-processing`
> (regex dùng để nhận dạng token), `23.3-regex-internals` (engine bên dưới).

---

## 🎯 Vấn Đề

Parser không muốn xử lý chuỗi ký tự thô — quá rối. Muốn làm việc với các đơn vị
có ý nghĩa: `let`, `x`, `=`, `42`, `;`. Việc tách này cần quy tắc: `42abc` là
1 token hay 2? `<=` là 1 token hay `<` + `=`? Lexer trả lời câu hỏi này.

```
"let age = 42;"
  ↓ LEXER
[Keyword "let"] [Identifier "age"] [Assign] [Number 42] [Semicolon]
  ── whitespace bị bỏ, comment bị bỏ, chỉ giữ cái có ý nghĩa
```

---

## 🧠 Cấu Trúc Một Token

```
interface Token {
  type: "NUMBER" | "IDENT" | "OP" | "PUNCT" | ...   // loại token
  value: string       // nguyên văn: "42", "+"
  line: number        // vị trí — bắt buộc cho báo lỗi & sourcemap
  column: number
}
```

Quy tắc tách token = **longest match**: quét từ vị trí hiện tại, ăn chuỗi dài nhất
khớp 1 loại token. `>=` phải là 1 token, không tách thành `>` + `=`.

---

## 💻 Code Ví Dụ

```typescript
// ===== Mini lexer cho biểu thức toán =====
type TokenType = "NUM" | "IDENT" | "OP" | "LPAREN" | "RPAREN";
interface Token { type: TokenType; value: string; pos: number }

function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; } // bỏ khoảng trắng
    if (/\d/.test(input[i])) {
      // quét CẢ CHUỖI số — không tách "123" thành 1,2,3 (longest match)
      let j = i;
      while (j < input.length && /\d/.test(input[j])) j++;
      tokens.push({ type: "NUM", value: input.slice(i, j), pos: i });
      i = j;
    } else if ("+-*/".includes(input[i])) {
      tokens.push({ type: "IDENT", value: input[i], pos: i }); // (đơn giản hóa)
      i++;
    } else if (input[i] === "(" || input[i] === ")") {
      tokens.push({ type: input[i] === "(" ? "LPAREN" : "RPAREN", value: input[i], pos: i });
      i++;
    } else {
      throw new Error(`Ký tự lạ tại ${i}: "${input[i]}"`);
    }
  }
  return tokens;
}
// Input "12+34" → [{num,"12"},{plus},{num,"34"}] — sai sót phổ biến: tách "1","2","+"
```

```typescript
// ===== Tokenizer dùng regex (thực chiến JS) =====
const TOKEN_SPEC: Array<[TokenType, RegExp]> = [
  ["NUM", /^\d+/],
  ["IDENT", /^[a-zA-Z_]\w*/],
  ["OP", /^[+\-*/]/],
  ["WS", /^\s+/],   // bỏ qua whitespace
];

function tokenize(src: string): Array<{ type: TokenType; value: string }> {
  const out: Array<{ type: TokenType; value: string }> = [];
  let rest = src;
  while (rest.length > 0) {
    let matched = false;
    for (const [type, re] of TOKEN_SPEC) {
      const m = rest.match(re);
      if (m) {
        if (type !== "WS") out.push({ type, value: m[0] });
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) throw new Error(`Ký tự không hợp lệ: "${rest[0]}"`);
  }
  return out;
}
```

---

## ⚖️ Lexer Write-By-Hand vs Generator

| Cách | Ưu | Nhược |
|---|---|---|
| Viết tay (vòng lặp + switch) | kiểm soát 100%, dễ debug | tốn công |
| Generator (lex, flex, nearley) | chuẩn, đỡ bug | thêm build step |
| Regex per token | nhanh viết | khó lỗi pos, khó mở rộng |

---

## ⚠️ Bẫy Thường Gặp

1. **Tách từng ký tự thay vì longest match** — `<=` tách thành `<` + `=` sai ngữ nghĩa.
2. **Quên track line/column** — lỗi báo sai vị trí, DX tệ.
3. **Không bỏ comment/whitespace sớm** — parser phải xử lý token rác.
4. **Dùng regex toàn bộ thay vì lexer** — regex lồng nhau khó debug hơn cả handwritten lexer.
5. **Lexer hiểu ngữ nghĩa** — phân loại `x` là biến hay hàm là VIỆC CỦA PARSER, không phải lexer.

---

## 📝 Bài Tập Tự Vấn

1. Viết lexer cho JSON: `{ "key": 123, "arr": [true, null] }` → tokens.
2. Thêm hỗ trợ chuỗi `"..."` có escape `\"` vào lexer — xử lý thế nào?
3. Tại sao token cần ghi `pos`? (gợi ý: báo lỗi + source map)

---

*Leaf thuộc [Lớp 23 — Text, Parsing & AST](../README.md)*
