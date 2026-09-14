/**
 * 5.7 Refactoring Techniques — Demo tổng quan
 *
 * Refactoring = thay đổi cấu trúc code, KHÔNG thay đổi hành vi.
 * Tour nhanh 6 kỹ thuật (bản đầy đủ ở từng leaf 5.7.1 → 5.7.6):
 *   1. Extract Method         — tách hàm dài thành hàm nhỏ có tên
 *   2. Rename Variable/Method — đặt tên tự nói lên ý định
 *   3. Inline Method          — gộp bỏ hàm trung gian thừa
 *   4. Move Method            — chuyển hàm về class sở hữu dữ liệu
 *   5. Decompose Conditional  — tách điều kiện dài thành predicate
 *   6. Replace Magic Number   — thay số ma bằng hằng số có tên
 */

// ─────── Hằng số (minh họa kỹ thuật 6: named constants) ───────
const RftVipFactor = 0.9;
const RftGiftRate = 0.15;
const RftGiftMinQty = 5;
const RftTaxRate = 0.1;
const RftShippingFee = 25000;
const RftUrbanRatePerKg = 20000;
const RftHanoiRatePerKg = 15000;
const RftStandardRatePerKg = 18000;
const RftMinSalary = 15_000_000;
const RftMinSavings = 100_000_000;
const RftMinCreditScore = 700;
const RftLoanMultiple = 8;
const RftNormalMultiple = 3;

// ────────── 1. EXTRACT METHOD ──────────
type RftCheckoutItem = { qty: number; price: number };

class RftCheckoutBefore {
  pay(items: RftCheckoutItem[], isVip: boolean): number {
    for (const item of items) {
      if (item.qty <= 0 || item.price < 0) throw new Error("dữ liệu item không hợp lệ");
    }
    let total = 0;
    for (const item of items) total += item.qty * item.price;
    if (isVip) total = total * RftVipFactor;
    const totalQty = items.reduce((sum, it) => sum + it.qty, 0);
    if (totalQty >= RftGiftMinQty) total = total * (1 - RftGiftRate);
    return total;
  }
}

class RftCheckoutAfter {
  private validateItems(items: RftCheckoutItem[]): void {
    for (const item of items) {
      if (item.qty <= 0 || item.price < 0) throw new Error("dữ liệu item không hợp lệ");
    }
  }
  private subtotal(items: RftCheckoutItem[]): number {
    return items.reduce((sum, it) => sum + it.qty * it.price, 0);
  }
  private totalQuantity(items: RftCheckoutItem[]): number {
    return items.reduce((sum, it) => sum + it.qty, 0);
  }
  private applyVip(total: number, isVip: boolean): number {
    return isVip ? total * RftVipFactor : total;
  }
  private applyGift(total: number, items: RftCheckoutItem[]): number {
    return this.totalQuantity(items) >= RftGiftMinQty ? total * (1 - RftGiftRate) : total;
  }
  pay(items: RftCheckoutItem[], isVip: boolean): number {
    this.validateItems(items);
    return this.applyGift(this.applyVip(this.subtotal(items), isVip), items);
  }
}

// ────────── 2. RENAME VARIABLE/METHOD ──────────
class RftRenameBefore {
  calc(u: string, e: string, act: number, exp: number): boolean {
    const d = act - exp;
    return u !== "" && e.includes("@") && d > 30;
  }
}

class RftRenameAfter {
  canResumeTrial(username: string, email: string, activeDays: number, expiredDays: number): boolean {
    const freeDaysUsed = activeDays - expiredDays;
    return username !== "" && email.includes("@") && freeDaysUsed > 30;
  }
}

// ────────── 3. INLINE METHOD ──────────
class RftInlineBefore {
  private netWithTax(price: number, qty: number): number {
    return price * qty * (1 + RftTaxRate);
  }
  checkout(price: number, qty: number): number {
    return this.netWithTax(price, qty) + RftShippingFee;
  }
}

class RftInlineAfter {
  checkout(price: number, qty: number): number {
    return price * qty * (1 + RftTaxRate) + RftShippingFee;
  }
}

// ────────── 4. MOVE METHOD ──────────
type RftLocation = { province: string; urban: boolean };

class RftCustomerBefore {
  constructor(readonly name: string, readonly address: { location: RftLocation }) {}
}

class RftOrderBefore {
  constructor(private readonly customer: RftCustomerBefore, private readonly weightKg: number) {}
  shippingFee(): number {
    const loc = this.customer.address.location;
    if (loc.urban) return this.weightKg * RftUrbanRatePerKg;
    if (loc.province === "Hà Nội") return this.weightKg * RftHanoiRatePerKg;
    return this.weightKg * RftStandardRatePerKg;
  }
}

class RftCustomerAfter {
  constructor(readonly name: string, readonly location: RftLocation) {}
  shippingFeeFor(weightKg: number): number {
    if (this.location.urban) return weightKg * RftUrbanRatePerKg;
    if (this.location.province === "Hà Nội") return weightKg * RftHanoiRatePerKg;
    return weightKg * RftStandardRatePerKg;
  }
}

class RftOrderAfter {
  constructor(private readonly customer: RftCustomerAfter, private readonly weightKg: number) {}
  shippingFee(): number {
    return this.customer.shippingFeeFor(this.weightKg);
  }
}

// ────────── 5. DECOMPOSE CONDITIONAL ──────────
type RftLeave = { age: number; serviceYears: number; joinedOnHoliday: boolean; isExpat: boolean };

class RftPolicyBefore {
  extraDays(leave: RftLeave): number {
    if (leave.age >= 60 || leave.serviceYears >= 15 || (leave.joinedOnHoliday && !leave.isExpat)) {
      return 5;
    }
    if (leave.serviceYears >= 10) return 3;
    return 0;
  }
}

class RftPolicyAfter {
  private isSenior(age: number): boolean {
    return age >= 60;
  }
  private isLongServer(years: number): boolean {
    return years >= 15;
  }
  private isHolidayLocal(joinedOnHoliday: boolean, isExpat: boolean): boolean {
    return joinedOnHoliday && !isExpat;
  }
  private servedAtLeastTen(years: number): boolean {
    return years >= 10;
  }
  extraDays(leave: RftLeave): number {
    const topTier = this.isSenior(leave.age) || this.isLongServer(leave.serviceYears) || this.isHolidayLocal(leave.joinedOnHoliday, leave.isExpat);
    if (topTier) return 5;
    if (this.servedAtLeastTen(leave.serviceYears)) return 3;
    return 0;
  }
}

// ────────── 6. REPLACE MAGIC NUMBER ──────────
class RftLoanBefore {
  maxLoan(salary: number, savings: number, creditScore: number): number {
    if (salary >= 15000000 && savings >= 100000000 && creditScore >= 700) return salary * 8;
    return salary * 3;
  }
}

class RftLoanAfter {
  private isPrimeCustomer(salary: number, savings: number, creditScore: number): boolean {
    return salary >= RftMinSalary && savings >= RftMinSavings && creditScore >= RftMinCreditScore;
  }
  maxLoan(salary: number, savings: number, creditScore: number): number {
    return this.isPrimeCustomer(salary, savings, creditScore) ? salary * RftLoanMultiple : salary * RftNormalMultiple;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Refactoring Techniques Demo (tổng quan) ===");
console.log("");

console.log("1️⃣ EXTRACT METHOD — hành vi giữ nguyên, cấu trúc trong sáng:");
const rftCart: RftCheckoutItem[] = [
  { qty: 6, price: 100000 },
  { qty: 2, price: 50000 },
];
const rftBefore = new RftCheckoutBefore();
const rftAfter = new RftCheckoutAfter();
console.log(`  ❌ Trước: pay() = ${rftBefore.pay(rftCart, true)} — validate + tính tiền + giảm giá dồn 1 hàm`);
console.log(`  ✅ Sau:  pay() = ${rftAfter.pay(rftCart, true)} — mỗi bước là 1 method nhỏ có tên`);
console.log("     💬 BEHAVIOR giữ nguyên, nhưng tách validate / subtotal / VIP / gift riêng biệt");
console.log("");

console.log("2️⃣ RENAME — tên tối nghĩa → tự mô tả ý định:");
console.log(`  ❌ calc("son", "s@e.com", 45, 10) → ${new RftRenameBefore().calc("son", "s@e.com", 45, 10)}`);
console.log(`  ✅ canResumeTrial("son", "s@e.com", 45, 10) → ${new RftRenameAfter().canResumeTrial("son", "s@e.com", 45, 10)}`);
console.log("     💬 Tên mới đọc như câu hỏi nghiệp vụ 'có thể dùng lại trial?' thay vì đoán calc/d/u");
console.log("");

console.log("3️⃣ INLINE METHOD — gộp hàm trung gian thừa:");
console.log("  ❌ checkout() gọi netWithTax() — wrapper chỉ 1 phép toán, tên không thêm giá trị");
console.log("  ✅ checkout() = price * qty * (1+tax) + ship — inline thẳng phép tính");
console.log(`     Kết quả: ${new RftInlineBefore().checkout(100000, 2)} === ${new RftInlineAfter().checkout(100000, 2)}`);
console.log("");

console.log("4️⃣ MOVE METHOD — chuyển hàm về class sở hữu dữ liệu (hết Feature Envy):");
const rftCustomerB = new RftCustomerBefore("Son", { location: { province: "Hà Nội", urban: true } });
const rftOrderB = new RftOrderBefore(rftCustomerB, 3);
const rftCustomerA = new RftCustomerAfter("Son", { province: "Hà Nội", urban: true });
const rftOrderA = new RftOrderAfter(rftCustomerA, 3);
console.log(`  ❌ Order.shippingFee() dùng customer.address... → ${rftOrderB.shippingFee()} đồng`);
console.log(`  ✅ Customer.shippingFeeFor(kg) → ${rftOrderA.shippingFee()} đồng — logic nằm đúng class có dữ liệu`);
console.log("");

console.log("5️⃣ DECOMPOSE CONDITIONAL — if dài → các predicate có tên:");
const rftLeave: RftLeave = { age: 35, serviceYears: 4, joinedOnHoliday: true, isExpat: false };
console.log("  ❌ Trước: if (age>=60 || serviceYears>=15 || (joinedOnHoliday && !isExpat))");
console.log(`  ✅ Sau:  isSenior(35) || isLongServer(4) || isHolidayLocal(true, false) → ${new RftPolicyAfter().extraDays(rftLeave)} ngày (giống ${new RftPolicyBefore().extraDays(rftLeave)})`);
console.log("");

console.log("6️⃣ REPLACE MAGIC NUMBER — số ma → hằng số có tên:");
const rftLoan = new RftLoanAfter();
console.log(`  ❌ Trước: salary>=15000000 && savings>=100000000 && creditScore>=700 ? salary*8 : salary*3`);
console.log(`  ✅ Sau:  isPrimeCustomer() dùng RftMinSalary / RftMinSavings / RftMinCreditScore → ${rftLoan.maxLoan(20_000_000, 150_000_000, 750)} đồng`);
console.log("");

console.log("✅ Refactoring đổi cấu trúc, giữ nguyên hành vi — mỗi kỹ thuật chi tiết ở 5.7.1 → 5.7.6");
console.log("");

export {};