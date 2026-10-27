# 🌳 23.2 Parsing Fundamentals (Phân Tích Cú Pháp & AST)

> **Parser biến chuỗi token thành cây (AST)** — cấu trúc có "ngữ pháp" rõ ràng.
> AST là nơi mọi công cụ mạnh thật sự hoạt động: lint, format, optimize,
> code-gen, transpile. Hiểu parser = hiểu máy "đọc" code như thế nào.

> Liên quan: `23.1-lexing-tokenization` (đầu vào của parser), `18.5-compilers-interpreters`
> (evaluator), `20.1-discrete-mathematics` (grammar là định lý hình thức).

---

## 🎯 Vấn Đề

Token `[2, +, 3, *, 4]` — cộng trước hay nhân trước? Trình tự token không nói
lên thứ tự ưu tiên. Parser + **grammar** quyết định: `*` ràng buộc chặt hơn `+`
→ `2 + (3*4)`. Ngoài ra phải phát hiện chuỗi token sai ngữ pháp (syntax error).

```
Grammar (EBTG rút gọn):
  expr   → term (('+' | '-') term)*
  term   → factor (('*' | '/') factor)*
  factor → NUM | '(' expr ')'
→ trình tự priority nằm NGAY trong cấu trúc grammar
```

---

## 🧠 Recursive Descent: Kỹ Thuật Kinh Điển

```
Mỗi quy tắc grammar = 1 hàm.
  parseExpr  gọi parseTerm
  parseTerm  gọi parseFactor
  parseFactor xử lý NUM hoặc "(" parseExpr ")"
Đệ quy phản ánh cấu trúc lồng nhau — code đọc như grammar.
LL(1): nhìn 1 token kế là biết đi nhánh nào (predictive parsing)
```

---

## 💻 Code Ví Dụ

```typescript
// ===== AST node =====
type Node =
  | { kind: "num"; value: number }
  | { kind: "binop"; op: string; left: Node; right: Node };

// ===== Recursive descent parser cho biểu thức =====
function parse(tokens: Token[]): Node {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  // factor → NUM | '(' expr ')'
  function parseFactor(): Node {
    const t = next();
    if (t.type === "NUM") return { kind: "num", value: Number(t.value) };
    if (t.value === "(") {
      const inner = parseExpr();
      if (next().value !== ")") throw new Error("Thiếu dấu )");
      return inner;
    }
    throw new Error(`Không mong đợi token: ${t.value}`);
  }

  // term → factor (('*'|'/') factor)*
  function parseTerm(): Node {
    let left = parseFactor();
    while (peek()?.value === "*" || peek()?.value === "/") {
      const op = next().value;
      left = { kind: "binop", op, left, right: parseFactor() }; // ưu tiên cao
    }
    return left;
  }

  // expr → term (('+'|'-') term)*
  function parseExpr(): Node {
    let left = parseTerm();
    while (peek()?.value === "+" || peek()?.value === "-") {
      const op = next().value;
      left = { kind: "binop", op, left, right: parseTerm() }; // ưu tiên thấp
    }
    return left;
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Token thừa tại ${pos}`);
  return result;
}

// ===== Duyệt AST: evaluator (visitor pattern) =====
function evalNode(n: Node): number {
  switch (n.kind) {
    case "num": return n.value;
    case "binop": {
      const l = evalNode(n.left), r = evalNode(n.right);
      return n.op === "+" ? l + r : n.op === "-" ? l - r : n.op === "*" ? l * r : l / r;
    }
  }
}
// parse(lex("2+3*4")) → AST đúng → evalNode = 14
// AST kiểm chứng thứ tự ưu tiên: (2 + (3 * 4)) — không phải (2+3)*4
```

---

## ⚖️ Cách Parse

| Kỹ thuật | Nhận token từ trước? | Mạnh | Dùng ở |
|---|---|---|---|
| Recursive descent | LL(1) | code dễ đọc | hand-written parser |
| Table-driven (LR, LALR) | nhiều token | ngữ pháp rộng hơn | yacc, bison |
| Parser combinator | functional | linh hoạt, TS-friendly | parsec, parsimmon |
| Parser generator | declarative | ít bug | ANTLR, nearley |

---

## ⚠️ Bẫy Thường Gặp

1. **Priority sai** — đặt `+` lồng ngoài `*` là sai ngữ nghĩa. Grammar phải phản ánh precedence.
2. **Left recursion vô hạn:** `expr → expr + term` khiến recursive descent chạy vô hạn → đổi thành vòng lặp.
3. **AST quá gần token** — AST là CẤU TRÚC Ý NGHĨA, không giữ punctuation/whitespace.
4. **Không phát hiện token thừa** — parse xong quên check `pos === tokens.length`.
5. **Ambiguous grammar** — grammar cho phép 2 cách parse cùng input → parser tự chọn, reader không đoán được.

---

## 📝 Bài Tập Tự Vấn

1. Thêm `-` một ngôi (unary minus) vào parser trên.
2. Parse JSON: `{ "k": [1, {"nested": true}] }` → AST.
3. Vì sao linter (ESLint) làm việc trên AST chứ không trên text?

---

*Leaf thuộc [Lớp 23 — Text, Parsing & AST](../README.md)*
