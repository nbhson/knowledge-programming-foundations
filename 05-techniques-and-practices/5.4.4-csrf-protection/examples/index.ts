/**
 * 5.4.4 CSRF Protection — Token + SameSite cookie
 *
 * CSRF (Cross-Site Request Forgery): attacker khiến browser của victim
 * tự động gửi request tới server (kèm cookie) để thực hiện hành động xấu.
 *
 * Phòng chống ở đây:
 * - CSRF token: server phát token, mọi request POST/PUT/DELETE phải kèm token
 * - SameSite=Strict/Lax: browser KHÔNG gửi cookie khi request cross-site
 * - Xác minh Origin/Referer
 */

import { randomBytes } from "node:crypto";

// ──────────────────────────────── Protector ─────────────────────────────────
class CsrfProtector {
  private readonly validTokens = new Set<string>();

  // Server phát token cho session/form
  issueToken(sessionId: string): string {
    const token = `${sessionId}_${randomBytes(8).toString("hex")}`;
    this.validTokens.add(token);
    return token;
  }

  // Kiểm tra token gửi kèm request
  validate(token: string | null, sessionId: string): boolean {
    if (!token) return false;
    return token === `${sessionId}_${token.split("_")[1] ?? ""}` && this.validTokens.has(token);
  }

  // Token dùng 1 lần → tiêu hủy sau khi xử lý thành công
  consume(token: string): void {
    this.validTokens.delete(token);
  }
}

// ─────────────────────────────── SameSite mini ──────────────────────────────
type SameSiteValue = "Strict" | "Lax" | "None";

interface SameSiteCookieOptions {
  sameSite: SameSiteValue;
  httpOnly: boolean;
  secure: boolean;
}

// Browser mô phỏng: có gửi kèm cookie khi request CROSS-SITE không?
function browserSendsCookie(
  opts: SameSiteCookieOptions,
  isCrossSite: boolean,
  method: "GET" | "POST"
): boolean {
  if (!isCrossSite) return true; // same-site luôn gửi
  if (opts.sameSite === "Strict") return false; // Strict: không gửi cross-site
  if (opts.sameSite === "Lax" && method === "POST") return false; // Lax: chặn POST
  return true; // None / GET cross-site: có gửi
}

// ────────────────────────── Xử lý request nhạy cảm ──────────────────────────
interface CsrfRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  sessionId: string;
  csrfToken: string | null;
  origin: string | null;
}

class CsrfBankService {
  constructor(private readonly protector: CsrfProtector) {}

  handleTransfer(req: CsrfRequest): boolean {
    // 1) Origin phải khớp (self-origin)
    if (req.origin && !req.origin.startsWith("https://bank.com")) {
      console.log(`   ❌ Chặn: Origin lạ "${req.origin}"`);
      return false;
    }
    // 2) Mọi phương thức thay đổi state đều phải có CSRF token hợp lệ
    if (req.method !== "GET" && !this.protector.validate(req.csrfToken, req.sessionId)) {
      console.log(`   ❌ Chặn: thiếu/sai CSRF token (${req.method} /transfer)`);
      return false;
    }
    if (req.csrfToken) this.protector.consume(req.csrfToken);
    console.log(`   ✅ Xử lý chuyển khoản ${req.method === "GET" ? "(xem)" : ""} — token hợp lệ`);
    return true;
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== CSRF Protection Demo ===");
console.log("");

const protector = new CsrfProtector();
const bank = new CsrfBankService(protector);
const sessionId = "sess-abc-123";

console.log("1️⃣ Server phát CSRF token cho session hợp lệ:");
const goodToken = protector.issueToken(sessionId);
console.log(`   🔑 CSRF token: ${goodToken}`);
console.log("");

console.log("2️⃣ Tấn công CSRF — request giả từ evil.com (POST /transfer):");
const attackerRequest: CsrfRequest = {
  method: "POST",
  sessionId,
  csrfToken: null, // attacker KHÔNG có token
  origin: "https://evil.com",
};
bank.handleTransfer(attackerRequest);
console.log("");

console.log("3️⃣ Attacker may mắn đoán được token (giả vờ gửi kèm):");
bank.handleTransfer({
  method: "POST",
  sessionId,
  csrfToken: "sess-abc-123_wrongtoken",
  origin: "https://bank.com",
});
console.log("");

console.log("4️⃣ Request HỢP LỆ từ chính server (origin bank.com + token đúng):");
bank.handleTransfer({
  method: "POST",
  sessionId,
  csrfToken: goodToken,
  origin: "https://bank.com",
});
console.log("");

console.log("5️⃣ SameSite cookie — browser có tự gửi cookie khi cross-site?");
const strict: SameSiteCookieOptions = { sameSite: "Strict", httpOnly: true, secure: true };
const lax: SameSiteCookieOptions = { sameSite: "Lax", httpOnly: true, secure: true };
console.log(`   Strict + cross-site POST → gửi cookie? ${browserSendsCookie(strict, true, "POST")}`);
console.log(`   Lax    + cross-site POST → gửi cookie? ${browserSendsCookie(lax, true, "POST")}`);
console.log(`   Lax    + cross-site GET  → gửi cookie? ${browserSendsCookie(lax, true, "GET")}`);
console.log("");

console.log("✅ CSRF bị chặn 3 lớp: CSRF token bắt buộc trên request thay đổi state, kiểm tra Origin, và SameSite=Strict/Lax ngăn cookie bị gửi kèm cross-site.");
export {};