/**
 * 7.1 Unit Testing — Mini Test Runner tự viết
 *
 * Minh họa khái niệm Unit Test:
 * - Hàm thuần (pure function) không có side-effect → dễ test.
 * - Tự viết assertEqual / assertThrows + runner mini (KHÔNG dùng vitest/jest).
 * - Áp dụng cấu trúc AAA (Arrange - Act - Assert).
 */

// ────────────────────── Hàm thuần cần test ──────────────────────
function add(a: number, b: number): number {
  return a + b;
}

function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Không thể chia cho 0");
  return a / b;
}

function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount phải nằm trong khoảng 0-100");
  }
  return price * (1 - discountPercent / 100);
}

function isEven(n: number): boolean {
  return n % 2 === 0;
}

// ────────────────────── Mini assert + runner ─────────────────────
type UnitTestKind = "equal" | "throws";

interface UnitTestResult {
  label: string;
  kind: UnitTestKind;
  passed: boolean;
  detail: string;
}

class UnitTestRunner {
  private results: UnitTestResult[] = [];

  // assertEqual: kiểm tra actual === expected
  equal(actual: unknown, expected: unknown, label: string): void {
    const passed = actual === expected;
    const detail = `expected=${JSON.stringify(expected)} | actual=${JSON.stringify(actual)}`;
    this.results.push({ label, kind: "equal", passed, detail });
    this.print(passed, label, detail);
  }

  // assertThrows: kiểm tra hàm phải throw Error
  throws(fn: () => void, label: string): void {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    const detail = threw ? "đã throw đúng như mong đợi" : "KHÔNG throw (bug!)";
    this.results.push({ label, kind: "throws", passed: threw, detail });
    this.print(threw, label, detail);
  }

  private print(passed: boolean, label: string, detail: string): void {
    if (passed) {
      console.log(`  ✅ PASS  ${label}`);
    } else {
      console.log(`  ❌ FAIL  ${label} — ${detail}`);
    }
  }

  summary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;
    console.log("");
    console.log(`📊 Tổng kết: ${passed}/${total} test PASS`);
    if (passed === total) {
      console.log("✅ Toàn bộ unit test đều xanh!");
    } else {
      console.log(`❌ Còn ${total - passed} test fail — cần sửa code.`);
    }
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Unit Test Demo ===");
console.log("Mô phỏng chạy test suite bằng runner tự viết.\n");

const runner = new UnitTestRunner();

console.log("Test Suite: add()");
runner.equal(add(1, 2), 3, "add(1, 2) = 3");
runner.equal(add(-5, 5), 0, "add(-5, 5) = 0");

console.log("\nTest Suite: divide()");
runner.equal(divide(10, 2), 5, "divide(10, 2) = 5");
runner.equal(divide(7, 2), 3.5, "divide(7, 2) = 3.5");
runner.throws(() => divide(10, 0), "divide(10, 0) phải throw Error");

console.log("\nTest Suite: calculateDiscount()");
runner.equal(calculateDiscount(100, 10), 90, "giảm 10% của 100 = 90");
runner.equal(calculateDiscount(100, 0), 100, "giảm 0% giữ nguyên giá");
runner.equal(calculateDiscount(100, 100), 0, "giảm 100% = 0");
runner.throws(() => calculateDiscount(100, -5), "discount âm phải throw");
runner.throws(() => calculateDiscount(100, 150), "discount > 100 phải throw");

console.log("\nTest Suite: isEven()");
runner.equal(isEven(4), true, "isEven(4) = true");
runner.equal(isEven(7), false, "isEven(7) = false");

console.log("\n--- Chú thích mỗi test theo cấu trúc AAA ---");
console.log(
  "  Arrange: khai báo input (VD: price=100, discount=10),\n" +
    "  Act:     gọi hàm calculateDiscount(...),\n" +
    "  Assert:  runner.equal(...) so sánh kết quả."
);
console.log("");

runner.summary();

export {};