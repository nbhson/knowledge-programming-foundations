/**
 * 9.7 SQL Injection — payloads phổ biến, vulnerable vs safe query builder
 *
 * Minh họa:
 * - Vulnerable builder (nối chuỗi): 4 payloads kinh điển đều đổi cấu trúc SQL.
 * - Safe builder (parameterized): input luôn là data, DB tự escape.
 * - Allowlist cho tên cột ORDER BY (thứ không parameterize được).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ───────────────────── Vulnerable: nối chuỗi ─────────────────────
function vulnerableById(id: string): string {
  return `SELECT * FROM users WHERE id = '${id}'`;
}

// Detector đơn giản: query có cấu trúc bị đổi không?
function looksTampered(template: string, built: string): boolean {
  // template kỳ vọng đúng 1 cặp quote bao quanh giá trị
  const expectedQuotes = 2;
  const actualQuotes = (built.match(/'/g) ?? []).length;
  return actualQuotes !== expectedQuotes || /(--|;|\bOR\b|\bUNION\b|\bSLEEP\b)/i.test(built.replace(template, ""));
}

// ───────────────────── Safe: parameterized ─────────────────────
interface SafeQuery {
  sql: string;
  params: unknown[];
}

function safeById(id: string): SafeQuery {
  return { sql: "SELECT * FROM users WHERE id = ?", params: [id] };
}

// Tên cột không parameterize được → allowlist
const SORT_ALLOWLIST: Record<string, string> = {
  name: "username",
  date: "created_at",
};

function safeOrderBy(sort: string): string {
  const col = SORT_ALLOWLIST[sort];
  if (!col) throw new Error(`sort không hợp lệ: ${sort}`);
  return `SELECT * FROM users ORDER BY ${col} ASC`;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== SQL Injection Demo ===\n");

  const payloads = [
    "1' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT password FROM users --",
    "1' AND SLEEP(5) --",
  ];

  console.log("1️⃣ VULNERABLE builder (nối chuỗi):");
  for (const p of payloads) {
    const sql = vulnerableById(p);
    console.log(`   input=${JSON.stringify(p)}`);
    console.log(`   → ${sql}`);
    console.log(`   ${looksTampered("SELECT * FROM users WHERE id = ''", sql) ? "   💥 cấu trúc SQL bị đổi!" : "   ok"}`);
  }

  console.log("\n2️⃣ SAFE builder (parameterized):");
  for (const p of payloads) {
    const q = safeById(p);
    console.log(`   input=${JSON.stringify(p)}`);
    console.log(`   → sql=${q.sql} params=${JSON.stringify(q.params)}`);
  }
  console.log("   ✅ input luôn là DATA — DB tìm id đúng bằng chuỗi đó (0 rows), không thực thi");

  console.log("\n3️⃣ ORDER BY (không parameterize được) → allowlist:");
  console.log(`   sort=name → ${safeOrderBy("name")}`);
  try {
    safeOrderBy("id; DROP TABLE users");
  } catch (e) {
    console.log(`   sort độc → ⛔ ${(e as Error).message}`);
  }

  console.log("\n✅ Bài học: value → placeholder ?; tên cột/bảng → allowlist; không bao giờ nối input vào SQL.");
}

main();

export {};
