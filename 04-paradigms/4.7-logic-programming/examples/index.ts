/**
 * 4.7 Logic Programming — facts/rules/unification + mini solver thuần TS
 *
 * Minh họa:
 * - Tri thức = facts (đúng hiển nhiên) + rules (Head :- Body)
 * - Unification: gán biến sao cho 2 term giống nhau (trái tim engine)
 * - Query: chứng minh goals bằng backtracking, thu mọi đáp án
 * - Demo 1: family (father/grandparent/sibling)
 * - Demo 2: block world (above bắc cầu, clear)
 *
 * Không deps ngoài — TS thuần.
 */

// ─────────────────────────── Term & substitution ───────────────────────────

/** Biến logic: tên bắt đầu bằng "?" (?X, ?Who). Atom là string thường. */
interface LpVar {
  var: string;
}

/** Compound: fn(args), ví dụ on(a, table). */
interface LpFun {
  fn: string;
  args: LpTerm[];
}

type LpTerm = string | LpVar | LpFun;

/** Substitution: ánh xạ tên biến → term đã gán. */
type Subst = Map<string, LpTerm>;

function isVar(t: LpTerm): t is LpVar {
  return typeof t === "object" && "var" in t;
}

/** Lần theo binding: ?X → giá trị đã gán (dây chuyền ?X → ?Y → tom). */
function walk(t: LpTerm, subst: Subst): LpTerm {
  let cur = t;
  while (isVar(cur) && subst.has(cur.var)) {
    cur = subst.get(cur.var) as LpTerm;
  }
  return cur;
}

/**
 * Unification: tìm substitution để a và b giống nhau.
 * Trả về substitution mới khi thành công, null khi FAIL.
 */
function unify(a: LpTerm, b: LpTerm, subst: Subst): Subst | null {
  const x = walk(a, subst);
  const y = walk(b, subst);
  if (isVar(x)) {
    const next = new Map(subst);
    next.set(x.var, y);
    return next;
  }
  if (isVar(y)) {
    const next = new Map(subst);
    next.set(y.var, x);
    return next;
  }
  if (typeof x === "string" || typeof y === "string") {
    return typeof x === "string" && typeof y === "string" && x === y ? subst : null;
  }
  if (x.fn !== y.fn || x.args.length !== y.args.length) return null;
  let cur = subst;
  for (let i = 0; i < x.args.length; i++) {
    const next = unify(x.args[i], y.args[i], cur);
    if (next === null) return null;
    cur = next;
  }
  return cur;
}

/** Đọc giá trị hiển thị của term sau khi áp substitution. */
function render(t: LpTerm, subst: Subst): string {
  const v = walk(t, subst);
  if (isVar(v)) return v.var;
  if (typeof v === "string") return v;
  return `${v.fn}(${v.args.map((a) => render(a, subst)).join(", ")})`;
}

// ─────────────────────────── Knowledge base ───────────────────────────

interface LpGoal {
  pred: string;
  args: LpTerm[];
}

interface LpRule {
  head: LpGoal;
  body: LpGoal[];
}

/** Fact = rule không có body. */
function fact(pred: string, ...args: LpTerm[]): LpRule {
  return { head: { pred, args }, body: [] };
}

function v(name: string): LpVar {
  return { var: name };
}

class KnowledgeBase {
  private rules: LpRule[] = [];

  addFact(pred: string, ...args: LpTerm[]): void {
    this.rules.push(fact(pred, ...args));
  }

  addRule(head: LpGoal, ...body: LpGoal[]): void {
    this.rules.push({ head, body });
  }

  /** Facts thô của 1 predicate (dùng cho phủ định theo closed-world). */
  rawFacts(pred: string): LpGoal[] {
    return this.rules.filter((r) => r.head.pred === pred && r.body.length === 0).map((r) => r.head);
  }

  /**
   * Query: chứng minh goals bằng backtracking, trả về mọi substitution.
   * Giới hạn depth chống rule đệ quy vô hạn.
   */
  query(goals: LpGoal[], depthLimit = 50): Subst[] {
    const out: Subst[] = [];
    const prove = (pending: LpGoal[], subst: Subst, depth: number): void => {
      if (depth > depthLimit || out.length >= 100) return;
      if (pending.length === 0) {
        out.push(subst);
        return;
      }
      const [first, ...rest] = pending;
      // Built-in bất đẳng thức: neq(X, Y) đúng khi 2 term KHÔNG unify được
      if (first.pred === "neq" && first.args.length === 2) {
        if (unify(first.args[0], first.args[1], subst) === null) {
          prove(rest, subst, depth + 1);
        }
        return;
      }
      for (const rule of this.rules) {
        if (rule.head.pred !== first.pred || rule.head.args.length !== first.args.length) continue;
        // Đổi tên biến của rule mỗi lần dùng (tránh đụng biến của query)
        const fresh = this.freshen(rule);
        const unified = unifyGoal(fresh.head, first, subst);
        if (unified !== null) {
          prove([...fresh.body, ...rest], unified, depth + 1); // thử nhánh này; hết thì quay lui nhánh khác
        }
      }
    };
    prove(goals, new Map(), 0);
    return out;
  }

  private counter = 0;

  /** Đổi tên biến trong rule thành ?Tên_n duy nhất. */
  private freshen(rule: LpRule): LpRule {
    this.counter++;
    const rename = (t: LpTerm): LpTerm => {
      if (isVar(t)) return v(`${t.var}_${this.counter}`);
      if (typeof t === "string") return t;
      return { fn: t.fn, args: t.args.map(rename) };
    };
    const goal = (g: LpGoal): LpGoal => ({ pred: g.pred, args: g.args.map(rename) });
    return { head: goal(rule.head), body: rule.body.map(goal) };
  }
}

function unifyGoal(head: LpGoal, goal: LpGoal, subst: Subst): Subst | null {
  let cur: Subst | null = subst;
  for (let i = 0; i < head.args.length && cur !== null; i++) {
    cur = unify(head.args[i], goal.args[i], cur);
  }
  return cur;
}

function goal(pred: string, ...args: LpTerm[]): LpGoal {
  return { pred, args };
}

// ─────────────────────────── Demo 1: family ───────────────────────────

function buildFamily(): KnowledgeBase {
  const kb = new KnowledgeBase();
  kb.addFact("parent", "tom", "bob");
  kb.addFact("parent", "tom", "liz");
  kb.addFact("parent", "bob", "ann");
  kb.addFact("male", "tom");
  kb.addFact("male", "bob");
  kb.addFact("female", "liz");
  kb.addFact("female", "ann");

  // father(X, Y) :- parent(X, Y), male(X).
  kb.addRule(goal("father", v("?X"), v("?Y")), goal("parent", v("?X"), v("?Y")), goal("male", v("?X")));
  // grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
  kb.addRule(
    goal("grandparent", v("?X"), v("?Z")),
    goal("parent", v("?X"), v("?Y")),
    goal("parent", v("?Y"), v("?Z")),
  );
  // sibling(X, Y): cùng cha/mẹ nhưng không phải chính mình.
  kb.addRule(
    goal("sibling", v("?X"), v("?Y")),
    goal("parent", v("?P"), v("?X")),
    goal("parent", v("?P"), v("?Y")),
    goal("neq", v("?X"), v("?Y")),
  );
  return kb;
}

// ─────────────────────────── Demo 2: block world ───────────────────────────

function buildBlocks(): KnowledgeBase {
  const kb = new KnowledgeBase();
  // on(Block, Support): khối nào nằm trên cái gì (table = mặt bàn)
  kb.addFact("on", "a", "table");
  kb.addFact("on", "b", "a");
  kb.addFact("on", "c", "table");

  // above(X, Y): X nằm phía trên Y (trực tiếp hoặc gián tiếp — bắc cầu).
  kb.addRule(goal("above", v("?X"), v("?Y")), goal("on", v("?X"), v("?Y")));
  kb.addRule(
    goal("above", v("?X"), v("?Y")),
    goal("on", v("?X"), v("?Z")),
    goal("above", v("?Z"), v("?Y")),
  );
  return kb;
}

/** clear(X): không có khối nào nằm trên X (closed-world: facts on đã liệt kê hết). */
function clearBlocks(kb: KnowledgeBase, blocks: string[]): string[] {
  const supporters = new Set(kb.rawFacts("on").map((f) => render(f.args[1], new Map())));
  return blocks.filter((b) => !supporters.has(b));
}

// ─────────────────────────── main ───────────────────────────

function ask(kb: KnowledgeBase, label: string, g: LpGoal, show: LpTerm[]): void {
  console.log(`  ?- ${label}`);
  const answers = kb.query([g]);
  if (answers.length === 0) {
    console.log("    → false (không chứng minh được)");
    return;
  }
  if (show.length === 0) {
    console.log("    → true (chứng minh được, không cần gán biến)");
    return;
  }
  for (const s of answers) {
    console.log(`    → ${show.map((t) => `${render(t, new Map())} = ${render(t, s)}`).join(", ")}`);
  }
}

function main(): void {
  console.log("=== Logic Programming Demo (mini solver thuần TS) ===");
  console.log("");

  console.log("1️⃣ Unification — gán biến để 2 term giống nhau:");
  const u1 = unify({ fn: "parent", args: ["tom", v("?X")] }, { fn: "parent", args: ["tom", "bob"] }, new Map());
  console.log(`  unify(parent(tom, ?X), parent(tom, bob)) → ${u1 === null ? "FAIL" : "?X = " + render(v("?X"), u1)}`);
  const u2 = unify("tom", "ann", new Map());
  console.log(`  unify(tom, ann) → ${u2 === null ? "FAIL (atom khác nhau)" : "ok"}`);
  console.log("");

  console.log("2️⃣ Family — facts parent/male/female + rules father/grandparent/sibling:");
  const family = buildFamily();
  ask(family, "father(tom, bob).", goal("father", "tom", "bob"), []);
  ask(family, "father(?Who, bob).", goal("father", v("?Who"), "bob"), [v("?Who")]);
  ask(family, "grandparent(?GP, ann).", goal("grandparent", v("?GP"), "ann"), [v("?GP")]);
  ask(family, "sibling(bob, ?S).", goal("sibling", "bob", v("?S")), [v("?S")]);
  console.log("");

  console.log("3️⃣ Block world — on(a,table), on(b,a), on(c,table) + rule above bắc cầu:");
  const blocks = buildBlocks();
  ask(blocks, "above(?X, table).", goal("above", v("?X"), "table"), [v("?X")]);
  ask(blocks, "above(b, table).", goal("above", "b", "table"), []);
  console.log(`  clear = [${clearBlocks(blocks, ["a", "b", "c"]).join(", ")}] (không khối nào nằm trên)`);
  console.log("");

  console.log("✅ Logic: khai báo facts + rules, đặt query — engine unify + backtracking tìm đáp án.");
}

main();
export {};
