/**
 * 5.12.3 Side Effects — Tách IO + Dependency Injection Demo
 *
 * Side effect = thao tác ra ngoài function scope (network, DB, file, log, clock...).
 * Cách quản lý:
 *   1. Cô lập side effect vào một class/service
 *   2. Inject dependency (clock, logger, repository) → core logic giữ pure
 *   3. Test bằng fake dependency, không cần chạm IO thật
 *
 * KHÔNG gọi fetch/DB thật — mô phỏng bằng interface + fake.
 */

// ─────────────────────────── Abstractions (ports) ───────────────────────────

interface SideEffectClock {
  now(): number;
}

interface SideEffectLogger {
  info(message: string): void;
}

interface SideEffectRepo {
  save(record: SideEffectRecord): void;
  all(): SideEffectRecord[];
}

interface SideEffectRecord {
  id: string;
  total: number;
  createdAt: number;
}

// ─────────────────────────── Adapters (IO thật) ───────────────────────────

class SystemClock implements SideEffectClock {
  now(): number {
    return Date.now(); // side effect: đọc thời gian hệ thống
  }
}

class ConsoleLogger implements SideEffectLogger {
  info(message: string): void {
    console.log(`     [io-log] ${message}`); // side effect: ghi ra console
  }
}

class InMemoryRepo implements SideEffectRepo {
  private records: SideEffectRecord[] = [];

  save(record: SideEffectRecord): void {
    this.records.push(record);
  }

  all(): SideEffectRecord[] {
    return [...this.records];
  }
}

// ─────────────────────────── Core logic (pure) ───────────────────────────

interface SideEffectOrderInput {
  id: string;
  unitPrice: number;
  qty: number;
}

// Pure: chỉ tính toán từ input
function computeOrderTotal(input: SideEffectOrderInput, taxRate: number): number {
  return input.unitPrice * input.qty * (1 + taxRate);
}

// Service — phụ thuộc abstraction, không tự gọi Date.now()/console.log/DB
class SideEffectOrderService {
  constructor(
    private readonly repo: SideEffectRepo,
    private readonly clock: SideEffectClock,
    private readonly logger: SideEffectLogger,
    private readonly taxRate: number,
  ) {}

  place(input: SideEffectOrderInput): SideEffectRecord {
    const total = computeOrderTotal(input, this.taxRate); // pure
    const record: SideEffectRecord = {
      id: input.id,
      total,
      createdAt: this.clock.now(), // effect qua abstraction
    };
    this.repo.save(record); // effect qua abstraction
    this.logger.info(`Đã lưu order ${record.id} total=${record.total}`); // effect qua abstraction
    return record;
  }
}

// ─────────────────────────── Fake cho test (không IO) ───────────────────────────

class FixedClock implements SideEffectClock {
  constructor(private readonly fixed: number) {}
  now(): number {
    return this.fixed;
  }
}

class SilentLogger implements SideEffectLogger {
  messages: string[] = [];
  info(message: string): void {
    this.messages.push(message); // chỉ ghi vào mảng — không in ra
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Side Effects Demo ===");
  console.log("");

  console.log("1️⃣ Core logic thuần — không IO, chỉ tính:");
  const input: SideEffectOrderInput = { id: "o-1", unitPrice: 100, qty: 3 };
  console.log(`  computeOrderTotal(${JSON.stringify(input)}, 0.1) = ${computeOrderTotal(input, 0.1)}`);
  console.log("");

  console.log("2️⃣ Production — inject adapter IO thật:");
  const prodRepo = new InMemoryRepo();
  const prodService = new SideEffectOrderService(prodRepo, new SystemClock(), new ConsoleLogger(), 0.1);
  const prodRecord = prodService.place(input);
  console.log(`  record=${JSON.stringify(prodRecord)} (createdAt lấy từ hệ thống)`);
  console.log("");

  console.log("3️⃣ Test — thay clock/logger/repo bằng fake, KHÔNG chạm IO:");
  const fakeRepo = new InMemoryRepo();
  const fakeLogger = new SilentLogger();
  const testService = new SideEffectOrderService(fakeRepo, new FixedClock(1_700_000_000_000), fakeLogger, 0.1);
  const testRecord = testService.place({ id: "o-2", unitPrice: 50, qty: 2 });
  console.log(`  record=${JSON.stringify(testRecord)} (createdAt cố định → deterministic)`);
  console.log(`  logger messages (chỉ trong bộ nhớ): ${JSON.stringify(fakeLogger.messages)}`);
  console.log(`  repo.all().length = ${fakeRepo.all().length}`);
  console.log("");

  console.log("4️⃣ So sánh — cùng logic, khác cách inject effect:");
  console.log(`  prod createdAt = ${prodRecord.createdAt} (biến động)`);
  console.log(`  test createdAt = ${testRecord.createdAt} (cố định 1700000000000)`);
  console.log("");

  console.log("✅ Side effects: cô lập IO sau abstraction + inject dependency → core thuần, test không cần IO thật");
}

run();
export {};