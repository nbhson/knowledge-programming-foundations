/**
 * 12.4 Web Workers - Offload Heavy Computation Demo
 *
 * Mô phỏng worker thread bằng TS thuần (KHÔNG dùng Worker DOM thật):
 * - MiniWorker: "chạy" tác vụ nặng sang một luồng khác (mô phỏng qua setTimeout),
 *   giao tiếp bằng postMessage + onmessage
 * - MiniWorkerPool: giới hạn số worker chạy đồng thời, xếp hàng tác vụ
 * - Cách tính số nguyên tố (heavy computation) không block "main thread"
 */

// ─────────────────────────── Mini Worker ───────────────────────────

interface WorkerTask {
  type: string;
  limit?: number;
  n?: number;
}

interface WorkerMessage {
  type: string;
  count?: number;
  max?: number;
  task?: string;
}

class MiniWorker {
  onmessage: ((data: WorkerMessage) => void) | null = null;
  private terminated = false;

  constructor(
    private readonly name: string,
    private readonly handler: (task: WorkerTask) => WorkerMessage,
  ) {}

  // Gửi tin nhắn vào worker — worker xử lý bất đồng bộ (mô phỏng luồng riêng)
  postMessage(task: WorkerTask): void {
    setTimeout(() => {
      if (this.terminated) {
        console.log(`  ⚠️  \`${this.name}\` đã bị terminate — bỏ qua task ${task.type}`);
        return;
      }
      const result = this.handler(task);
      console.log(`  🔧 \`${this.name}\` xong ${task.type}: ${JSON.stringify(result)}`);
      // result gửi ngược về main thread
      setTimeout(() => this.onmessage?.(result), 0);
    }, 10);
  }

  terminate(): void {
    this.terminated = true;
  }
}

// ─────────────────────────── Heavy computation (chạy trong "worker") ───────────────────────────

function computePrimes(limit: number): WorkerMessage {
  const primes: number[] = [];
  outer: for (let n = 2; n <= limit; n++) {
    for (const p of primes) {
      if (n % p === 0) continue outer;
      if (p * p > n) break;
    }
    primes.push(n);
  }
  return { type: "PRIMES_RESULT", count: primes.length, max: primes[primes.length - 1] ?? 0 };
}

// ─────────────────────────── Mini Worker Pool ───────────────────────────

class MiniWorkerPool {
  private queue: Array<() => void> = [];
  private active = 0;

  constructor(
    private readonly size: number,
    private readonly makeWorker: () => MiniWorker,
  ) {}

  // Xếp tác vụ; nếu còn worker rảnh thì chạy ngay
  post(task: WorkerTask): void {
    this.queue.push(() => this.runTask(task));
    this.drain();
  }

  private runTask(task: WorkerTask): void {
    const worker = this.makeWorker();
    const onDone = worker.onmessage;
    worker.onmessage = (data) => {
      this.active--;
      worker.terminate();
      this.drain();
      onDone?.(data);
    };
    this.active++;
    worker.postMessage(task);
  }

  private drain(): void {
    while (this.active < this.size && this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }

  pendingTasks(): number {
    return this.queue.length;
  }
}

// ─────────────────────────── "Main thread" mô phỏng ───────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== Web Workers Demo ===");
  console.log("");

  console.log("1️⃣ Worker đơn — tính số nguyên tố KHÔNG block main:");
  const mainBusy: number[] = [];
  const singleWorker = new MiniWorker("worker-1", (task) => {
    const limit = Number(task.limit ?? 0);
    return computePrimes(limit);
  });

  singleWorker.onmessage = (data) => {
    console.log(`   → Main nhận từ worker: ${data.type} đếm=${data.count}, số cuối=${data.max}`);
    console.log("   → Trong lúc worker tính, main thread vẫn 'mượt' (mô phỏng: UI không bị đơ)");
  };

  singleWorker.postMessage({ type: "COMPUTE_PRIMES", limit: 50_000 });
  // Main vẫn chạy được công việc của mình trong khi worker "tính"
  for (let i = 1; i <= 5; i++) {
    mainBusy.push(i * i);
    console.log(`   (main thread vẫn xử lý UI/event #${i})`);
    await sleep(5);
  }
  console.log("");
  await sleep(30);

  console.log("2️⃣ Worker Pool (size=2) — 4 tác vụ, chỉ 2 chạy song song:");
  let workerCounter = 0;
  const pool = new MiniWorkerPool(2, () => {
    const name = `pool-worker-${++workerCounter}`;
    const w = new MiniWorker(name, (task) => computePrimes(Number(task.limit ?? 0)));
    w.onmessage = (data) => {
      console.log(`   → ${name} trả về: ${data.count} số nguyên tố (max=${data.max})`);
    };
    return w;
  });

  for (const limit of [2000, 5000, 3000, 8000]) {
    pool.post({ type: "COMPUTE_PRIMES", limit });
    console.log(`   ⬆️  đã xếp task limit=${limit} (đang chờ: ${pool.pendingTasks()})`);
  }
  await sleep(80);
  console.log("");

  console.log("3️⃣ Worker bị terminate — task sau đó bị bỏ qua:");
  const terminatedWorker = new MiniWorker("vô-dụng", (task) => ({ type: "OK", task: task.type }));
  terminatedWorker.terminate();
  terminatedWorker.postMessage({ type: "FIB", n: 10 });
  await sleep(20);
  console.log("");

  console.log("✅ Web Workers: heavy computation rời khỏi main thread — giao tiếp bằng message, pool giới hạn concurrency");
}

run();
export {};