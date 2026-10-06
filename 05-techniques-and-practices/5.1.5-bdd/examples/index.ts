/**
 * 5.1.5 BDD — Behavior-Driven Development với Gherkin (Given/When/Then)
 *
 * TS thuần + Node built-in, KHÔNG cần Cucumber/vitest.
 * Mini-runner tự viết: định nghĩa Feature/Scenario bằng tiếng business,
 * bind step Given/When/Then tới code thật, chạy và báo cáo.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────── Domain: tính discount ────────────────────

function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  if (amount > 50) return amount * 0.95;
  return amount;
}

// ─────────────────── Mini BDD runner ────────────────────

interface BddContext {
  orderTotal: number;
  payment: number;
}

type StepFn = (ctx: BddContext, arg?: number) => void;

interface Step {
  keyword: "Given" | "When" | "Then";
  text: string;
  fn: StepFn;
  expected?: number;
}

interface Scenario {
  name: string;
  steps: Step[];
}

function assertEqual(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function runScenario(s: Scenario): boolean {
  const ctx: BddContext = { orderTotal: 0, payment: 0 };
  console.log(`  Scenario: ${s.name}`);
  try {
    for (const step of s.steps) {
      step.fn(ctx, step.expected);
      if (step.keyword === "Then" && step.expected !== undefined) {
        assertEqual(ctx.payment, step.expected, `    Then ${step.text}`);
      }
      console.log(`    ${step.keyword} ${step.text} ... OK`);
    }
    console.log(`    ✅ Passed\n`);
    return true;
  } catch (err) {
    console.log(`    ❌ Failed: ${(err as Error).message}\n`);
    return false;
  }
}

// ─────────────────── Step definitions ────────────────────

const givenTotal = (total: number): Step => ({
  keyword: "Given",
  text: `I have items totaling $${total}`,
  fn: (ctx) => {
    ctx.orderTotal = total;
  },
});

const whenApplyDiscount: Step = {
  keyword: "When",
  text: "I apply discount",
  fn: (ctx) => {
    ctx.payment = calculateDiscount(ctx.orderTotal);
  },
};

const thenPay = (expected: number): Step => ({
  keyword: "Then",
  text: `I should pay $${expected}`,
  fn: () => {},
  expected,
});

// ────────────────────────── Demo chạy ─────────────────────────────────

function main(): void {
  console.log("=== 5.1.5 BDD Demo (Gherkin mini-runner, TS thuần) ===\n");
  console.log("Feature: Discount Calculation");
  console.log("  As a customer");
  console.log("  I want to get discount based on order amount");
  console.log("  So that I can save money on purchases\n");

  console.log("❌ CÁCH XẤU — test chỉ dev đọc được:");
  console.log("  it('test1', () => expect(calculateDiscount(150)).toBe(135))");
  console.log("  → PO không hiểu test nói về behavior gì.\n");

  console.log("✅ CÁCH TỐT — BDD, PO đọc được từng scenario:");
  const scenarios: Scenario[] = [
    {
      name: "Order over $100 gets 10% discount",
      steps: [givenTotal(150), whenApplyDiscount, thenPay(135)],
    },
    {
      name: "Order under $50 gets no discount",
      steps: [givenTotal(30), whenApplyDiscount, thenPay(30)],
    },
    {
      name: "Order between $50 and $100 gets 5% discount",
      steps: [givenTotal(80), whenApplyDiscount, thenPay(76)],
    },
  ];

  let passed = 0;
  for (const s of scenarios) {
    if (runScenario(s)) passed++;
  }
  console.log(`📊 Kết quả: ${passed}/${scenarios.length} scenarios passed`);
  console.log("   → Mỗi scenario = 1 living doc mà cả PO lẫn dev đều đọc được.");
}

main();

export {};
