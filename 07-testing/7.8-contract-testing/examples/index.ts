/**
 * 7.8 Contract Testing — Pact khái niệm + mô phỏng matching
 *
 * Minh họa consumer-driven contract testing:
 * - Consumer định nghĩa pact (kỳ vọng về API provider).
 * - Provider verify bằng matching rules (type-based, cho phép field thừa).
 * - Breaking change (xóa/đổi type field) bị phát hiện trước khi deploy.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface PactRequest {
  method: string;
  path: string;
}

interface PactInteraction {
  description: string;
  request: PactRequest;
  response: { status: number; body: Record<string, unknown> };
}

// ─────────────── Matching: type-based, thoáng field thừa ───────────────
function verifyBody(
  actual: unknown,
  expected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  if (typeof actual !== "object" || actual === null) {
    return ["body không phải object"];
  }
  const act = actual as Record<string, unknown>;
  for (const [key, expVal] of Object.entries(expected)) {
    if (!(key in act)) {
      errors.push(`thiếu field "${key}"`);
    } else if (typeof act[key] !== typeof expVal) {
      errors.push(
        `sai type field "${key}": kỳ vọng ${typeof expVal}, nhận ${typeof act[key]}`,
      );
    }
  }
  return errors;
}

function verifyInteraction(
  actualStatus: number,
  actualBody: unknown,
  pact: PactInteraction,
): { pass: boolean; errors: string[] } {
  const errors: string[] = [];
  if (actualStatus !== pact.response.status) {
    errors.push(
      `sai status: kỳ vọng ${pact.response.status}, nhận ${actualStatus}`,
    );
  }
  errors.push(...verifyBody(actualBody, pact.response.body));
  return { pass: errors.length === 0, errors };
}

// ─────────────────────── Provider giả lập (2 phiên bản) ───────────────────────
function providerV1(): { status: number; body: unknown } {
  // Đúng contract: đủ field, đúng type (thừa field "role" vẫn OK)
  return {
    status: 200,
    body: { id: 1, name: "Alice", email: "a@b.com", role: "admin" },
  };
}

function providerV2Breaking(): { status: number; body: unknown } {
  // Breaking: đổi "name" -> "fullName", đổi type "id" thành string
  return { status: 200, body: { id: "1", fullName: "Alice" } };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Contract Testing Demo (Pact khái niệm) ===\n");

  // Consumer (OrderService) định nghĩa kỳ vọng về UserService
  const pact: PactInteraction = {
    description: "lấy user để tạo order",
    request: { method: "GET", path: "/users/1" },
    response: {
      status: 200,
      body: { id: 1, name: "Alice", email: "a@b.com" },
    },
  };
  console.log(`1️⃣ Pact: "${pact.description}"`);
  console.log(`   ${pact.request.method} ${pact.request.path} → 200 ${JSON.stringify(pact.response.body)}`);

  console.log("\n2️⃣ Provider v1 verify:");
  const v1 = providerV1();
  const r1 = verifyInteraction(v1.status, v1.body, pact);
  console.log(`   ${r1.pass ? "✅ PASS" : "❌ FAIL"} — field thừa "role" được chấp nhận (matching thoáng)`);

  console.log("\n3️⃣ Provider v2 (breaking) verify:");
  const v2 = providerV2Breaking();
  const r2 = verifyInteraction(v2.status, v2.body, pact);
  console.log(`   ${r2.pass ? "✅ PASS" : "❌ FAIL — chặn deploy!"}`);
  for (const e of r2.errors) console.log(`     • ${e}`);

  console.log("\n✅ Bài học: consumer-driven pact phát hiện breaking change ở CI, không cần deploy cả hệ thống.");
}

main();

export {};
