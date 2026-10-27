/**
 * 14.1 Naming Conventions — Demo
 *
 * So sánh trực quan code XẤU (tên viết tắt khó hiểu) vs TỐT (tên tự giải thích):
 *   - Biến, hằng số, boolean (is/has/can)
 *   - Hàm (động từ + tân ngữ)
 *   - Class/interface (danh từ, PascalCase)
 */

// ─────────────────────────── Phiên bản XẤU ─────────────────────────────
interface NamingBadUserInput {
  n: string;
  e: string;
}

class NamingBadProcessor {
  // tên x được giữ ít tham số, nhưng ý nghĩa ẩn
  private mx = 10;

  proc(u: NamingBadUserInput, t: number, x: boolean, y: boolean): boolean {
    let r = false;
    const v = u.e.includes("@"); // e là gì? v là gì?
    if (t > this.mx && v) {
      r = x;
    } else {
      r = y;
    }
    // 7 ở đây nghĩa là gì? — magic number
    if (u.n.length < 7) {
      r = false;
    }
    return r;
  }
}

// ─────────────────────────── Phiên bản TỐT ──────────────────────────────
const NAMING_MIN_PASSWORD_LENGTH = 7;

interface NamingUserInput {
  name: string;
  email: string;
}

class NamingRegistrationValidator {
  private readonly maxRetryCount = 10;

  isValidEmail(email: string): boolean {
    return email.includes("@");
  }

  hasEnoughChars(term: string, min: number): boolean {
    return term.length >= min;
  }

  private isRetryCountExceeded(attempt: number): boolean {
    return attempt > this.maxRetryCount;
  }

  /**
   * Kiểm tra đăng ký hợp lệ.
   * @returns true nếu email hợp lệ, đủ ký tự và chưa vượt số lần thử.
   */
  canRegister(input: NamingUserInput, attempt: number): boolean {
    const emailIsValid = this.isValidEmail(input.email);
    const passwordIsLongEnough = this.hasEnoughChars(input.name, NAMING_MIN_PASSWORD_LENGTH);
    const retryStillAllowed = !this.isRetryCountExceeded(attempt);
    return emailIsValid && passwordIsLongEnough && retryStillAllowed;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Naming Conventions Demo ===");
console.log("");

const badInput: NamingBadUserInput = { n: "Son", e: "son@ex.com" };
const badProcessor = new NamingBadProcessor();

const goodInput: NamingUserInput = { name: "Nguyen Son", email: "son@ex.com" };
const validator = new NamingRegistrationValidator();

console.log("1️⃣ BIẾN & BOOLEAN:");
console.log("  ❌ let d = 3;  let flag = true;  let data = ...;");
console.log("  ✅ let daysSinceLastLogin = 3;  let isLoggedIn = true;  let userRoles = ...;");
console.log("  💬 Boolean nên bắt đầu bằng is/has/can: isLoggedIn, hasPermission, canDelete");
console.log("");

console.log("2️⃣ SO SÁNH 2 class xử lý đăng ký:");
console.log("  ❌ NamingBadProcessor.proc(u, t, x, y) →", badProcessor.proc(badInput, 5, true, true));
console.log("     • e / v / r / x / y — đều không nói lên ý nghĩa, phải đọc từng dòng mới hiểu");
console.log("     • Số 7 bí ẩn — vì sao lại là 7? thay đổi ở đây dễ vỡ");
console.log("");
console.log("  ✅ NamingRegistrationValidator.canRegister(...) →", validator.canRegister(goodInput, 5));
console.log("     • isValidEmail / hasEnoughChars / isRetryCountExceeded — đọc như câu tiếng Anh");
console.log("     • NAMING_MIN_PASSWORD_LENGTH — hằng số UPPER_SNAKE, tự giải thích");
console.log("");

console.log("3️⃣ HÀM — động từ + tân ngữ:");
console.log("  ❌ process(data), handle(input), get()");
console.log("  ✅ calculateTotalPrice(items), getUserById(id), sendWelcomeEmail(email)");
console.log("");

console.log("4️⃣ QUY ƯỚC CASING:");
console.log("  Class/Interface/Type  → PascalCase : UserService, PaymentGateway");
console.log("  Biến / hàm            → camelCase  : getUserById, maxRetries");
console.log("  Hằng số               → UPPER_SNAKE : API_BASE_URL, MAX_RETRY_COUNT");
console.log("");

console.log("✅ Tên gọi rõ ràng giúp code tự giải thích — không cần comment, không đoán mò");

export {};