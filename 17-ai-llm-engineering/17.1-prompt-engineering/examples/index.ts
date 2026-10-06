/**
 * 17.1 Prompt Engineering — mô phỏng template builder + zero/few-shot + CoT
 * + structured output + eval đơn giản. Thuần local, KHÔNG gọi API LLM thật.
 */

export {};

interface FewShotExample {
  input: string;
  output: string;
}

interface PromptSpec {
  role: string;
  context: string;
  task: string;
  steps: string[];
  constraints: string[];
  format: string;
  examples: FewShotExample[];
}

/** Lắp ráp prompt từ các khối chuẩn Role/Context/Task/Steps/Constraints/Format/Examples */
function buildPrompt(spec: PromptSpec): string {
  const lines: string[] = [
    `Bạn là ${spec.role}.`,
    `Bối cảnh: ${spec.context}`,
    `Nhiệm vụ: ${spec.task}`,
    `Thực hiện theo các bước:`,
    ...spec.steps.map((s, i) => `  ${i + 1}. ${s}`),
    `Ràng buộc: ${spec.constraints.join("; ")}`,
    `Định dạng output: ${spec.format}`,
  ];
  if (spec.examples.length > 0) {
    lines.push("Ví dụ:");
    for (const e of spec.examples) {
      lines.push(`- Input: ${e.input}`);
      lines.push(`  Output: ${e.output}`);
    }
  }
  return lines.join("\n");
}

/** Phân loại zero-shot vs few-shot: có ví dụ hay không */
function promptMode(spec: PromptSpec): "zero-shot" | "few-shot" {
  return spec.examples.length === 0 ? "zero-shot" : "few-shot";
}

interface SentimentResult {
  label: "positive" | "negative" | "neutral";
  confidence: number;
}

/**
 * "Model" giả lập: phân loại cảm xúc bằng từ khóa (đại diện cho LLM thật).
 * Production: thay hàm này bằng fetch tới API LLM.
 */
function mockClassify(review: string): string {
  const text = review.toLowerCase();
  const positive = ["tuyệt", "tốt", "thích", "tuyet", "tot", "great", "love"];
  const negative = ["tệ", "dở", "ghét", "te", "do", "bad", "hate"];
  const posHit = positive.filter((w) => text.includes(w)).length;
  const negHit = negative.filter((w) => text.includes(w)).length;
  const label = posHit > negHit ? "positive" : negHit > posHit ? "negative" : "neutral";
  const confidence = Math.min(0.99, 0.5 + Math.abs(posHit - negHit) * 0.2);
  // Structured output: luôn trả JSON đúng schema
  return JSON.stringify({ label, confidence });
}

/** Parse + validate structured output (ném lỗi khi thiếu field) */
function parseStructuredOutput(raw: string): SentimentResult {
  const parsed = JSON.parse(raw) as Partial<SentimentResult>;
  if (parsed.label !== "positive" && parsed.label !== "negative" && parsed.label !== "neutral") {
    throw new Error(`label không hợp lệ: ${String(parsed.label)}`);
  }
  if (typeof parsed.confidence !== "number") {
    throw new Error("thiếu field confidence");
  }
  return { label: parsed.label, confidence: parsed.confidence };
}

/** Eval đơn giản: accuracy trên tập mẫu có nhãn */
function evaluate(cases: Array<{ input: string; expected: SentimentResult["label"] }>): number {
  let correct = 0;
  for (const c of cases) {
    const pred = parseStructuredOutput(mockClassify(c.input));
    if (pred.label === c.expected) correct++;
  }
  return cases.length === 0 ? 0 : correct / cases.length;
}

function main(): void {
  console.log("=== 17.1 Prompt Engineering Demo ===");
  console.log("");

  const zeroShot: PromptSpec = {
    role: "chuyên gia phân loại cảm xúc",
    context: "đánh giá sản phẩm tiếng Việt",
    task: "phân loại cảm xúc của review",
    steps: ["Đọc review", "Xác định từ mang cảm xúc", "Chọn 1 trong 3 nhãn"],
    constraints: ["chỉ trả JSON", "không giải thích thêm"],
    format: '{"label": "positive|negative|neutral", "confidence": number}',
    examples: [],
  };

  const fewShot: PromptSpec = {
    ...zeroShot,
    examples: [
      { input: "Sản phẩm tuyệt vời, tôi rất thích", output: '{"label": "positive", "confidence": 0.9}' },
      { input: "Chất lượng tệ, rất thất vọng", output: '{"label": "negative", "confidence": 0.9}' },
    ],
  };

  console.log(`1. Zero-shot prompt (${promptMode(zeroShot)}):`);
  console.log(buildPrompt(zeroShot));
  console.log("");
  console.log(`2. Few-shot prompt (${promptMode(fewShot)}): +${fewShot.examples.length} ví dụ mẫu`);
  console.log("");

  console.log("3. Chain-of-Thought: các bước suy luận đã nhúng trong prompt (steps 1-3 ở trên).");
  console.log("");

  const cases = [
    { input: "Sản phẩm tuyệt vời, giao hàng nhanh", expected: "positive" as const },
    { input: "Chất lượng tệ, đóng gói dở", expected: "negative" as const },
    { input: "Sản phẩm tốt, tôi rất thích", expected: "positive" as const },
    { input: "Hàng tạm được, không có gì đặc biệt", expected: "neutral" as const },
  ];
  console.log("4. Structured output + eval:");
  for (const c of cases) {
    const raw = mockClassify(c.input);
    const parsed = parseStructuredOutput(raw);
    console.log(`   "${c.input}" → ${raw} (expected=${c.expected})`);
    void parsed;
  }
  console.log(`   Accuracy: ${(evaluate(cases) * 100).toFixed(1)}% trên ${cases.length} case`);
  console.log("");
  console.log("✅ Prompt có cấu trúc + structured output + eval hoạt động (mô phỏng local)");
}

main();
