/**
 * 5.7.2 Rename Variable/Method — Demo
 *
 * Đổi tên (biến, tham số, method, class) cho tự nói lên ý định.
 * Không đổi logic — chỉ đổi "ngôn ngữ" của code.
 */

const RnvResumeWindowDays = 30;

// ❌ TRƯỚC — tên ngắn, tối nghĩa, phải đoán nghĩa
class RnvAccountBefore {
  calc(u: string, e: string, act: number, exp: number): boolean {
    const d = act - exp;
    if (u !== "" && e.includes("@") && d > RnvResumeWindowDays) {
      return true;
    }
    return false;
  }
}

// ✅ SAU — tên đọc lên như một câu hỏi nghiệp vụ
type RnvContact = { username: string; email: string };

class RnvAccountAfter {
  canResumeTrial(contact: RnvContact, activeDays: number, expiredDays: number): boolean {
    const freeDaysUsed = activeDays - expiredDays;
    const hasValidContact = contact.username !== "" && contact.email.includes("@");
    const stillInsideWindow = freeDaysUsed > RnvResumeWindowDays;
    return hasValidContact && stillInsideWindow;
  }
}

// ❌ TRƯỚC — số trần "5" xuất hiện bừa, tên vô nghĩa
class RnvLevelBefore {
  pro(lv: number, p: number): string {
    if (lv >= 5 && p >= 5) return "gold";
    if (lv >= 3) return "silver";
    return "bronze";
  }
}

// ✅ SAU — tên tham số + hằng số thay cho chữ số trần
const RnvGoldMinLevel = 5;
const RnvGoldMinProducts = 5;
const RnvSilverMinLevel = 3;

class RnvLevelAfter {
  tier(level: number, activeProducts: number): string {
    const isGold = level >= RnvGoldMinLevel && activeProducts >= RnvGoldMinProducts;
    if (isGold) return "gold";
    if (level >= RnvSilverMinLevel) return "silver";
    return "bronze";
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Rename Variable/Method Demo ===");
console.log("");

console.log("1️⃣ Method + tham số:");
console.log(`  ❌ calc("son", "s@e.com", 45, 10) → ${new RnvAccountBefore().calc("son", "s@e.com", 45, 10)}`);
console.log(`  ✅ canResumeTrial({username:"son", email:"s@e.com"}, 45, 10) → ${new RnvAccountAfter().canResumeTrial({ username: "son", email: "s@e.com" }, 45, 10)}`);
console.log("     💬 calc/u/e/act/exp → hasValidContact, freeDaysUsed, stillInsideWindow");
console.log("");

console.log("2️⃣ Biến + số trần:");
console.log(`  ❌ pro(5, 5) → ${new RnvLevelBefore().pro(5, 5)} — '5' là gì? lv/p là gì?`);
console.log(`  ✅ tier(level=5, activeProducts=5) → ${new RnvLevelAfter().tier(5, 5)} — gold khi đủ cả level lẫn số sản phẩm`);
console.log("");

console.log("📏 QUY TẮC ĐẶT TÊN:");
console.log("  - Method: bắt đầu bằng verb → canResumeTrial, calculateTotal, sendNotification");
console.log("  - Biến: danh từ rõ nghĩa → freeDaysUsed, orderTotal, customerName");
console.log("  - Boolean: is/has/can → hasValidContact, isGold, canResumeTrial");
console.log("  - TRÁNH abbreviation: u→username, e→email, act→activeDays, lv→level");
console.log("");
console.log("✅ Rename: thay đổi TÊN, giữ nguyên LOGIC — công cụ IDE tốt chỉ là Edit → Rename Symbol");
console.log("");

export {};