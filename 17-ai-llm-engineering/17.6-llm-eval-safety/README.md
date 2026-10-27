# 🛡️ 17.6 LLM Eval & Safety (Đánh Giá & An Toàn LLM)

> **Không đo thì không cải thiện, không chặn thì không an toàn:**
> eval metrics cho biết output tốt đến đâu, guardrails ngăn output gây hại trước khi đến user.

---

## 🎯 Vấn Đề

"Thấy hay" là cảm tính: cùng một prompt, đổi một chữ có thể làm chất lượng tụt mà không ai nhận ra
cho đến khi user phàn nàn. Tệ hơn, model có thể **hallucinate** (bịa trích dẫn, số liệu) hoặc sinh nội dung
độc hại/bị jailbreak. Cần eval tự động chạy mỗi lần đổi prompt/model + guardrail chặn input/output nguy hiểm.

```
Đổi prompt v1 → v2 ──► chạy eval suite (100 case) ──► điểm ↑ mới merge (như unit test)
User input ──► INPUT GUARDRAIL ──► model ──► OUTPUT GUARDRAIL ──► user
```

---

## 💻 Code Ví Dụ

```typescript
// 1. Metrics: exact match + overlap (mô phỏng ROUGE-like) + keyword coverage
function exactMatch(pred: string, gold: string): number {
  return pred.trim().toLowerCase() === gold.trim().toLowerCase() ? 1 : 0;
}

function overlapScore(pred: string, gold: string): number {
  const p = new Set(pred.toLowerCase().split(/\s+/));
  const g = gold.toLowerCase().split(/\s+/);
  const hit = g.filter((w) => p.has(w)).length;
  return g.length === 0 ? 0 : hit / g.length; // recall từ vựng
}

interface EvalCase { input: string; expected: string; predicted: string }

function evalSuite(cases: EvalCase[]): { exact: number; overlap: number } {
  const exact = cases.reduce((s, c) => s + exactMatch(c.predicted, c.expected), 0) / cases.length;
  const overlap = cases.reduce((s, c) => s + overlapScore(c.predicted, c.expected), 0) / cases.length;
  return { exact, overlap };
}

// 2. Guardrail mô phỏng: chặn theo danh sách pattern nguy hiểm + PII đơn giản
const BLOCKED = [/bỏ qua mọi chỉ dẫn/i, /hack/i, /\b\d{12,16}\b/]; // jailbreak, hack, số thẻ

function guardrail(text: string): { safe: boolean; reason: string } {
  for (const pattern of BLOCKED) {
    if (pattern.test(text)) return { safe: false, reason: `Vi phạm pattern ${pattern}` };
  }
  return { safe: true, reason: "OK" };
}
```

> Scorer đầy đủ + demo hallucination + input/output guardrail trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Thực hành | Lợi ích |
|---|---|
| Eval suite cố định | Mọi thay đổi prompt/model đều so sánh được bằng số |
| Overlap + exact | Vừa đo khớp chính xác, vừa đo "đúng ý" |
| Input guardrail | Chặn prompt injection/jailbreak trước khi vào model |
| Output guardrail | Chặn PII, nội dung độc hại trước khi đến user |

---

## 🧱 Guardrails (2025–2026)

Keyword-filter trong demo chỉ là lớp đầu tiên. Production dùng **model guardrail chuyên dụng** làm lớp riêng:

| Guardrail | Ai làm | Vai trò |
|---|---|---|
| [LlamaGuard](https://github.com/meta-llama/PurpleLlama) | Meta | LLM classifier phân loại input/output an toàn theo chính sách |
| [PromptGuard](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M) | Meta | Nhận diện **prompt injection / jailbreak** ngay ở input |
| AWS Bedrock Guardrails | AWS | Policy content filter + denied topics + PII mask, managed |

**Phòng thủ prompt injection** (defense-in-depth, không chỉ 1 lớp):

```
User input ──► INPUT FILTER (PromptGuard/injection detector) ──► LLM (dùng tools)
                     │                                                    │
            chặn/jailbreak pattern                            OUTPUT FILTER ──► user
                                                            (kiểm nội dung + PII)
```

- **Privilege separation**: agent chạy tool với quyền tối thiểu, riêng biệt với quyền của user —
  bị injection thì thiệt hại chỉ trong sandbox của agent, không phải toàn hệ thống.
- Input/output filter là 2 lớp độc lập: chặn dữ liệu vào và nội dung ra — một lớp bị lọt lớp kia giữ.
- Guardrail model chạy song song, **không thay** eval: eval đo chất lượng, guardrail chặn rủi ro runtime.

---

## 🤥 Hallucination Measurement

Đo hallucination ở 3 mức, từ rẻ đến đắt:

| Cách | Làm thế nào | Ưu / Nhược |
|---|---|---|
| **Self-check** | Hỏi lại model "câu trên có chính xác không?" hoặc sample nhiều lần, đo sự đồng thuận | Rẻ, tự động — nhưng model có thể tự tin sai (cùng bias) |
| **Citation-grounded** | Ép trả lời kèm trích dẫn nguồn (chunk RAG §mấy), kiểm mỗi câu có căn cứ không | Khách quan, kiểm tra được tự động — cần pipeline retrieval tốt |
| **LLM-as-judge** | Model chấm câu trả lời so với context/gold answer theo rubric | Mềm dẻo, chấm được câu mở — thiên vị, cần luân phiên judge + human spot-check |

---

## 📊 RAG Eval — RAGAS Metrics

Với pipeline RAG (17.3), đừng chỉ đo "trả lời hay" — đo cả **chất lượng truy xuất**. Bộ metrics [RAGAS](https://docs.ragas.io/):

| Metric | Đo gì | Câu hỏi |
|---|---|---|
| **Faithfulness** | Câu trả lời có bám vào context được truy xuất không? | Có bịa không? |
| **Answer relevance** | Câu trả lời có đúng câu hỏi không? | Có trả lẹo/lạc đề không? |
| **Context precision** | Trong các chunk truy xuất, chunk liên quan có đứng trước không? | Rerank có tốt không? |
| **Context recall** | Mọi thông tin cần có nằm trong context chưa? | Retrieval có bỏ sót không? |

> Faithfulness + context metrics cho biết **nên sửa retriever hay sửa generator** — thay vì chỉ biết "trả lời dở".

---

## ⚠️ Lưu Ý

- Keyword-guardrail trong demo chỉ là **lớp đầu tiên**: production cần thêm classifier, PII detector, policy engine.
- Eval tự động không thay con người: giữ thêm human-review cho case nhạy cảm (y tế, pháp lý).
- "LLM chấm LLM" (LLM-as-judge) tiện nhưng thiên vị model cùng họ — luân phiên judge + human spot-check.
- Lưu eval dataset versioned như code: đổi test mà không review thì điểm số vô nghĩa.

---

## 🎯 Khi Nào Dùng

- Mọi pipeline LLM production: eval chạy trong CI trước khi merge prompt mới.
- Guardrail input+output cho mọi chatbot user-facing.
- Red-team định kỳ: cố tình jailbreak để tìm lỗ hổng trước kẻ xấu.

---

## 🔗 Liên Quan

- [17.1 Prompt Engineering](../17.1-prompt-engineering/README.md) — đối tượng chính của eval.
- [17.3 RAG](../17.3-rag/README.md) — đo faithfulness (trả lời có căn cứ không).
- [09-security](../../09-security/README.md) — guardrail là một lớp defense-in-depth.

---

## 📚 Tài Liệu

- 📖 [Braintrust](https://www.braintrust.dev/) — nền tảng eval/observatory cho LLM (thay OpenAI Evals, đã deprecated 2024)
- 📖 [LangSmith](https://smith.langchain.com/) — tracing + eval suite; [RAGAS](https://docs.ragas.io/) — metrics RAG
- 📖 [Arize Phoenix](https://phoenix.arize.com/) • [Trulens](https://www.trulens.org/) • [DeepEval](https://deepeval.com/) — các nền tảng eval hiện hành 2025–2026
- 📖 *TruthfulQA: Measuring How Models Mimic Human Falsehoods* — Lin et al., 2021
- 📖 [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

---

## ⏭️ Bài Tiếp Theo

→ [Lớp 18: CS Fundamentals](../../18-cs-fundamentals/README.md)
