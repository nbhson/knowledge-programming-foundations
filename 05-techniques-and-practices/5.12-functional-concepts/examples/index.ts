/**
 * 5.12 Functional Concepts — Overview Demo
 *
 * Minh họa 5 khái niệm cốt lõi của FP (áp dụng được cả trong code OOP):
 *   - Immutability       : không sửa dữ liệu cũ, luôn tạo bản mới
 *   - Pure function      : cùng input → cùng output, không side effect
 *   - Side effects       : cô lập IO ra một nơi, inject vào trong
 *   - Currying           : hàm nhiều tham số → chuỗi hàm 1 tham số
 *   - Function composition: ghép hàm nhỏ thành pipeline lớn
 *
 * KHÔNG dùng lib ngoài — TS thuần.
 */

// ─────────────────────────── Immutability ───────────────────────────

interface FpUserState {
  name: string;
  age: number;
  points: number;
}

function fpAddPoints(state: FpUserState, points: number): FpUserState {
  return { ...state, points: state.points + points };
}

// ─────────────────────────── Pure function ───────────────────────────

function fpPriceAfterTax(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}

// ─────────────────────────── Side effect (injected) ───────────────────────────

type FpEmitter = (message: string) => void;

function fpNotify(event: string, emit: FpEmitter): void {
  emit(`Event: ${event}`);
}

// ─────────────────────────── Currying ───────────────────────────

const fpFormatter = (prefix: string) => (amount: number) => `${prefix}${amount.toFixed(2)}`;

// ─────────────────────────── Composition ───────────────────────────

function fpCompose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (x) => f(g(x));
}

const fpTrim = (s: string) => s.trim();
const fpLower = (s: string) => s.toLowerCase();
const fpSlug = fpCompose(fpLower, (s: string) => s.replace(/\s+/g, "-"));

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Functional Concepts Demo ===");
  console.log("");

  console.log("1️⃣ Immutability — cập nhật tạo object mới:");
  const current: FpUserState = { name: "John", age: 25, points: 10 };
  const upgraded = fpAddPoints(current, 50);
  console.log(`  trước=${JSON.stringify(current)}`);
  console.log(`  sau  =${JSON.stringify(upgraded)} (object cũ không đổi)`);
  console.log("");

  console.log("2️⃣ Pure function — deterministic:");
  console.log(`  fpPriceAfterTax(100, 0.1) = ${fpPriceAfterTax(100, 0.1)}`);
  console.log(`  fpPriceAfterTax(100, 0.1) = ${fpPriceAfterTax(100, 0.1)} (luôn như nhau)`);
  console.log("");

  console.log("3️⃣ Side effect — được inject thay vì nằm rải rác:");
  fpNotify("order.shipped", (msg) => console.log(`  [logger] ${msg}`));
  fpNotify("order.shipped", (msg) => console.log(`  [audit ] ${msg}`));
  console.log("");

  console.log("4️⃣ Currying — config trước, gọi sau:");
  const formatVND = fpFormatter("₫");
  const formatUSD = fpFormatter("$");
  console.log(`  formatVND(25000) = ${formatVND(25000)}, formatUSD(25) = ${formatUSD(25)}`);
  console.log("");

  console.log("5️⃣ Composition — pipeline nhỏ:");
  console.log(`  slug(\"  Học Lập Trình TS \") = ${fpSlug("  Học Lập Trình TS ")}`);
  console.log("");

  console.log("✅ Functional Concepts: immutable data + pure function + injectable IO + currying + compose");
}

run();
export {};