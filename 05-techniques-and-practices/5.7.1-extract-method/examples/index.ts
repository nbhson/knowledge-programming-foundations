/**
 * 5.7.1 Extract Method — Demo
 *
 * Tách một hàm dài (validate + tính toán + định dạng) thành các method nhỏ,
 * mỗi method chỉ làm MỘT việc và có tên tự mô tả.
 * Hành vi TRƯỚC và SAU hoàn toàn giống nhau.
 */

const EmVipFactor = 0.9;
const EmGiftMinQty = 5;
const EmGiftFactor = 0.85;

type EmOrderItem = { name: string; qty: number; price: number };

// ❌ TRƯỚC — một hàm dài làm mọi thứ: validate, tính tổng, giảm giá, gift, format
class EmInvoiceBefore {
  print(items: EmOrderItem[], isVip: boolean): string {
    if (items.length === 0) return "Hóa đơn rỗng";

    for (const item of items) {
      if (item.qty <= 0 || item.price < 0) {
        throw new Error(`Sản phẩm '${item.name}' không hợp lệ`);
      }
    }

    let total = 0;
    for (const item of items) {
      total = total + item.qty * item.price;
    }

    if (isVip) {
      total = total * EmVipFactor;
    }

    const totalQty = items.reduce((sum, it) => sum + it.qty, 0);
    if (totalQty >= EmGiftMinQty) {
      total = total * EmGiftFactor;
    }

    return `Tổng: ${total.toFixed(2)} đồng`;
  }
}

// ✅ SAU — mỗi bước là một method nhỏ, có tên, tái dùng được
class EmInvoiceAfter {
  private hasItems(items: EmOrderItem[]): boolean {
    return items.length > 0;
  }

  private validate(items: EmOrderItem[]): void {
    for (const item of items) {
      if (item.qty <= 0 || item.price < 0) {
        throw new Error(`Sản phẩm '${item.name}' không hợp lệ`);
      }
    }
  }

  private subtotal(items: EmOrderItem[]): number {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  private totalQuantity(items: EmOrderItem[]): number {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }

  private applyVip(total: number, isVip: boolean): number {
    return isVip ? total * EmVipFactor : total;
  }

  private applyGift(total: number, items: EmOrderItem[]): number {
    return this.totalQuantity(items) >= EmGiftMinQty ? total * EmGiftFactor : total;
  }

  private format(total: number): string {
    return `Tổng: ${total.toFixed(2)} đồng`;
  }

  print(items: EmOrderItem[], isVip: boolean): string {
    if (!this.hasItems(items)) return "Hóa đơn rỗng";
    this.validate(items);
    const rawTotal = this.subtotal(items);
    const vipTotal = this.applyVip(rawTotal, isVip);
    return this.format(this.applyGift(vipTotal, items));
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Extract Method Demo ===");
console.log("");

const emItems: EmOrderItem[] = [
  { name: "Laptop", qty: 1, price: 15000000 },
  { name: "Chuột", qty: 4, price: 250000 },
];

const emBefore = new EmInvoiceBefore();
const emAfter = new EmInvoiceAfter();

console.log("❌ TRƯỚC — print() dài: validate + subtotal + VIP + gift + format dồn chung 1 hàm:");
console.log(`  → ${emBefore.print(emItems, true)}`);
console.log("  💬 Muốn biết 'tổng sau giảm giá gift là bao nhiêu' → phải đọc hết cả hàm");
console.log("");

console.log("✅ SAU — mỗi bước là 1 method nhỏ có tên:");
console.log(`  → ${emAfter.print(emItems, true)} (kết quả giống hệt TRƯỚC)`);
console.log("  1. hasItems()   — hóa đơn có hàng không?");
console.log("  2. validate()   — dữ liệu sản phẩm hợp lệ?");
console.log("  3. subtotal()   — tổng tiền hàng");
console.log("  4. applyVip()   — chiết khấu VIP?");
console.log("  5. applyGift()  — đủ số lượng tặng giảm giá?");
console.log("  6. format()     — đóng gói kết quả chữ");
console.log("");

console.log("💡 Lợi ích: mỗi method test riêng được, tái dùng được, đọc print() như bảng mục lục.");
console.log("");
console.log("✅ Extract Method: bóc tách khối code rời rạc thành function có tên — không đổi hành vi");
console.log("");

export {};