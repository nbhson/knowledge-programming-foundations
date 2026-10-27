# 🤖 Lớp 17: AI & LLM Engineering (Kỹ Thuật LLM)

> **LLM Engineering** là tập hợp kỹ thuật xây dựng sản phẩm trên mô hình ngôn ngữ lớn:
> từ viết prompt hiệu quả, biểu diễn văn bản thành vector, truy xuất tri thức (RAG),
> đến agent tự hành và đánh giá/an toàn — tất cả minh họa **thuần local, không gọi API thật**.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 17.1 | Prompt Engineering | Zero/few-shot, CoT, structured output, eval | [17.1-prompt-engineering](17.1-prompt-engineering/README.md) |
| 17.2 | Embeddings | Vector hóa văn bản, cosine similarity, search | [17.2-embeddings](17.2-embeddings/README.md) |
| 17.3 | RAG | Chunking, retrieve → rerank → generate, faithfulness | [17.3-rag](17.3-rag/README.md) |
| 17.4 | Vector Databases | ANN/HNSW/IVF khái niệm, metadata filtering | [17.4-vector-databases](17.4-vector-databases/README.md) |
| 17.5 | AI Agents | ReAct loop, tools, planning | [17.5-ai-agents](17.5-ai-agents/README.md) |
| 17.6 | LLM Eval & Safety | Metrics, hallucination, guardrails | [17.6-llm-eval-safety](17.6-llm-eval-safety/README.md) |
| 17.7 | Model Context Protocol (MCP) | Chuẩn kết nối Agent ↔ Tools/Data (Linux Foundation) | [17.7-model-context-protocol](17.7-model-context-protocol/README.md) |

---

## 📖 Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│  17.1 PROMPT ──► diễn đạt yêu cầu cho model             │
│       │                                                 │
│       ▼                                                 │
│  17.2 EMBEDDINGS ──► văn bản → vector                   │
│       │                                                 │
│       ├──► 17.3 RAG ──► chunk → retrieve → rerank        │
│       │              → generate (trích xuất local)       │
│       │                                                 │
│       └──► 17.4 VECTOR DB ──► ANN index + filter         │
│                    (HNSW/IVF khái niệm, mô phỏng local)  │
│                                                         │
│  17.5 AGENTS ──► ReAct: Thought → Action → Observation  │
│  17.6 EVAL/SAFETY ──► đo lường + guardrail mọi tầng     │
│       │                                                 │
│       ▼                                                 │
│  17.7 MCP ──► chuẩn kết nối Agent ↔ Tools/Data          │
│              (tools/resources/prompts, viết 1 lần)      │
└─────────────────────────────────────────────────────────┘
```

| Tầng | Câu hỏi trả lời | Output mô phỏng trong repo |
|---|---|---|
| Prompt | Làm sao model hiểu đúng ý? | Template builder + structured parser + eval |
| Embeddings | Làm sao so sánh ngữ nghĩa? | Cosine similarity + top-k search thuần TS |
| RAG | Làm sao trả lời từ tài liệu riêng? | Pipeline chunk → retrieve → rerank → generate |
| Vector DB | Scale search lên triệu vector? | Partition (IVF) + metadata filter |
| Agents | Làm sao model tự dùng tools? | ReAct loop gọi tools local |
| Eval/Safety | Làm sao biết output tốt/an toàn? | Scorer + guardrail keyword-based |
| MCP | Làm sao agent nối tools theo chuẩn chung? | Registry client/server mô phỏng local |

---

## 🗺️ Lộ Trình Học

1. **17.1 → 17.2**: học cách "nói chuyện" với model, rồi hiểu văn bản được số hóa ra sao.
2. **17.2 → 17.3 → 17.4**: từ 1 vector → pipeline RAG hoàn chỉnh → index ở quy mô lớn.
3. **17.5**: cho model "tay chân" (tools) và vòng lặp suy luận ReAct.
4. **17.6**: đo lường mọi thứ ở trên + chặn output nguy hiểm.
5. **17.7**: MCP — giao thức chuẩn để agent gọi tools của bên thứ ba.

> 💡 **Nguyên tắc mô phỏng:** mọi ví dụ trong lớp này dùng **số liệu/code thuần** (hash-vector, overlap-score, template),
> tuyệt đối **không gọi API LLM thật**, không cần key, chạy offline 100%.

---

## ▶️ Chạy Ví Dụ

```bash
# Chạy từng leaf (ví dụ)
cd 17-ai-llm-engineering/17.1-prompt-engineering
npx tsx examples/index.ts

cd ../17.2-embeddings
npx tsx examples/index.ts

cd ../17.3-rag
npx tsx examples/index.ts
```

Mỗi leaf đều có `examples/index.ts` chạy độc lập, không dependencies ngoài `typescript` + `tsx`.

---

## ⏭️ Bài Tiếp Theo

→ [17.1 Prompt Engineering](17.1-prompt-engineering/README.md) — bắt đầu từ cách viết prompt đúng.
