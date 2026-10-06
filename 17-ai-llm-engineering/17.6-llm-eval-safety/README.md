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

- 📖 [OpenAI Evals](https://github.com/openai/evals)
- 📖 *TruthfulQA: Measuring How Models Mimic Human Falsehoods* — Lin et al., 2021
- 📖 [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

---

## ⏭️ Bài Tiếp Theo

→ [Lớp 18: CS Fundamentals](../../18-cs-fundamentals/README.md)
