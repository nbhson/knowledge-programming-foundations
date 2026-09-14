/**
 * 9.6 Helmet & Security Headers — Danh sách header bảo mật và cách set
 *
 * Minh họa:
 * - Danh sách các HTTP security headers quan trọng + giá trị khuyến nghị
 * - Hàm `applyHelmetHeaders` mô phỏng việc set headers lên response
 * - Build CSP directive string từ cấu hình (giống helmet)
 *
 * Lưu ý: không có HTTP server thật — chỉ mô phỏng bằng object/console.
 */

// ──────────────────────── Danh sách security headers ───────────────────────
interface SecurityHeader {
  name: string;
  value: string;
  purpose: string;
}

const HELMET_HEADERS: SecurityHeader[] = [
  { name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains", purpose: "Enforce HTTPS" },
  { name: "Content-Security-Policy", value: "default-src 'self'", purpose: "Chặn XSS" },
  { name: "X-Content-Type-Options", value: "nosniff", purpose: "Chặn MIME sniffing" },
  { name: "X-Frame-Options", value: "DENY", purpose: "Chặn clickjacking" },
  { name: "Referrer-Policy", value: "strict-origin-when-cross-origin", purpose: "Kiểm soát header Referer" },
  { name: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()", purpose: "Giới hạn browser features" },
  { name: "Cache-Control", value: "no-store", purpose: "Không cache response nhạy cảm" },
  { name: "Cross-Origin-Opener-Policy", value: "same-origin", purpose: "Cách ly window với cross-origin" },
];

// ─────────────────── Mô phỏng response + set headers ───────────────────────
interface HelmetResponse {
  headers: Map<string, string>;
}

function createResponse(): HelmetResponse {
  return { headers: new Map<string, string>() };
}

// Giả lập middleware helmet: set toàn bộ các header an toàn lên response
function applyHelmetHeaders(res: HelmetResponse): number {
  let count = 0;
  for (const h of HELMET_HEADERS) {
    res.headers.set(h.name, h.value);
    count++;
  }
  return count;
}

// In như trình duyệt nhìn thấy (giống `curl -I`)
function printResponseHeaders(res: HelmetResponse): void {
  for (const [name, value] of res.headers) {
    console.log(`   ${name}: ${value}`);
  }
}

// ──────────────────────── Build CSP directive string ───────────────────────
type CspDirectiveMap = Record<string, string[]>;

function buildCsp(csp: CspDirectiveMap): string {
  const parts: string[] = [];
  for (const [directive, sources] of Object.entries(csp)) {
    parts.push(`${directive} ${sources.join(" ")}`);
  }
  return parts.join("; ");
}

// Thêm nonce để cho phép inline script an toàn (tránh XSS)
function applyCspWithNonce(res: HelmetResponse, csp: CspDirectiveMap, nonce: string): void {
  const nonceDirective = {
    ...csp,
    "script-src": [...(csp["script-src"] ?? []), `'nonce-${nonce}'`],
  };
  res.headers.set("Content-Security-Policy", buildCsp(nonceDirective));
}

// ─────────────────── So sánh: response có / không có helmet ─────────────────
interface HelmetBody {
  html: string;
}

function renderPage(body: HelmetBody, res: HelmetResponse): string {
  return body.html;
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Helmet & Security Headers Demo ===");
console.log("");

console.log("1️⃣ Danh sách security headers + mục đích:");
for (const h of HELMET_HEADERS) {
  console.log(`   🛡️ ${h.name.padEnd(28)} ${h.purpose.padEnd(32)} → ${h.value}`);
}
console.log("");

console.log("2️⃣ Áp dụng headers lên response (mô phỏng helmet middleware):");
const res = createResponse();
const headerCount = applyHelmetHeaders(res);
console.log(`   ✅ Đã set ${headerCount} headers. Response như trình duyệt nhận:`);
console.log("");
printResponseHeaders(res);
console.log("");

console.log("3️⃣ CSP chi tiết với nonce cho inline script:");
const cspConfig: CspDirectiveMap = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "https://fonts.googleapis.com"],
  "img-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
};
const nonce = "r4nd0m-n0nce-abc123";
const resNonce = createResponse();
applyCspWithNonce(resNonce, cspConfig, nonce);
console.log(`   Content-Security-Policy: ${resNonce.headers.get("Content-Security-Policy")}`);
console.log(`   → Inline script phải mang thuộc tính nonce="${nonce}"`);
console.log("");

console.log("4️⃣ Trang web render khi có helmet (không bị đổi body):");
const bodyHtml = renderPage({ html: "<h1>Xin chào</h1><script src='/app.js'></script>" }, res);
console.log(`   Body gửi tới client: ${bodyHtml.slice(0, 40)}… (helmet không hề đụng vào body)`);
console.log("");

console.log("✅ Helmet đơn giản là 'object headers' — set đúng security headers giúp trình duyệt tự bảo vệ: chặn clickjacking, XSS, MIME sniffing, enforce HTTPS.");
export {};