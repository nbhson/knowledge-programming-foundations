/**
 * 5.12.4 Currying — Curried Add + Partial Application + Validation Builder
 *
 * Currying: biến hàm `f(a, b, c)` thành `f(a)(b)(c)`.
 * Lợi ích: tạo hàm chuyên biệt từ hàm tổng quát (partial application),
 * xây dựng pipeline validate tái sử dụng.
 *
 * KHÔNG dùng lib ngoài — TS thuần.
 */

// ─────────────────────────── Curried add ───────────────────────────

const curriedAdd = (a: number) => (b: number) => a + b;

// Curry tổng quát cho hàm 3 tham số (đệ quy có type)
type Curried3<A, B, C, R> = (a: A) => (b: B) => (c: C) => R;

function curry3<A, B, C, R>(fn: (a: A, b: B, c: C) => R): Curried3<A, B, C, R> {
  return (a) => (b) => (c) => fn(a, b, c);
}

function volumes(width: number, height: number, depth: number): number {
  return width * height * depth;
}

const curriedVolume = curry3(volumes);

// ─────────────────────────── Partial application ───────────────────────────

function partial<A, B, R>(fn: (a: A, b: B) => R, a: A): (b: B) => R {
  return (b) => fn(a, b);
}

function toFixed(decimals: number, value: number): string {
  return value.toFixed(decimals);
}

const toFixed2 = partial(toFixed, 2);

// ─────────────────────────── Validation builder ───────────────────────────

interface ValidationRule {
  name: string;
  check: (value: string) => boolean;
  message: string;
}

// Rule factories (curried): cấu hình 1 lần, tái sử dụng nhiều nơi
const hasMinLength = (min: number) => (value: string): boolean => value.length >= min;
const hasMaxLength = (max: number) => (value: string): boolean => value.length <= max;
const matchesPattern = (pattern: RegExp) => (value: string): boolean => pattern.test(value);

class ValidationBuilder {
  private rules: ValidationRule[] = [];

  addRule(name: string, check: (value: string) => boolean, message: string): ValidationBuilder {
    this.rules.push({ name, check, message });
    return this; // fluent + immutable-ish (trả về chính builder)
  }

  validate(value: string): { valid: boolean; errors: string[] } {
    const errors = this.rules.filter((r) => !r.check(value)).map((r) => r.message);
    return { valid: errors.length === 0, errors };
  }

  count(): number {
    return this.rules.length;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Currying Demo ===");
  console.log("");

  console.log("1️⃣ Curried add — chuỗi hàm 1 tham số:");
  console.log(`  curriedAdd(2)(3) = ${curriedAdd(2)(3)}`);
  const increment = curriedAdd(1);
  const add10 = curriedAdd(10);
  console.log(`  increment(5) = ${increment(5)}, add10(5) = ${add10(5)}`);
  console.log("");

  console.log("2️⃣ curry3 — từ hàm 3 tham số tạo hàm chuyên biệt:");
  const areaWithHeight10 = curriedVolume(10); // còn thiếu height, depth
  const area10x5 = areaWithHeight10(5); // còn thiếu depth
  console.log(`  curriedVolume(2)(3)(4) = ${curriedVolume(2)(3)(4)}`);
  console.log(`  curriedVolume(10)(5)(2) = ${area10x5(2)}`);
  console.log("");

  console.log("3️⃣ Partial application — cố định tham số đầu:");
  console.log(`  toFixed2(3.14159) = ${toFixed2(3.14159)}, toFixed2(2.5) = ${toFixed2(2.5)}`);
  console.log("");

  console.log("4️⃣ Validation builder — ghép rule curried:");
  const usernameValidator = new ValidationBuilder()
    .addRule("minLength", hasMinLength(3), "Phải có ít nhất 3 ký tự")
    .addRule("maxLength", hasMaxLength(20), "Tối đa 20 ký tự")
    .addRule("pattern", matchesPattern(/^[a-zA-Z0-9_]+$/), "Chỉ cho phép chữ, số, gạch dưới");
  console.log(`  Số rule: ${usernameValidator.count()}`);
  const cases = ["john_doe", "ab", "john-doe", "valid_user_123"];
  for (const value of cases) {
    const result = usernameValidator.validate(value);
    console.log(`  validate('${value}') → valid=${result.valid}${result.valid ? "" : `, errors=[${result.errors.join(", ")}]`}`);
  }
  console.log("");

  console.log("5️⃣ Tái sử dụng rule factory cho field khác:");
  const passwordValidator = new ValidationBuilder()
    .addRule("minLength", hasMinLength(8), "Mật khẩu ≥ 8 ký tự")
    .addRule("pattern", matchesPattern(/\d/), "Phải chứa ít nhất 1 số");
  console.log(`  validate('abc')          → ${JSON.stringify(passwordValidator.validate("abc"))}`);
  console.log(`  validate('secret123')    → ${JSON.stringify(passwordValidator.validate("secret123"))}`);
  console.log("");

  console.log("✅ Currying: hàm curried + partial application + rule factory → cấu hình 1 lần, tái sử dụng nhiều nơi");
}

run();
export {};