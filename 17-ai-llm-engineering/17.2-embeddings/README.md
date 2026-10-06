# 🧭 17.2 Embeddings (Vector Nhúng)

> **Embeddings biến văn bản thành tọa độ trong không gian ngữ nghĩa:**
> hai câu cùng ý nghĩa thì vector gần nhau — đo bằng cosine similarity, tìm kiếm bằng top-k.

---

## 🎯 Vấn Đề

So khớp từ khóa (keyword match) thất bại với ngôn ngữ tự nhiên: "xe hơi" vs "ô tô" không chung
từ nào nhưng cùng ý; "táo" (quả) vs "Apple" (hãng) chung chữ nhưng khác ý. Cần một biểu diễn số
mà khoảng cách hình học phản ánh tương đồng ngữ nghĩa — đó là embedding vector.

```
"xe hơi" ─┐
           ├─► [0.9, 0.1, ...] ─┐ cosine ≈ 0.95 (gần)
"ô tô"  ──┘                     │
"táo chín" ─► [0.1, 0.9, ...] ─┘ cosine ≈ 0.05 (xa)
```

---

## 💻 Code Ví Dụ

```typescript
// Cosine similarity thuần TS — không cần thư viện
function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function norm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom; // ∈ [-1, 1], càng gần 1 càng giống nhau
}

interface Doc {
  id: string;
  text: string;
  vector: number[];
}

// Top-k search: xếp hạng tài liệu theo độ tương đồng với query
function search(query: number[], docs: Doc[], k: number): Array<Doc & { score: number }> {
  return docs
    .map((d) => ({ ...d, score: cosineSimilarity(query, d.vector) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}
```

> Demo đầy đủ (hash-embedding giả lập + cosine + search trên corpus tiếng Việt) trong
> `examples/index.ts` — chạy bằng `npx ts-node examples/index.ts`. Không gọi API embedding thật.

---

## ✅ Lợi Ích

| Khả năng | Lợi ích |
|---|---|
| Semantic search | Tìm theo ý nghĩa, không cần trùng từ khóa |
| Clustering/dedup | Gom nhóm văn bản giống nhau, phát hiện trùng lặp |
| Nền tảng RAG | Truy xuất chunk liên quan trước khi generate |
| Rẻ khi query | Pre-compute vector docs một lần, mỗi query chỉ dot-product |

---

## ⚠️ Lưu Ý

- Vector phải **normalize** trước khi so cosine, nếu không độ dài vector làm lệch kết quả.
- Embedding giả lập bằng hash trong demo **không hiểu ngữ nghĩa thật** — production phải dùng model thật (E5, BGE, OpenAI embeddings...).
- Chiều vector (dimensions) càng lớn càng giàu biểu diễn nhưng tốn RAM/index chậm hơn.
- Embedding bị lệch theo dữ liệu huấn luyện (bias ngôn ngữ) — luôn eval trên dữ liệu của chính bạn.

---

## 🎯 Khi Nào Dùng

- Ô tìm kiếm muốn "gõ ý, ra đúng tài liệu" thay vì Ctrl+F từ khóa.
- Gợi ý bài viết/sản phẩm tương tự, phát hiện nội dung trùng.
- Làm retriever cho RAG (→ 17.3) và index cho vector DB (→ 17.4).
- Không dùng khi cần khớp chính xác (mã đơn hàng, ID) — hãy dùng filter/equality.

---

## 🔗 Liên Quan

- [17.3 RAG](../17.3-rag/README.md) — dùng embeddings để retrieve chunk.
- [17.4 Vector Databases](../17.4-vector-databases/README.md) — index hàng triệu vector.
- [18-cs-fundamentals](../../18-cs-fundamentals/README.md) — khoảng cách vector là hình học/đại số tuyến tính.

---

## 📚 Tài Liệu

- 📖 [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- 📖 [Sentence-Transformers Docs](https://www.sbert.net/)
- 📖 *Efficient Estimation of Word Representations in Vector Space* (Word2Vec) — Mikolov et al., 2013

---

## ⏭️ Bài Tiếp Theo

→ [17.3 RAG](../17.3-rag/README.md)
