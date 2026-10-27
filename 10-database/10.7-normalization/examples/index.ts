/**
 * 10.7 Normalization — 1NF-3NF/BCNF + ví dụ tách bảng
 *
 * Minh họa:
 * - Bảng 0NF: cell nhiều giá trị + email/user lặp lại → đếm anomaly.
 * - Tách dần 1NF (atomic) → 2NF (bỏ partial dep) → 3NF (bỏ transitive dep).
 * - Denormalize có chủ đích: price_at_buy snapshot.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ───────────────────── 0NF: bảng gộp ─────────────────────
interface RawRow {
  orderId: number;
  userId: number;
  userEmail: string;
  productNames: string; // "áo, quần" — vi phạm 1NF
  total: number;
}

const RAW: RawRow[] = [
  { orderId: 1, userId: 1, userEmail: "a@b.com", productNames: "áo, quần", total: 300 },
  { orderId: 2, userId: 1, userEmail: "a@b.com", productNames: "mũ", total: 100 },
  { orderId: 3, userId: 2, userEmail: "old@x.com", productNames: "áo", total: 150 },
  // user 2 đổi email nhưng chỉ update order 3, quên chỗ khác → anomaly (mô phỏng)
  { orderId: 4, userId: 2, userEmail: "new@x.com", productNames: "quần", total: 180 },
];

function countEmailConflicts(rows: RawRow[]): number {
  const seen = new Map<number, Set<string>>();
  for (const r of rows) {
    if (!seen.has(r.userId)) seen.set(r.userId, new Set());
    seen.get(r.userId)?.add(r.userEmail);
  }
  let conflicts = 0;
  for (const emails of seen.values()) {
    if (emails.size > 1) conflicts++;
  }
  return conflicts;
}

// ───────────────────── 3NF: tách bảng ─────────────────────
interface User { id: number; email: string }
interface Product { id: number; name: string; price: number }
interface Order { id: number; userId: number }
interface OrderItem { orderId: number; productId: number; qty: number; priceAtBuy: number }

const USERS: User[] = [
  { id: 1, email: "a@b.com" },
  { id: 2, email: "new@x.com" }, // 1 sự thật, 1 nơi → không thể conflict
];

function emailOf(userId: number): string {
  return USERS.find((u) => u.id === userId)?.email ?? "?";
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Normalization Demo ===\n");

  console.log("0️⃣ Bảng gộp (0NF): userEmail lặp lại, productNames 'áo, quần' (không atomic)");
  console.log(`   user có email mâu thuẫn: ${countEmailConflicts(RAW)} (user 2: old@x.com vs new@x.com) 💥`);

  console.log("\n1️⃣ 1NF: tách productNames thành rows riêng (mỗi cell 1 giá trị atomic)");
  console.log("   order_items(order_id, product_name) — không còn 'áo, quần' trong 1 cell");

  console.log("\n2️⃣ 2NF: tách products (name/price chỉ phụ thuộc product_id)");
  console.log("   products(id, name, price) — đổi giá 1 nơi, không sửa từng order");

  console.log("\n3️⃣ 3NF: tách users (email phụ thuộc user_id, không phải order_id)");
  console.log(`   users = ${JSON.stringify(USERS)}`);
  console.log(`   emailOf(2) = ${emailOf(2)} — duy nhất, không thể mâu thuẫn ✅`);

  console.log("\n4️⃣ Denormalize có chủ đích: OrderItem.priceAtBuy (snapshot giá lúc mua)");
  console.log("   giá products đổi sau này không làm sai hóa đơn cũ — ghi rõ lý do, không copy bừa");

  console.log("\n✅ Bài học: chuẩn tới 3NF để mỗi sự thật 1 nơi; denormalize chỉ khi đo được lợi ích read.");
}

main();

export {};
