/**
 * 4.2 Functional Programming — Core Concepts Demo
 *
 * Minh họa các khái niệm cốt lõi của FP:
 * - Pure function (hàm thuần túy)
 * - Immutability (bất biến)
 * - Higher-order function (hàm bậc cao)
 * - Currying (curry hóa)
 * - Function composition (kết hợp hàm)
 */

// ────────────────────────── Pure function ───────────────────────────────────
// ❌ Impure: phụ thuộc biến ngoài (external state) → kết quả không xác định
let taxRate = 0.1;
function priceWithTaxImpure(price: number): number {
  return price * (1 + taxRate);
}

// ✅ Pure: cùng input → cùng output, không đọc/ghi state ngoài, không side effect
function priceWithTaxPure(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}

// ❌ Impure: đổi array gốc (mutation)
function addItemMutate(list: string[], item: string): void {
  list.push(item);
}

// ✅ Pure: trả về array mới, không đụng tới array gốc
function addItemPure(list: readonly string[], item: string): string[] {
  return [...list, item];
}

// ──────────────────────────── Immutability ──────────────────────────────────
interface User {
  name: string;
  age: number;
}

const user: User = Object.freeze({ name: "John", age: 25 });

function increaseAge(u: User): User {
  return { ...u, age: u.age + 1 }; // bản mới, giữ nguyên bản cũ
}

// ─────────────────────── Higher-order function ──────────────────────────────
type Unary<T, R> = (arg: T) => R;

function createMultiplier(factor: number): Unary<number, number> {
  return (n: number) => n * factor; // closure + trả về function
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

// ────────────────────────────── Currying ────────────────────────────────────
// Hàm nhiều tham số → chuỗi hàm 1 tham số
const formatPrice = (prefix: string) => (amount: number) =>
  `${prefix}${amount.toFixed(2)}`;

const formatVND = formatPrice("₫");
const formatUSD = formatPrice("$");

// Thực tế: validator curry hóa, tái sử dụng cấu hình
const minLength = (min: number) => (value: string) => value.length >= min;
const hasPattern = (pattern: RegExp) => (value: string) => pattern.test(value);

const usernameRules = [
  minLength(3),
  hasPattern(/^[a-zA-Z0-9_]+$/),
];

function isValidUsername(value: string): boolean {
  return usernameRules.every((rule) => rule(value));
}

// ──────────────────────── Function composition ──────────────────────────────
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (x) => f(g(x));
}

const toLowerCase = (s: string) => s.toLowerCase();
const trim = (s: string) => s.trim();
const addTitle = (name: string) => `Xin chào, ${name}!`;

// ghép 3 hàm nhỏ thành pipeline lớn: trim → toLowerCase → addTitle
const greet = compose(compose(addTitle, toLowerCase), trim);

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Functional Programming Demo ===");
console.log("");

console.log("1️⃣ Pure function (Hàm thuần túy):");
taxRate = 0.2; // state ngoài thay đổi làm kết quả impure thay đổi
console.log(`  ❌ Impure: priceWithTaxImpure(100) = ${priceWithTaxImpure(100)}`);
console.log(`  ✅ Pure:   priceWithTaxPure(100, 0.2) = ${priceWithTaxPure(100, 0.2)}`);
console.log("");

console.log("   Pure khi thao tác với array:");
const list = ["a", "b"];
const list2 = addItemPure(list, "c");
const listMut: string[] = ["a", "b"];
addItemMutate(listMut, "c");
console.log(`  ✅ addItemPure: gốc=[${list}] → mới=[${list2}] (gốc không đổi)`);
console.log(`  ❌ addItemMutate: gốc bị sửa thành [${listMut}]`);
console.log("");

console.log("2️⃣ Immutability (Bất biến):");
console.log(`  user gốc: ${JSON.stringify(user)}`);
const olderUser = increaseAge(user);
console.log(`  user mới sau tăng tuổi: ${JSON.stringify(olderUser)}`);
console.log(`  user gốc vẵn nguyên: ${JSON.stringify(user)}`);
console.log("");

console.log("3️⃣ Higher-order function (Hàm bậc cao):");
console.log(`  double(5) = ${double(5)}, triple(5) = ${triple(5)}`);
const numbers = [1, 2, 3, 4, 5];
console.log(`  map: ${JSON.stringify(numbers.map((n) => n * 2))}`);
console.log(`  filter: ${JSON.stringify(numbers.filter((n) => n % 2 === 0))}`);
console.log(
  `  reduce: ${numbers.reduce((acc, n) => acc + n, 0)}`
);
console.log("");

console.log("4️⃣ Currying (Curry hóa):");
console.log(`  formatVND(25000) = ${formatVND(25000)}`);
console.log(`  formatUSD(25) = ${formatUSD(25)}`);
console.log(
  `  isValidUsername("john_doe") = ${isValidUsername("john_doe")}`
);
console.log(
  `  isValidUsername("a") = ${isValidUsername("a")} (quá ngắn → false)`
);
console.log("");

console.log("5️⃣ Function composition (Kết hợp hàm):");
console.log(`  greet("  JOHN DOE  ") = ${greet("  JOHN DOE  ")}`);
console.log("");

console.log("✅ FP tổ chức code bằng hàm thuần túy, bất biến và kết hợp hàm nhỏ thành pipeline");
export {};
