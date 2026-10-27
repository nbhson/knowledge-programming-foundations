/**
 * 18.4 Numbers & Math — demo bẫy IEEE-754 (0.1+0.2), so sánh epsilon,
 * tiền tệ bằng cents, BigInt, overflow, NaN. Thuần TypeScript.
 */

export {};

/** So sánh float bằng epsilon thay vì === */
function floatEqual(a: number, b: number, eps: number = Number.EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

/** Tiền tệ: cộng bằng cents (số nguyên) — chính xác tuyệt đối */
function addCents(a: number, b: number): number {
  return a + b;
}

function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2)}đ`;
}

/** Giai thừa BigInt — chính xác với số nguyên rất lớn */
function bigFactorial(n: bigint): bigint {
  let result = 1n;
  for (let i = 2n; i <= n; i++) result *= i;
  return result;
}

/** Cộng an toàn: cảnh báo khi vượt MAX_SAFE_INTEGER */
function safeAdd(a: number, b: number): { value: number; safe: boolean } {
  const value = a + b;
  return { value, safe: Number.isSafeInteger(value) };
}

function main(): void {
  console.log("=== 18.4 Numbers & Math Demo ===");
  console.log("");

  console.log("1. Bẫy kinh điển IEEE-754:");
  const sum = 0.1 + 0.2;
  console.log(`   0.1 + 0.2 = ${sum}`);
  console.log(`   (0.1 + 0.2) === 0.3 → ${sum === 0.3} ❌`);
  console.log(`   floatEqual(0.1 + 0.2, 0.3) → ${floatEqual(sum, 0.3)} ✅ (dùng epsilon)`);
  console.log("");

  console.log("2. Tiền tệ bằng cents (tránh float):");
  console.log(`   float: 10000 * 0.07 = ${10000 * 0.07} (may rủi làm tròn)`);
  const tax = Math.round(10000 * 0.07); // tính thuế bằng cents, làm tròn 1 lần duy nhất
  console.log(`   cents: 10000xu + thuế ${tax}xu = ${addCents(10000, tax)}xu = ${formatCents(addCents(10000, tax))}`);
  console.log("");

  console.log("3. Vượt MAX_SAFE_INTEGER (2^53 - 1):");
  console.log(`   MAX_SAFE_INTEGER = ${Number.MAX_SAFE_INTEGER}`);
  const overflow = safeAdd(Number.MAX_SAFE_INTEGER, 1);
  console.log(`   MAX + 1 = ${overflow.value}, safe? ${overflow.safe ? "✅" : "⛔ MẤT CHÍNH XÁC"}`);
  console.log(`   BigInt 30! = ${bigFactorial(30n)}`);
  console.log("");

  console.log("4. NaN lan truyền âm thầm:");
  const nan = 0 / 0;
  console.log(`   0/0 = ${nan}, Number.isNaN? ${Number.isNaN(nan)}`);
  console.log(`   NaN + 5 = ${nan + 5} (lan tiếp — phải bắt sớm bằng Number.isNaN)`);
  console.log(`   1/0 = ${1 / 0} (Infinity — kiểm tra isFinite trước khi chia)`);
  console.log("");
  console.log("✅ Epsilon, cents, BigInt, overflow-check hoạt động");
}

main();
