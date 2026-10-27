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
- **pgvector (Postgres) là lựa chọn phổ biến nhất 2026 cho RAG vừa và nhỏ** — 1 DB duy nhất cho data quan hệ + vector, không cần hạ tầng mới; scale lên hàng chục triệu vectors vẫn ổn với HNSW index.
- **Hybrid search (BM25 + vector) là best practice cho RAG** — keyword bắt chính xác (tên riêng, mã), vector bắt ngữ nghĩa; kết hợp rồi rerank cho chất lượng tốt nhất.

---

## 🔀 Hybrid Search (BM25 + Vector)

Vector search hiểu nghĩa nhưng tệ với **từ khóa chính xác** (mã sản phẩm, tên riêng, mã lỗi). Keyword BM25 (full-text search) ngược lại. **Hybrid = cả hai + fuse kết quả:**

```
query "ERR_CONN_TIMEOUT Postgres" 
→ BM25: match chính xác token "ERR_CONN_TIMEOUT" (score 0.9)
→ vector: match doc về "kết nối database bị ngắt" (score 0.85)
→ RRF/weighted fusion → kết quả tốt hơn từng cái riêng lẻ ✅
```

- **RRF (Reciprocal Rank Fusion)**: `score = Σ 1/(k + rank_i)` — gộp rank từ 2 nguồn, không cần chuẩn hóa score.
- pgvector: kết hợp `tsvector` (full-text) + `<->` (vector) trong 1 query; Elasticsearch/OpenSearch có hybrid built-in; Qdrant/Milvus hỗ trợ sparse+dense.
- RAG production gần như luôn hybrid: keyword giữ chính xác, semantic hiểu ý — chọn theo data của bạn.

## 🗜️ Quantization (Giảm Memory 4–32×)

Vector 1536 dims float32 = ~6KB/vector → 10M vectors = 60GB. Quantization nén:

| Kỹ thuật | Nén | Chất lượng recall | Dùng khi |
|---|---|---|---|
| **Scalar (int8)** | 4× | ~99% | Mặc định đáng thử đầu tiên |
| **Product Quantization (PQ)** | 8–32× | 90–95% | Bộ nhớ là nút cổng, chấp nhận tuning |
| **Binary (BQ)** | 32× | 70–85% | Pre-filter thô rồi rerank bằng vector gốc |
| **Matryoshka embeddings** | Cắt đầu vector | Giữ được theo trade-off | Model hỗ trợ (OpenAI text-embedding-3) |

> Công thức phổ biến: quantize để **tìm ứng viên (candidate)** nhanh, rồi **rerank** bằng vector gốc float32 trên top-100 → recall gần full, memory giảm mạnh.

## 🏪 So sánh nhanh (2026)

| DB | Điểm mạnh | Điểm yếu | Hợp với |
|---|---|---|---|
| **pgvector** (Postgres ext) | SQL + JOIN + metadata filter, 1 DB cho tất cả, phổ biến nhất cho RAG vừa-nhỏ | HNSW chậm hơn chuyên dụng ở ~trăm triệu vector | Đã có Postgres, RAG < 10M vectors |
| **Qdrant** | Rust, nhanh, filter mạnh, quantization tốt | Vận hành riêng nếu self-host | RAG medium-large, self-host |
| **Milvus** | Scale cực lớn (tỷ vectors), GPU index, nhiều index type | Vận hành phức tạp (etcd, MinIO…) | Hàng trăm triệu–tỷ vectors |
| **Pinecone** | Managed, serverless, không lo vận hành | Đắt, vendor lock-in, ít control | Team nhỏ không muốn vận hành, scale nhanh |

> Kinh nghiệm 2026: **bắt đầu với pgvector** (ít moving parts, dùng SQL quen), chuyển Qdrant/Milvus khi > 50M vectors hoặc QPS cao; Pinecone khi ưu tiên managed tuyệt đối.

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

**Các vector DB phổ biến (2026):** pgvector (Postgres), Pinecone, Weaviate, Milvus, Qdrant, Elasticsearch/OpenSearch k-NN — với RAG vừa và nhỏ, pgvector thường là lựa chọn đầu tiên trước khi cân nhắc dedicated DB.

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
