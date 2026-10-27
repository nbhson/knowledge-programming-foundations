/**
 * 13.6 Scalable Architecture — Demo
 *
 * Mô phỏng hành trình: Monolith (1 instance) → Scale-Out (nhiều instance + load balancer)
 * → Hàng đợi (queue) → DB replica — và ĐẾM THROUGHPUT (request/giây).
 */

const ScaleLatencyMs = 5;

interface ScaleAppInstance {
  readonly name: string;
  process(requestId: number): Promise<void>;
  getProcessed(): number;
}

class ScaleInstance implements ScaleAppInstance {
  readonly name: string;
  private processedCount = 0;

  constructor(name: string) {
    this.name = name;
  }

  process(requestId: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.processedCount++;
        resolve();
      }, ScaleLatencyMs);
    });
  }

  getProcessed(): number {
    return this.processedCount;
  }
}

/** Chạy workload tuần tự trên 1 instance — mô phỏng Monolith */
async function runSerially(instance: ScaleAppInstance, workload: number): Promise<number> {
  const start = Date.now();
  for (let i = 0; i < workload; i++) {
    await instance.process(i);
  }
  return Date.now() - start;
}

/** Chạy workload song song trên pool instances — mô phỏng Scale-Out */
async function runWithPool(
  instances: ScaleAppInstance[],
  workload: number,
  concurrency: number
): Promise<number> {
  const start = Date.now();
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = nextIndex++;
      if (index >= workload) return;
      await instances[index % instances.length].process(index);
    }
  };
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return Date.now() - start;
}

function throughput(workload: number, elapsedMs: number): string {
  return `${(workload / (elapsedMs / 1000)).toFixed(0)} req/s`;
}

class ScaleMessageQueue {
  private items: number[] = [];
  private maxBacklog = 0;

  push(requestId: number): void {
    this.items.push(requestId);
    this.maxBacklog = Math.max(this.maxBacklog, this.items.length);
  }

  pull(): number | undefined {
    return this.items.shift();
  }

  size(): number {
    return this.items.length;
  }

  getMaxBacklog(): number {
    return this.maxBacklog;
  }
}

/** Producer đẩy request vào queue, các worker (consumer) kéo ra xử lý — producer không bị chặn */
async function runWithQueue(
  queue: ScaleMessageQueue,
  workersCount: number,
  workload: number
): Promise<number> {
  const start = Date.now();
  for (let i = 0; i < workload; i++) {
    queue.push(i);
  }
  const worker = async (): Promise<void> => {
    for (;;) {
      const requestId = queue.pull();
      if (requestId === undefined) break;
      await new ScaleInstance(`Worker ${(requestId % workersCount) + 1}`).process(requestId);
    }
  };
  const workers = Array.from({ length: workersCount }, () => worker());
  await Promise.all(workers);
  return Date.now() - start;
}

class ScaleDatabaseCluster {
  private primaryReads = 0;
  private replicaReads = 0;
  private readonly replicas: string[];

  constructor(replicaCount: number) {
    this.replicas = Array.from({ length: replicaCount }, (_, i) => `Replica DB ${i + 1}`);
  }

  /** 80% đọc đi replica, 20% đi primary */
  read(readerId: number): void {
    const isReadFromReplica = readerId % 5 !== 0; // 4/5 lần → replica
    if (isReadFromReplica) {
      this.replicaReads++;
      console.log(`  📖 [đọc ${readerId}] → ${this.replicas[readerId % this.replicas.length]}`);
    } else {
      this.primaryReads++;
      console.log(`  📖 [đọc ${readerId}] → Primary DB (bắt buộc read-your-writes)`);
    }
  }

  summary(): void {
    console.log(`     Đọc primary=${this.primaryReads}, replica=${this.replicaReads} — primary thoát tải nặng đọc`);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
(async () => {
  console.log("=== Scalable Architecture Demo ===");
  console.log("");

  const workload = 40;
  console.log(`Benchmark workload = ${workload} requests, mỗi request mô phỏng mất ${ScaleLatencyMs}ms\n`);

  console.log("🏛️ GIAI ĐOẠN 1 — Monolith (1 instance, xử lý nối tiếp):");
  const monolith = new ScaleInstance("Monolith Server");
  const monoElapsed = await runSerially(monolith, workload);
  console.log(`  ⏱️  Thời gian: ${monoElapsed}ms → throughput ${throughput(workload, monoElapsed)}`);
  console.log("  🚧 Nút thắt: CPU đơn, 1 request làm xong mới đến request kế.");
  console.log("");

  console.log("🏢 GIAI ĐOẠN 2 — Scale-Out (3 instance sau load balancer, xử lý song song):");
  const scaledInstances = Array.from(
    { length: 3 },
    (_, i) => new ScaleInstance(`App Server ${i + 1}`)
  );
  const scaleElapsed = await runWithPool(scaledInstances, workload, 3);
  console.log(`  ⏱️  Thời gian: ${scaleElapsed}ms → throughput ${throughput(workload, scaleElapsed)}`);
  for (const instance of scaledInstances) {
    console.log(`  📊 ${instance.name}: xử lý ${instance.getProcessed()} requests`);
  }
  console.log(`  🚀 Tăng tốc ×${(monoElapsed / scaleElapsed).toFixed(1)} so với Monolith`);
  console.log("");

  console.log("📨 GIAI ĐOẠN 3 — Message Queue (producer push, 3 workers kéo ra xử lý, không chặn client):");
  const queue = new ScaleMessageQueue();
  const queueElapsed = await runWithQueue(queue, 3, workload);
  console.log(`  ⏱️  Thời gian: ${queueElapsed}ms → throughput ${throughput(workload, queueElapsed)}`);
  console.log(`  📦 Backlog tối đa trong queue: ${queue.getMaxBacklog()} — client không bao giờ bị chặn chờ xử lý`);
  console.log("  💡 Queue giúp tách producer/consumer, có thể scale worker độc lập.");
  console.log("");

  console.log("🗄️ GIAI ĐOẠN 4 — DB Replica (đọc phân tán, chỉ 1 primary ghi):");
  const dbCluster = new ScaleDatabaseCluster(3);
  for (let i = 1; i <= 10; i++) {
    dbCluster.read(i);
  }
  dbCluster.summary();
  console.log("");

  console.log("📊 SO SÁNH THROUGHPUT:");
  console.log("  ┌─────────────────────┬──────────────┬─────────────────┐");
  console.log("  │ Kiến trúc           │ Thời gian    │ Throughput      │");
  console.log(`  ├─────────────────────┼──────────────┼─────────────────┤`);
  console.log(`  │ Monolith            │ ${String(monoElapsed).padEnd(12)}│ ${String(throughput(workload, monoElapsed)).padEnd(15)}│`);
  console.log(`  │ Scale-Out (3 app)   │ ${String(scaleElapsed).padEnd(12)}│ ${String(throughput(workload, scaleElapsed)).padEnd(15)}│`);
  console.log(`  │ Queue + 3 workers   │ ${String(queueElapsed).padEnd(12)}│ ${String(throughput(workload, queueElapsed)).padEnd(15)}│`);
  console.log("  └─────────────────────┴──────────────┴─────────────────┘");
  console.log("");
  console.log("✅ Kiến trúc mở rộng theo thang: monolith → scale-out + LB → queue → db replica giúp tăng throughput");
})();

export {};