/**
 * 17.4 Vector Databases — mô phỏng brute-force vs IVF-partition (ANN)
 * + metadata filtering + đo recall. Thuần local, không cần vector DB thật.
 */

export {};

interface VecDoc {
  id: string;
  vector: number[];
  meta: Record<string, string>;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function cosine(a: number[], b: number[]): number {
  const d = Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b));
  return d === 0 ? 0 : dot(a, b) / d;
}

/** Chuẩn hóa vector về độ dài 1 */
function normalize(v: number[]): number[] {
  const n = Math.sqrt(dot(v, v));
  return n === 0 ? v : v.map((x) => x / n);
}

/** Tạo vector ngẫu nhiên có seed để demo deterministic */
function seededVector(seed: number, dims: number): number[] {
  const v: number[] = [];
  let s = seed;
  for (let i = 0; i < dims; i++) {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    v.push((s % 1000) / 1000);
  }
  return normalize(v);
}

/** Metadata filtering: thu hẹp ứng viên trước khi tính khoảng cách (pre-filter) */
function filterByMeta(docs: VecDoc[], predicate: (m: Record<string, string>) => boolean): VecDoc[] {
  return docs.filter((d) => predicate(d.meta));
}

/** Brute-force: so query với MỌI vector — chính xác nhưng chậm O(N) */
function bruteForce(query: number[], docs: VecDoc[], k: number): { doc: VecDoc; score: number }[] {
  return docs
    .map((d) => ({ doc: d, score: cosine(query, d.vector) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

/** IVF mô phỏng: gán vector vào partition có centroid gần nhất */
function assignPartition(vector: number[], centroids: number[][]): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const s = cosine(vector, centroids[i]);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}

function buildIndex(docs: VecDoc[], centroids: number[][]): Map<number, VecDoc[]> {
  const partitions = new Map<number, VecDoc[]>();
  for (const d of docs) {
    const p = assignPartition(d.vector, centroids);
    if (!partitions.has(p)) partitions.set(p, []);
    (partitions.get(p) as VecDoc[]).push(d);
  }
  return partitions;
}

/** ANN search: chỉ quét partition gần nhất (nprobe=1) — nhanh nhưng có thể sót */
function annSearch(
  query: number[],
  partitions: Map<number, VecDoc[]>,
  centroids: number[][],
  k: number,
): { doc: VecDoc; score: number }[] {
  const p = assignPartition(query, centroids);
  const candidates = partitions.get(p) ?? [];
  return candidates
    .map((d) => ({ doc: d, score: cosine(query, d.vector) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

function main(): void {
  console.log("=== 17.4 Vector Databases Demo ===");
  console.log("");

  const DIMS = 16;
  const N = 60;
  const tenants = ["acme", "globex"];
  const docs: VecDoc[] = [];
  for (let i = 0; i < N; i++) {
    docs.push({
      id: `doc-${i}`,
      vector: seededVector(i + 1, DIMS),
      meta: { tenant: tenants[i % 2], year: i % 3 === 0 ? "2024" : "2025" },
    });
  }
  const centroids = [seededVector(1001, DIMS), seededVector(2002, DIMS), seededVector(3003, DIMS)];
  const partitions = buildIndex(docs, centroids);

  console.log(`1. Index: ${N} vectors → ${centroids.length} partitions (IVF mô phỏng):`);
  for (const [p, list] of partitions) console.log(`   partition-${p}: ${list.length} vectors`);
  console.log("");

  const query = seededVector(7, DIMS);
  const k = 5;
  const exact = bruteForce(query, docs, k);
  const approx = annSearch(query, partitions, centroids, k);
  console.log(`2. Brute-force top-${k}: ${exact.map((r) => r.doc.id).join(", ")}`);
  console.log(`   ANN (1 partition) top-${k}: ${approx.map((r) => r.doc.id).join(", ")}`);
  const exactIds = new Set(exact.map((r) => r.doc.id));
  const recall = approx.filter((r) => exactIds.has(r.doc.id)).length / k;
  console.log(`   Recall@${k} ≈ ${(recall * 100).toFixed(0)}% (độ đánh đổi của ANN)`);
  console.log("");

  console.log("3. Metadata filtering (tenant=acme, pre-filter rồi mới search):");
  const scoped = filterByMeta(docs, (m) => m.tenant === "acme");
  const scopedTop = bruteForce(query, scoped, 3);
  console.log(`   ${scoped.length}/${docs.length} docs thuộc acme → top-3: ${scopedTop.map((r) => r.doc.id).join(", ")}`);
  console.log("");
  console.log("✅ IVF-partition + metadata filter + đo recall hoạt động (local)");
}

main();
