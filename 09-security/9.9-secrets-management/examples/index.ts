/**
 * 9.9 Secrets Management — Vault/KMS khái niệm, rotation, env loader + redaction
 *
 * Minh họa:
 * - requireSecret: fail-fast lúc boot khi thiếu secret bắt buộc.
 * - redact: che secret thành "***" trước khi log.
 * - Rotation: đổi giá trị secret mà không đụng code.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Loader ───────────────────────────
function requireSecret(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`thiếu secret bắt buộc: ${name} (fail-fast lúc boot)`);
  return v;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

// Mọi secret gom vào 1 Set để redact nhất quán
function redact(
  obj: Record<string, unknown>,
  secrets: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = secrets.has(k) ? "***" : v;
  }
  return out;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Secrets Management Demo ===\n");

  // Giả lập secret từ Vault/KMS inject qua env lúc runtime
  process.env["DB_PASSWORD"] = "s3cr3t-db-pass";
  process.env["STRIPE_KEY"] = "sk-live-abc123";
  process.env["APP_PORT"] = "3000";

  console.log("1️⃣ Loader (fail-fast + phân biệt secret/config):");
  const dbPassword = requireSecret("DB_PASSWORD");
  const stripeKey = requireSecret("STRIPE_KEY");
  const port = optional("APP_PORT", "3000");
  console.log(`   DB_PASSWORD: loaded (${dbPassword.length} ký tự, không in giá trị)`);
  console.log(`   APP_PORT (config thường): ${port}`);

  console.log("\n2️⃣ Redact trước khi log:");
  const secrets = new Set(["DB_PASSWORD", "STRIPE_KEY"]);
  const logged = redact(
    { DB_PASSWORD: dbPassword, STRIPE_KEY: stripeKey, APP_PORT: port },
    secrets,
  );
  console.log(`   log ra: ${JSON.stringify(logged)} ✅`);

  console.log("\n3️⃣ Rotation (đổi secret không đụng code):");
  console.log("   Vault rotate STRIPE_KEY → app reload env → requireSecret đọc giá trị mới");
  process.env["STRIPE_KEY"] = "sk-live-xyz789-rotated";
  const rotated = requireSecret("STRIPE_KEY");
  console.log(`   key mới: loaded (${rotated.length} ký tự) — code giữ nguyên, chỉ giá trị đổi`);

  console.log("\n4️⃣ Thiếu secret → crash ngay lúc boot (không chạy nửa chừng):");
  delete process.env["DB_PASSWORD"];
  try {
    requireSecret("DB_PASSWORD");
  } catch (e) {
    console.log(`   ⛔ ${(e as Error).message}`);
  }

  console.log("\n✅ Bài học: secret qua Vault/KMS → env runtime; fail-fast; redact mọi log; rotate định kỳ.");
}

main();

export {};
