# 🕹️ 17.5 AI Agents (Tác Tử AI)

> **Agent = LLM có tay chân:** thay vì chỉ trả lời, model lặp vòng
> Thought → Action (gọi tool) → Observation cho đến khi xong việc.

---

## 🎯 Vấn Đề

Nhiều việc không thể xong bằng một câu trả lời: "tổng chi phí 3 đơn hàng + thuế?" cần tra đơn hàng,
tính toán, rồi mới tổng hợp. Gọi LLM một lần sẽ bịa số. Agent giải quyết bằng vòng lặp **ReAct**:
model suy nghĩ (thought), chọn tool + tham số (action), đọc kết quả tool (observation), lặp lại,
kèm kế hoạch (planning) chia task lớn thành bước nhỏ và giới hạn số vòng để không lặp vô hạn.

```
Thought: cần giá 3 đơn → Action: getOrder("A1") → Observation: $100
Thought: đã có 1/3, lấy tiếp → Action: getOrder("A2") → Observation: $200
Thought: đủ dữ liệu → Action: calc("100+200+50, thuế 10%") → Observation: $385
Thought: xong → Final answer: $385
```

---

## 💻 Code Ví Dụ

```typescript
// Tool local: agent chỉ được gọi qua interface này
interface Tool {
  name: string;
  description: string;
  run(args: string): string; // input/output đều là string để model dễ dùng
}

const calculator: Tool = {
  name: "calc",
  description: "Tính biểu thức số học, ví dụ: calc('100+200*1.1')",
  run(args: string): string {
    // Production: dùng parser an toàn (xem 18.5), demo dùng Function với whitelist ký tự
    if (!/^[0-9+\-*/().\s]+$/.test(args)) return "Error: biểu thức không hợp lệ";
    try {
      const value = Function(`"use strict"; return (${args});`)() as number;
      return String(value);
    } catch {
      return "Error: không tính được";
    }
  },
};

// ReAct loop mô phỏng: "model" ở đây là hàm rule-based chọn tool (production: gọi LLM thật)
function reactLoop(question: string, tools: Tool[], docs: Record<string, string>, maxSteps: number): string {
  const observations: string[] = [];
  for (let step = 0; step < maxSteps; step++) {
    // Thought (mô phỏng): nếu còn mã đơn chưa tra thì tra, đủ rồi thì calc
    const pending = Object.keys(docs).filter((k) => !observations.some((o) => o.includes(k)));
    let action: string;
    if (pending.length > 0) {
      action = `lookup('${pending[0]}')`;
      observations.push(`${pending[0]}=${docs[pending[0]]}`);
    } else {
      const expr = observations.map((o) => o.split("=")[1]).join("+");
      const calcTool = tools.find((t) => t.name === "calc") as Tool;
      const result = calcTool.run(expr);
      return `Final answer cho "${question}": ${result}`;
    }
    void action;
  }
  return "Dừng: quá số vòng cho phép (tránh lặp vô hạn).";
}
```

> Vòng ReAct đầy đủ (tools lookup/calc + planning + giới hạn vòng + log Thought/Action/Observation)
> trong `examples/index.ts` — chạy bằng `npx tsx examples/index.ts`.

---

## ✅ Lợi Ích

| Khả năng | Lợi ích |
|---|---|
| Dùng tools | Lấy dữ liệu thật thay vì bịa (DB, API, máy tính) |
| Multi-step | Xong việc phức tạp mà 1 prompt không làm nổi |
| Planning | Chia task lớn → bước nhỏ, dễ kiểm soát |
| Quan sát được | Log Thought/Action/Obs giúp debug từng bước |

---

## ⚠️ Lưu Ý

- Luôn giới hạn `maxSteps` + timeout: agent có thể lặp vô hạn hoặc gọi tool tốn tiền.
- Tool là **mặt tấn công**: validate input, cấp quyền tối thiểu, không cho agent chạy shell tùy ý.
- Đừng để agent tự ý hành động nguy hiểm (xóa DB, gửi mail) mà không có human-in-the-loop.
- Log mọi tool-call: khi sai, bạn cần biết sai ở bước suy luận hay ở dữ liệu tool trả về.

---

## 🎯 Khi Nào Dùng

- Task cần dữ liệu tươi/riêng (giá, tồn kho, docs nội bộ) + tính toán.
- Tự động hóa quy trình nhiều bước (research → tổng hợp → tạo ticket).
- Không dùng khi 1 prompt RAG đơn đã trả lời tốt — agent tốn latency và chi phí hơn nhiều.

---

## 🔗 Liên Quan

- [17.1 Prompt Engineering](../17.1-prompt-engineering/README.md) — prompt điều khiển agent.
- [17.3 RAG](../17.3-rag/README.md) — retriever thường là 1 tool của agent.
- [17.6 LLM Eval & Safety](../17.6-llm-eval-safety/README.md) — guardrail cho tool-call.

---

## 📚 Tài Liệu

- 📖 *ReAct: Synergizing Reasoning and Acting in Language Models* — Yao et al., 2022
- 📖 [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- 📖 [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)

---

## ⏭️ Bài Tiếp Theo

→ [17.6 LLM Eval & Safety](../17.6-llm-eval-safety/README.md)
