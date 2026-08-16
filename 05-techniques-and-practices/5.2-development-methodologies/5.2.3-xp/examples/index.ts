/**
 * XP Simulation — Mô phỏng chu trình TDD (Red - Green - Refactor)
 *
 * Chạy: npx ts-node examples/index.ts
 *
 * Mô phỏng:
 * 1. RED:   Viết test kỳ vọng tính năng mới, chạy test → FAILS
 * 2. GREEN: Viết code tối thiểu để test PASS
 * 3. REFACTOR: Dọn dẹp code, đảm bảo test vẫn PASS
 */

// ─── Simple Test Framework ────────────────────────────────────────

class MiniTestRunner {
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void): void {
    try {
      fn();
      console.log(`   ✅ PASS: ${name}`);
      this.passed++;
    } catch (e: any) {
      console.log(`   ❌ FAIL: ${name} — ${e.message}`);
      this.failed++;
    }
  }

  expect(actual: any) {
    return {
      toBe(expected: any) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
    };
  }

  summary(): void {
    console.log(`\n📊 Tests: ${this.passed} passed, ${this.failed} failed`);
  }
}

// ─── Code cần phát triển: Calculator ────────────────────────────────

class Calculator {
  // Bắt đầu chưa có implementation
  add(a: number, b: number): number {
    return a + b; // Green implementation
  }

  // Sẽ thêm các method khác theo chu trình TDD
}

// ─── TDD Simulation ───────────────────────────────────────────────

const runner = new MiniTestRunner();

console.log("🔴 STEP 1: RED — Viết test cho tính năng add()");
console.log("   (Viết test trước khi triển khai)");

runner.test("add(2, 3) should return 5", () => {
  const calc = new Calculator();
  runner.expect(calc.add(2, 3)).toBe(5);
});

runner.test("add(-1, 1) should return 0", () => {
  const calc = new Calculator();
  runner.expect(calc.add(-1, 1)).toBe(0);
});

console.log("\n🟢 STEP 2: GREEN — Code đã pass tất cả test!");

console.log("\n🔵 STEP 3: REFACTOR — Đảm bảo code sạch, test vẫn xanh");
console.log("   (Refactor code không đổi behavior, test đảm bảo an toàn)");

runner.summary();