# 🗄️ 17.4 Vector Databases (Cơ Sở Dữ Liệu Vector)

> **Vector DB sinh ra để tìm "gần nhất" trong hàng triệu vector:**
> brute-force quá chậm nên dùng chỉ mục xấp xỉ (ANN: IVF, HNSW) + lọc metadata.

---

## 🎯 Vấn Đề

Tìm top-k bằng cosine trên 10 vector thì dễ; trên 10 triệu vector × 768 chiều thì mỗi query
quét toàn bộ là không thể (hàng giây → timeout). Vector DB đánh đổi **độ chính xác lấy tốc độ**
(Approximate Nearest Neighbor) bằng cách tổ chức vector thành cụm (IVF) hoặc đồ thị (HNSW),
kết hợp lọc metadata (ngày, tác giả, quyền truy cập) trước/sau search.

```
Brute force:  query ─► so với MỌI vector (10M × 768 phép nhân) ─► chậm
IVF:          query ─► tìm cụm gần nhất (100 cụm) ─► chỉ so trong cụm ─► nhanh ~100x
HNSW:         query ─► đi trên đồ thị nhiều tầng từ thưa → dày ─► nhanh + chính xác cao
```

---

## 💻 Code Ví Dụ

```typescript
interface VecDoc { id: string; vector: number[]; meta: Record<string, string>; }

// Metadata filtering: thu hẹp tập ứng viên trước khi tính khoảng cách
function filterByMeta(docs: VecDoc[], predicate: (m: Record<string, string>) => boolean): VecDoc[] {
  return docs.filter((d) => predicate(d.meta));
}

// IVF mô phỏng: gán mỗi vector vào partition (cụm) gần nhất, query chỉ quét cụm gần nhất
function assignPartition(vector: number[], centroids: number[][]): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const s = cosine(vector, centroids[i]); // cosine định nghĩa như 17.2
    if (s > bestScore) { bestScore = s; best = i; }
  }
  return best;
}

declare function cosine(a: number[], b: number[]): number;

// Quét ANN: chỉ tính cosine trong partition của query (nprobe = 1)
function annSearch(
  query: number[],
  partitions: Map<number, VecDoc[]>,
  centroids: number[][],
  k: number,
): VecDoc[] {
  const p = assignPartition(query, centroids);
  const candidates = partitions.get(p) ?? [];
  return candidates
    .map((d) => ({ d, s: cosine(query, d.vector) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, k)
    .map((x) => x.d);
}
```

> Mô phỏng đầy đủ (brute-force vs IVF-partition + metadata filter + đo recall) trong
> `examples/index.ts` — chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Kỹ thuật | Lợi ích |
|---|---|
| IVF (partition) | Giảm số vector phải quét từ N xuống N/num_clusters |
| HNSW (graph) | Query log-scale, recall cao — chuẩn production |
| Metadata filter | Kết hợp "giống ý" + "đúng điều kiện" (quyền, thời gian) |
| Pre-filter vs post-filter | Linh hoạt giữa tốc độ và độ đầy kết quả |

---

## ⚠️ Lưu Ý

- ANN là **xấp xỉ**: có thể bỏ sót hàng xóm thật — luôn đo recall@k khi tuning.
- HNSW tốn RAM (lưu nhiều cạnh đồ thị); IVF cần train centroids đại diện.
- Filter quá chặt + post-filter → trả về ít hơn k kết quả; production dùng pre-filter hoặc hybrid.
- Đừng lưu embedding đắt tiền mà không versioning: đổi model embedding = phải re-index toàn bộ.

---

## 🎯 Khi Nào Dùng

- Corpus > ~100k chunks và query cần < 100ms (RAG production).
- Cần filter theo quyền truy cập/tenant song song với similarity.
- Prototype nhỏ (< 10k vectors): brute-force trong RAM là đủ, chưa cần vector DB.

---

## 🔗 Liên Quan

- [17.2 Embeddings](../17.2-embeddings/README.md) — vector đưa vào index.
- [17.3 RAG](../17.3-rag/README.md) — retriever tiêu thụ kết quả vector DB.
- [10-database](../../10-database/README.md) — so sánh với index B-tree/truyền thống.

---

## 📚 Tài Liệu

- 📖 *Efficient and Robust Approximate Nearest Neighbor Search using HNSW* — Malkov & Yashunin, 2018
- 📖 [Pinecone: IVF vs HNSW](https://www.pinecone.io/learn/series/faiss/vector-indexes/)
- 📖 [Weaviate Concepts](https://weaviate.io/developers/weaviate/concepts/vector-index)

---

## ⏭️ Bài Tiếp Theo

→ [17.5 AI Agents](../17.5-ai-agents/README.md)
