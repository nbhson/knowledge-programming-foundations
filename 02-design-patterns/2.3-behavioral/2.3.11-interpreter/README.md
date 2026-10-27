# 🧮 2.3.11 Interpreter Pattern

> Định nghĩa **grammar (văn phạm)** của ngôn ngữ mini bằng các class — rồi **interpret (diễn giải)** câu lệnh thành kết quả.

---

## 🎯 Vấn đề

Bạn cần xử lý **ngôn ngữ mini / biểu thức có cấu trúc** (công thức `a + b * 2`, rule engine, query filter) mà không muốn kéo cả parser-generator nặng nề. Cách nhanh (`eval`, regex chắp vá) thì **nguy hiểm và rối**:

```
❌ Không Interpreter — eval / regex chắp vá
eval("a + b * 2"); // ⚠️ chạy code tùy ý — lỗ hổng bảo mật
// Regex tách toán hạng? Không xử lý được ưu tiên *, ngoặc, biến...
// Thêm toán tử mới → sửa regex rối rắm, dễ vỡ. ❌

// ✅ GIẢI PHÁP: mỗi quy tắc grammar = 1 class Expression,
//    biểu thức phức = cây Expression, interpret(context) đệ quy
new Add(new Var("a"), new Multiply(new Var("b"), new Num(2)))
  .interpret({ a: 3, b: 4 }); // 3 + 4*2 = 11 ✅
```

**Bản chất Interpreter:** mô hình hóa **grammar** thành hierarchy class (Terminal: số/biến; Nonterminal: cộng/trừ/nhân), mỗi class biết cách **tự diễn giải** mình trong 1 `Context` (map biến → giá trị). Parse 1 lần → cây → interpret nhiều lần với context khác nhau.

**Scenario điển hình:** expression evaluator, rule engine (`age > 18 AND vip`), filter/search query, macro/template đơn giản, DSL nội bộ.

**Phân biệt Interpreter vs Visitor vs Command:**
- **Interpreter:** diễn giải **ngôn ngữ/grammar** thành kết quả (có cây cú pháp + context).
- **Visitor** (2.3.10): thêm **operation** trên structure có sẵn (AST của Interpreter có thể dùng Visitor để interpret).
- **Command** (2.3.3): đóng gói **1 hành động** để gọi/undo (không có grammar).

---

## 🧩 Cấu trúc

```
┌──────────────────────────────────────────────────────┐
│  AbstractExpression (Expression)                      │
│  ─ interpret(context: Context): number                │
│         ▲                    ▲                       │
│  TerminalExpression   NonterminalExpression          │
│  ─ Num (số literal)   ─ Add (left + right)           │
│  ─ Var (biến → tra   ─ Subtract (left - right)      │
│    context)             ─ Multiply (left * right)    │
│                                                      │
│  Context                                          │
│  ─ Map<string, number> (biến → giá trị)              │
│                                                      │
│  Client                                             │
│  ─ dựng cây Expression (parse 1 lần)                 │
│  ─ interpret(context) nhiều lần                      │
└──────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Cây cho "a + b * 2":        Add
                           /   \
                        Var(a)  Multiply
                                /      \
                             Var(b)   Num(2)
interpret({a:3, b:4}): Add → 3 + Multiply → 3 + (4*2) = 11
// Đệ quy từ lá lên gốc; đổi context → kết quả khác, không parse lại
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Context — biến → giá trị
type Context = Map<string, number>;

// AbstractExpression
interface Expression {
  interpret(ctx: Context): number;
}

// Terminal — số literal
class Num implements Expression {
  constructor(private value: number) {}
  interpret(_ctx: Context): number { return this.value; }
}

// Terminal — biến, tra trong context
class Var implements Expression {
  constructor(private name: string) {}
  interpret(ctx: Context): number {
    const v = ctx.get(this.name);
    if (v === undefined) throw new Error(`Biến chưa gán: ${this.name}`);
    return v;
  }
}

// Nonterminal — cộng
class Add implements Expression {
  constructor(private left: Expression, private right: Expression) {}
  interpret(ctx: Context): number {
    return this.left.interpret(ctx) + this.right.interpret(ctx);
  }
}

// Nonterminal — nhân
class Multiply implements Expression {
  constructor(private left: Expression, private right: Expression) {}
  interpret(ctx: Context): number {
    return this.left.interpret(ctx) * this.right.interpret(ctx);
  }
}

// Client — "a + b * 2" với { a: 3, b: 4 } = 11
const expr: Expression = new Add(
  new Var('a'),
  new Multiply(new Var('b'), new Num(2)),
);
console.log(expr.interpret(new Map([['a', 3], ['b', 4]]))); // 11
```

**Real-world example — rule engine:**

```typescript
// Grammar: And(Condition, Condition), Or(...), GreaterThan(field, value)
// Context: record user { age, vip, ... }
// Rule "age > 18 AND vip" = cây rule → interpret(user) → true/false
interface Rule { check(user: Map<string, number | boolean>): boolean; }
class And implements Rule {
  constructor(private l: Rule, private r: Rule) {}
  check(u: Map<string, number | boolean>): boolean {
    return this.l.check(u) && this.r.check(u);
  }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 📝 **Grammar thành code** | Mỗi quy tắc = 1 class rõ ràng | Thêm toán tử `Power` = thêm 1 class — không đụng parser rối. |
| 🔄 **Parse 1 lần, chạy N lần** | Cây dựng xong → interpret với context khác nhau | Đổi giá trị biến không cần parse lại — nhanh cho rule/filter lặp lại. |
| 🧩 **Kết hợp tự do** | Expression lồng nhau tùy ý | Cây đệ quy biểu diễn mọi biểu thức phức tạp từ vài class đơn giản. |
| 🛡️ **An toàn hơn eval** | Chỉ interpret đúng grammar cho phép | Không chạy code tùy ý — chặn lỗ hổng injection của `eval`. |
| 🧪 **Test từng quy tắc** | Mỗi class test độc lập | Test `Add`, `Var` riêng rồi mới test cây lớn. |

---

## ⚠️ Lưu Ý

| Lưu ý | Giải thích | Giảm thiểu |
|-------|------------|------------|
| 📝 **Bùng nổ class** | Mỗi quy tắc 1 class → grammar lớn = hàng chục class | Chỉ dùng cho **ngôn ngữ mini**; grammar lớn → dùng parser generator (PEG, ANTLR). |
| 🐢 **Hiệu năng** | Cây + đệ quy chậm hơn code biên dịch | Biểu thức chạy ít / rule đơn giản thì ổn; hot path → biên dịch sang function. |
| 🌳 **Cây sâu → stack overflow** | Đệ quy sâu với biểu thức khổng lồ | Giới hạn độ sâu parse; hoặc interpret bằng stack lặp. |
| 🔧 **Chưa có parser sẵn** | Pattern chỉ lo interpret — vẫn cần code parse text → cây | Viết tokenizer/parser mini riêng, hoặc dựng cây trực tiếp như ví dụ. |
| 📚 **Khó bảo trì khi phình** | Thêm ưu tiên toán tử, ngoặc, function... | Khi grammar vượt ~10 quy tắc → chuyển sang công cụ parser thật. |

---

## 🎯 Khi nào dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Ngôn ngữ mini: công thức, rule, filter (`age > 18 AND vip`) | ✅ Rất phù hợp | Use case kinh điển của Interpreter. |
| Expression evaluator nhúng trong app | ✅ Phù hợp | An toàn hơn `eval`, linh hoạt hơn hard-code. |
| DSL nội bộ ít quy tắc (< ~10) | ✅ Phù hợp | Class-per-rule vẫn gọn. |
| Grammar lớn (SQL, ngôn ngữ lập trình) | ❌ Dùng parser generator | Class-per-rule bùng nổ — cần ANTLR/PEG. |
| Chỉ tính 1 lần, biểu thức cố định | ⚠️ Function thường đủ | Không cần cả grammar + cây. |
| Hiệu năng cực quan trọng (hot loop) | ⚠️ Cân nhắc | Interpret chậm hơn code compile — đo trước. |

---

## 🔗 Liên quan

- **2.3.10 Visitor** — Cây AST của Interpreter có thể dùng Visitor: mỗi `visitX` = 1 quy tắc interpret (tách interpret khỏi node).
- **2.2.5 Composite** — Cây Expression chính là Composite (Nonterminal chứa Expression con).
- **2.3.6 Iterator** — Duyệt cây cú pháp khi parse/interpret.
- **2.1.4 Builder** — Builder dựng cây Expression từng bước khi parse.
- **Parser Generator (ANTLR, PEG.js)** — Giải pháp thay thế khi grammar lớn.

**Interpreter trong TypeScript thực tế:**
- Filter/query builder: `where("age").gt(18).and(...)` → cây → SQL
- Excel-like formula evaluator trong web app
- i18n ICU MessageFormat (`{count, plural, ...}` → cây → render)

---

## 📁 Cấu trúc thư mục

```
2.3.11-interpreter/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.11-interpreter
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu

- 📖 [Interpreter - Refactoring Guru](https://refactoring.guru/design-patterns/interpreter)
- 📖 [Interpreter - Source Making](https://sourcemaking.com/design_patterns/interpreter)
- 📖 [Design Patterns - GoF (Interpreter chapter)](https://en.wikipedia.org/wiki/Interpreter_pattern)

---

## ⏭️ Bài tiếp theo

→ [03 Principles](../../../03-principles/README.md)
