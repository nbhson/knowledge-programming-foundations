/**
 * 12.3 Event Loop - Microtask vs Macrotask Order Demo
 *
 * Minh họa thứ tự thực thi trong JavaScript/Node.js:
 * - Code đồng bộ (Call Stack) chạy trước tiên
 * - Microtasks (Promise.then, queueMicrotask) chạy sau current task
 *   nhưng TRƯỚC macrotasks
 * - Macrotasks (setTimeout, setInterval, I/O) chạy sau cùng
 *
 * Output dưới đây in theo đúng thứ tự thực thi thật của event loop.
 */

// Chờ cho các timer/callback hiện có trong event loop chạy xong
const settle = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─────────────────────────── Demo 1: thứ tự cơ bản ───────────────────────────

async function demoBasicOrder(): Promise<void> {
  console.log("  [1] sync — bắt đầu"); // chạy ngay trong Call Stack

  // Macrotask: setTimeout đẩy callback vào task queue, chờ tới LƯỢT SAU
  setTimeout(() => {
    console.log("  [5] macrotask — setTimeout(0)"); // in SAU CÙNG
  }, 0);

  // Microtask: Promise callback chạy ngay sau khi sync code xong
  Promise.resolve().then(() => {
    console.log("  [3] microtask — Promise.then");
  });

  // Microtask: queueMicrotask cũng là microtask
  queueMicrotask(() => {
    console.log("  [4] microtask — queueMicrotask");
  });

  console.log("  [2] sync — kết thúc");

  // Đợi mọi callback chạy xong để output có thứ tự đúng
  await settle(5);
  // (microtask trước macrotask: event loop flush hết microtask queue, rồi mới xử lý 1 macrotask)
  console.log("  (giải thích: microtask trước macrotask — Promise/queueMicrotask in [3][4] trước setTimeout [5])");
  console.log("");
}

// ─────────────────────────── Demo 2: microtask tạo microtask ───────────────────────────

async function demoManyMicrotasks(): Promise<void> {
  console.log("  [A ] sync — Log A");

  setTimeout(() => console.log("  [F ] macrotask — setTimeout"), 0);

  Promise.resolve().then(() => console.log("  [B ] microtask — Promise #1"));

  // Microtask tạo thêm microtask — vẫn được flush hết trước khi event loop sang macrotask
  Promise.resolve().then(() => {
    console.log("  [C ] microtask — Promise #2 (tạo thêm 1 microtask)");
    queueMicrotask(() => console.log("  [D ] microtask — tạo từ Promise #2"));
  });

  console.log("  [E ] sync — Log hết sync code");
  await settle(5);
  // (microtask trước macrotask: B, C, D in hết rồi mới tới F)
  console.log("  (giải thích: microtask trước macrotask — toàn bộ microtask queue B→C→D được flush trước F)");
  console.log("");
}

// ─────────────────────────── Demo 3: await trong async ───────────────────────────

async function demoAwait(): Promise<void> {
  console.log("  [1] sync — trước await");

  // 'await' hoạt động như .then — phần sau await là microtask
  await Promise.resolve();
  console.log("  [2] microtask — phần sau await (Promise)");

  await new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log("  [4] macrotask — setTimeout bên trong async");
      resolve();
    }, 0);
  });

  console.log("  [5] microtask — phần sau setTimeout (await Promise)");
  await settle(5);
  // (giải thích: await dừng hàm nhưng KHÔNG block event loop — microtask trước macrotask)
  console.log("  (giải thích: await tạm dừng nhưng nhường quyền cho event loop — không hề chặn main thread)");
  console.log("");
}

// ─────────────────────────── Demo 4: block event loop ───────────────────────────

async function demoBlocking(): Promise<void> {
  console.log("  Bắt đầu một hàm sync NẶNG (vòng lặp 5 triệu lần):");
  setTimeout(() => console.log("  -> setTimeout(0) lẽ ra chạy... nhưng phải chờ!"), 0);

  const start = Date.now();
  let sum = 0;
  for (let i = 0; i < 5_000_000; i++) {
    sum += i; // CPU-bound — chặn hết microtask lẫn macrotask
  }
  void sum;

  console.log(`  -> Hàm nặng hoàn thành sau ${Date.now() - start}ms`);
  await settle(5);
  console.log("  (vòng lặp đồng bộ chiếm trọn main thread — mọi thứ khác phải xếp hàng đợi)");
  console.log("");
}

// ───────────────────────────────── Runner ───────────────────────────────

async function run(): Promise<void> {
  console.log("=== Event Loop Demo ===");
  console.log("");

  console.log("1️⃣ Thứ tự cơ bản (đánh số là thứ tự thực thi):");
  await demoBasicOrder();

  console.log("2️⃣ Microtask tạo ra microtask mới:");
  await demoManyMicrotasks();

  console.log("3️⃣ await trong async function:");
  await demoAwait();

  console.log("4️⃣ Hàm sync nặng làm chặn event loop:");
  await demoBlocking();

  console.log("✅ Event loop: sync code → microtask (Promise/queueMicrotask) → macrotask (setTimeout/I/O)");
}

run();
export {};