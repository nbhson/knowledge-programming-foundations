/**
 * 5.12.5 Function Composition — Pipe / Compose Utility + Mini Pipeline Demo
 *
 *   compose(f, g, h)(x) = f(g(h(x)))   — trái sang phải (đọc từ phải)
 *   pipe(f, g, h)(x)    = h(g(f(x)))   — phải sang trái (đọc từ trái)
 *
 * Dùng để ghép các hàm nhỏ, pure thành pipeline xử lý dữ liệu.
 *
 * KHÔNG dùng lib ngoài — TS thuần.
 */

// ─────────────────────────── Utilities ───────────────────────────

// compose: f sau g — áp dụng từ phải qua trái
function compose2<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (x) => f(g(x));
}

// pipe: f trước g — áp dụng từ trái qua phải (đọc tự nhiên)
function pipe2<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
  return (x) => g(f(x));
}

// ─────────────────────────── Các hàm nhỏ (pure) ───────────────────────────

const trim3 = (s: string): string => s.trim();
const removePunct = (s: string): string => s.replace(/[.,!?]/g, "");
const lower = (s: string): string => s.toLowerCase();
const slugifyWord = (s: string): string => s.replace(/\s+/g, "-");

// ─────────────────────────── Pipeline xử lý text ───────────────────────────

// pipeline: trim → lower → slugify (đọc từ trái dễ hiểu)
const toSlug = pipe2(
  pipe2(trim3, lower),
  slugifyWord,
);

// ─────────────────────────── Pipeline nạp tiền (mini đơn hàng) ───────────────────────────

interface MoneyInput {
  amount: number;
  currency: string;
}

const applyDiscount = (pct: number) => (input: MoneyInput): MoneyInput => ({
  ...input,
  amount: input.amount * (1 - pct),
});

const addTax = (rate: number) => (input: MoneyInput): MoneyInput => ({
  ...input,
  amount: input.amount * (1 + rate),
});

const roundMoney = (input: MoneyInput): MoneyInput => ({
  ...input,
  amount: Math.round(input.amount * 100) / 100,
});

const formatMoney = (input: MoneyInput): string => `${input.currency} ${input.amount.toFixed(2)}`;

// pipeline: discount 10% → tax 8% → round → format
const finalPrice = pipe2(
  pipe2(pipe2(applyDiscount(0.1), addTax(0.08)), roundMoney),
  formatMoney,
);

// ─────────────────────────── Compose version (đảo chiều) ───────────────────────────

const greetName = (name: string): string => `Xin chào, ${name}!`;
const toTitleCase = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase());

// compose: áp dụng trim3 → toTitleCase → greetName
const greet = compose2(greetName, compose2(toTitleCase, trim3));

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Function Composition Demo ===");
  console.log("");

  console.log("1️⃣ Utilities — compose & pipe:");
  console.log(`  compose(f, g)(x) = f(g(x)); pipe(f, g)(x) = g(f(x))`);
  console.log("");

  console.log("2️⃣ Pipeline slug từ chuỗi lộn xộn:");
  const slug = toSlug("  Học Lập Trình, TypeScript!  ");
  console.log(`  toSlug(\"  Học Lập Trình, TypeScript!  \") = \"${slug}\"`);
  console.log(`  (trim → lower → replace space = '-')`);
  console.log("");

  console.log("3️⃣ Pipeline đơn hàng — 10% off → 8% tax → round → format:");
  const price = finalPrice({ amount: 100, currency: "$" });
  console.log(`  finalPrice({amount:100, currency:\"$\"}) = ${price}`);
  console.log(`  (100 → 90 → 97.2 → 97.2 → \"$ 97.20\")`);
  console.log("");

  console.log("4️⃣ Pipeline tái sử dụng cho giá khác:");
  const price2 = finalPrice({ amount: 250, currency: "₫" });
  console.log(`  finalPrice({amount:250, currency:\"₫\"}) = ${price2}`);
  console.log("");

  console.log("5️⃣ compose (đọc từ phải):");
  console.log(`  greet(\"  john doe  \") = ${greet("  john doe  ")}`);
  console.log(`  (trim → title case → greet)`);
  console.log("");

  console.log("✅ Composition: pipe/compose ghép hàm nhỏ thành pipeline — mỗi khâu một việc, dễ test");
}

run();
export {};