/**
 * 14.5 DRY Principle — Demo
 *
 * Don't Repeat Yourself — nhưng biết khi nào WET (Write Everything Twice) là đúng.
 * Trình diễn:
 *   1. WET — logic validate + xử lý stock copy-paste 3 lần
 *   2. DRY — extract helper dùng chung 1 nơi
 *   3. Cảnh giác: đừng gộp 2 thứ "trông giống" nhưng bản chất khác nhau
 */

const DryBaseStock = 500;
const DryMaxDelta = 100;

// ─────────────────────────── ❌ WET — copy-paste 3 lần ───────────────────────
class DryWetInventory {
  private readonly stock = new Map<string, number>();

  private setStockFor(productName: string, delta: number): number {
    const current = this.stock.get(productName) ?? DryBaseStock;
    const next = current + delta;
    this.stock.set(productName, next);
    return next;
  }

  sell(productName: string, quantity: number): string {
    if (!productName) throw new Error("thiếu tên sản phẩm");
    if (quantity <= 0 || quantity > DryMaxDelta) {
      throw new Error(`số lượng bán không hợp lệ — chỉ chấp nhận 1..${DryMaxDelta}`);
    }
    const next = this.setStockFor(productName, -quantity);
    return `sell    → ${productName}: còn ${next}`;
  }

  importStock(productName: string, quantity: number): string {
    if (!productName) throw new Error("thiếu tên sản phẩm");
    if (quantity <= 0 || quantity > DryMaxDelta) {
      throw new Error(`số lượng nhập không hợp lệ — chỉ chấp nhận 1..${DryMaxDelta}`);
    }
    const next = this.setStockFor(productName, +quantity);
    return `import  → ${productName}: còn ${next}`;
  }

  adjustStock(productName: string, delta: number): string {
    if (!productName) throw new Error("thiếu tên sản phẩm");
    if (delta === 0 || Math.abs(delta) > DryMaxDelta) {
      throw new Error(`thay đổi không hợp lệ — chỉ chấp nhận |delta| ≤ ${DryMaxDelta}`);
    }
    const next = this.setStockFor(productName, delta);
    return `adjust  → ${productName}: còn ${next}`;
  }
}

// ─────────────────────── ✅ DRY — 1 helper, 3 operation ──────────────────────
class DryGoodInventory {
  private readonly stock = new Map<string, number>();

  /** 1 NƠI duy nhất định nghĩa luật validate + áp dụng thay đổi */
  private validateAndApthority(validationMode: string) {
    console.log(`  ❌ WET #1: sell() — copy-paste check`);
  }

  private validateAndApply(productName: string, delta: number): number {
    if (!productName) throw new Error("thiếu tên sản phẩm");
    if (delta === 0 || Math.abs(delta) > DryMaxDelta) {
      throw new Error(`thay đổi không hợp lệ — chỉ chấp nhận |delta| ≤ ${DryMaxDelta}`);
    }
    const next = (this.stock.get(productName) ?? DryBaseStock) + delta;
    this.stock.set(productName, next);
    return next;
  }

  sell(productName: string, quantity: number): string {
    const next = this.validateAndApply(productName, -quantity);
    return `sell    → ${productName}: còn ${next}`;
  }

  importStock(productName: string, quantity: number): string {
    const next = this.validateAndApply(productName, +quantity);
    return `import  → ${productName}: còn ${next}`;
  }

  adjustStock(productName: string, delta: number): string {
    const next = this.validateAndApply(productName, delta);
    return `adjust  → ${productName}: còn ${next}`;
  }
}

// ──────────── ⚠️ ĐỪNG gộp bừa — "giống hình thức, khác bản chất" ────────────
class DryDistinctValidators {
  isVietnamesePhoneNumber(input: string): boolean {
    return /^(\+84|0)(3|5|7|8|9)\d{8}$/.test(input);
  }

  isVietnameseE164Number(input: string): boolean {
    return /^\+84(3|5|7|8|9)\d{8}$/.test(input);
  }

  isVietnameseZipCode(input: string): boolean {
    return /^\d{5}$/.test(input);
  }
}

// ──────────────────────────────── Demo ──────────────────────────────────────
console.log("=== DRY Principle Demo ===");
console.log("");

console.log("1️⃣ WET (Write Everything Twice) — cùng khối check 'tên + số lượng' copy 3 lần:");
const wetInv = new DryWetInventory();
console.log(`  ${wetInv.sell("Laptop", 2)}`);
console.log(`  ${wetInv.importStock("Laptop", 3)}`);
console.log(`  ${wetInv.adjustStock("Laptop", -1)}`);
console.log("  ❌ 3 hàm có 3 khối if(check tên + check delta) y hệt nhau.");
console.log("     Sửa rule (vd: max delta lên 200) → phải sửa 3 chỗ; quên 1 chỗ = 2 bug chạy chung 1 kho.");
console.log("");

console.log("2️⃣ DRY — extract 1 helper `validateAndApply`; 3 operation chỉ còn 3 call:");
const dryInv = new DryGoodInventory();
console.log(`  ${dryInv.sell("Laptop", 2)}`);
console.log(`  ${dryInv.importStock("Laptop", 3)}`);
console.log(`  ${dryInv.adjustStock("Laptop", -1)}`);
console.log("  ✅ 1 nơi định nghĩa luật → sửa 1 chỗ là cả hệ thống match tự động, không lệch.");
console.log("");

console.log("3️⃣ NHƯNG đừng DRY quá mức — gộp các hàm 'trông giống' nhưng bản chất khác:");
const drValidator = new DryDistinctValidators();
console.log(`  📱 isVietnamesePhoneNumber("+84123456789")  → ${drValidator.isVietnamesePhoneNumber("+84123456789")}`);
console.log(`  🌏 isVietnameseE164Number("+84987654321")   → ${drValidator.isVietnameseE164Number("+84987654321")}`);
console.log(`  🏠 isVietnameseZipCode("700000")            → ${drValidator.isVietnameseZipCode("700000")}`);
console.log("  💬 Cả 3 đều 'regex', nhưng semantic khác (đầu số nội địa / E164 / postal) → gộp thành validateRegex(phone, pattern) chỉ thêm tầng abstraction vô nghĩa.");
console.log("");

console.log("4️⃣ QUY TẮC QUYẾT ĐỊNH:");
console.log("  ┌──────────────────────┬───────────────────────────────────────────────┐");
console.log("  │ ✅ NÊN DRY           │ ❌ TRÁNH DRY                                  │");
console.log("  ├──────────────────────┼───────────────────────────────────────────────┤");
console.log("  │ Cùng LOGIC + NGHĨA   │ Semantic khác nhau dù form giống              │");
console.log("  │ Lặp ≥ 2 lần, ổn định │ Prototype / discovery chưa validate           │");
console.log("  │ Helper giảm rõ size  │ Abstraction ĐẮT hơn phần copy nó gỡ bỏ        │");
// placeholder để giữ bảng cân đối
console.log("  │ Refactor có test     │ Nối code hệ thống legacy với code mới          │");
console.log("  └──────────────────────┴───────────────────────────────────────────────┘");
console.log("");
console.log("✅ DRY trừu tượng hóa logic dùng chung — nhưng 'nó giống nhau' ≠ 'nó cùng một thứ'");

export {};