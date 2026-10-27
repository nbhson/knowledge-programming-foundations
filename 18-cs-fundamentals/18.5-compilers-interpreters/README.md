# 🔧 18.5 Compilers & Interpreters (Biên Dịch & Thông Dịch)

> **Mọi code bạn viết đều đi qua 3 cửa:** tách chữ thành token (lex),
> dựng cây cú pháp (parse), rồi thực thi (eval) — hiểu pipeline này là hiểu mọi ngôn ngữ.

---

## 🎯 Vấn Đề

Vì sao lỗi cú pháp báo đúng dòng/cột? Vì sao `2 + 3 * 4 = 14` chứ không phải 20? Vì sao cùng một
đoạn code mà trình duyệt báo lỗi khác Node? Vì mỗi implementation đều lex → parse → eval theo grammar
riêng, với độ ưu tiên toán tử và thông điệp lỗi riêng. Hiểu pipeline giúp bạn đọc lỗi nhanh và thậm chí
tự viết mini-language (công thức Excel, rule engine, agent calculator an toàn).

```
"2 + 3 * 4" ──LEX──► [2][+][3][*][4] ──PARSE──► (+ 2 (* 3 4)) ──EVAL──► 14
```

---

## 💻 Code Ví Dụ

```typescript
// Mini expression evaluator: lex → parse → eval, hỗ trợ + - * / và ngoặc
type Token = { type: "num" | "op" | "paren"; value: string };

function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " ") { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) num += input[i++];
      tokens.push({ type: "num", value: num });
    } else if ("+-*/".includes(ch)) {
      tokens.push({ type: "op", value: ch }); i++;
    } else if ("()".includes(ch)) {
      tokens.push({ type: "paren", value: ch }); i++;
    } else {
      throw new Error(`Ký tự lạ tại vị trí ${i}: '${ch}'`);
    }
  }
  return tokens;
}

// Parser ưu tiên: expr (+ -) → term (* /) → factor (số/ngoặc) — đệ quy xuống
// (xem implementation đầy đủ trong examples/index.ts)
function evaluate(input: string): number {
  const tokens = lex(input);
  let pos = 0;
  function parseExpr(): number {
    let v = parseTerm();
    while (tokens[pos]?.value === "+" || tokens[pos]?.value === "-") {
      const op = tokens[pos++].value;
      v = op === "+" ? v + parseTerm() : v - parseTerm();
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (tokens[pos]?.value === "*" || tokens[pos]?.value === "/") {
      const op = tokens[pos++].value;
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new Error("Chia cho 0");
      v = op === "*" ? v * rhs : v / rhs;
    }
    return v;
  }
  function parseFactor(): number {
    const t = tokens[pos++];
    if (t?.type === "num") return parseFloat(t.value);
    if (t?.value === "(") {
      const v = parseExpr();
      if (tokens[pos++]?.value !== ")") throw new Error("Thiếu dấu )");
      return v;
    }
    throw new Error("Biểu thức không hợp lệ");
  }
  return parseExpr();
}
```

> Lexer/parser/evaluator đầy đủ + AST in đẹp + test cases trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Hiểu biết | Lợi ích |
|---|---|
| Lex/parse/eval | Đọc lỗi cú pháp nhanh, hiểu độ ưu tiên toán tử |
| Viết evaluator riêng | Parser công thức, rule engine, calculator an toàn (thay `eval`) |
| Compiler vs interpreter | Hiểu vì sao TS cần build, Python chạy trực tiếp, JIT là gì |
| AST mental model | Hiểu ESLint/Babel/refactor-tool hoạt động ra sao |

---

## ⚠️ Lưu Ý

- **Không dùng `eval()`/`Function()` cho input người dùng** — mini-evaluator ở trên chính là thay thế an toàn.
- Parser đệ quy đơn giản đủ cho biểu thức; ngôn ngữ thật cần xử lý lỗi phục hồi, source-map, optimization passes.
- Chia cho 0 và tràn số vẫn phải xử lý tường minh ngay cả trong evaluator tự viết.

---

## 🎯 Khi Nào Dùng

- Cần ô công thức/điều kiện do user nhập (discount rule, filter builder): viết evaluator thay vì `eval`.
- Viết linter/codemod/preset: thao tác trên AST (Babel, ESLint).
- Agent cần tool tính toán an toàn (→ 17.5): evaluator này là ứng viên sáng giá.

---

## 🔗 Liên Quan

- [17.5 AI Agents](../17-ai-llm-engineering/17.5-ai-agents/README.md) — calculator tool an toàn cho agent.
- [04-paradigms](../../04-paradigms/README.md) — interpreter pattern và declarative DSL.
- [18.3 Encoding Data](../18.3-encoding-data/README.md) — source text cũng là byte/charset trước khi lex.

---

## 📚 Tài Liệu

- 📖 *Crafting Interpreters* — Robert Nystrom (miễn phí online)
- 📖 *Structure and Interpretation of Computer Programs* (SICP) — Abelson & Sussman
- 📖 [Crafting Interpreters Online](https://craftinginterpreters.com/)

---

## ⏭️ Bài Tiếp Theo

→ [Lớp 19: Frontend Performance](../../19-frontend-performance/README.md)
