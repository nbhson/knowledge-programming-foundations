/**
 * 10.12 Vector DB — embeddings, cosine similarity, HNSW khái niệm + cosine search thuần
 *
 * Minh họa:
 * - cosine(a, b): 1 = cùng hướng, 0 = trực giao.
 * - top-k search: query "mèo" gần "mướp" hơn "ô tô".
 * - HNSW giải thích trực quan (brute-force O(n) vs HNSW O(log n)).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Cosine ───────────────────────────
function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("vector khác chiều");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

interface Doc {
  id: string;
  text: string;
  vec: number[];
}

function topK(query: number[], docs: Doc[], k: number): { id: string; score: number }[] {
  return docs
    .map((d) => ({ id: d.id, score: cosine(query, d.vec) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Vector DB / Cosine Search Demo ===\n");

  // Vector 3 chiều minh họa: [liên quan mèo, liên quan xe, liên quan thức ăn]
  const docs: Doc[] = [
    { id: "doc1", text: "mướp là giống mèo nhà", vec: [0.9, 0.05, 0.4] },
    { id: "doc2", text: "mèo thích ăn cá", vec: [0.85, 0.0, 0.5] },
    { id: "doc3", text: "ô tô chạy bằng xăng", vec: [0.0, 0.95, 0.1] },
    { id: "doc4", text: "cách reset mật khẩu", vec: [0.1, 0.1, 0.2] },
  ];
  const query = [0.95, 0.0, 0.3]; // "mèo"

  console.log('1️⃣ Query "mèo" — cosine với từng doc:');
  for (const d of docs) {
    console.log(`   ${d.id} (${d.text}): ${cosine(query, d.vec).toFixed(3)}`);
  }

  console.log("\n2️⃣ Top-2 (semantic search):");
  for (const r of topK(query, docs, 2)) {
    console.log(`   ${r.id}: score ${r.score.toFixed(3)} ✅`);
  }
  console.log('   keyword LIKE "%mèo%" cũng trúng doc1/doc2 — nhưng với "khôi phục đăng nhập" vs "reset mật khẩu" thì chỉ semantic trúng');

  console.log("\n3️⃣ HNSW (khái niệm, khi có hàng triệu vectors):");
  console.log("   brute-force: so với TỪNG vector — O(n), chính xác 100%, chậm ở scale lớn");
  console.log("   HNSW: đồ thị nhiều tầng — tầng trên nhảy xa, tầng dưới dò chính xác — O(log n) gần đúng");
  console.log("   recall ~95-99% với tốc độ nhanh hơn 100-1000x — đánh đổi nhỏ, lợi lớn cho RAG");

  console.log("\n✅ Bài học: cosine = độ gần nghĩa; top-k = retrieve cho RAG; HNSW = index cho scale.");
}

main();

export {};
