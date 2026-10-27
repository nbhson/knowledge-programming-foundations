# 📚 17.3 RAG (Retrieval-Augmented Generation)

> **RAG cho phép model trả lời từ tài liệu của bạn:** cắt nhỏ văn bản (chunking),
> truy xuất đoạn liên quan (retrieve), xếp lại (rerank), rồi mới sinh câu trả lời (generate).

---

## 🎯 Vấn Đề

LLM có 2 điểm yếu chí mạng: (1) không biết dữ liệu riêng của công ty bạn (docs nội bộ, chính sách mới),
(2) bịa đặt chi tiết (hallucination) khi thiếu căn cứ. Fine-tune cho mỗi lần docs đổi là đắt đỏ.
RAG giải quyết bằng cách **đính kèm bằng chứng vào prompt** trước khi generate.

```
User hỏi ──► RETRIEVE (top-k chunks) ──► RERANK ──► GENERATE (chỉ dùng context) ──► Trả lời + trích dẫn
     "Chính sách hoàn tiền?" → [chunk §3.2, §5.1] → [§3.2] → "Hoàn trong 30 ngày (theo §3.2)"
```

---

## 💻 Code Ví Dụ

```typescript
interface Chunk { id: string; text: string; tokens: string[]; }

// 1. Chunking: cắt văn bản thành đoạn có overlap để không mất ngữ cảnh biên
function chunkText(text: string, size: number, overlap: number): Chunk[] {
  const words = text.split(/\s+/);
  const chunks: Chunk[] = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const slice = words.slice(start, start + size);
    chunks.push({ id: `chunk-${chunks.length}`, text: slice.join(" "), tokens: slice });
    if (start + size >= words.length) break;
  }
  return chunks;
}

// 2. Retrieve: chấm điểm overlap từ vựng (mô phỏng; production dùng embeddings 17.2)
function retrieve(query: string, chunks: Chunk[], k: number): Array<Chunk & { score: number }> {
  const q = new Set(query.toLowerCase().split(/\s+/));
  return chunks
    .map((c) => {
      const hit = c.tokens.filter((t) => q.has(t.toLowerCase())).length;
      return { ...c, score: hit / Math.max(q.size, 1) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// 3. Rerank + 4. Generate (trích xuất): chọn chunk tốt nhất, trích câu chứa từ khóa
function generateAnswer(query: string, ranked: Array<Chunk & { score: number }>): string {
  const best = ranked[0];
  if (!best || best.score === 0) return "Không tìm thấy thông tin trong tài liệu.";
  return `Dựa trên [${best.id}]: "${best.text}"`;
}
```

> Pipeline đầy đủ (chunk → retrieve → rerank → generate + eval faithfulness khái niệm) trong
> `examples/index.ts` — chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Cập nhật tri thức không cần train lại | Thêm/sửa docs là model "biết" ngay |
| Giảm hallucination | Mọi câu trả lời gắn với chunk trích dẫn được |
| Minh bạch | User kiểm chứng được nguồn (§mấy, file nào) |
| Rẻ hơn fine-tune | Chỉ tốn chi phí index + prompt dài hơn |

---

## ⚠️ Lưu Ý

- Chunk quá to → nhiễu; chunk quá nhỏ → mất ngữ cảnh. Thường bắt đầu 300–500 tokens, overlap 10–20%.
- "Garbage in, garbage out": docs lỗi thời/trùng lặp thì RAG cũng trả lời sai — cần pipeline làm sạch docs.
- Luôn có fallback "không tìm thấy trong tài liệu" thay vì để model bịa.
- Đo faithfulness (câu trả lời có được context hỗ trợ không), không chỉ đo "hay".

---

## 🚀 RAG Nâng Cao (2025–2026)

Pipeline cơ bản trên đủ cho FAQ; các biến thể dưới đây giải quyết các chế độ lỗi khác nhau:

| Kỹ thuật | Ý tưởng | Giải quyết |
|---|---|---|
| **Agentic RAG** | Agent tự quyết định **có retrieve không**, truy vấn nào, truy xuất thêm lần nữa nếu chưa đủ | Câu hỏi nhiều bước, không phải mọi câu hỏi đều cần retrieve |
| **Self-RAG** | Model tự đánh giá từng đoạn retrieved (relevant? hỗ trợ câu trả lời?) trước khi dùng | Chunk nhiễu làm câu trả lời sai dù retrieval tìm đúng chủ đề |
| **Corrective RAG (CRAG)** | Nếu self-check thấy chunk kém → **viết lại query** hoặc fallback web search | Query mơ hồ, corpus thiếu thông tin |
| **HyDE** | Model viết **câu trả lời giả định** trước, dùng chính nó làm vector truy vấn | Query ngắn/mơ hồ so với docs dài (semantic gap) |
| **GraphRAG** | Trích thực thể + quan hệ thành graph, truy xuất theo đồ thị | Câu hỏi tổng hợp đa tài liệu ("quan hệ giữa X và Y") |

### 📏 Context window dài (128K–1M+ tokens) có làm RAG lỗi thời không?

**Không.** Context dài giúp "đút cả cuốn sách vào prompt" nhưng không thay được retrieval:

- **Chunking cho doc dài vẫn cần thiết**: chi phí + độ trễ tăng theo tokens; context giữa bị "loãng"
  (model bỏ sót thông tin giữa — *lost in the middle*); chi phí gửi cả corpus mỗi câu hỏi là không bền.
- **Dense vs sparse retrieval**: dense (embeddings, 17.2) bắt được nghĩa, sparse (BM25/keyword) bắt được
  từ hiếm, mã sản phẩm, tên riêng — hai thế lực lỗi khác nhau.
- **Hybrid search + rerank vẫn cần thiết dù context dài**: hybrid (dense + sparse) tăng recall,
  rerank đưa chunk liên quan lên đầu; context dài hơn chỉ làm việc đó **trong** window, còn số chunk
  đưa vào vẫn giới hạn để giữ chi phí và độ chính xác.

---

## 🎯 Khi Nào Dùng

- Chatbot trên docs nội bộ, FAQ, chính sách, codebase.
- Trợ lý trích dẫn nguồn (luật, y tế, tài chính — nơi bịa đặt là tối kỵ).
- Không dùng khi câu hỏi là kiến thức chung ổn định (thủ đô, cú pháp ngôn ngữ) — LLM thuần đã đủ.

---

## 🔗 Liên Quan

- [17.2 Embeddings](../17.2-embeddings/README.md) — retriever ngữ nghĩa thay vì overlap từ vựng.
- [17.4 Vector Databases](../17.4-vector-databases/README.md) — lưu và tìm chunk ở quy mô lớn.
- [17.1 Prompt Engineering](../17.1-prompt-engineering/README.md) — prompt "chỉ dùng context cho trước".

---

## 📚 Tài Liệu

- 📖 *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* — Lewis et al., 2020
- 📖 [Anthropic: Building effective RAG](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/long-context-tips)
- 📖 [Microsoft RAG Pattern](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)

---

## ⏭️ Bài Tiếp Theo

→ [17.4 Vector Databases](../17.4-vector-databases/README.md)
