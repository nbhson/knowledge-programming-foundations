/**
 * 5.4.5 OWASP Top 10 — Checklist + mô phỏng từng lỗ hổng điển hình
 *
 * Minh họa các lỗ hổng trong OWASP Top 10 (2021) + cách phòng chống:
 * - A01 Broken Access Control → kiểm tra quyền trước khi truy cập
 * - A03 Injection             → parameterized query, không nối chuỗi
 * - A02 Cryptographic Failures→ hash password, HTTPS, không plaintext
 * - A07 Auth & Session        → không đặt session cố định (fixation)
 * - A09 Logging & Monitoring  → ghi log khi bị chặn
 */

// ──────────────────────────────── Checklist ─────────────────────────────────
interface OwaspRiskItem {
  code: string;
  name: string;
  status: "ĐÃ SỬA" | "CẦN SỬA";
  fixed: boolean;
}

const OWASP_CHECKLIST: OwaspRiskItem[] = [
  { code: "A01", name: "Broken Access Control", status: "ĐÃ SỬA", fixed: true },
  { code: "A02", name: "Cryptographic Failures", status: "ĐÃ SỬA", fixed: true },
  { code: "A03", name: "Injection", status: "ĐÃ SỬA", fixed: true },
  { code: "A04", name: "Insecure Design", status: "ĐÃ SỬA", fixed: true },
  { code: "A05", name: "Security Misconfiguration", status: "ĐÃ SỬA", fixed: true },
  { code: "A06", name: "Vulnerable & Outdated Components", status: "ĐÃ SỬA", fixed: true },
  { code: "A07", name: "Authentication Failures", status: "ĐÃ SỬA", fixed: true },
  { code: "A08", name: "Software & Data Integrity Failures", status: "ĐÃ SỬA", fixed: true },
  { code: "A09", name: "Logging & Monitoring Failures", status: "ĐÃ SỬA", fixed: true },
  { code: "A10", name: "Server-Side Request Forgery (SSRF)", status: "ĐÃ SỬA", fixed: true },
];

// ─────────────────────────────── Vulnerability ──────────────────────────────
// A03 Injection — so sánh query NỐI CHUỖI (vulnerable) và parameterized (safe)
class OwaspInjectionVulnerability {
  private readonly users = [
    { id: 1, name: "alice" },
    { id: 2, name: "bob" },
  ];

  // ❌ BAD — attacker nhập: 1' OR '1'='1 → trả về TOÀN BỘ users
  vulnerableQuery(input: string): { id: number; name: string }[] {
    if (input.includes("' OR '1'='1")) return this.users;
    const id = Number(input);
    return this.users.filter((u) => u.id === id);
  }

  // ✅ GOOD — ép kiểu số, input lạ không lọt vào SQL
  safeQuery(input: string): { id: number; name: string }[] {
    const id = Number(input);
    if (!Number.isInteger(id)) return [];
    return this.users.filter((u) => u.id === id);
  }
}

// A01 Broken Access Control — phải kiểm tra quyền của USER HIỆN TẠI
class OwaspAccessControlVulnerability {
  canAccess(currentUserId: string, targetUserId: string, isAdmin: boolean): boolean {
    return currentUserId === targetUserId || isAdmin;
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== OWASP Top 10 Demo ===");
console.log("");

console.log("1️⃣ Checklist 10 lỗ hổng OWASP Top 10 (2021):");
for (const item of OWASP_CHECKLIST) {
  console.log(`   ${item.code} · ${item.name.padEnd(40)} → ${item.status}`);
}
console.log("");

console.log("2️⃣ A03 Injection — SQL query nối chuỗi vs parameterized:");
const sqli = new OwaspInjectionVulnerability();
const attackInput = "1' OR '1'='1";
console.log(`   🔥 Attacker nhập: "${attackInput}"`);
const badResult = sqli.vulnerableQuery(attackInput);
console.log(`   ❌ Vulnerable query → trả về ${badResult.length} user (lộ toàn bộ dữ liệu!)`);
console.log(`   ✅ Parameterized   → trả về ${sqli.safeQuery(attackInput).length} user (bị chặn)`);
console.log("");

console.log("3️⃣ A01 Broken Access Control — user chỉ truy cập đúng tài nguyên của mình:");
const access = new OwaspAccessControlVulnerability();
console.log(`   user u-1 đọc hồ sơ CỦA MÌNH (u-1), không admin → cho phép: ${access.canAccess("u-1", "u-1", false)}`);
console.log(`   user u-1 đọc hồ sơ CỦA NGƯỜI KHÁC (u-2), không admin → cho phép: ${access.canAccess("u-1", "u-2", false)}`);
console.log(`   user u-1 đọc hồ sơ u-2 nhưng LÀ admin           → cho phép: ${access.canAccess("u-1", "u-2", true)}`);
console.log("");

console.log("4️⃣ A09 Logging & Monitoring — phải ghi log mỗi lần truy cập trái phép:");
function logSecurityEvent(userId: string, action: string, blocked: boolean): void {
  const line = `[${new Date().toISOString()}] ${userId} → ${action} ${blocked ? "❌ BLOCKED" : "✅ OK"}`;
  console.log(`   📝 ${line}`);
}
logSecurityEvent("u-1", "read /api/users/u-2", !access.canAccess("u-1", "u-2", false));
logSecurityEvent("u-1", "read /api/users/u-1", access.canAccess("u-1", "u-1", false));
console.log("");

console.log("✅ OWASP Top 10 là checklist chuẩn: mỗi lỗ hổng có cách phòng chống tương ứng — access control, parameterized query, hash password, ghi log mọi truy cập trái phép.");
export {};