/**
 * 5.6 Error Handling Techniques — Tổng quan các kỹ thuật xử lý lỗi
 *
 * Minh họa nhanh (chi tiết ở các leaf 5.6.1 → 5.6.4):
 * - Custom error + phân loại lỗi
 * - try/catch + fallback an toàn
 * - Circuit breaker / Retry / Saga / DLQ — xử lý "lỗi" ở mức hệ thống
 */

// ──────────────────────────────── Custom error ──────────────────────────────
class ErrorCatalogError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "ErrorCatalogError";
  }
}

class RetryableError extends ErrorCatalogError {
  constructor(message: string) {
    super(message, "RETRYABLE", true);
    this.name = "RetryableError";
  }
}

class PermanentError extends ErrorCatalogError {
  constructor(message: string) {
    super(message, "PERMANENT", false);
    this.name = "PermanentError";
  }
}

// ────────────────────────────── Phân loại lỗi ───────────────────────────────
function handleWithCatalog(error: unknown): string {
  if (error instanceof RetryableError) return `🔁 retryable → thử lại (${error.code})`;
  if (error instanceof PermanentError) return `⛔ permanent → báo lỗi, không thử lại (${error.code})`;
  if (error instanceof Error) return `❓ lỗi không phân loại: ${(error as Error).message}`;
  return "❓ unknown error";
}

// Mô phỏng một pipeline xử lý đơn hàng → các bước ném lỗi phân loại
let orderAttempts = 0;
function placeOrderWithFallback(items: string[]): string {
  orderAttempts++;
  try {
    if (items.length === 0) {
      throw new PermanentError("Giỏ hàng rỗng");
    }
    if (orderAttempts % 2 === 1) {
      throw new RetryableError("Payment gateway tạm bận");
    }
    return "✅ Đặt hàng thành công";
  } catch (error) {
    return handleWithCatalog(error);
  }
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== Error Handling Techniques Overview Demo ===");
console.log("");

console.log("1️⃣ Phân loại lỗi bằng custom Error class:");
try {
  throw new RetryableError("Service tạm thời không phản hồi");
} catch (error) {
  console.log(`   ${handleWithCatalog(error)}`);
}
try {
  throw new PermanentError("Không tìm thấy user");
} catch (error) {
  console.log(`   ${handleWithCatalog(error)}`);
}
console.log("");

console.log("2️⃣ try/catch với fallback — xử lý đặt hàng, lỗi được catch:");
for (let i = 0; i < 3; i++) {
  console.log(`   Lần ${i + 1}: ${placeOrderWithFallback(["Sách TS"])}`);
}
console.log("");

console.log("3️⃣ Bảng kỹ thuật xử lý lỗi ở mức hệ thống:");
const errorTechniques = [
  { name: "Circuit Breaker  (5.6.1)", problem: "Service liên tục fail", solution: "Ngắt mạch, chờ hồi phục" },
  { name: "Retry Pattern    (5.6.2)", problem: "Lỗi thoáng qua", solution: "Thử lại với backoff" },
  { name: "Saga Pattern     (5.6.3)", problem: "Transaction phân tán", solution: "Bù trừ từng bước" },
  { name: "Dead Letter Queue (5.6.4)", problem: "Message fail vĩnh viễn", solution: "Đưa sang queue riêng" },
];
for (const t of errorTechniques) {
  console.log(`   ${t.name}  |  ${t.problem}  →  ${t.solution}`);
}
console.log("");

console.log("✅ Xử lý lỗi đi từ cá nhân (custom error + try/catch) đến hệ thống (circuit breaker, retry, saga, DLQ). Phân loại lỗi retryable/permanent giúp chọn đúng chiến lược.");
export {};