/**
 * 5.1.6 Mutation Testing — Đánh giá chất lượng test suite bằng mutants
 *
 * TS thuần + Node built-in, KHÔNG cần Stryker.
 * Tạo mutants (đổi toán tử/logic), chạy cùng test suite,
 * tính mutation score = killed / total.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────── Code gốc (SUT) ────────────────────

function isEven(n: number): boolean {
  return n % 2 === 0;
}

// ─────────────────── Test suite (tự viết assert) ────────────────────

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

/** Test YẾU: chỉ check số chẵn, không check số lẻ. */
function weakSuite(fn: (n: number) => boolean): void {
  assertEqual(fn(4), true, "isEven(4)");
}

/** Test MẠNH: check cả chẵn lẫn lẻ + biên. */
function strongSuite(fn: (n: number) => boolean): void {
  assertEqual(fn(4), true, "isEven(4)");
  assertEqual(fn(3), false, "isEven(3)");
  assertEqual(fn(0), true, "isEven(0)");
  assertEqual(fn(-2), true, "isEven(-2)");
}

// ─────────────────── Mutants ────────────────────

interface Mutant {
  name: string;
  fn: (n: number) => boolean;
}

const mutants: Mutant[] = [
  { name: "=== thành !==", fn: (n) => n % 2 !== 0 },
  { name: "% thành *", fn: (n) => n * 2 === 0 },
  { name: "0 thành 1", fn: (n) => n % 2 === 1 },
  { name: "luôn return true", fn: () => true },
  { name: "luôn return false", fn: () => false },
];

type Suite = (fn: (n: number) => boolean) => void;

function runMutation(suite: Suite, suiteName: string): { killed: number; survived: number } {
  let killed = 0;
  let survived = 0;
  console.log(`\nSuite: ${suiteName}`);
  for (const m of mutants) {
    try {
      suite(m.fn);
      survived++;
      console.log(`  🟡 SURVIVED — mutant "${m.name}" lọt qua test (test yếu!)`);
    } catch {
      killed++;
      console.log(`  🟢 KILLED   — mutant "${m.name}" bị test bắt được`);
    }
  }
  return { killed, survived };
}

// ────────────────────────── Demo chạy ─────────────────────────────────

function main(): void {
  console.log("=== 5.1.6 Mutation Testing Demo (TS thuần) ===");
  console.log("SUT: isEven(n) = n % 2 === 0");
  console.log(`Tổng mutants: ${mutants.length}`);

  const weak = runMutation(weakSuite, "WEAK suite (chỉ 1 case)");
  const strong = runMutation(strongSuite, "STRONG suite (chẵn + lẻ + biên)");

  const score = (k: number, t: number): string => ((k / t) * 100).toFixed(1) + "%";
  const total = mutants.length;
  console.log("\n📊 Mutation Score:");
  console.log(`   • Weak suite:   ${weak.killed}/${total} killed → ${score(weak.killed, total)}`);
  console.log(`   • Strong suite: ${strong.killed}/${total} killed → ${score(strong.killed, total)}`);
  console.log("   → Coverage 100% vẫn có thể mutation score thấp.");
  console.log("   → Mục tiêu thực tế: mutation score > 80% cho core logic.");
}

main();

export {};
