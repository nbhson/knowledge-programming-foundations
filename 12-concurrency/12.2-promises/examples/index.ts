/**
 * 12.2 Promises - Callback → Promise Chain → Promise combinators
 *
 * Minh họa tiến hóa xử lý bất đồng bộ:
 * 1. Callback hell
 * 2. Promise (promisify)
 * 3. Promise chain (.then/.catch/.finally)
 * 4. Promise.all / Promise.allSettled / Promise.race / Promise.any
 *
 * KHÔNG dùng fetch thật — simulatedApi trả về Promise + setTimeout.
 */

// ─────────────────────────── Simulated API ───────────────────────────

interface ApiResult {
  resource: string;
  value: string;
}

function simulatedApi(resource: string, delayMs: number, shouldFail = false): Promise<ApiResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(`Lỗi khi lấy ${resource}`));
      else resolve({ resource, value: `data-${resource}` });
    }, delayMs);
  });
}

// ─────────────────────────── 1. Callback style ───────────────────────────

type Callback = (error: Error | null, result?: ApiResult) => void;

function apiWithCallback(resource: string, delayMs: number, cb: Callback): void {
  setTimeout(() => {
    if (resource === "fail") {
      cb(new Error(`Lỗi khi lấy ${resource}`));
    } else {
      cb(null, { resource, value: `data-${resource}` });
    }
  }, delayMs);
}

function callbackHell(): Promise<string> {
  return new Promise((resolve) => {
    console.log("  ❌ Callback hell — lồng nhau, khó đọc:");
    apiWithCallback("users", 10, (err1, user) => {
      if (err1) {
        console.log(`   → lỗi: ${err1.message}`);
        resolve("done");
        return;
      }
      apiWithCallback("posts", 10, (err2, post) => {
        if (err2) {
          console.log(`   → lỗi: ${err2.message}`);
          resolve("done");
          return;
        }
        apiWithCallback("comments", 10, (err3, comment) => {
          if (err3) {
            console.log(`   → lỗi: ${err3.message}`);
            resolve("done");
            return;
          }
          console.log(`   → ${user!.value} → ${post!.value} → ${comment!.value}`);
          console.log("   (mỗi bước lại thụt lùi 1 cấp — thiếu đường thoát lỗi rõ ràng)");
          resolve("done");
        });
      });
    });
  });
}

// ─────────────────────────── 2 + 3. Promise + Chain ───────────────────────────

async function promiseChain(): Promise<void> {
  console.log("  ✅ Promise chain — .then gắn phẳng, lỗi dồn về .catch:");
  await simulatedApi("users", 10)
    .then((user) => {
      console.log(`   → ${user.value}`);
      return simulatedApi("posts", 10);
    })
    .then((post) => {
      console.log(`   → ${post.value}`);
      return simulatedApi("comments", 10);
    })
    .then((comment) => console.log(`   → ${comment.value}`))
    .catch((error) => console.log(`   ⚠️  lỗi: ${error instanceof Error ? error.message : String(error)}`))
    .finally(() => console.log("   → finally: hoàn thành (kể cả thành công hay thất bại)"));
}

// ─────────────────────────── 4. Combinators ───────────────────────────

// Promise.any cần ES2021 trong typings — cast qua interface để vẫn dùng native (Node 15+)
interface PromiseAnyConstructor {
  any<T>(values: Iterable<T | PromiseLike<T>>): Promise<T>;
}

const PromiseWithAny = Promise as unknown as PromiseAnyConstructor;

async function demoCombinators(): Promise<void> {
  console.log("  🧩 Promise.all — tất cả cùng thành công:");
  const allOk = await Promise.all([
    simulatedApi("a", 20),
    simulatedApi("b", 20),
    simulatedApi("c", 20),
  ]);
  console.log(`   → ${allOk.map((r) => r.value).join(", ")}`);

  console.log("  🧩 Promise.all fail-fast — 1 cái reject là reject cả:");
  const allFail = await Promise.all([
    simulatedApi("a", 20),
    simulatedApi("lỗi", 20, true),
  ]).catch((error) => `reject: ${error instanceof Error ? error.message : String(error)}`);
  console.log(`   → ${allFail}`);

  console.log("  🧩 Promise.allSettled — chờ hết, báo kết quả từng cái:");
  const settled = await Promise.allSettled([
    simulatedApi("users", 20),
    simulatedApi("posts", 20, true), // cái này fail
    simulatedApi("comments", 20),
  ]);
  settled.forEach((result, i) => {
    const label = ["users", "posts", "comments"][i];
    if (result.status === "fulfilled") console.log(`   → ${label}: fulfilled (${result.value.value})`);
    else console.log(`   → ${label}: rejected (${result.reason instanceof Error ? result.reason.message : String(result.reason)})`);
  });

  console.log("  🧩 Promise.race — cái settle NHẤT thắng (dù resolve hay reject):");
  const race = await Promise.race([
    simulatedApi("chậm", 50),
    simulatedApi("nhanh", 10),
  ]);
  console.log(`   → thắng: ${race.value} (nhanh nhất về đích)`);

  console.log("  🧩 Promise.any — cái resolve ĐẦU TIÊN thắng (bỏ qua reject):");
  const any = await PromiseWithAny.any([
    simulatedApi("fail-1", 5, true),
    simulatedApi("fail-2", 5, true),
    simulatedApi("otay", 5),
  ]);
  console.log(`   → thắng: ${any.value}`);
}

// ───────────────────────────────── Demo ───────────────────────────────

async function run(): Promise<void> {
  console.log("=== Promises Demo ===");
  console.log("");

  console.log("1️⃣ Callback → Promise:");
  await callbackHell();
  console.log("");

  console.log("2️⃣ Promise chain:");
  await promiseChain();
  console.log("");

  console.log("3️⃣ Combinators:");
  await demoCombinators();
  console.log("");

  console.log("✅ Promise: 1 callback → .then chain → combine bằng all/allSettled/race/any");
}

run();
export {};