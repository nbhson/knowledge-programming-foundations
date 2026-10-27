/**
 * 3.1.8 CUPID - Composable, Unix philosophy, Predictable, Idiomatic, Domain-based
 *
 * Hàm nhỏ làm một việc tốt, ghép nối được, hành xử đoán được,
 * viết theo idiom TS, đặt tên theo ngôn ngữ nghiệp vụ.
 */

interface User {
  name: string;
  age: number;
  active: boolean;
}

// --- ❌ BAD: 1 hàm làm nhiều việc, side-effect ẩn, tên kỹ thuật chung chung ---
function processDataBad(users: User[]): string[] {
  users.sort((a, b) => a.age - b.age); // side-effect ẩn: đổi mảng gốc của caller!
  const result: string[] = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
      result.push(users[i].name.toUpperCase());
    }
  }
  return result;
}

// --- ✅ GOOD: CUPID ---
const isActive = (user: User): boolean => user.active; // Unix: 1 việc
const toDisplayName = (user: User): string => user.name.toUpperCase(); // Unix: 1 việc
const byAge = (a: User, b: User): number => a.age - b.age;

function getActiveNames(users: readonly User[]): string[] {
  return [...users] // Predictable: copy trước khi sort, không đổi input gốc
    .sort(byAge) // Idiomatic + Composable: comparator tái dùng được
    .filter(isActive)
    .map(toDisplayName);
}

// --- ✅ GOOD: Domain-based — tên nói ngôn ngữ nghiệp vụ ---
interface OrderLineInput {
  price: number;
  quantity: number;
}

function calculateCheckoutTotal(lines: readonly OrderLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

// --- Demo ---
function main(): void {
  console.log("=== CUPID Demo ===");
  console.log("");

  const users: User[] = [
    { name: "Son", age: 30, active: true },
    { name: "An", age: 25, active: false },
    { name: "Binh", age: 28, active: true },
  ];
  const snapshot = JSON.stringify(users);

  // ❌ BAD: đổi mảng gốc của caller
  const badResult = processDataBad(users);
  console.log(`❌ BAD processData: ${JSON.stringify(badResult)}`);
  console.log(`   → mảng gốc bị đổi thứ tự: ${JSON.stringify(users) !== snapshot ? "ĐÚNG, đã bị đổi (side-effect ẩn)!" : "không"}`);
  console.log("");

  // ✅ GOOD: đoán được, không đổi input, ghép nối rõ ràng
  const users2: User[] = [
    { name: "Son", age: 30, active: true },
    { name: "An", age: 25, active: false },
    { name: "Binh", age: 28, active: true },
  ];
  const goodResult = getActiveNames(users2);
  console.log(`✅ GOOD getActiveNames: ${JSON.stringify(goodResult)}`);
  console.log(`   → mảng gốc giữ nguyên: ${JSON.stringify(users2.map((u) => u.name))}`);
  console.log("");

  // ✅ GOOD: tái dùng mảnh ghép cho flow mới không cần viết lại
  const onlyNames = users2.filter(isActive).map(toDisplayName);
  console.log(`✅ GOOD tái dùng mảnh ghép: ${JSON.stringify(onlyNames)}`);
  console.log("");

  // ✅ GOOD: Domain-based
  const total = calculateCheckoutTotal([
    { price: 100, quantity: 2 },
    { price: 50, quantity: 3 },
  ]);
  console.log(`✅ GOOD domain-based calculateCheckoutTotal: ${total}`);
  console.log("");
  console.log("✅ CUPID: nhỏ + 1 việc + đoán được + idiomatic + nói ngôn ngữ domain");
}

main();

export {};
