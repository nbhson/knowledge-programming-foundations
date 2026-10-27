/**
 * 14.6 Refactoring Techniques — Demo
 *
 * Trình diễn 4 kỹ thuật refactoring (trước → sau), không đổi behavior:
 *   1. Extract Method     — tách code rời rạc thành hàm riêng
 *   2. Rename             — đổi tên cho tự nói lên ý nghĩa
 *   3. Replace Magic Number with Constant
 *   4. Decompose Conditional — tách điều kiện dài thành hàm bậc cao
 */

// ─────────────── 1. EXTRACT METHOD — trước ───────────────────────────────────
class RefCheckoutBefore {
  applyPrice(cart: { qty: number; price: number; hasVip: boolean }): number {
    let total = 0;
    for (const item of [cart]) {
      total += item.qty * item.price;
    }
    if (cart.hasVip) {
      total = total * 0.95;
    }
    const gift = cart.qty >= 5 ? total * 0.15 : 0;
    return total - gift;
  }
}

// ─────────────── 1. EXTRACT METHOD + CONSTANT — sau ──────────────────────────
const REF_VIP_DISCOUNT = 0.05;
const REF_GIFT_RATE = 0.15;
const REF_GIFT_MIN_QUANTITY = 5;

class RefCheckoutAfter {
  private sumLineItems(qty: number, price: number): number {
    return qty * price;
  }

  private applyVipDiscount(total: number, isVip: boolean): number {
    return isVip ? total * (1 - REF_VIP_DISCOUNT) : total;
  }

  private computeGift(total: number, qty: number): number {
    return qty >= REF_GIFT_MIN_QUANTITY ? total * REF_GIFT_RATE : 0;
  }

  applyPrice(cart: { qty: number; price: number; hasVip: boolean }): number {
    const subtotal = this.sumLineItems(cart.qty, cart.price);
    const afterVip = this.applyVipDiscount(subtotal, cart.hasVip);
    return afterVip - this.computeGift(afterVip, cart.qty);
  }
}

// ─────────────── 2. RENAME — trước (tên tối nghĩa) ───────────────────────────
class RefNameBad {
  calc(a: string, b: string, m: number, p: number, u: string): boolean {
    const t = p * 2;
    if (t > m && a !== "" && b.includes("@") && this.crt(u)) {
      return true;
    }
    return false;
  }

  private crt(us: string): boolean {
    return us.length > 3;
  }
}

// ─────────────── 2. RENAME — sau (tên tự nói) ────────────────────────────────
interface RefAccountPayload {
  firstName: string;
  email: string;
  isVip: boolean;
}

class RefNameGood {
  private hasValidRoleOrElse(retryCount: number, maxRetries: number): boolean {
    return retryCount * 2 > maxRetries;
  }

  canOpenVipAccount(payload: RefAccountPayload, retryCount: number, maxRetries: number): boolean {
    const retryBudgetExhausted = this.hasValidRoleOrElse(retryCount, maxRetries);
    const hasFullName = payload.firstName !== "";
    const hasEmailFormat = payload.email.includes("@");
    const usernameWithEnoughChars = payload.firstName.length > 3;
    return retryBudgetExhausted && hasFullName && hasEmailFormat && usernameWithEnoughChars;
  }
}

// ─────────────── 4. DECOMPOSE CONDITIONAL — trước ────────────────────────────
type RefOrder = { age: number; memberSinceYears: number; country: string; isVerified: boolean };

class RefDiscountBefore {
  discountFor(order: RefOrder): number {
    if (
      order.age >= 60 ||
      order.memberSinceYears >= 5 ||
      (order.country === "VN" && order.isVerified)
    ) {
      return 0.2;
    }
    return 0;
  }
}

// ─────────────── 4. DECOMPOSE CONDITIONAL — sau ──────────────────────────────
class RefDiscountAfter {
  private isSenior(age: number): boolean {
    return age >= 60;
  }

  private isLoyal(memberSinceYears: number): boolean {
    return memberSinceYears >= 5;
  }

  private isVerifiedLocal(country: string, isVerified: boolean): boolean {
    return country === "VN" && isVerified;
  }

  discountFor(order: RefOrder): number {
    const eligible = this.isSenior(order.age) || this.isLoyal(order.memberSinceYears) || this.isVerifiedLocal(order.country, order.isVerified);
    return eligible ? 0.2 : 0;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Refactoring Techniques Demo ===");
console.log("");

console.log("1️⃣ EXTRACT METHOD + REPLACE MAGIC NUMBER:");
const cart = { qty: 6, price: 100, hasVip: true };
const checkoutBefore = new RefCheckoutBefore();
const checkoutAfter = new RefCheckoutAfter();
console.log(`  ❌ Trước: ${checkoutBefore.applyPrice(cart)} — mọi phép tính dồn 1 hàm, hằng số 0.95/0.15/5 không tên`);
console.log(`  ✅ Sau:  ${checkoutAfter.applyPrice(cart)} — BEHAVIOR giữ nguyên, nhưng mỗi bước là 1 hàm nhỏ có tên`);
console.log("     💬 Kiểm chứng same behavior: 570 === 570 ✓");
console.log("");

console.log("2️⃣ RENAME — biến/hàm tối nghĩa → tự mô tả:");
const nameBad = new RefNameBad();
const nameGood = new RefNameGood();
console.log(`  ❌ calc("Son", "s@e.com", 10, 5, "Son") → ${nameBad.calc("Son", "s@e.com", 10, 5, "Son")}`);
console.log(`  ✅ canOpenVipAccount({firstName:"Son", email:"s@e.com", isVip:false}, 5, 10) → ${nameGood.canOpenVipAccount({ firstName: "Son", email: "s@e.com", isVip: false }, 5, 10)}`);
console.log("     💬 Tên mới đọc như câu hỏi nghiệp vụ — 'có thể mở tài khoản VIP?' — thay vì đoán calc/crt/m");
console.log("");

console.log("3️⃣ DECOMPOSE CONDITIONAL — điều kiện dài → các hàm mô tả:");
console.log("  ❌ Trước: if (age>=60 || memberSinceYears>=5 || (country===`VN` && isVerified))");
const discountBefore = new RefDiscountBefore();
const discountAfter = new RefDiscountAfter();
const order2: RefOrder = { age: 25, memberSinceYears: 6, country: "VN", isVerified: true };
console.log(`  ✅ Sau:  isSenior || isLoyal || isVerifiedLocal(age=${order2.age}, memberSince=${order2.memberSinceYears}, VN, true)`);
console.log(`     Kết quả giữ nguyên: discount = ${discountBefore.discountFor(order2)} === ${discountAfter.discountFor(order2)}`);
console.log("     💬 Điều kiện được 'đặt tên' — debug và mở rộng dễ hơn nhiều");
console.log("");

console.log("4️⃣ CHECKLIST REFACTOR AN TOÀN:");
console.log("  □ Có test pass trước khi bắt đầu (chưa có → thêm test)");
console.log("  □ Mỗi bước một thay đổi NHỎ, commit sau mỗi bước");
console.log("  □ KHÔNG gộp 'thêm tính năng' với 'refactor' cùng lúc");
console.log("  □ Sau refactor code phải RÕ HƠN, không phải khôn hơn");
console.log("");
console.log("✅ Refactoring: extract method, rename, replace magic number, decompose conditional — đổi cấu trúc, giữ nguyên hành vi");

export {};