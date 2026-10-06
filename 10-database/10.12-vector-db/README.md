# 🧠 10.12 Vector DB (Embeddings & Tìm Kiếm Ngữ Nghĩa)

> **Vector DB** lưu **embeddings** (vector số thực biểu diễn ý nghĩa) và tìm "gần nghĩa nhất" bằng **cosine similarity** — nền tảng của semantic search và RAG. Index lớn dùng **HNSW** (đồ thị nhiều tầng) để tìm gần đúng siêu nhanh.

---

## 🎯 Vấn đề

Tìm kiếm keyword (`LIKE '%...%'`) không hiểu nghĩa: user hỏi "cách reset mật khẩu" nhưng doc ghi "khôi phục thông tin đăng nhập" → 0 kết quả dù cùng ý:

```
keyword:  "reset mật khẩu" vs "khôi phục đăng nhập" → không khớp chữ → miss 💥
semantic: embedding(câu 1) · embedding(câu 2) ≈ 0.9 → match ✅
```

---

## 💻 Code ví dụ

Cosine similarity thuần + top-k search (không deps).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb)); // 1 = cùng hướng, 0 = trực giao
}

function topK(query: number[], docs: { id: string; vec: number[] }[], k: number) {
  return docs
    .map((d) => ({ id: d.id, score: cosine(query, d.vec) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Hiểu nghĩa | "mèo" gần "mướp" hơn "ô tô" trong không gian embedding — search theo ý, không theo chữ |
| Nền RAG | Retrieve docs liên quan → nhét vào prompt LLM → giảm hallucination |
| Nhanh ở scale lớn | HNSW: O(log n) gần đúng thay vì brute-force O(n) trên hàng triệu vectors |

---

## ⚠️ Lưu Ý

- Embedding model quyết định chất lượng: cùng DB, model tốt hơn cho kết quả tốt hơn — benchmark trên data của bạn.
- Chuẩn hóa vector (unit norm) thì cosine = dot product — nhanh hơn; lưu ý khi tự implement.
- Metadata filtering (giá, category) kết hợp vector search — DB thật hỗ trợ hybrid (pgvector, Milvus).
- Chunking: doc dài phải cắt chunk (200–500 tokens, overlap) — chunk dở thì retrieve dở dù DB xịn.

---

## 🎯 Khi nào dùng

- Semantic search, FAQ/chatbot RAG, recommendation, image similarity.
- Không dùng khi: tìm chính xác (mã đơn, ID) — keyword/exact index nhanh + đúng hơn.

---

## 🔗 Liên quan

- **10.5 Indexes** — HNSW là "index" của thế giới vector (như B-tree của SQL).
- **11.3 GraphQL** — RAG API thường expose qua GraphQL/REST search endpoint.
- **10.6 Redis** — Redis Stack cũng có vector search cho cache ngữ nghĩa.

---

## 📚 Tài liệu

- pgvector — https://github.com/pgvector/pgvector
- HNSW paper (Malkov & Yashunin) — https://arxiv.org/abs/1603.09320
- OpenAI Embeddings — https://platform.openai.com/docs/guides/embeddings

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.12-vector-db
npx ts-node examples/index.ts
```

Demo: cosine giữa các vector mẫu → top-k semantic search → giải thích HNSW trực quan.

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm Database — tiếp tục Networking:

→ [11.1 HTTP Basics](../../11-networking-apis/11.1-http-basics/README.md)
