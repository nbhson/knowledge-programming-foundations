/**
 * 3.1.9 Postel's Law (Robustness Principle) Demo
 *
 * Input chấp nhận rộng rãi (tolerant reader, chuẩn hóa),
 * output luôn chặt chẽ và nhất quán (1 schema duy nhất).
 */

export {};

// --- ❌ BAD: input khắt khe + output luộm thuộm ---
function parseAgeBad(input: number): number | null {
  if (typeof input !== "number") {
    throw new Error("Must be number"); // "18" rõ ràng vẫn chết
  }
  if (input < 0) {
    return null; // lúc throw, lúc null, lúc number — client đoán mò
  }
  return input;
}

// --- ✅ GOOD: input rộng, output chặt (1 shape duy nhất) ---
type ParseResult = { ok: true; age: number } | { ok: false; error: string };

function parseAge(input: unknown): ParseResult {
  const normalized: unknown = typeof input === "string" ? input.trim() : input;
  const age: unknown =
    typeof normalized === "string" && normalized !== "" ? Number(normalized) : normalized;
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 150) {
    return { ok: false, error: "Age must be an integer in range 0-150" };
  }
  return { ok: true, age };
}

// --- ✅ GOOD: Tolerant Reader — bỏ qua field lạ, chỉ đọc field cần ---
interface UserPayload {
  [key: string]: unknown;
}

function readUserName(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid payload: expected object");
  }
  const name: unknown = (payload as UserPayload)["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Invalid payload: missing required field 'name'");
  }
  return name.trim(); // field lạ (vd: "nickname" mới) bị bỏ qua — client cũ không vỡ
}

// --- Demo ---
function main(): void {
  console.log("=== Postel's Law Demo ===");
  console.log("");

  // ❌ BAD: khắt khe vô lý + output mập mờ
  try {
    parseAgeBad("18" as unknown as number);
  } catch (error) {
    console.log(`❌ BAD parseAgeBad("18"): throw ${(error as Error).message}`);
  }
  console.log(`❌ BAD parseAgeBad(-5): trả về ${String(parseAgeBad(-5))} (null mập mờ)`);
  console.log("");

  // ✅ GOOD: input rộng — string số, khoảng trắng đều chấp nhận
  const wideInputs: unknown[] = ["18", "  25 ", 30, "abc", -5, 200, null];
  for (const input of wideInputs) {
    const result = parseAge(input);
    if (result.ok) {
      console.log(`✅ GOOD parseAge(${JSON.stringify(input)}): ok, age=${result.age}`);
    } else {
      console.log(`✅ GOOD parseAge(${JSON.stringify(input)}): lỗi rõ ràng — ${result.error}`);
    }
  }
  console.log("");

  // ✅ GOOD: tolerant reader — API thêm field mới, client cũ vẫn sống
  const oldPayload = { name: "  Son  " };
  const newPayload = { name: "Son", nickname: "sonny", avatarUrl: "https://x/y.png", v2: true };
  console.log(`✅ GOOD tolerant reader (payload cũ): "${readUserName(oldPayload)}"`);
  console.log(`✅ GOOD tolerant reader (payload mới nhiều field lạ): "${readUserName(newPayload)}"`);
  console.log("");
  console.log("✅ Postel: input rộng (chuẩn hóa) + output chặt (1 schema)");
}

main();
