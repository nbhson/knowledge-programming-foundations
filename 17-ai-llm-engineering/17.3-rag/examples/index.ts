/**
 * 17.3 RAG — pipeline chunking → retrieve → rerank → generate,
 * mô phỏng hoàn toàn local (overlap từ vựng thay cho embeddings thật)
 * + eval faithfulness ở mức khái niệm.
 */

export {};

interface Chunk {
  id: string;
  text: string;
  tokens: string[];
}

interface ScoredChunk extends Chunk {
  score: number;
}

/** 1. Chunking: cắt văn bản thành đoạn có overlap giữ ngữ cảnh biên */
function chunkText(text: string, size: number, overlap: number): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: Chunk[] = [];
  const step = Math.max(1, size - overlap);
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + size);
    chunks.push({ id: `chunk-${chunks.length}`, text: slice.join(" "), tokens: slice });
    if (start + size >= words.length) break;
  }
  return chunks;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/\s+/).filter(Boolean);
}

/** 2. Retrieve: chấm overlap từ vựng query-chunk (mô phỏng retriever ngữ nghĩa) */
function retrieve(query: string, chunks: Chunk[], k: number): ScoredChunk[] {
  const q = new Set(tokenize(query));
  return chunks
    .map((c) => {
      const hit = c.tokens.filter((t) => q.has(t.toLowerCase())).length;
      return { ...c, score: q.size === 0 ? 0 : hit / q.size };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** 3. Rerank: chấm lại bằng mật độ từ khóa (khái niệm cross-encoder gọn nhẹ) */
function rerank(query: string, candidates: ScoredChunk[]): ScoredChunk[] {
  const q = new Set(tokenize(query));
  return candidates
    .map((c) => {
      const density = c.tokens.filter((t) => q.has(t.toLowerCase())).length / Math.max(c.tokens.length, 1);
      return { ...c, score: 0.5 * c.score + 0.5 * density };
    })
    .sort((a, b) => b.score - a.score);
}

/** 4. Generate (trích xuất): trả lời + trích dẫn chunk, fallback khi không có bằng chứng */
function generateAnswer(query: string, ranked: ScoredChunk[]): string {
  const best = ranked[0];
  if (!best || best.score === 0) {
    return `Không tìm thấy thông tin về "${query}" trong tài liệu.`;
  }
  void query;
  return `Dựa trên [${best.id}] (score=${best.score.toFixed(2)}): "${best.text}"`;
}

/** Eval faithfulness (khái niệm): % từ nội dung của câu trả lời xuất hiện trong context */
function faithfulness(answer: string, context: string): number {
  const ctx = new Set(tokenize(context));
  const words = tokenize(answer).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const supported = words.filter((w) => ctx.has(w)).length;
  return supported / words.length;
}

function main(): void {
  console.log("=== 17.3 RAG Pipeline Demo ===");
  console.log("");

  const knowledgeBase =
    "Chính sách hoàn tiền áp dụng trong 30 ngày kể từ ngày nhận hàng. " +
    "Khách hàng cần giữ hóa đơn để được hoàn tiền đầy đủ. " +
    "Sản phẩm điện tử được bảo hành 12 tháng tại trung tâm chính hãng. " +
    "Để đổi mật khẩu hãy vào phần cài đặt tài khoản và chọn bảo mật.";

  const chunks = chunkText(knowledgeBase, 12, 3);
  console.log(`1. Chunking: ${chunks.length} chunks (size=12 từ, overlap=3):`);
  for (const c of chunks) console.log(`   [${c.id}] ${c.text}`);
  console.log("");

  const query = "hoàn tiền trong bao lâu cần hóa đơn";
  const retrieved = retrieve(query, chunks, 3);
  console.log(`2. Retrieve top-3 cho query "${query}":`);
  for (const r of retrieved) console.log(`   [${r.id}] score=${r.score.toFixed(2)} — ${r.text}`);
  console.log("");

  const ranked = rerank(query, retrieved);
  console.log("3. Rerank (kết hợp mật độ từ khóa):");
  for (const r of ranked) console.log(`   [${r.id}] score=${r.score.toFixed(2)} — ${r.text}`);
  console.log("");

  const answer = generateAnswer(query, ranked);
  console.log("4. Generate:");
  console.log(`   ${answer}`);
  const context = ranked.map((r) => r.text).join(" ");
  console.log(`   Faithfulness ≈ ${(faithfulness(answer, context) * 100).toFixed(1)}% (từ answer được context hỗ trợ)`);
  console.log("");

  console.log(`5. Fallback: ${generateAnswer("thủ đô của Pháp", ranked)}`);
  console.log("");
  console.log("✅ Pipeline RAG retrieve → rerank → generate hoạt động (local)");
}

main();
