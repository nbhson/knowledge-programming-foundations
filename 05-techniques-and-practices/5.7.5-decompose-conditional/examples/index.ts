/**
 * 5.7.5 Decompose Conditional — Demo
 *
 * Tách điều kiện dài & khó đọc thành các method predicate có tên.
 * Mỗi điều kiện con trở thành câu hỏi nghiệp vụ rõ ràng.
 */

const DcSeniorAge = 60;
const DcLongServiceYears = 15;
const DcTenureYears = 10;

type DcLeave = { age: number; serviceYears: number; joinedOnHoliday: boolean; isExpat: boolean };

// ❌ TRƯỚC — điều kiện dài dồn 1 chỗ, đọc là phải phân tích
class DcPolicyBefore {
  extraDays(leave: DcLeave): number {
    if (leave.age >= DcSeniorAge || leave.serviceYears >= DcLongServiceYears || (leave.joinedOnHoliday && !leave.isExpat)) {
      return 5;
    }
    if (leave.serviceYears >= DcTenureYears) {
      return 3;
    }
    return 0;
  }
}

// ✅ SAU — mỗi điều kiện là một predicate có tên, tái dùng được
class DcPolicyAfter {
  private isSenior(age: number): boolean {
    return age >= DcSeniorAge;
  }

  private isLongService(years: number): boolean {
    return years >= DcLongServiceYears;
  }

  private isHolidayLocal(joinedOnHoliday: boolean, isExpat: boolean): boolean {
    return joinedOnHoliday && !isExpat;
  }

  private hasTenure(years: number): boolean {
    return years >= DcTenureYears;
  }

  extraDays(leave: DcLeave): number {
    const topTier = this.isSenior(leave.age) || this.isLongService(leave.serviceYears) || this.isHolidayLocal(leave.joinedOnHoliday, leave.isExpat);
    if (topTier) return 5;
    if (this.hasTenure(leave.serviceYears)) return 3;
    return 0;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Decompose Conditional Demo ===");
console.log("");

console.log("❌ TRƯỚC — must đọc kỹ để hiểu 'ai được +5 ngày?':");
console.log("  `if (leave.age >= 60 || leave.serviceYears >= 15 || (leave.joinedOnHoliday && !leave.isExpat))`");
console.log("  💬 Phải căng não phân tích: senior? lâu năm? nghỉ nước ngoài? thuộc nhóm nào?");
console.log("");

console.log("✅ SAU — điều kiện được 'đặt tên':");
console.log("  topTier = isSenior(age) || isLongService(years) || isHolidayLocal(joinedOnHoliday, isExpat)");
console.log("  → mỗi predicate trả lời 1 CÂU HỎI: già chưa? thâm niên? nghỉ lễ nội địa?");
console.log("");

const dcCases: DcLeave[] = [
  { age: 65, serviceYears: 2, joinedOnHoliday: false, isExpat: true },
  { age: 30, serviceYears: 16, joinedOnHoliday: false, isExpat: false },
  { age: 28, serviceYears: 3, joinedOnHoliday: true, isExpat: false },
  { age: 25, serviceYears: 4, joinedOnHoliday: false, isExpat: true },
];

const dcBefore = new DcPolicyBefore();
const dcAfter = new DcPolicyAfter();

for (let i = 0; i < dcCases.length; i++) {
  const c = dcCases[i];
  const r1 = dcBefore.extraDays(c);
  const r2 = dcAfter.extraDays(c);
  const match = r1 === r2 ? "✓ giống" : "✗ LỆCH";
  console.log(`  Case ${i + 1}: TRƯỚC=${r1} · SAU=${r2} — ${match}`);
}

console.log("  💬 Với SAU, đọc `topTier` biết ngay đó là 'hạng ưu tiên cao' — không cần phân tích lại từng &&  ||");
console.log("");
console.log("✅ Decompose Conditional: điều kiện phức tạp → hàm predicate có tên, đọc code như đọc quy tắc nghiệp vụ");
console.log("");

export {};