/**
 * 3.1.2 KISS (Keep It Simple, Stupid) - Demo
 *
 * Giữ code đơn giản — dễ đọc, dễ hiểu, dễ sửa.
 * Tránh over-engineering, abstraction không cần thiết.
 */

// --- ❌ BAD: Over-engineered ---
type ProcessResult<T> = T extends string
  ? StringProcessor<T>
  : T extends number
    ? NumberProcessor<T>
    : never;

abstract class BaseProcessor<T> {
  abstract process(input: T): T;
}

class StringProcessor<T extends string> extends BaseProcessor<T> {
  process(input: T): T {
    return input.trim().toLowerCase() as T;
  }
}

class NumberProcessor<T extends number> extends BaseProcessor<T> {
  process(input: T): T {
    return Math.abs(input) as unknown as T;
  }
}

function processBad<T>(input: T): ProcessResult<T> {
  if (typeof input === "string") {
    return new StringProcessor().process(input) as unknown as ProcessResult<T>;
  }
  return new NumberProcessor().process(input as number) as unknown as ProcessResult<T>;
}

// --- ✅ GOOD: Simple and clear ---
function processInput(input: string): string {
  return input.trim().toLowerCase();
}

function processNumber(input: number): number {
  return Math.abs(input);
}

// --- Demo ---
console.log("=== KISS Demo ===");
console.log("");

// GOOD: đơn giản, đọc hiểu ngay
const result = processInput("  Hello World  ");
console.log(`✅ processInput("  Hello World  ") = "${result}"`);
console.log("");

// GOOD: tách 2 function rõ ràng thay vì generic phức tạp
const num = processNumber(-42);
console.log(`✅ processNumber(-42) = ${num}`);
console.log("");

// BAD: generic phức tạp — khó đọc, khó debug, khó maintain
const badResult = processBad("  Hello  ");
console.log(`⚠️ processBad("  Hello  ") = "${badResult}" (phức tạp không cần thiết)`);
console.log("");

// So sánh độ phức tạp
console.log("📊 So sánh:");
console.log("   BAD:  ~20 dòng generic + abstract class + conditional type");
console.log("   GOOD: 2 function, mỗi function 1 dòng logic");
console.log("");

console.log("✅ KISS: đơn giản hơn = dễ đọc, dễ sửa, ít bug");

export {};
