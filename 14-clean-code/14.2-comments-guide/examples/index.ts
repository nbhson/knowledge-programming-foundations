/**
 * 14.2 Comments Guide — Demo
 *
 * Comment tốt giải thích TẠI SAO (why), không giải thích CÁI GÌ (what).
 * Trình diễn các trường hợp:
 *   - Comment thừa (redundant) → xóa, thay bằng tên biến tốt
 *   - Comment lừa dối (nói dối code) → sửa luôn code
 *   - Comment giải thích "why"/cảnh báo → được giữ lại
 */

// ────────────────────── ❌ Phiên bản comment thừa ──────────────────────────
class CommentBadTax {
  // Hàm tính thuế
  calculateTax(price: number): number {
    // nhân với 0.1
    const tax = price * 0.1;
    // trả về thuế
    return tax;
  }
}

// ────────────────────── ✅ Refactor: comment thừa bị xóa ───────────────────
const COMMENT_TAX_RATE = 0.1;

class CommentGoodTax {
  calculateStandardTax(basePrice: number): number {
    return basePrice * COMMENT_TAX_RATE;
  }
}

// ────────────────────── ❌ Comment lừa dối (dối trá) ───────────────────────
class CommentBadUserName {
  // Trả về ID của user
  getUserName(userId: number): string {
    return `user-${userId}-name`;
  }
}

// ────────────────────── ✅ Sửa luôn code cho đúng với tên ───────────────────
class CommentGoodUserResolver {
  getUserProfileName(userId: number): string {
    // quy tắc kinh doanh: tên hiển thị = "user-" + id
    return `user-${userId}-name`;
  }
}

// ──────────────────── ✅ Comment nên tồn tại — giải thích WHY ───────────────
class CommentPayment {
  /**
   * Giữ lại giỏ hàng trên thiết bị dùng localStorage.
   * WHY: người dùng nội địa có tỉ lệ bỏ giỏ cao khi mất mạng —
   * quyết định từ analytics #reports/cart-abandon (2024-10).
   */
  persistCart(cartId: string, items: string[]): void {
    const snapshot = `${cartId}:${items.join(",")}`;
    console.log(`  💾 Lưu giỏ hàng ${snapshot.length} ký tự (localStorage)`);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Comments Guide Demo ===");
console.log("");

console.log("1️⃣ COMMENT THỪA (redundant) — comment nói lại đúng code:");
console.log("  ❌ class CommentBadTax:");
console.log("       // Hàm tính thuế");
console.log("       // nhân với 0.1");
console.log("     → Comment không thêm thông tin nào, chỉ tốn thời gian đọc");
console.log("  ✅ class CommentGoodTax:");
console.log("       const COMMENT_TAX_RATE = 0.1;  // code tự nói, xóa hết comment thừa");
console.log("       → Thay comment bằng hằng số có tên + tên hàm đã đủ rõ");
console.log("");

console.log("2️⃣ COMMENT LỪA DỐI (misleading) — comment nói sai với code:");
console.log("  ❌ // Trả về ID của user  nhưng hàm tên getUserName");
console.log(
  "     → Hàm CommentBadUserName.getUserName(1) trả về:",
  new CommentBadUserName().getUserName(1)
);
console.log("  ✅ Sửa luôn: hàm getUSER_PROFILE_NAME cho đúng việc thực sự làm:");
console.log(
  "     → CommentGoodUserResolver.getUserProfileName(1) =",
  new CommentGoodUserResolver().getUserProfileName(1)
);
console.log("     💬 Quy tắc: comment sai còn tệ hơn không comment — sửa code hoặc xóa comment");
console.log("");

console.log("3️⃣ COMMENT ĐÁNG GIÁ (giải thích WHY) — được giữ lại:");
new CommentPayment().persistCart("cart-42", ["iphone", "airpods"]);
console.log("  💬 Mô tả 'tại sao' (chống bỏ giỏ vì mạng yếu) + link tài liệu — reader hiểu ngay context");
console.log("");

console.log("4️⃣ CHIẾC LƯỢC RA QUYẾT ĐỊNH:");
console.log("  ┌────────────────────────────────────────────────────────────┐");
console.log("  │ Trường hợp                            │ Nên comment?     │");
console.log("  ├────────────────────────────────────────┼──────────────────┤");
console.log("  │ Giải thích TẠI SAO (decision, why)     │ ✅ CÓ            │");
console.log("  │ Cảnh báo side effect / caveat          │ ✅ CÓ            │");
console.log("  │ TODO/FIXME có context                  │ ✅ CÓ            │");
console.log("  │ Link tài liệu / compliance             │ ✅ CÓ            │");
console.log("  │ Nói lại code (redundant)               │ ❌ KHÔNG         │");
console.log("  │ Mô tả thay đổi theo thời gian          │ ❌ KHÔNG (git)   │");
console.log("  │ Diễn giải từng dòng                    │ ❌ KHÔNG         │");
console.log("  └────────────────────────────────────────┴──────────────────┘");
console.log("");
console.log("✅ Comment tốt: giải thích WHY + cảnh báo + liên kết; mọi thứ code tự nói được thì để code nói");

export {};