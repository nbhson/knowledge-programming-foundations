/**
 * 13.7 Consistent Hashing — Demo
 *
 * Mô phỏng:
 *   - Mod-N hashing (hash(key) % N): thêm/bớt 1 node → gần như mọi key di chuyển
 *   - Consistent hashing (hash ring + virtual nodes): chỉ ~K/N keys di chuyển
 * Chạy: npx ts-node examples/index.ts (từ thư mục 13.7-consistent-hashing)
 */

/** FNV-1a 32-bit: hash đơn giản, phân phối đều, không cần deps ngoài. */
function hashString(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mod-N cluster: node = hash(key) % nodes.length (baseline để so sánh). */
class ModNCluster {
  private readonly nodes: string[] = [];

  addNode(name: string): void {
    this.nodes.push(name);
  }

  removeNode(name: string): void {
    const i = this.nodes.indexOf(name);
    if (i >= 0) this.nodes.splice(i, 1);
  }

  getNode(key: string): string {
    return this.nodes[hashString(key) % this.nodes.length];
  }
}

/** Consistent hash ring với virtual nodes (mỗi node vật lý = N điểm trên vòng). */
class ConsistentHashRing {
  private readonly ring = new Map<number, string>();
  private sortedHashes: number[] = [];

  constructor(private readonly virtualNodesPerNode: number = 100) {}

  addNode(name: string): void {
    for (let i = 0; i < this.virtualNodesPerNode; i++) {
      this.ring.set(hashString(`${name}#vn${i}`), name);
    }
    this.resort();
  }

  removeNode(name: string): void {
    for (const [h, owner] of this.ring) {
      if (owner === name) this.ring.delete(h);
    }
    this.resort();
  }

  getNode(key: string): string {
    if (this.sortedHashes.length === 0) throw new Error("Ring trống — chưa có node nào");
    const h = hashString(key);
    // Binary search: virtual node đầu tiên có hash >= h (wrap-around về 0).
    let lo = 0;
    let hi = this.sortedHashes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedHashes[mid] < h) lo = mid + 1;
      else hi = mid;
    }
    const owner = this.ring.get(this.sortedHashes[lo % this.sortedHashes.length]);
    if (owner === undefined) throw new Error("Ring inconsistent");
    return owner;
  }

  distribution(keys: string[]): Map<string, number> {
    const dist = new Map<string, number>();
    for (const k of keys) dist.set(this.getNode(k), (dist.get(this.getNode(k)) ?? 0) + 1);
    return dist;
  }

  private resort(): void {
    this.sortedHashes = [...this.ring.keys()].sort((a, b) => a - b);
  }
}

interface Placement {
  getNode(key: string): string;
}

function snapshot(cluster: Placement, keys: string[]): Map<string, string> {
  const snap = new Map<string, string>();
  for (const k of keys) snap.set(k, cluster.getNode(k));
  return snap;
}

function countMoved(before: Map<string, string>, cluster: Placement): number {
  let moved = 0;
  for (const [k, node] of before) if (cluster.getNode(k) !== node) moved++;
  return moved;
}

function fmtDist(dist: Map<string, number>): string {
  return [...dist.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([n, c]) => `${n}=${c}`)
    .join(", ");
}

function main(): void {
  console.log("=== Consistent Hashing Demo ===");
  console.log("");

  const keys: string[] = [];
  for (let i = 0; i < 1000; i++) keys.push(`user:${i}`);
  const initial = ["cache-1", "cache-2", "cache-3"];

  // 1️⃣ Mod-N baseline
  console.log("1️⃣ Mod-N hashing (hash % N) — thêm node thứ 4:");
  const mod = new ModNCluster();
  initial.forEach((n) => mod.addNode(n));
  const modBefore = snapshot(mod, keys);
  mod.addNode("cache-4");
  const modMoved = countMoved(modBefore, mod);
  console.log(`   Keys di chuyển: ${modMoved}/1000 (${((modMoved / 10).toFixed(1))}%) — gần như toàn bộ!`);
  console.log("");

  // 2️⃣ Consistent hashing
  console.log("2️⃣ Consistent hashing (100 virtual nodes/node) — thêm node thứ 4:");
  const ring = new ConsistentHashRing(100);
  initial.forEach((n) => ring.addNode(n));
  console.log(`   Phân phối ban đầu: ${fmtDist(ring.distribution(keys))}`);
  const ringBefore = snapshot(ring, keys);
  ring.addNode("cache-4");
  const ringMoved = countMoved(ringBefore, ring);
  console.log(`   Phân phối sau:      ${fmtDist(ring.distribution(keys))}`);
  console.log(`   Keys di chuyển: ${ringMoved}/1000 (${((ringMoved / 10).toFixed(1))}%) — kỳ vọng ~1/4 = 25%`);
  console.log("");

  // 3️⃣ Remove node
  console.log("3️⃣ Consistent hashing — xóa cache-2 (failover):");
  const beforeRemove = snapshot(ring, keys);
  ring.removeNode("cache-2");
  const removedMoved = countMoved(beforeRemove, ring);
  console.log(`   Keys di chuyển: ${removedMoved}/1000 — chỉ keys của cache-2 phải remap`);
  console.log(`   Phân phối sau:  ${fmtDist(ring.distribution(keys))}`);
  console.log("");

  // 4️⃣ Virtual nodes ít vs nhiều
  console.log("4️⃣ Virtual nodes quyết định độ đều (1000 keys / 3 nodes):");
  for (const vn of [1, 100]) {
    const r = new ConsistentHashRing(vn);
    initial.forEach((n) => r.addNode(n));
    console.log(`   ${vn} vn/node → ${fmtDist(r.distribution(keys))}`);
  }
  console.log("");
  console.log("✅ Consistent hashing: thêm/bớt node chỉ di chuyển ~K/N keys, virtual nodes giữ phân phối đều");
}

main();

export {};
