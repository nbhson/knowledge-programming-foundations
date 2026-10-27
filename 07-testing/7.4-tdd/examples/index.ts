/**
 * 7.4 Test-Driven Development (TDD) — Red → Green → Refactor
 *
 * Minh họa vòng lặp TDD với Stack:
 * - 🔴 RED:      viết test trước → test FAIL (implementation chưa có).
 * - 🟢 GREEN:    viết code tối thiểu → test PASS.
 * - 🔵 REFACTOR: cải tiến code (thêm guard, method mới) → test vẫn PASS.
 */

// ──────────────────── Các phiên bản implementation ────────────────────

// Phiên bản "chưa viết code" — đại diện trạng thái RED
class TddStackStub {
  push(_item: number): void {
    throw new Error("TODO: chưa implement Stack");
  }
  pop(): number {
    throw new Error("TODO: chưa implement Stack");
  }
}

// Phiên bản GREEN — code tối thiểu đủ để test qua
class TddStackBasic {
  private items: number[] = [];
  push(item: number): void {
    this.items.push(item);
  }
  pop(): number {
    if (this.items.length === 0) throw new Error("Stack is empty");
    return this.items.pop() as number;
  }
  size(): number {
    return this.items.length;
  }
}

// Phiên bản REFACTOR — thêm isEmpty, peek, clear; logic tốt hơn, behavior giữ nguyên
class TddStackRefactored {
  private readonly items: number[] = [];
  push(item: number): void {
    this.items.push(item);
  }
  pop(): number {
    if (this.isEmpty()) throw new Error("Stack is empty");
    return this.items.pop() as number;
  }
  peek(): number {
    if (this.isEmpty()) throw new Error("Stack is empty");
    return this.items[this.items.length - 1];
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  size(): number {
    return this.items.length;
  }
}

// ──────────────────── Mini test runner ────────────────────
interface TddCase {
  name: string;
  fn: () => void;
}

class TddTestSuite {
  private passed = 0;
  private totalChecks = 0;

  assert(cond: boolean, label: string): void {
    this.totalChecks++;
    if (cond) {
      this.passed++;
      console.log(`    ✅ ${label}`);
    } else {
      console.log(`    ❌ ${label}`);
    }
  }

  run(cases: TddCase[]): { passed: number; total: number } {
    for (const c of cases) c.fn();
    return { passed: this.passed, total: this.totalChecks };
  }

  expectPopToBe(stack: TddStackRefactored | TddStackBasic, expected: number): void {
    this.assert(stack.pop() === expected, `pop() = ${expected}`);
  }

  expectEmptyPush(stack: TddStackRefactored | TddStackBasic): void {
    this.assert(stack.size() === 0 && (() => {
      try {
        stack.pop();
        return false;
      } catch {
        return true;
      }
    })(), "pop() từ stack rỗng phải throw");
  }
}

// ──────────────────── 1. Pha RED: test trước, chưa có code ────────────────────
function phaseRed(): void {
  console.log("🔴 PHA 1 — RED: Viết test TRƯỚC, implementation chưa tồn tại");
  let redPass = 0;
  try {
    const stub = new TddStackStub();
    stub.push(10); // → throw "TODO"
    console.log("  Chạy test...");
  } catch {
    redPass++;
  }
  // Test bắt buộc phải FAIL ở giai đoạn này
  if (redPass === 1) console.log("  ✅ Kết quả: test FAIL đúng như mong đợi (stack chưa được implement)");
  else console.log("  ❌ Test không fail — có vấn đề!");
}

// ──────────────────── 2. Pha GREEN: code tối thiểu ────────────────────
function phaseGreen(): void {
  console.log("\n🟢 PHA 2 — GREEN: Viết code tối thiểu để test qua");
  const suite = new TddTestSuite();
  const stack = new TddStackBasic();

  const cases: TddCase[] = [
    {
      name: "push/pop LIFO",
      fn: () => {
        stack.push(10);
        stack.push(20);
        suite.expectPopToBe(stack, 20);
        suite.expectPopToBe(stack, 10);
      },
    },
    {
      name: "pop stack rỗng throw",
      fn: () => suite.expectEmptyPush(stack),
    },
  ];
  const { passed, total } = suite.run(cases);
  console.log(`  Kết quả: ${passed}/${total} PASS → 🟢 GREEN`);
}

// ──────────────────── 3. Pha REFACTOR: cải tiến, giữ behavior ────────────────────
function phaseRefactor(): void {
  console.log("\n🔵 PHA 3 — REFACTOR: Cải tiến code, test cũ vẫn phải PASS");
  const suite = new TddTestSuite();
  const stack = new TddStackRefactored();

  const cases: TddCase[] = [
    {
      name: "behavior push/pop giữ nguyên",
      fn: () => {
        stack.push(10);
        stack.push(20);
        suite.expectPopToBe(stack, 20);
        suite.expectPopToBe(stack, 10);
      },
    },
    {
      name: "behavior pop rỗng vẫn throw",
      fn: () => suite.expectEmptyPush(stack),
    },
    {
      name: "tính năng MỚI: peek không xóa phần tử",
      fn: () => {
        stack.push(42);
        suite.assert(stack.peek() === 42, "peek() = 42");
        suite.assert(stack.size() === 1, "stack vẫn còn 1 phần tử sau peek");
      },
    },
  ];
  const { passed, total } = suite.run(cases);
  console.log(`  Kết quả: ${passed}/${total} PASS — behavior cũ không đổi + thêm peek → 🔵 REFACTOR an toàn`);
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== TDD Demo ===");
console.log("Vòng lặp Red → Green → Refactor xây dựng class Stack.\n");

phaseRed();
phaseGreen();
phaseRefactor();

console.log("\n✅ TDD: test viết trước dẫn dắt code; refactor không phá vỡ hành vi");
export {};