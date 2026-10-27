# 🌳 Lớp 23: Text, Parsing & AST (Phân Tích Văn Bản)

> **Mỗi lần bạn dùng linter, ORM, config file, route path, hay template engine —
> có một parser đang chạy.** Hiểu lexer → parser → AST là hiểu cách máy đọc
> ngôn ngữ con người viết ra: nền của compiler, linter, syntax highlight,
> và cả MCP tool calling.

> Liên quan: `18.5-compilers-interpreters` (mini evaluator), `20.5-text-regex-processing`
> (regex = 1 dạng nhận dạng pattern đơn giản), `18.1-operating-systems` (tệp tin).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 23.1 | Lexing & Tokenization | Tách chuỗi → token | [23.1-lexing-tokenization](23.1-lexing-tokenization/README.md) |
| 23.2 | Parsing Fundamentals | Grammar, recursive descent, AST | [23.2-parsing-fundamentals](23.2-parsing-fundamentals/README.md) |
| 23.3 | Regex Internals | NFA/DFA, backtracking, ReDoS | [23.3-regex-internals](23.3-regex-internals/README.md) |
| 23.4 | Schema & Validation | JSON Schema, Zod, data validation | [23.4-schema-validation](23.4-schema-validation/README.md) |

---

## 📖 Tổng Quan

```
TEXT "2 + 3 * 4"
     │
     ▼  LEXER (23.1)
TOKENS: [num(2), plus, num(3), star, num(4)]
     │
     ▼  PARSER (23.2)
AST:        (+)
           /   \
        (2)    (*)
              /   \
            (3)   (4)
     │
     ▼
EVALUATOR / TRANSFORMER / LINTER
→ 14  (tính toán, tối ưu, kiểm tra, code-gen...)
```

**Tại sao quan trọng:** mọi công cụ dev đều chạy pipeline này — TypeScript compiler,
ESLint, Prettier, Prisma schema parser, Markdown renderer, template engine.

---

## 🔗 Liên Kết Chéo

- **Evaluator mini:** `18.5-compilers-interpreters`
- **Regex engine bên trong:** `23.3-regex-internals`
- **Serialize format schema:** `20.4-serialization-formats`

---

## 📖 Tài Nguyên Tham Khảo

- *Crafting Interpreters* — Robert Nystrom (free online, kinh điển)
- *Parsing Techniques* — Grune & Jacobs
- AST Explorer (astexplorer.net) — xem AST trực tiếp trong trình duyệt
