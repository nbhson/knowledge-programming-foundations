/**
 * 17.2 Embeddings — mô phỏng hash-embedding + cosine similarity + top-k search.
 * Thuần TypeScript, KHÔNG gọi API embedding thật (vector giả lập, không hiểu ngữ nghĩa).
 */

export {};

/** Hash chuỗi thành số 32-bit (FNV-1a) — nền cho embedding giả lập */
function hashToken(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Embedding GIẢ LẬP: mỗi từ bắn vào 1 chiều (hash % dims) rồi cộng dồn + chuẩn hóa.
 * Chỉ để demo hình học cosine — production phải dùng model thật (E5/BGE/...).
 */
function fakeEmbed(text: string, dims: number): number[] {
  const vec: number[] = new Array(dims).fill(0);
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const idx = hashToken(t) % dims;
    vec[idx] += 1;
  }
  const n = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return n === 0 ? vec : vec.map((v) => v / n);
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** Cosine similarity ∈ [-1, 1]: càng gần 1 càng giống nhau */
function cosineSimilarity(a: number[], b: number[]): number {
  const denom = Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b));
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

interface Doc {
  id: string;
  text: string;
  vector: number[];
}

/** Top-k search theo cosine similarity giảm dần */
function search(query: number[], docs: Doc[], k: number): Array<Doc & { score: number }> {
  return docs
    .map((d) => ({ ...d, score: cosineSimilarity(query, d.vector) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

function main(): void {
  console.log("=== 17.2 Embeddings Demo ===");
  console.log("");

  const DIMS = 64;
  const corpus: string[] = [
    "chính sách hoàn tiền trong 30 ngày",
    "hướng dẫn đổi mật khẩu tài khoản",
    "chính sách bảo hành sản phẩm điện tử",
    "cách theo dõi đơn hàng đang giao",
    "quy định hoàn tiền khi hủy đơn",
  ];
  const docs: Doc[] = corpus.map((text, i) => ({
    id: `doc-${i + 1}`,
    text,
    vector: fakeEmbed(text, DIMS),
  }));

  const q = "hoàn tiền đơn hàng";
  const qv = fakeEmbed(q, DIMS);
  console.log(`Query: "${q}"`);
  console.log("");

  console.log("1. Cosine similarity với từng doc:");
  for (const d of docs) {
    console.log(`   ${d.id} (${d.text}) → ${cosineSimilarity(qv, d.vector).toFixed(3)}`);
  }
  console.log("");

  console.log("2. Top-3 search:");
  for (const r of search(qv, docs, 3)) {
    console.log(`   ${r.id} score=${r.score.toFixed(3)} — ${r.text}`);
  }
  console.log("");

  console.log("3. Tính chất cosine: sim(v, v) =", cosineSimilarity(qv, qv).toFixed(3), "(vector với chính nó = 1)");
  console.log("");
  console.log("✅ Cosine similarity + top-k search hoạt động (vector giả lập local)");
}

main();
