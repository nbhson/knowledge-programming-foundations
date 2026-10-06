# 💬 17.1 Prompt Engineering (Kỹ Thuật Viết Prompt)

> **Prompt tốt = spec tốt:** càng diễn đạt rõ vai trò, ví dụ, bước suy luận và định dạng output,
> model càng trả lời đúng — không cần model lớn hơn, chỉ cần prompt tốt hơn.

---

## 🎯 Vấn Đề

Model LLM không đọc được ý nghĩ: cùng một câu hỏi, cách diễn đạt khác nhau cho kết quả khác nhau.
Các lỗi phổ biến: prompt mơ hồ ("viết giúp tôi cái này"), không ví dụ mẫu, bắt suy luận phức tạp
trong một bước, và yêu cầu output tự do rồi parse bằng regex mong manh.

```
❌ Prompt mơ hồ:
   "Tóm tắt bài này" → tóm tắt bao nhiêu câu? cho ai đọc? format gì?

✅ Prompt có cấu trúc:
   Role + Context + Task + Steps + Constraints + Format + Examples
```

---

## 💻 Code Ví Dụ

```typescript
// Template builder: lắp ráp prompt từ các khối chuẩn
interface PromptSpec {
  role: string;
  context: string;
  task: string;
  steps: string[];
  constraints: string[];
  format: string;
  examples: Array<{ input: string; output: string }>; // few-shot
}

function buildPrompt(spec: PromptSpec): string {
  const lines: string[] = [
    `Bạn là ${spec.role}.`,
    `Bối cảnh: ${spec.context}`,
    `Nhiệm vụ: ${spec.task}`,
    `Các bước (Chain-of-Thought):`,
    ...spec.steps.map((s, i) => `  ${i + 1}. ${s}`),
    `Ràng buộc: ${spec.constraints.join("; ")}`,
    `Định dạng output: ${spec.format}`,
  ];
  if (spec.examples.length > 0) {
    lines.push("Ví dụ:");
    spec.examples.forEach((e) =>
      lines.push(`- Input: ${e.input}\n  Output: ${e.output}`),
    );
  }
  return lines.join("\n");
}

// Structured output: ép model trả JSON rồi parse + validate
function parseJsonOutput<T>(raw: string, requiredKeys: Array<keyof T>): T {
  const parsed = JSON.parse(raw) as T;
  for (const key of requiredKeys) {
    if ((parsed as Record<string, unknown>)[key as string] === undefined) {
      throw new Error(`Thiếu field bắt buộc: ${String(key)}`);
    }
  }
  return parsed;
}
```

> Xem demo đầy đủ (zero/few-shot, CoT, structured output + eval đơn giản) trong `examples/index.ts`
> — chạy bằng `npx ts-node examples/index.ts`. Mô phỏng hoàn toàn local, không gọi API thật.

---

## ✅ Lợi Ích

| Kỹ thuật | Lợi ích |
|---|---|
| Zero-shot rõ ràng | Đủ tốt cho task đơn giản, không tốn ví dụ |
| Few-shot (1-5 ví dụ) | Định hình format và phong cách output chính xác |
| Chain-of-Thought | Tăng độ đúng cho toán/logic nhiều bước |
| Structured output (JSON) | Parse được bằng code, không đoán mò |
| Eval đơn giản | Biết prompt nào tốt hơn bằng số, không bằng cảm giác |

---

## ⚠️ Lưu Ý

- Few-shot quá nhiều ví dụ → tốn token, có thể làm model "học vẹt" ví dụ thay vì hiểu task.
- CoT khiến output dài hơn (tốn tiền/latency) — chỉ dùng khi task cần suy luận.
- Đừng tin JSON của model mù quáng: luôn `try/catch` + validate schema (ví dụ: zod).
- Prompt injection: đừng nối input người dùng trực tiếp vào system prompt mà không có delimiter/guardrail.

---

## 🎯 Khi Nào Dùng

- **Zero-shot + format rõ**: phân loại, tóm tắt ngắn, trích xuất field đơn giản.
- **Few-shot**: khi output cần format lạ mà mô tả bằng lời khó (ví dụ: nhãn tùy chỉnh).
- **CoT**: giải toán, debug, lập kế hoạch nhiều bước.
- **Structured output**: mọi pipeline mà code downstream cần đọc kết quả (agent, RAG, ETL).

---

## 🔗 Liên Quan

- [17.5 AI Agents](../17.5-ai-agents/README.md) — prompt điều khiển ReAct loop và gọi tools.
- [17.3 RAG](../17.3-rag/README.md) — prompt kèm context truy xuất được.
- [17.6 LLM Eval & Safety](../17.6-llm-eval-safety/README.md) — đo chất lượng prompt và chặn output xấu.

---

## 📚 Tài Liệu

- 📖 [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- 📖 [Anthropic Prompt Engineering Docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- 📖 *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models* — Wei et al., 2022

---

## ⏭️ Bài Tiếp Theo

→ [17.2 Embeddings](../17.2-embeddings/README.md)
