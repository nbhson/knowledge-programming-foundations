/**
 * 4.4 Procedural Programming — Step-by-Step Procedure Demo
 *
 * Minh họa cách tổ chức code theo procedure: chia bài toán thành
 * các hàm/thủ tục nhỏ, mỗi thủ tục làm đúng 1 việc, chạy tuần tự từng bước.
 */

// ──────────────────── Bước 1: Nhập liệu ─────────────────────────────────────
function collectOrderItems(): { name: string; price: number; quantity: number }[] {
  return [
    { name: "Cà phê sữa đá", price: 25000, quantity: 2 },
    { name: "Bánh mì ốp la", price: 20000, quantity: 1 },
    { name: "Nước cam ép", price: 30000, quantity: 1 },
  ];
}

// ──────────────────── Bước 2: Tính tổng tiền ────────────────────────────────
function calculateSubtotal(
  items: { name: string; price: number; quantity: number }[]
): number {
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price * items[i].quantity;
  }
  return subtotal;
}

// ──────────────────── Bước 3: Áp dụng giảm giá (mỗi procedure 1 mục đích) ───
function applyDiscount(subtotal: number, discountPercent: number): number {
  return subtotal * (1 - discountPercent / 100);
}

// ──────────────────── Bước 4: Cộng thuế ─────────────────────────────────────
function applyTax(amount: number, taxPercent: number): number {
  return amount * (1 + taxPercent / 100);
}

// ──────────────────── Bước 5: Làm tròn đến tiền nguyên ──────────────────────
function roundToInt(amount: number): number {
  return Math.round(amount);
}

// ──────────────────── Bước 6: Định dạng in ra ──────────────────────────────
function formatCurency(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}₫`;
}

function printLine(title: string, value: string): void {
  const padded = title.padEnd(24, ".");
  console.log(`  ${padded}: ${value}`);
}

// ─────────────── Procedure tổng: điều phối theo đúng thứ tự bước ───────────
function processOrder(discountPercent: number, taxPercent: number): void {
  console.log("Bước 1 — Đọc danh sách món:");
  const items = collectOrderItems();
  for (const item of items) {
    console.log(`  - ${item.name} | ${item.price}₫ x ${item.quantity}`);
  }
  console.log("");

  console.log("Bước 2 — Tính tiền trước giảm giá:");
  const subtotal = calculateSubtotal(items);
  printLine("Tạm tính", formatCurency(subtotal));
  console.log("");

  console.log(`Bước 3 — Giảm giá ${discountPercent}%:`);
  const afterDiscount = applyDiscount(subtotal, discountPercent);
  printLine("Sau giảm giá", formatCurency(afterDiscount));
  console.log("");

  console.log(`Bước 4 — Cộng thuế ${taxPercent}%:`);
  const afterTax = applyTax(afterDiscount, taxPercent);
  printLine("Sau thuế (chưa làm tròn)", formatCurency(afterTax));
  console.log("");

  console.log("Bước 5 — Làm tròn:");
  const total = roundToInt(afterTax);
  printLine("Tổng phải trả", formatCurency(total));
  console.log("");

  console.log("Bước 6 — In hoá đơn:");
  printLine("Thành tiền", formatCurency(total));
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Procedural Programming Demo ===");
console.log("");

console.log("🧾 Xử lý đơn hàng — mỗi việc là một procedure nhỏ, chạy tuần tự:");
console.log("");
processOrder(10, 8);

console.log("");
console.log("✅ Procedural: chia bài toán thành các bước rõ ràng, mỗi hàm làm đúng 1 việc, chạy từ trên xuống");
export {};
