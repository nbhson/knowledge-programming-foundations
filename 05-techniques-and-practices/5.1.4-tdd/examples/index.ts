/**
 * 5.1.4 TDD — Test-Driven Development: Red → Green → Refactor
 *
 * Demo TS thuần tự chứa: mini test-runner (record + assertEqual/assertTrue),
 * KHÔNG dùng framework ngoài. Vì TS biên dịch cả file cùng lúc, ta MÔ PHỎNG
 * đúng tinh thần TDD bằng 3 phase đối với cùng 1 bộ test:
 *
 * 🔴 RED     — chạy test với "code chưa viết" (stub throw) → test FAIL
 * 🟢 GREEN   — viết code tối thiểu đúng → test PASS
 * 🔵 REFACTOR— làm sạch code (hằng số đặt tên) → test vẫn PASS
 *
 * Case study: calculateDiscount (đơn giá) và validatePassword (mật khẩu).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ────────────────────────── Mini Test Runner ──────────────────────────

type MiniTestFn = () => void | Promise<void>;

class MiniTestRunner {
  private tests: Array<{ name: string; fn: MiniTestFn }> = [];
  private passed = 0;
  private failed = 0;

  constructor(private group: string) {}

  record(name: string, fn: MiniTestFn): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log(`\n── ${this.group} ──`);
    for (const t of this.tests) {
      try {
        await t.fn();
        this.passed++;
        console.log(`  ✅ PASS  ${t.name}`);
      } catch (err) {
        this.failed++;
        console.log(`  ❌ FAIL  ${t.name}`);
        console.log(`      └─ ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`  ── Kết quả: ${this.passed} passed / ${this.tests.length} total ──`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg = ""): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} ⇒ expect ${b}, got ${a}`);
}

function assertTrue(actual: boolean, msg = ""): void {
  if (actual !== true) throw new Error(`${msg} ⇒ expect true, got ${actual}`);
}

// ─────────────────────── Case 1: calculateDiscount ────────────────────

/** 🔴 RED: "code chưa tồn tại" — mọi test đều fail */
function redCalculateDiscount(_amount: number): number {
  throw new Error("NotImplemented: calculateDiscount chưa được viết");
}

/** 🟢 GREEN: code tối thiểu để test pass */
function greenCalculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  return amount;
}

/** 🔵 REFACTOR: cùng hành vi, code sạch hơn (hằng số có tên) */
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

function refactoredCalculateDiscount(amount: number): number {
  return amount > DISCOUNT_THRESHOLD ? amount * (1 - DISCOUNT_RATE) : amount;
}

/** Bộ test dùng cho cả 3 phase (cùng 1 spec) */
function defineDiscountTests(runner: MiniTestRunner, imp: (amount: number) => number): void {
  runner.record("đơn > 100 → chiết khấu 10% (150 → 135)", () => assertEqual(imp(150), 135));
  runner.record("đơn <= 100 → không chiết khấu (50 → 50)", () => assertEqual(imp(50), 50));
  runner.record("đơn = đúng ngưỡng 100 → không chiết khấu", () => assertEqual(imp(100), 100));
}

// ─────────────────────── Case 2: validatePassword ─────────────────────

/** 🔴 RED: "code chưa tồn tại" */
function redValidatePassword(_password: string): boolean {
  throw new Error("NotImplemented: validatePassword chưa được viết");
}

/** 🟢 GREEN: code tối thiểu làm test pass */
function greenValidatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/** 🔵 REFACTOR: tách từng điều kiện thành rule rõ ràng */
interface PasswordRule {
  check(password: string): boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { check: (pw) => pw.length >= 8 },
  { check: (pw) => /[A-Z]/.test(pw) },
  { check: (pw) => /[0-9]/.test(pw) },
  { check: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function refactoredValidatePassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.check(password));
}

function definePasswordTests(runner: MiniTestRunner, imp: (pw: string) => boolean): void {
  runner.record("ngắn hơn 8 ký tự → false", () => assertTrue(!imp("short")));
  runner.record("thiếu chữ hoa → false", () => assertTrue(!imp("lowercase123!")));
  runner.record("thiếu số → false", () => assertTrue(!imp("NoNumbers!")));
  runner.record("thiếu ký tự đặc biệt → false", () => assertTrue(!imp("NoSpecial1")));
  runner.record("hợp lệ 'ValidPass1!' → true", () => assertTrue(imp("ValidPass1!")));
}

// ────────────────────────── Demo: các phase ───────────────────────────

async function runAll(): Promise<void> {
  console.log("=== 5.1.4 TDD Demo — Red → Green → Refactor ===\n");

  console.log("🔴 PHASE 1 — RED: viết test TRƯỚC, code chưa tồn tại → test FAIL (điều này LÀ TDD).");
  const redRunner = new MiniTestRunner("RED — calculateDiscount (code = stub chưa viết)");
  defineDiscountTests(redRunner, redCalculateDiscount);
  await redRunner.run();
  const redPwRunner = new MiniTestRunner("RED — validatePassword (code = stub chưa viết)");
  definePasswordTests(redPwRunner, redValidatePassword);
  await redPwRunner.run();

  console.log("\n🟢 PHASE 2 — GREEN: viết code TỐI THIỂU đủ pass → test PASS.");
  const greenRunner = new MiniTestRunner("GREEN — calculateDiscount (implement tối thiểu)");
  defineDiscountTests(greenRunner, greenCalculateDiscount);
  await greenRunner.run();
  const greenPwRunner = new MiniTestRunner("GREEN — validatePassword (implement tối thiểu)");
  definePasswordTests(greenPwRunner, greenValidatePassword);
  await greenPwRunner.run();

  console.log("\n🔵 PHASE 3 — REFACTOR: làm sạch code, GIỮ NGUYÊN hành vi → test vẫn PASS.");
  const refactorRunner = new MiniTestRunner("REFACTOR — calculateDiscount (hằng số có tên)");
  defineDiscountTests(refactorRunner, refactoredCalculateDiscount);
  await refactorRunner.run();
  const refactorPwRunner = new MiniTestRunner("REFACTOR — validatePassword (tách rule)");
  definePasswordTests(refactorPwRunner, refactoredValidatePassword);
  await refactorPwRunner.run();

  // Verify hành vi không thay đổi giữa green & refactor
  console.log("\n🔗 Verify: green ≡ refactor cho mọi sample");
  assertEqual(greenCalculateDiscount(150), refactoredCalculateDiscount(150));
  assertEqual(greenValidatePassword("ValidPass1!"), refactoredValidatePassword("ValidPass1!"));

  console.log("\n✅ TDD Demo hoàn tất — nhịp Red → Green → Refactor giúp code đúng ngay từ đầu, không over-engineer.");
}

void runAll();

export {};