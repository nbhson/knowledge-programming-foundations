/**
 * 5.1.1 Unit Testing — Kiểm thử từng đơn vị nhỏ nhất trong cô lập
 *
 * Demo TS thuần tự chứa: mini test-runner (record + assertEqual/assertThrows),
 * KHÔNG dùng framework ngoài. Minh họa 3 kiểu unit test:
 * 1. Pure function — calculateDiscount
 * 2. Mock dependency — UserService + FakeUserRepo
 * 3. Class với nhiều method — Cart
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ────────────────────────── Mini Test Runner ──────────────────────────

type MiniTestFn = () => void | Promise<void>;

class MiniTestRunner {
  private tests: Array<{ name: string; fn: MiniTestFn }> = [];
  private passed = 0;
  private failed = 0;

  constructor(private group: string) {}

  record(name: string, fn: MiniTestFn): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    console.log(`\n── ${this.group} ──`);
    for (const t of this.tests) {
      try {
        await t.fn();
        this.passed++;
        console.log(`  ✅ PASS  ${t.name}`);
      } catch (err) {
        this.failed++;
        console.log(`  ❌ FAIL  ${t.name}`);
        console.log(`      └─ ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`  ── Kết quả: ${this.passed} passed / ${this.tests.length} total ──`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg = ""): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg} ⇒ expect ${b}, got ${a}`);
}

function assertTrue(actual: boolean, msg = ""): void {
  if (actual !== true) throw new Error(`${msg} ⇒ expect true, got ${actual}`);
}

function assertThrows(fn: () => unknown, expectedMsg = ""): void {
  try {
    fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (expectedMsg === "" || msg.includes(expectedMsg)) return;
    throw new Error(`⇒ expect error contains "${expectedMsg}", got "${msg}"`);
  }
  throw new Error("⇒ expect function to throw, but it did not");
}

async function assertRejects(fn: () => Promise<unknown>, expectedMsg = ""): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (expectedMsg === "" || msg.includes(expectedMsg)) return;
    throw new Error(`⇒ expect rejection contains "${expectedMsg}", got "${msg}"`);
  }
  throw new Error("⇒ expect promise to reject, but it did not");
}

// ────────────────────────── 1. Pure function ──────────────────────────

function calculateDiscount(price: number, percentage: number): number {
  if (price < 0) throw new Error("Price cannot be negative");
  if (percentage < 0 || percentage > 100) throw new Error("Percentage must be 0-100");
  return price * (1 - percentage / 100);
}

// ──────────────────────── 2. Mock dependency ──────────────────────────

interface UserRecord {
  id: number;
  name: string;
  email: string;
}

interface UserRepository {
  findById(id: number): Promise<UserRecord | null>;
  save(user: UserRecord): Promise<void>;
}

class FakeUserRepo implements UserRepository {
  private nextFindResult: UserRecord | null = null;
  readonly findByIdArgs: number[] = [];
  readonly saveArgs: UserRecord[] = [];

  mockFind(result: UserRecord | null): void {
    this.nextFindResult = result;
  }

  async findById(id: number): Promise<UserRecord | null> {
    this.findByIdArgs.push(id);
    return this.nextFindResult;
  }

  async save(user: UserRecord): Promise<void> {
    this.saveArgs.push(user);
  }
}

class UserService {
  constructor(private repo: UserRepository) {}

  async getUser(id: number): Promise<UserRecord> {
    const user = await this.repo.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  async updateUser(id: number, updates: Partial<Pick<UserRecord, "name" | "email">>): Promise<UserRecord> {
    const user = await this.getUser(id);
    const updated = { ...user, ...updates };
    await this.repo.save(updated);
    return updated;
  }
}

// ─────────────────────── 3. Class nhiều method ─────────────────────────

class Cart {
  private items: Array<{ name: string; price: number; qty: number }> = [];

  addItem(name: string, price: number, qty: number = 1): void {
    if (price < 0 || qty < 0) throw new Error("Invalid price or quantity");
    this.items.push({ name, price, qty });
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.qty, 0);
  }

  clear(): void {
    this.items = [];
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

async function runAll(): Promise<void> {
  console.log("=== 5.1.1 Unit Testing Demo (mini test-runner tự chứa) ===\n");

  const pure = new MiniTestRunner("1️⃣ Pure function — calculateDiscount");
  pure.record("100 với discount 20% = 80", () => assertEqual(calculateDiscount(100, 20), 80));
  pure.record("discount 0% giữ nguyên giá", () => assertEqual(calculateDiscount(100, 0), 100));
  pure.record("discount 100% = 0", () => assertEqual(calculateDiscount(100, 100), 0));
  pure.record("price âm → throw", () =>
    assertThrows(() => calculateDiscount(-10, 10), "Price cannot be negative"));
  pure.record("percentage > 100 → throw", () =>
    assertThrows(() => calculateDiscount(100, 150), "Percentage must be 0-100"));
  await pure.run();

  const mock = new MiniTestRunner("2️⃣ Mock dependency — UserService + FakeUserRepo");
  mock.record("tìm thấy user → trả về đúng", async () => {
    const repo = new FakeUserRepo();
    const svc = new UserService(repo);
    const mockUser = { id: 1, name: "John", email: "john@test.com" };
    repo.mockFind(mockUser);
    const result = await svc.getUser(1);
    assertEqual(result, mockUser);
    assertEqual(repo.findByIdArgs, [1]);
  });
  mock.record("không tìm thấy → throw", async () => {
    const repo = new FakeUserRepo();
    const svc = new UserService(repo);
    repo.mockFind(null);
    await assertRejects(() => svc.getUser(999), "User not found");
  });
  mock.record("updateUser merge dữ liệu & lưu qua repo", async () => {
    const repo = new FakeUserRepo();
    const svc = new UserService(repo);
    repo.mockFind({ id: 1, name: "John", email: "john@test.com" });
    const result = await svc.updateUser(1, { name: "Jane" });
    assertEqual(result, { id: 1, name: "Jane", email: "john@test.com" });
    assertEqual(repo.saveArgs, [{ id: 1, name: "Jane", email: "john@test.com" }]);
  });
  await mock.run();

  const cartGroup = new MiniTestRunner("3️⃣ Class — Cart");
  cartGroup.record("khởi tạo rỗng", () => {
    const cart = new Cart();
    assertEqual(cart.getTotal(), 0);
    assertEqual(cart.getItemCount(), 0);
  });
  cartGroup.record("tính tổng tiền & số lượng đúng", () => {
    const cart = new Cart();
    cart.addItem("Apple", 1000, 2);
    cart.addItem("Banana", 500, 3);
    assertEqual(cart.getTotal(), 3500);
    assertEqual(cart.getItemCount(), 5);
  });
  cartGroup.record("giá âm → throw", () => {
    const cart = new Cart();
    assertThrows(() => cart.addItem("Item", -100), "Invalid price or quantity");
  });
  cartGroup.record("clear làm rỗng giỏ", () => {
    const cart = new Cart();
    cart.addItem("Item", 100);
    cart.clear();
    assertEqual(cart.getTotal(), 0);
    assertEqual(cart.getItemCount(), 0);
  });
  await cartGroup.run();

  console.log("\n✅ Tất cả unit test đều cô lập — không phụ thuộc DB/API thật, chạy nhanh & deterministic.");
}

void runAll();

export {};