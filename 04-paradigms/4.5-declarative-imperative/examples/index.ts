/**
 * 4.5 Declarative vs Imperative — Cùng 1 bài toán, 2 cách viết
 *
 * - Imperative (thủ tục): chỉ CÁCH làm từng bước (loop, if, mutate biến)
 * - Declarative (khai báo): mô tả KẾT QUẢ mong muốn (dùng map/filter/reduce)
 */

// ─────────────────── Cùng một bài toán bằng 2 cách ──────────────────────────
// Bài toán: lấy các số chẵn từ mảng, nhân đôi, rồi tính tổng. Trả về kèm danh sách.

function evenDoubledSumImperative(numbers: readonly number[]): {
  total: number;
  list: number[];
} {
  const doubled: number[] = [];
  let total = 0;

  // HOW: chỉ từng bước thao tác — duyệt chỉ số, kiểm tra, ghi đè biến
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] % 2 === 0) {
      const value = numbers[i] * 2;
      doubled.push(value);
      total += value;
    }
  }

  return { total, list: doubled };
}

function evenDoubledSumDeclarative(numbers: readonly number[]): {
  total: number;
  list: number[];
} {
  // WHAT: mô tả phép biến đổi, để ngôn ngữ lo việc duyệt & kiểm tra
  const doubled = numbers
    .filter((n) => n % 2 === 0) // chọn phần tử "chẵn"
    .map((n) => n * 2); // biến đổi "nhân đôi"

  const total = doubled.reduce((acc, n) => acc + n, 0); // "tính tổng"
  return { total, list: doubled };
}

// ──────────────── Thêm ví dụ thực tế: lọc user active ──────────────────────
interface User {
  name: string;
  isActive: boolean;
  score: number;
}

const users: User[] = [
  { name: "Lan", isActive: true, score: 90 },
  { name: "Hùng", isActive: false, score: 50 },
  { name: "Mai", isActive: true, score: 75 },
];

function activeNamesImperative(list: readonly User[]): string[] {
  const names: string[] = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].isActive) {
      names.push(list[i].name);
    }
  }
  return names;
}

function activeNamesDeclarative(list: readonly User[]): string[] {
  return list.filter((u) => u.isActive).map((u) => u.name);
}

// ──────────────────── Đếm total score user active ───────────────────────────
function totalActiveScoreImperative(list: readonly User[]): number {
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].isActive) {
      total += list[i].score;
    }
  }
  return total;
}

function totalActiveScoreDeclarative(list: readonly User[]): number {
  return list.reduce(
    (acc, u) => (u.isActive ? acc + u.score : acc),
    0
  );
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Declarative vs Imperative Demo ===");
console.log("");

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log("🎯 Bài toán 1: số chẵn × 2 rồi tính tổng");
console.log("  Imperative  →", JSON.stringify(evenDoubledSumImperative(numbers)));
console.log("  Declarative →", JSON.stringify(evenDoubledSumDeclarative(numbers)));
console.log("");

console.log("🎯 Bài toán 2: tên user đang active");
console.log("  Imperative  →", JSON.stringify(activeNamesImperative(users)));
console.log("  Declarative →", JSON.stringify(activeNamesDeclarative(users)));
console.log("");

console.log("🎯 Bài toán 3: tổng điểm user active");
console.log(
  `  Imperative  → ${totalActiveScoreImperative(users)}`
);
console.log(
  `  Declarative → ${totalActiveScoreDeclarative(users)}`
);
console.log("");

// So sánh cùng một chuỗi phép biến đổi — declarative ngắn gọn hơn hẳn
console.log("📏 Độ dài code (so sánh nhanh):");
console.log("  Imperative: loop + điều kiện + mutate biến (nhiều dòng)");
console.log("  Declarative: filter/map/reduce mô tả trực tiếp kết quả");
console.log("");

console.log("✅ Declarative mô tả WHAT (kết quả), Imperative mô tả HOW (từng bước); cùng kết quả, khác cách tiếp cận");
export {};
