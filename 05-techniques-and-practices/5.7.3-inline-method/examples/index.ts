/**
 * 5.7.3 Inline Method — Demo
 *
 * Khi một method chỉ là wrapper quá đơn giản (đi đường vòng),
 * hãy "inline" nó vào chỗ gọi. Ngược lại, method có Ý NGHĨA riêng
 * thì GIỮ LẠI — đừng inline mù quáng.
 */

const ImTaxRate = 0.1;
const ImShippingFee = 25000;
const ImMinHoursForOvertime = 40;
const ImOvertimeRate = 1.5;
const ImHourlyRate = 80000;

// ❌ TRƯỚC — wrapper chỉ 1 phép toán, tên không thêm giá trị
class ImCheckoutBefore {
  private netWithTax(price: number, qty: number): number {
    return price * qty * (1 + ImTaxRate);
  }

  checkout(price: number, qty: number): number {
    return this.netWithTax(price, qty) + ImShippingFee;
  }
}

// ✅ SAU — inline thẳng phép tính vào checkout
class ImCheckoutAfter {
  checkout(price: number, qty: number): number {
    return price * qty * (1 + ImTaxRate) + ImShippingFee;
  }
}

// ⚠️ NGƯỢC LẠI — method có ý nghĩa riêng thì KHÔNG inline
class ImPayroll {
  private isOvertimeWeek(hours: number): boolean {
    return hours > ImMinHoursForOvertime;
  }

  weeklySalary(hours: number): number {
    const base = hours * ImHourlyRate;
    return this.isOvertimeWeek(hours) ? base * ImOvertimeRate : base;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Inline Method Demo ===");
console.log("");

console.log("1️⃣ NÊN INLINE — wrapper không thêm giá trị:");
console.log("  ❌ Trước:");
console.log("     checkout() → netWithTax(price, qty) + ImShippingFee");
console.log("     netWithTax() chỉ là `return price * qty * (1 + ImTaxRate)` — 1 dòng, 1 phép toán,");
console.log("     tên không giải thích thêm gì → đi đường vòng");
console.log("  ✅ Sau:");
console.log("     checkout() → `price * qty * (1 + ImTaxRate) + ImShippingFee` trực tiếp ngay tại chỗ gọi");
console.log(`     Kết quả giữ nguyên: ${new ImCheckoutBefore().checkout(100000, 2)} === ${new ImCheckoutAfter().checkout(100000, 2)}`);
console.log("");

console.log("2️⃣ KHÔNG NÊN INLINE — method có ý nghĩa nghiệp vụ:");
console.log("  ❌ Trả `isOvertimeWeek(hours)` về nơi gọi:");
console.log("     `hours > 40` lặp lộn xộn, luật 'làm bao nhiêu giờ là overtime' bị nằm rải rác");
console.log("  ✅ Giữ `isOvertimeWeek()` — một CHỖ duy nhất định nghĩa khái niệm nghiệp vụ:");
console.log(`     weeklySalary(45) → ${new ImPayroll().weeklySalary(45)} đồng (giờ làm > ${ImMinHoursForOvertime} → OT ×${ImOvertimeRate})`);
console.log("");

console.log("📏 QUY TẮC:");
console.log("  INLINE khi:   → method chỉ gọi 1 method khác, tên không thêm nghĩa, chỉ 1 nơi sử dụng");
console.log("  GIỮ khi:      → tên nói lên ý định nghiệp vụ (isOvertimeWeek), tái dùng nhiều nơi, logic có thể đổi");
console.log("");
console.log("✅ Inline Method: gộp method thừa vào caller — code ngắn đi mà nghĩa không mất");
console.log("");

export {};