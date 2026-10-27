/**
 * 7.10 Fuzz Testing — random input + mô phỏng fuzzer tìm crash parser
 *
 * Minh họa:
 * - Parser có bug ẩn (NUL byte, ngoặc không cân bằng).
 * - Fuzzer: seed corpus + mutation ngẫu nhiên × N vòng.
 * - Thu thập crash, minimize input, biến crash thành regression seed.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────── Parser có bug (target) ───────────────────────
function parseConfig(input: string): string {
  if (input.includes("\u0000")) throw new Error("NUL byte crash!");
  let depth = 0;
  for (const ch of input) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) throw new Error("unbalanced brace");
    if (depth > 32) throw new Error("nesting quá sâu (DoS)");
  }
  if (depth !== 0) throw new Error("unclosed brace");
  return "ok";
}

// ─────────────────────────── Fuzzer ───────────────────────────
const ALPHABET = ["{", "}", "a", " ", ":", '"', "\u0000"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mutate(seed: string): string {
  const chars = seed.split("");
  const op = Math.random();
  if (op < 0.4 && chars.length > 0) {
    // thay 1 ký tự
    chars[Math.floor(Math.random() * chars.length)] = pick(ALPHABET);
  } else if (op < 0.7) {
    // chèn ký tự ngẫu nhiên
    chars.splice(Math.floor(Math.random() * (chars.length + 1)), 0, pick(ALPHABET));
  } else if (chars.length > 1) {
    // xóa 1 ký tự
    chars.splice(Math.floor(Math.random() * chars.length), 1);
  }
  return chars.join("");
}

interface FuzzReport {
  runs: number;
  crashes: Map<string, string>; // message -> input mẫu
}

function fuzz(seeds: string[], rounds: number): FuzzReport {
  const crashes = new Map<string, string>();
  for (let i = 0; i < rounds; i++) {
    const input = mutate(pick(seeds));
    try {
      parseConfig(input);
    } catch (err) {
      const msg = (err as Error).message;
      if (!crashes.has(msg)) crashes.set(msg, input);
    }
  }
  return { runs: rounds, crashes };
}

// Minimize: thử xóa từng ký tự mà vẫn crash → input ngắn nhất tái hiện lỗi
function minimize(crashInput: string): string {
  let best = crashInput;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length; i++) {
      const candidate = best.slice(0, i) + best.slice(i + 1);
      try {
        parseConfig(candidate);
      } catch {
        best = candidate;
        improved = true;
        break;
      }
    }
  }
  return best;
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Fuzz Testing Demo ===\n");

  const seeds = ['{"a": 1}', "{}", '{"x": {}}'];
  console.log(`1️⃣ Seed corpus (${seeds.length} input hợp lệ) + mutation ngẫu nhiên × 5000 vòng...`);
  const report = fuzz(seeds, 5000);
  console.log(`   đã chạy ${report.runs} input, tìm thấy ${report.crashes.size} loại crash:`);

  for (const [msg, sample] of report.crashes) {
    const mini = minimize(sample);
    console.log(`   💥 "${msg}" — mẫu: ${JSON.stringify(sample)} → minimize: ${JSON.stringify(mini)}`);
  }

  console.log("\n2️⃣ Biến crash thành regression seed (không tái phát):");
  console.log('   seeds.push("{", "\\u0000") → unit test assert parseConfig ném lỗi có kiểm soát');

  console.log("\n✅ Bài học: fuzzer tìm crash mà test tay bỏ sót; minimize giúp debug; lưu crash làm regression test.");
}

main();

export {};
