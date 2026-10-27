# 🔮 4.7 Logic Programming (Lập Trình Logic)

> **Logic Programming** không ra lệnh "làm thế nào" — bạn khai báo **facts** (sự kiện đúng) và **rules** (luật suy luận), rồi đặt **query** (câu hỏi). Engine tự **suy luận** ra đáp án bằng **unification** + **backtracking**.

---

## 🎯 Vấn đề

Cùng bài toán "ai là ông nội của Tom?", 2 cách tư duy khác hẳn:

```
❌ IMPERATIVE — bạn viết thuật toán duyệt:
   for (p of parents) {
     if (p.child === "tom")
       for (g of parents)
         if (g.child === p.name && isMale(g.name)) return g.name;
   }

✅ LOGIC — bạn khai báo tri thức, engine tự tìm:
   parent(john, mary).  parent(mary, tom).  male(john).
   grandfather(X, Z) :- parent(X, Y), parent(Y, Z), male(X).
   ?- grandfather(Who, tom).   →  Who = john
```

**Ý tưởng cốt lõi:** chương trình = **tri thức (knowledge base)**. Chạy chương trình = **chứng minh (proof search)**.

---

## 📚 Facts, Rules, Queries

| Khái niệm | Ý nghĩa | Ví dụ Prolog |
|-----------|---------|--------------|
| **Fact** | Mệnh đề luôn đúng | `parent(tom, bob).` — Tom là cha/mẹ của Bob |
| **Rule** | `Head :- Body.` — Head đúng NẾU Body đúng | `grandparent(X,Z) :- parent(X,Y), parent(Y,Z).` |
| **Query** | Câu hỏi `?- goal.` — engine tìm binding thỏa mãn | `?- parent(tom, Who).` → `Who = bob` |
| **Variable** | Viết hoa (`X`, `Who`) — chỗ cần điền đáp án | `X`, `Y`, `Z` |
| **Atom** | Hằng viết thường — giá trị cụ thể | `tom`, `bob`, `red` |

```prolog
% --- facts: ai là cha/mẹ của ai, ai là nam ---
parent(tom, bob).
parent(bob, ann).
male(tom).
male(bob).

% --- rules: suy ra quan hệ mới từ facts ---
father(X, Y) :- parent(X, Y), male(X).
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).

% --- queries ---
?- father(tom, bob).        % true  (kiểm tra)
?- father(Who, bob).        % Who = tom  (tìm kiếm)
?- grandparent(GP, ann).    % GP = tom  (suy luận 2 bước)
```

> 💡 Dấu `.` kết thúc mệnh đề. `:-` đọc là "NẾU" (neck). Query bắt đầu bằng `?-`.

---

## 🔗 Unification (Hợp Nhất) — Trái Tim Của Engine

**Unification** = tìm cách gán biến sao cho 2 term **trở nên giống nhau**. Mọi query đều được giải bằng unification lặp đi lặp lại.

```
unify(parent(tom, X), parent(tom, bob))
→ X = bob   ✅ (gán X, 2 term giống nhau)

unify(parent(tom, X), parent(ann, bob))
→ ❌ FAIL (tom ≠ ann, không cách nào gán cho giống)

unify(grandparent(GP, ann), grandparent(X, Z))
→ GP = X, Z = ann   ✅ (đổi tên biến cũng là unification)
```

**Quy tắc (3 dòng là đủ hiểu):**

| Trường hợp | Kết quả |
|------------|---------|
| atom vs atom | Giống nhau → ok; khác nhau → FAIL |
| biến vs bất kỳ | Gán biến = term kia (nếu chưa gán; nếu đã gán thì unify tiếp giá trị cũ) |
| compound `f(a...)` vs `f(b...)` | Cùng tên + cùng số args → unify từng cặp; khác → FAIL |

**Backtracking:** khi 1 rule có nhiều facts khớp (vd `parent(X,Y)` khớp 2 facts), engine thử **từng lựa chọn**, nếu nhánh sau FAIL thì **quay lui** thử nhánh khác — đó là cách query trả về **nhiều đáp án**.

---

## 💻 Mini Solver Thuần TS

Engine trong [`examples/index.ts`](examples/index.ts) cài đặt đúng 3 ý trên, không deps ngoài:

```typescript
// Term: atom (string thường) | biến (?X) | compound on(?X, ?Y)
type Term = string | { var: string } | { fn: string; args: Term[] };

// Unification cốt lõi
function unify(a: Term, b: Term, subst: Subst): Subst | null {
  a = walk(a, subst);   // lần theo binding đã có
  b = walk(b, subst);
  if (isVar(a)) return bind(a, b, subst);   // biến → gán
  if (isVar(b)) return bind(b, a, subst);
  if (typeof a === "string") return a === b ? subst : null;
  if (typeof b === "string" || a.fn !== b.fn || a.args.length !== b.args.length) return null;
  for (let i = 0; i < a.args.length; i++) { // unify từng cặp arg
    const next = unify(a.args[i], b.args[i], subst);
    if (next === null) return null;         // 1 cặp fail → cả goal fail
    subst = next;
  }
  return subst;
}
```

Query = chứng minh từng goal bằng backtracking, thu thập mọi substitution thành công:

```typescript
// Demo 1 — family: parent/male facts + father/grandparent/sibling rules
query("grandparent", ["?GP", "ann"]);  // → ?GP = tom
query("sibling", ["bob", "?S"]);       // → ?S = liz (nhờ rule + bất đẳng thức)

// Demo 2 — block world: on(a,table), on(b,a) + rule above bắc cầu
query("above", ["?X", "table"]);       // → ?X = a, ?X = b (backtracking ra 2 đáp án)
query("clear", ["?X"]);                // → khối nào không bị đè
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧠 **Gần ngôn ngữ con người** | Luật nghiệp vụ viết như câu nói ("X là cha của Y nếu...") |
| 🔍 **Tìm kiếm tự động** | Không viết thuật toán duyệt — engine backtracking lo |
| 📖 **Dễ thêm tri thức** | Thêm fact mới là có đáp án mới, không sửa code cũ |
| 🧪 **Quan hệ nhiều chiều** | Cùng rule vừa kiểm tra, vừa tìm kiếm, vừa liệt kê |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐢 **Hiệu năng khó đoán** | Backtracking mù có thể bùng nổ tổ hợp với KB lớn |
| 🔁 **Vòng lặp vô hạn** | Rule đệ quy sai thứ tự (`p(X) :- p(X).`) treo engine |
| 🧮 **Không hợp tính toán số** | Vòng lặp số học, IO, state — imperative/OOP làm tốt hơn |
| 📉 **Ít dùng production** | Chủ yếu ở AI planning, type checker, luật nghiệp vụ (Datalog, miniKanren) |

---

## 🔗 Liên quan

- **4.5 Declarative vs Imperative** — Logic là declarative ở mức cực đoan (chỉ WHAT thuần tri thức)
- **4.2 Functional Programming** — Pattern matching trong FP (Haskell/Elixir) chính là unification đơn giản hóa
- **5.12.2 Pure Functions** — Rules không side effect, giống hàm thuần

---

## 📚 Tài liệu tham khảo

- 📖 [Learn Prolog Now! (free)](https://www.learnprolognow.org/)
- 📖 [Prolog — Wikipedia](https://en.wikipedia.org/wiki/Prolog)
- 📖 [The Reasoned Schemer (miniKanren)](https://mitpress.mit.edu/books/reasoned-schemer)

---

## ▶️ Chạy ví dụ

```bash
cd 04-paradigms/4.7-logic-programming
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [4.8 Generic Programming](../4.8-generic-programming/README.md)
