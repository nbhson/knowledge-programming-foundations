/**
 * 14.3 Error Handling — Demo
 *
 * Trình diễn:
 *   - Custom error classes (phân loại lỗi)
 *   - try/catch theo cấp — catch ở nơi BIẾT CÁCH xử lý
 *   - NEVER SWALLOW — lỗi bị nuốt im lặng là anti-pattern
 *   - Result type — expected failures xử lý kiểu functional
 */

// ─────────────────────── Phân loại lỗi bằng class ──────────────────────────
class ErrAppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number = 500,
    readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = "ErrAppError";
  }
}

class ErrNotFoundError extends ErrAppError {
  constructor(resource: string, id: string) {
    super(`${resource} không tồn tại: ${id}`, "NOT_FOUND", 404, { resource, id });
    this.name = "ErrNotFoundError";
  }
}

class ErrValidationError extends ErrAppError {
  constructor(field: string, reason: string) {
    super(`Dữ liệu không hợp lệ ở ${field}`, "VALIDATION_ERROR", 422, { field, reason });
    this.name = "ErrValidationError";
  }
}

class ErrExternalServiceError extends ErrAppError {
  constructor(service: string, originalMessage: string) {
    super(`Dịch vụ ${service} thất bại: ${originalMessage}`, "EXTERNAL_ERROR", 503, {
      service,
    });
    this.name = "ErrExternalServiceError";
  }
}

// ───────────────────── Mô phỏng DB + fetch với lỗi ─────────────────────────
class ErrMockUserDb {
  private readonly users = new Map<string, string>([
    ["u1", "Alice"],
    ["u2", "Bob"],
  ]);

  findById(id: string): string {
    const user = this.users.get(id);
    if (user === undefined) {
      throw new ErrNotFoundError("User", id);
    }
    return user;
  }

  save(id: string, value: string): void {
    if (id === "u-fail") {
      throw new ErrExternalServiceError("database", "timeout sau 5s");
    }
    this.users.set(id, value);
  }
}

// ─────────────────────────── ❌ Nuốt lỗi ────────────────────────────────────
function ErrSwallowedLookup(db: ErrMockUserDb, id: string): string {
  try {
    return db.findById(id);
  } catch {
    // SWALLOW — bỏ qua hoàn toàn, caller không hề biết có lỗi
    return "No User";
  }
}

// ─────────────────────── ✅ Xử lý đúng cách ─────────────────────────────────
interface ErrUserProfile {
  name: string;
  label: string;
}

function ErrLookupUserProfile(db: ErrMockUserDb, id: string): ErrUserProfile {
  try {
    const name = db.findById(id);
    return { name, label: `user:${name}` };
  } catch (error) {
    // 1. Không bao giờ nuốt lỗi
    // 2. Lỗi đã phân loại → propagate cho layer cao hơn quyết định
    if (error instanceof ErrNotFoundError) {
      console.log(`  ⚠️  [warn] ${error.message} (mã ${error.code}, HTTP ${error.statusCode})`);
    }
    throw error;
  }
}

// ─────────────────────── Result type (functional) ───────────────────────────
type ErrResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ErrAppError };

function ErrParseProfileAge(raw: string): ErrResult<number> {
  const parsed = Number(raw);
  if (parsed === 0 || Number.isNaN(parsed)) {
    return { ok: false, error: new ErrValidationError("age", "phải là số") };
  }
  return { ok: true, value: parsed };
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Error Handling Demo ===");
console.log("");

const db = new ErrMockUserDb();

console.log("1️⃣ Custom error class — phân loại rõ lỗi:");
try {
  db.findById("khong-ton-tai");
} catch (error) {
  if (error instanceof ErrAppError) {
    console.log(`  🎯 Catch ${error.name}: message="${error.message}", code=${error.code}, HTTP=${error.statusCode}, details=${JSON.stringify(error.details)}`);
  }
}
console.log("");

console.log("2️⃣ CẤM nuốt lỗi (never swallow):");
console.log("  ❌ ErrSwallowedLookup →", JSON.stringify(ErrSwallowedLookup(db, "u1")));
console.log(`     Với id lỗi: "${ErrSwallowedLookup(db, "sai")}" → caller tưởng 'No User' là 1 user thật!`);
console.log("  ✅ ErrLookupUserProfile → propagate đúng lỗi đã phân loại:");
try {
  ErrLookupUserProfile(db, "sai");
} catch (error) {
  console.log(`     Lỗi được đẩy lên cho layer biết cách xử lý: ${(error as Error).message}`);
}
console.log("");

console.log("3️⃣ Xử lý ở đúng cấp — repository ném lỗi cụ thể, controller quyết định:");
try {
  db.save("u-fail", "Nguyen");
} catch (error) {
  if (error instanceof ErrAppError) {
    console.log(`  🏗️  Repository ném ${error.name} → controller hiển thị 'HTTP ${error.statusCode}' cho client`);
  }
}
console.log("");

console.log("4️⃣ Result type — bắt buộc xử lý cả 2 nhánh ok/fail:");
const ageOk = ErrParseProfileAge("25");
const ageFail = ErrParseProfileAge("abc");
for (const [label, result] of [
  ["25 ", ageOk],
  ["abc", ageFail],
] as const) {
  if (result.ok) {
    console.log(`  ✅ age="${label}" → hợp lệ, value=${result.value}`);
  } else {
    console.log(`  ❌ age="${label}" → ${result.error.message} (code=${result.error.code})`);
  }
}
console.log("");

console.log("5️⃣ SO SÁNH ANTI-PATTERN vs CLEAN:");
console.log("  ┌──────────────────────┬────────────────────────────────────────┐");
console.log("  │ ❌ Anti-pattern      │ ✅ Clean                                │");
console.log("  ├──────────────────────┼────────────────────────────────────────┤");
console.log("  │ catch (e) {} (nuốt)  │ Log + rethrow hoặc trả Result          │");
console.log("  │ throw new Error()    │ Throw ErrAppError subclass cụ thể      │");
console.log("  │ Error string 'NOT_FOUND' | Error class + code + statusCode     │");
console.log("  │ Trả null khi lỗi     │ Result<T> | error — caller bắt buộc xét │");
console.log("  └──────────────────────┴────────────────────────────────────────┘");
console.log("");
console.log("✅ Error handling sạch: custom error class + không nuốt lỗi + xử lý đúng cấp");

export {};