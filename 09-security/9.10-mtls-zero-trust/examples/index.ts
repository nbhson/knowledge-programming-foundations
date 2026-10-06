/**
 * 9.10 mTLS & Zero Trust — handshake khái niệm + mô phỏng policy check
 *
 * Minh họa:
 * - mtlsHandshake: client và server verify cert lẫn nhau (hết hạn/revoke → từ chối).
 * - authorize: DÙ handshake ok, mỗi request vẫn check policy (default deny).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface Cert {
  cn: string; // Common Name = identity của service
  expiresAt: number;
  revoked: boolean;
}

function mtlsHandshake(client: Cert, server: Cert, now: number): string | null {
  // Client verify server (như TLS thường) ...
  if (server.revoked) return `server cert "${server.cn}" bị revoke`;
  if (server.expiresAt < now) return `server cert "${server.cn}" hết hạn`;
  // ... + server verify client (phần "m" của mTLS)
  if (client.revoked) return `client cert "${client.cn}" bị revoke`;
  if (client.expiresAt < now) return `client cert "${client.cn}" hết hạn`;
  return null; // hai chiều đều ok → kênh mã hóa
}

// Zero-trust authorize: identity có cert vẫn phải có quyền
function authorize(
  caller: string,
  action: string,
  policy: Record<string, string[]>,
): boolean {
  return policy[caller]?.includes(action) ?? false; // default deny
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== mTLS & Zero Trust Demo ===\n");
  const now = Date.now();
  const day = 24 * 3600 * 1000;

  const checkoutSvc: Cert = { cn: "checkout", expiresAt: now + 30 * day, revoked: false };
  const paymentApi: Cert = { cn: "payment", expiresAt: now + 30 * day, revoked: false };
  const policy: Record<string, string[]> = {
    checkout: ["payment.charge"],
    reporting: ["payment.read"],
  };

  console.log("1️⃣ Handshake hợp lệ (2 chiều):");
  console.log(`   checkout → payment: ${mtlsHandshake(checkoutSvc, paymentApi, now) ?? "✅ kênh mã hóa thiết lập"}`);

  console.log("\n2️⃣ Cert hết hạn / bị revoke → từ chối ngay:");
  const expired: Cert = { ...checkoutSvc, expiresAt: now - day };
  console.log(`   expired cert: ⛔ ${mtlsHandshake(expired, paymentApi, now)}`);
  const revoked: Cert = { ...checkoutSvc, revoked: true };
  console.log(`   revoked cert: ⛔ ${mtlsHandshake(revoked, paymentApi, now)}`);

  console.log("\n3️⃣ Zero-trust: handshake ok VẪN check policy từng request:");
  console.log(`   checkout → payment.charge: ${authorize("checkout", "payment.charge", policy) ? "✅ cho phép" : "⛔ deny"}`);
  console.log(`   checkout → payment.refund: ${authorize("checkout", "payment.refund", policy) ? "✅ cho phép" : "⛔ deny (không có quyền)"}`);
  console.log(`   attacker (không cert) → payment.charge: ⛔ deny (không handshake được từ bước 1)`);

  console.log("\n✅ Bài học: mTLS = identity 2 chiều; policy = quyền từng call; không tin ai chỉ vì 'trong mạng nội bộ'.");
}

main();

export {};
