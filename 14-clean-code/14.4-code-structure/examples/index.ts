/**
 * 14.4 Code Structure — Demo
 *
 * Trình diễn tổ chức code tốt vs một function dài làm nhiều việc:
 *   - Function nhỏ, đúng 1 trách nhiệm, < 20 dòng
 *   - Gom tham số vào interface (tránh 4+ tham số rời)
 *   - Module hóa: tách logic thành các khối tái dùng
 */

// ─────────────────────── ❌ Blanket function (làm TẤT CẢ) ───────────────────
interface StructRawOrder {
  productName: string;
  unitPrice: number;
  quantity: number;
  couponCode?: string;
  customerEmail: string;
}

class StructBadOrderProcessor {
  completeOrder(raw: StructRawOrder): string {
    // 1) validate
    if (!raw.productName) throw new Error("thiếu tên sản phẩm");
    if (raw.quantity <= 0) throw new Error("số lượng phải > 0");
    if (raw.customerEmail.indexOf("@") < 0) throw new Error("email sai");
    // 2) tính tiền
    let subtotal = raw.unitPrice * raw.quantity;
    let discount = 0;
    if (raw.couponCode === "SALE10") discount = subtotal * 0.1;
    const tax = subtotal * 0.08;
    const total = subtotal - discount + tax;
    // 3) lưu DB
    const orderNumber = "ORD-" + raw.customerEmail.length + "-" + raw.quantity;
    // 4) gửi email + log
    const receipt = `${orderNumber}: ${raw.productName} x${raw.quantity} = ${total}`;
    if (raw.customerEmail.endsWith("@company.com")) {
      console.log("   (gửi email nội bộ...)");
    }
    return receipt;
  }
}

// ─────────────────────── ✅ Tách thành các function nhỏ ─────────────────────
const StructDiscountRate = 0.1;
const StructTaxRate = 0.08;

interface StructOrderItem {
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface StructCustomer {
  email: string;
  isInternal: boolean;
}

interface StructOrderCommand {
  item: StructOrderItem;
  couponCode?: string;
  customer: StructCustomer;
}

interface StructOrderPricing {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

class StructGoodOrderProcessor {
  validate(order: StructOrderCommand): void {
    if (!order.item.productName) throw new Error("thiếu tên sản phẩm");
    if (order.item.quantity <= 0) throw new Error("số lượng phải > 0");
    if (order.customer.email.indexOf("@") < 0) throw new Error("email sai");
  }

  calculatePricing(order: StructOrderCommand): StructOrderPricing {
    const subtotal = order.item.unitPrice * order.item.quantity;
    const discount = order.couponCode === "SALE10" ? subtotal * StructDiscountRate : 0;
    const tax = subtotal * StructTaxRate;
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }

  buildOrderNumber(order: StructOrderCommand): string {
    return `ORD-${order.customer.email.length}-${order.item.quantity}`;
  }

  notifyCustomer(order: StructOrderCommand, total: number): void {
    if (order.customer.isInternal) {
      console.log("   (gửi email nội bộ...)");
    }
  }

  complete(order: StructOrderCommand): string {
    this.validate(order);
    const pricing = this.calculatePricing(order);
    const orderNumber = this.buildOrderNumber(order);
    this.notifyCustomer(order, pricing.total);
    return `${orderNumber}: ${order.item.productName} x${order.item.quantity} = ${pricing.total}`;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Code Structure Demo ===");
console.log("");

const companyCustomer: StructCustomer = { email: "abc@company.com", isInternal: true };
const externalCustomer: StructCustomer = { email: "son@example.com", isInternal: false };
const orderItem: StructOrderItem = { productName: "Laptop", unitPrice: 1000, quantity: 2 };

console.log("1️⃣ MỘT function dài làm 4 việc (validate + tính tiền + DB + email):");
console.log("  ❌ StructBadOrderProcessor.completeOrder(...) →", new StructBadOrderProcessor().completeOrder({ productName: "Laptop", unitPrice: 1000, quantity: 2, couponCode: "SALE10", customerEmail: "son@example.com" }));
console.log("     • ~15 dòng trong 1 hàm: validation lẫn lộn business logic");
console.log("     • Coupon 'SALE10', thuế 0.08, mã 'ORD-...' — magic value nằm rải rác");
console.log("     • Không tái dùng: muốn tính giá riêng cũng phải gọi cả 'completeOrder'");
console.log("");

console.log("2️⃣ Tách thành các function nhỏ, mỗi cái 1 việc:");
const good = new StructGoodOrderProcessor();
const orderCmd: StructOrderCommand = {
  item: orderItem,
  couponCode: "SALE10",
  customer: externalCustomer,
};
const orderPricing = good.calculatePricing(orderCmd);
console.log(`  📐 calculatePricing → subtotal=${orderPricing.subtotal}, discount=${orderPricing.discount}, tax=${orderPricing.tax}, total=${orderPricing.total}`);
console.log(`  📏 buildOrderNumber  → ${good.buildOrderNumber(orderCmd)}`);
console.log(`  ✅ complete(order)   → ${good.complete(orderCmd)}`);
console.log("     • Mỗi hàm < 6 dòng, tên mô tả đúng hành động");
console.log("     • calculatePricing dùng lại được cho màn hình 'tạm tính'");
console.log("");

console.log("3️⃣ Tham số — dùng interface gom lại (tránh 4+ tham số rời):");
console.log("  ❌ connect(host, port, timeout, retries, ssl, proxy, user, pass) — 8 tham số");
console.log("  ✅ StructOrderCommand gom item + customer + coupon vào 1 object:");
console.log(`     Object.keys(orderCmd) → [${Object.keys(orderCmd).join(", ")}] rõ ràng, đọc dễ`);
console.log("");

console.log("4️⃣ MODULE hóa — mỗi khối code là 1 'module' tách biệt:");
console.log("  struct > validate (khối 1)");
console.log("          ├─ calculatePricing (khối 2 — business logic thuần túy)");
console.log("          ├─ buildOrderNumber (khối 3 — tạo mã)");
console.log("          └─ notifyCustomer   (khối 4 — side effect)");
console.log("  💬 Tách side effect (DB/email) khỏi logic tính toán → dễ test từng phần");
console.log("");

console.log("✅ Code structure: function nhỏ 1 việc + interface gom tham số + tách side effect giúp dễ đọc dễ test");

export {};