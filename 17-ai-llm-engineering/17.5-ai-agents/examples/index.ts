/**
 * 17.5 AI Agents — mô phỏng vòng lặp ReAct (Thought → Action → Observation),
 * tools local (lookup/calc), planning chia bước + giới hạn số vòng.
 * KHÔNG gọi LLM/API thật — "model" là hàm rule-based chọn tool.
 */

export {};

interface Tool {
  name: string;
  description: string;
  run(args: string): string;
}

/** Tool tra cứu đơn hàng local (đại diện DB/API) */
function makeLookupTool(orders: Record<string, number>): Tool {
  return {
    name: "lookup",
    description: "Tra cứu giá trị đơn hàng: lookup('A1')",
    run(args: string): string {
      const id = args.replace(/['"]/g, "").trim();
      const value = orders[id];
      return value === undefined ? `Error: không có đơn ${id}` : `${id}=${value}`;
    },
  };
}

/** Tool tính toán an toàn: whitelist ký tự số học (xem thêm 18.5 evaluator) */
function makeCalcTool(): Tool {
  return {
    name: "calc",
    description: "Tính biểu thức số học: calc('100+200*1.1')",
    run(args: string): string {
      const expr = args.replace(/['"]/g, "").trim();
      if (!/^[0-9+\-*/().\s]+$/.test(expr) || expr.length === 0) {
        return "Error: biểu thức không hợp lệ";
      }
      try {
        const value = Function(`"use strict"; return (${expr});`)() as number;
        if (typeof value !== "number" || !isFinite(value)) return "Error: kết quả không hợp lệ";
        return String(Math.round(value * 100) / 100);
      } catch {
        return "Error: không tính được";
      }
    },
  };
}

interface TraceStep {
  thought: string;
  action: string;
  observation: string;
}

/**
 * ReAct loop mô phỏng: planning = liệt kê mã đơn cần tra → tra từng cái
 * → đủ dữ liệu thì calc → trả lời. Dừng khi xong hoặc hết maxSteps.
 */
function reactLoop(question: string, orderIds: string[], tools: Tool[], maxSteps: number): { answer: string; trace: TraceStep[] } {
  const lookup = tools.find((t) => t.name === "lookup") as Tool;
  const calc = tools.find((t) => t.name === "calc") as Tool;
  const trace: TraceStep[] = [];
  const observations: string[] = [];
  const pending = [...orderIds];

  for (let step = 0; step < maxSteps; step++) {
    if (pending.length > 0) {
      const next = pending.shift() as string;
      const action = `lookup('${next}')`;
      const observation = lookup.run(`'${next}'`);
      trace.push({ thought: `Cần giá ${next} (${observations.length + 1}/${orderIds.length}).`, action, observation });
      observations.push(observation);
    } else {
      const expr = observations.map((o) => o.split("=")[1]).join("+");
      const action = `calc('${expr} + thuế 10%')`;
      const subtotal = calc.run(expr);
      const total = calc.run(`(${subtotal})*1.1`);
      const observation = `tạm tính=${subtotal}, tổng +thuế=${total}`;
      trace.push({ thought: "Đã đủ giá các đơn, tính tổng + thuế 10%.", action, observation });
      return { answer: `Final answer cho "${question}": ${total}`, trace };
    }
  }
  return { answer: "Dừng: quá số vòng cho phép (tránh lặp vô hạn).", trace };
}

function main(): void {
  console.log("=== 17.5 AI Agents (ReAct) Demo ===");
  console.log("");

  const orders: Record<string, number> = { A1: 100, A2: 200, A3: 50 };
  const tools = [makeLookupTool(orders), makeCalcTool()];
  console.log("1. Tools đã đăng ký:");
  for (const t of tools) console.log(`   ${t.name}: ${t.description}`);
  console.log("");

  console.log("2. Planning: câu hỏi cần 3 lookups + 1 calc:");
  const question = "Tổng giá trị 3 đơn A1, A2, A3 cộng thuế 10%?";
  console.log(`   "${question}"`);
  console.log("");

  const { answer, trace } = reactLoop(question, ["A1", "A2", "A3"], tools, 6);
  console.log("3. Trace Thought → Action → Observation:");
  trace.forEach((s, i) => {
    console.log(`   Bước ${i + 1}: Thought: ${s.thought}`);
    console.log(`            Action: ${s.action}`);
    console.log(`            Observation: ${s.observation}`);
  });
  console.log("");
  console.log(`4. ${answer}`);
  console.log("");
  console.log("✅ ReAct loop + tools local + giới hạn vòng hoạt động");
}

main();
