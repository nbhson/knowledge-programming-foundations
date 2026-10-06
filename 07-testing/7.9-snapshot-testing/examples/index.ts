/**
 * 7.9 Snapshot Testing — khi nào snapshot tốt/xấu + mô phỏng serializer
 *
 * Minh họa:
 * - Serializer ổn định (sort keys) để diff deterministic.
 * - Snapshot TỐT: shape ổn định → pass, thay đổi có chủ đích → fail + diff.
 * - Snapshot XẤU: chứa timestamp/random → flaky, và cách fix (che field động).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Serializer ───────────────────────────
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as object).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

function serialize(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2);
}

function diffLines(oldText: string, newText: string): string {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const n = Math.max(a.length, b.length);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      out.push(`- ${a[i] ?? ""}`);
      out.push(`+ ${b[i] ?? ""}`);
    }
  }
  return out.join("\n");
}

function matchSnapshot(
  stored: string,
  received: unknown,
): { pass: boolean; diff: string } {
  const next = serialize(received);
  if (stored === next) return { pass: true, diff: "" };
  return { pass: false, diff: diffLines(stored, next) };
}

// Che field động (thay bằng placeholder) trước khi snapshot
function sanitize<T>(obj: T, dynamicKeys: string[]): T {
  const clone = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  for (const k of dynamicKeys) {
    if (k in clone) clone[k] = "<DYNAMIC>";
  }
  return clone as T;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Snapshot Testing Demo ===\n");

  // 1. Snapshot TỐT: error shape ổn định
  const errorShape = { code: "NOT_FOUND", message: "User không tồn tại", retryable: false };
  const stored = serialize(errorShape);
  console.log("1️⃣ Snapshot TỐT (error shape ổn định):");
  console.log(`   lần chạy sau → ${matchSnapshot(stored, errorShape).pass ? "✅ PASS" : "❌ FAIL"}`);

  // 2. Thay đổi có chủ đích → fail + diff để review
  console.log("\n2️⃣ Thay đổi có chủ đích (thêm field hint):");
  const changed = { ...errorShape, hint: "kiểm tra lại userId" };
  const r2 = matchSnapshot(stored, changed);
  console.log(`   → ${r2.pass ? "✅ PASS" : "❌ FAIL (đúng! cần review diff rồi mới -u)"}`);
  console.log(r2.diff.split("\n").map((l) => `     ${l}`).join("\n"));

  // 3. Snapshot XẤU: chứa timestamp → flaky
  console.log("\n3️⃣ Snapshot XẤU (chứa timestamp):");
  const withTime1 = { ...errorShape, at: new Date("2026-01-01T00:00:00Z").toISOString() };
  const badStored = serialize(withTime1);
  const withTime2 = { ...errorShape, at: new Date("2026-06-01T00:00:00Z").toISOString() };
  console.log(`   → ${matchSnapshot(badStored, withTime2).pass ? "✅ PASS" : "❌ FAIL mỗi lần chạy (flaky!)"}`);

  // 4. Fix: sanitize field động
  console.log("\n4️⃣ Fix bằng sanitize (che field động):");
  const s1 = serialize(sanitize(withTime1, ["at"]));
  const s2 = serialize(sanitize(withTime2, ["at"]));
  console.log(`   → ${s1 === s2 ? "✅ PASS ổn định" : "❌ FAIL"} (at → "<DYNAMIC>")`);

  console.log("\n✅ Bài học: snapshot tốt cho shape ổn định; che giá trị động; luôn review diff trước khi -u.");
}

main();

export {};
