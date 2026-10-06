/**
 * 10.11 Replication — sync/async, lag, read-your-writes + mô phỏng lag
 *
 * Minh họa:
 * - Async: write nhanh, replica lag → đọc dính stale.
 * - Sync: không stale nhưng write chậm (đợi replica).
 * - Read-your-writes: sau ghi, đọc của cùng user về primary.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
class Store {
  data = new Map<string, { value: string; version: number }>();
}

const primary = new Store();
let primaryVersion = 0;
// replica là bản sao trễ `lag` versions
let replicaSnapshot = new Map<string, { value: string; version: number }>();

function primaryWrite(key: string, value: string, lag: number): void {
  primaryVersion++;
  primary.data.set(key, { value, version: primaryVersion });
  // replica mới chỉ sync tới (primaryVersion - lag)
  replicaSnapshot = new Map();
  for (const [k, v] of primary.data) {
    if (v.version <= primaryVersion - lag) replicaSnapshot.set(k, v);
  }
}

function replicaRead(key: string): string {
  return replicaSnapshot.get(key)?.value ?? "(STALE: chưa thấy update)";
}

function primaryRead(key: string): string {
  return primary.data.get(key)?.value ?? "(not found)";
}

// Router read-your-writes: vừa ghi → đọc primary
function readAfterWrite(key: string, justWrote: boolean): string {
  return justWrote ? primaryRead(key) : replicaRead(key);
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Replication Lag Demo ===\n");

  console.log("1️⃣ Async (lag 1 version) — đọc ngay sau ghi dính stale:");
  primaryWrite("email", "old@x.com", 99); // seed, sync đầy đủ
  replicaSnapshot = new Map(primary.data);
  primaryWrite("email", "new@x.com", 1); // lag: replica chưa thấy
  console.log(`   primary: ${primaryRead("email")} | replica: ${replicaRead("email")} 💥`);

  console.log("\n2️⃣ Fix: read-your-writes (2s sau ghi đọc primary):");
  console.log(`   vừa ghi → đọc primary: ${readAfterWrite("email", true)} ✅`);
  console.log(`   request khác → đọc replica: ${readAfterWrite("email", false)} (chấp nhận lag)`);

  console.log("\n3️⃣ Sync vs async vs semi-sync:");
  console.log("   sync      : write đợi replica confirm — chắc (không mất data) nhưng chậm");
  console.log("   async     : write về ngay — nhanh, replica lag ms–s, failover có thể mất đuôi");
  console.log("   semi-sync : đợi ít nhất 1 replica — cân bằng phổ biến (MySQL/Postgres streaming)");

  console.log("\n✅ Bài học: scale read bằng replica + che lag bằng read-your-writes cho UX sau ghi.");
}

main();

export {};
