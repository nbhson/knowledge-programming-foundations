/**
 * 5.7.6 Replace Magic Number — Demo
 *
 * Số "ma" xuất hiện lộn xộn trong code (15000000, 0.085, 8...) rất khó hiểu
 * và dễ sửa nhầm. Thay bằng hằng số/hàm có TÊN: một nơi định nghĩa,
 * mọi nơi khác chỉ nhắc đến tên.
 */

// ✅ Hằng số có tên — một NƠI duy nhất giữ "con số"
const RmMinMonthlySalary = 15_000_000;
const RmMinSavings = 100_000_000;
const RmMinCreditScore = 700;
const RmMaxLoanMultiple = 8;
const RmNormalLoanMultiple = 3;
const RmAnnualInterestRate = 0.085;
const RmDefaultLoanTerms = 12;

class RmLoanBefore {
  maxLoan(salary: number, savings: number, creditScore: number): number {
    if (salary >= 15000000 && savings >= 100000000 && creditScore >= 700) {
      return salary * 8;
    }
    return salary * 3;
  }

  yearlyInterest(loan: number): number {
    return loan * 0.085;
  }

  monthlyInstallment(loan: number): number {
    return loan / 12;
  }
}

class RmLoanAfter {
  private isPrimeCustomer(salary: number, savings: number, creditScore: number): boolean {
    return salary >= RmMinMonthlySalary && savings >= RmMinSavings && creditScore >= RmMinCreditScore;
  }

  maxLoan(salary: number, savings: number, creditScore: number): number {
    const multiple = this.isPrimeCustomer(salary, savings, creditScore) ? RmMaxLoanMultiple : RmNormalLoanMultiple;
    return salary * multiple;
  }

  yearlyInterest(loan: number): number {
    return loan * RmAnnualInterestRate;
  }

  monthlyInstallment(loan: number): number {
    return loan / RmDefaultLoanTerms;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Replace Magic Number Demo ===");
console.log("");

console.log("❌ TRƯỚC — code đầy số ma:");
console.log("  `if (salary >= 15000000 && savings >= 100000000 && creditScore >= 700)`");
console.log("  `return salary * 8;`  `return loan * 0.085;`  `return loan / 12;`");
console.log("  💬 15000000 là gì? 8 là gì? 0.085 là lãi tháng hay năm? 12 để làm gì?");
console.log("  💬 Ngân hàng đổi lãi suất → phải tìm từng chỗ 0.085 mà sửa, lỡ sửa nhầm chỗ khác");
console.log("");

console.log("✅ SAU — hằng số có tên:");
const rmAfter = new RmLoanAfter();
const rmBefore = new RmLoanBefore();
console.log(`  isPrimeCustomer() dùng RmMinMonthlySalary / RmMinSavings / RmMinCreditScore`);
console.log(`  maxLoan(20tr, 150tr, 750) → ${rmAfter.maxLoan(20_000_000, 150_000_000, 750)} đồng (giống TRƯỚC: ${rmBefore.maxLoan(20_000_000, 150_000_000, 750)})`);
console.log(`  yearlyInterest(100tr) → ${rmAfter.yearlyInterest(100_000_000)} đồng/năm`);
console.log(`  monthlyInstallment(100tr) → ${rmAfter.monthlyInstallment(100_000_000)} đồng/tháng (${RmDefaultLoanTerms} kỳ)`);
console.log("  💬 Muốn đổi lãi suất → sửa ĐÚNG 1 dòng RmAnnualInterestRate; 12 kỳ → đổi RmDefaultLoanTerms");
console.log("");

console.log("📏 QUY TẮC:");
console.log("  - Con số có Ý NGHĨA nghiệp vụ (lãi suất, hạn mức) → phải thành hằng số có tên");
console.log("  - Con số chỉ là đếm/tạm (i++ , array.length, 0/1 khởi tạo) → cứ để nguyên");
console.log("  - Cùng nghĩa ở nhiều nơi → dùng CHUNG một hằng số (không copy value)");
console.log("");
console.log("✅ Replace Magic Number: số trần → hằng số đặt tên — code tự giải thích, sửa 1 chỗ là chuẩn toàn hệ thống");
console.log("");

export {};