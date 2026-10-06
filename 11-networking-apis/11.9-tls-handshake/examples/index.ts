/**
 * 11.9 TLS Handshake — 1.2 vs 1.3, mTLS nhắc + mô phỏng cipher negotiation
 *
 * Minh họa:
 * - 1.2: 2-RTT, cipher đa dạng (kể cả yếu). 1.3: 1-RTT, chỉ AEAD mạnh.
 * - Negotiate: chọn suite mạnh nhất cả hai cùng hỗ trợ, loại cipher yếu.
 * - mTLS = thêm client cert (chi tiết ở 9.10).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────── Cipher negotiation ───────────────────────
const STRENGTH: Record<string, number> = {
  TLS_AES_128_GCM_SHA256: 3, // 1.3 AEAD mạnh
  TLS_CHACHA20_POLY1305_SHA256: 3, // 1.3, tốt cho mobile (không AES-NI)
  TLS_ECDHE_RSA_AES128_GCM_SHA256: 2, // 1.2 ổn
  TLS_RSA_WITH_RC4_128_SHA: 0, // yếu — loại
  TLS_RSA_WITH_3DES_EDE_CBC_SHA: 0, // yếu — loại
};

function negotiate(client: string[], server: string[]): string | null {
  const common = client.filter((c) => server.includes(c) && (STRENGTH[c] ?? 0) > 0);
  common.sort((a, b) => (STRENGTH[b] ?? 0) - (STRENGTH[a] ?? 0));
  return common[0] ?? null;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== TLS Handshake Demo ===\n");

  console.log("1️⃣ So sánh handshake:");
  console.log("   TLS 1.2: TCP (1 RTT) + handshake (2 RTT) ≈ 3 RTT trước data; hỗ trợ cả cipher yếu");
  console.log("   TLS 1.3: TCP + handshake gộp ≈ 1-2 RTT; chỉ AEAD + forward secrecy bắt buộc; 0-RTT nối lại");

  console.log("\n2️⃣ Cipher negotiation (chọn mạnh nhất cùng hỗ trợ):");
  const client = ["TLS_AES_128_GCM_SHA256", "TLS_ECDHE_RSA_AES128_GCM_SHA256", "TLS_RSA_WITH_RC4_128_SHA"];
  const server = ["TLS_ECDHE_RSA_AES128_GCM_SHA256", "TLS_AES_128_GCM_SHA256"];
  console.log(`   client: ${client.join(", ")}`);
  console.log(`   server: ${server.join(", ")}`);
  console.log(`   → chọn: ${negotiate(client, server)} ✅ (RC4 bị loại dù client gửi)`);

  console.log("\n3️⃣ Không có cipher mạnh chung:");
  const oldServer = ["TLS_RSA_WITH_RC4_128_SHA"];
  console.log(`   → ${negotiate(client, oldServer) ?? "⛔ handshake failure — thà không nối còn hơn mã hóa yếu"}`);

  console.log("\n4️⃣ mTLS nhắc: TLS thường chỉ client verify server;");
  console.log("   mTLS thêm server verify client cert → identity 2 chiều (chi tiết: 9.10).");

  console.log("\n✅ Bài học: tối thiểu TLS 1.2, ưu tiên 1.3; chỉ AEAD; rotate cert tự động; HSTS ép HTTPS.");
}

main();

export {};
