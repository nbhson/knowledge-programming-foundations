/**
 * 5.7.4 Move Method — Demo
 *
 * Khi một method dùng dữ liệu của class KHÁC nhiều hơn dữ liệu của chính nó
 * (Feature Envy), hãy CHUYỂN method sang class sở hữu dữ liệu đó.
 * Behavioral giữ nguyên, nhưng trách nhiệm đặt đúng chỗ (SRP).
 */

const MmUrbanRatePerKg = 20000;
const MmHanoiRatePerKg = 15000;
const MmStandardRatePerKg = 18000;

type MmLocation = { province: string; urban: boolean };

// ❌ TRƯỚC — shippingFee() nằm ở Order nhưng dùng dữ liệu của customer.address
class MmCustomerBefore {
  constructor(readonly name: string, readonly address: { location: MmLocation }) {}
}

class MmOrderBefore {
  constructor(
    private readonly customer: MmCustomerBefore,
    private readonly weightKg: number,
    readonly productName: string
  ) {}

  shippingFee(): number {
    const loc = this.customer.address.location;
    if (loc.urban) return this.weightKg * MmUrbanRatePerKg;
    if (loc.province === "Hà Nội") return this.weightKg * MmHanoiRatePerKg;
    return this.weightKg * MmStandardRatePerKg;
  }

  total(price: number): number {
    return price * this.weightKg + this.shippingFee();
  }
}

// ✅ SAU — shippingFeeFor() chuyển sang Customer, nơi nắm dữ liệu location
class MmCustomerAfter {
  constructor(readonly name: string, readonly location: MmLocation) {}

  shippingFeeFor(weightKg: number): number {
    if (this.location.urban) return weightKg * MmUrbanRatePerKg;
    if (this.location.province === "Hà Nội") return weightKg * MmHanoiRatePerKg;
    return weightKg * MmStandardRatePerKg;
  }
}

class MmOrderAfter {
  constructor(
    private readonly customer: MmCustomerAfter,
    private readonly weightKg: number,
    readonly productName: string
  ) {}

  shippingFee(): number {
    return this.customer.shippingFeeFor(this.weightKg);
  }

  total(price: number): number {
    return price * this.weightKg + this.shippingFee();
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Move Method Demo ===");
console.log("");

const mmLoc: MmLocation = { province: "Hà Nội", urban: true };

console.log("❌ TRƯỚC — Feature Envy:");
console.log("  Order.shippingFee() truy cập `this.customer.address.location` 3 chỗ");
console.log("  → Order dùng dữ liệu của Customer nhiều hơn dữ liệu của chính nó");
const mmOrderBefore = new MmOrderBefore(new MmCustomerBefore("Son", { location: mmLoc }), 3, "Laptop");
console.log(`  → shippingFee() = ${mmOrderBefore.shippingFee()} đồng cho đơn ${mmOrderBefore.productName}`);
console.log("  💬 Sửa luật phí vận chuyển → phải sửa class Order dù nó không liên quan");
console.log("");

console.log("✅ SAU — Move Method sang Customer:");
console.log("  Customer.nắm location → sở hữu luôn shippingFeeFor(weightKg)");
console.log("  Order.chỉ biết nhờ `customer.shippingFeeFor(weightKg)`");
const mmOrderAfter = new MmOrderAfter(new MmCustomerAfter("Son", mmLoc), 3, "Laptop");
console.log(`  → shippingFee() = ${mmOrderAfter.shippingFee()} đồng — kết quả GIỐNG TRƯỚC`);
console.log("  💬 Sửa luật phí → chỉ sửa 1 chỗ trong Customer, mọi Order cùng dùng");
console.log("");

console.log("🔍 DẤU HIỆU Feature Envy cần Move Method:");
console.log("  - Method gọi this.xxx.xxx.yyy() nhiều hơn dùng field cục bộ");
console.log("  - Method liên tục lấy dữ liệu từ object khác qua getter dài");
console.log("");
console.log("✅ Move Method: đưa method về class chứa dữ liệu nó đang dùng — Behavior giữ nguyên, trách nhiệm đúng chỗ");
console.log("");

export {};