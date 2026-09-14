/**
 * 12.1 Async/Await - Simulated API Demo
 *
 * Minh họa async/await với API mô phỏng (Promise + setTimeout):
 * - await tuần tự (sequential) vs chạy song song (Promise.all)
 * - Error handling với try/catch
 * - Đo thời gian để thấy sự khác biệt
 *
 * KHÔNG dùng fetch thật — hàm simulatedApi trả về Promise resolve sau delayMs.
 */

// ─────────────────────────── Simulated API ───────────────────────────

interface ApiResult {
  resource: string;
  id: number;
  value: string;
}

function simulatedApi(resource: string, id: number, delayMs: number, shouldFail = false): Promise<ApiResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Lỗi mạng khi gọi ${resource}/${id}`));
        return;
      }
      resolve({ resource, id, value: `data-${resource}-${id}` });
    }, delayMs);
  });
}

// Helper đo thời gian
const timers = new Map<string, number>();

function startTimer(label: string): void {
  timers.set(label, Date.now());
}

function elapsed(label: string): number {
  return Date.now() - (timers.get(label) ?? 0);
}

// ─────────────────────────── Sequential vs Parallel ───────────────────────────

async function fetchUserSequentially(): Promise<void> {
  startTimer("sequential");
  console.log("  🐢 Chạy TUẦN TỰ (mỗi request chờ request trước xong):");
  const users = await simulatedApi("users", 1, 100);
  console.log(`   → ${users.value} (100ms)`);
  const posts = await simulatedApi("posts", 2, 100);
  console.log(`   → ${posts.value} (100ms)`);
  const comments = await simulatedApi("comments", 3, 100);
  console.log(`   → ${comments.value} (100ms)`);
  console.log(`   ⏱  Tổng: ~${Math.round(elapsed("sequential") / 100) * 100}ms (cộng dồn 3×100ms)`);
}

async function fetchUserInParallel(): Promise<void> {
  startTimer("parallel");
  console.log("  🚀 Chạy SONG SONG (Promise.all — 3 request cùng lúc):");
  const [users, posts, comments] = await Promise.all([
    simulatedApi("users", 1, 100),
    simulatedApi("posts", 2, 100),
    simulatedApi("comments", 3, 100),
  ]);
  console.log(`   → ${users.value} (100ms)`);
  console.log(`   → ${posts.value} (100ms)`);
  console.log(`   → ${comments.value} (100ms)`);
  console.log(`   ⏱  Tổng: ~${Math.round(elapsed("parallel") / 100) * 100}ms (chạy đồng thời)`);
}

// ─────────────────────────── Error handling ───────────────────────────

async function callWithErrorHandling(): Promise<void> {
  try {
    const result = await simulatedApi("users", 99, 50, true);
    console.log(`   → ${result.value}`);
  } catch (error) {
    console.log(`   ⚠️  catch lỗi: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ─────────────────────────── Async function + IIFE ───────────────────────────

async function demo(): Promise<void> {
  console.log("=== Async/Await Demo ===");
  console.log("");

  console.log("1️⃣ await tuần tự — kết quả phụ thuộc thứ tự:");
  await fetchUserSequentially();
  console.log("");

  console.log("2️⃣ Promise.all — các request độc lập chạy song song:");
  await fetchUserInParallel();
  console.log("");

  console.log("3️⃣ Error handling — await trong try/catch:");
  await callWithErrorHandling();
  console.log("");

  console.log("4️⃣ Chain phụ thuộc — request sau cần kết quả request trước:");
  const user = await simulatedApi("users", 5, 50);
  const posts = await simulatedApi("posts", Number(user.id), 50);
  console.log(`   → lấy posts của user ${user.id}: ${posts.value}`);
  console.log("");

  console.log("✅ async/await: code tuần tự dễ đọc, await nhường quyền cho event loop, Promise.all để chạy song song");
}

// IIFE — gọi async function ngay khi chạy file
demo();
export {};