/**
 * 5.1 Testing Techniques — Tổng quan các kỹ thuật kiểm thử
 *
 * Demo TS thuần tự chứa: tự viết mini test-runner
 * (record + assertEqual / assertThrows), KHÔNG cần framework ngoài.
 *
 * Chạy: npx ts-node examples/index.ts
 *
 * Nội dung:
 * 1. Unit Testing   → MathUtils, StringUtils
 * 2. Integration    → MockDatabase + HttpClient (mock)
 * 3. TDD            → Calculator (mini: Red-Green-Refactor)
 * 4. Mock Patterns  → Spy, Stub, async mock
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
    if (this.failed > 0) console.log(`  ⚠️  ${this.failed} test thất bại`);
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

// ────────────────────────── Bị test (SUT) ─────────────────────────────

class MathUtils {
  add(a: number, b: number): number {
    return a + b;
  }
  subtract(a: number, b: number): number {
    return a - b;
  }
  multiply(a: number, b: number): number {
    return a * b;
  }
  divide(a: number, b: number): number {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }
}

class StringUtils {
  reverse(str: string): string {
    return str.split("").reverse().join("");
  }
  isPalindrome(str: string): boolean {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("");
  }
  truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
  }
}

class MockDatabase {
  private data = new Map<string, unknown>();

  insert(key: string, value: unknown): void {
    this.data.set(key, value);
  }
  query<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
  delete(key: string): boolean {
    return this.data.delete(key);
  }
  getAll(): unknown[] {
    return Array.from(this.data.values());
  }
}

class HttpClient {
  async fetch(url: string): Promise<{ status: number; data: unknown }> {
    return { status: 200, data: { url } };
  }
}

class Calculator {
  private history: number[] = [];

  add(n: number): number {
    this.history.push(n);
    return this.history.reduce((acc, v) => acc + v, 0);
  }
  clear(): void {
    this.history = [];
  }
  getHistory(): number[] {
    return [...this.history];
  }
}

// ────────────────────────── Spy / Stub ────────────────────────────────

class InsertSpy {
  readonly calls: Array<[string, unknown]> = [];

  constructor(private db: MockDatabase) {}

  insert(key: string, value: unknown): void {
    this.calls.push([key, value]);
    this.db.insert(key, value);
  }

  calledWith(key: string, value: unknown): boolean {
    return this.calls.some(([k, v]) => k === key && JSON.stringify(v) === JSON.stringify(value));
  }
}

class QueryStub extends MockDatabase {
  private canned: unknown = null;

  stubWith(value: unknown): void {
    this.canned = value;
  }
  query<T>(_key: string): T | undefined {
    return this.canned as T | undefined;
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

async function runAll(): Promise<void> {
  console.log("=== 5.1 Testing Techniques Demo (mini test-runner tự chứa) ===\n");

  // 1️⃣ Unit Testing
  const unit = new MiniTestRunner("1️⃣ Unit Testing — MathUtils / StringUtils");
  unit.record("add: 2 + 3 = 5", () => assertEqual(new MathUtils().add(2, 3), 5));
  unit.record("subtract: 10 - 4 = 6", () => assertEqual(new MathUtils().subtract(10, 4), 6));
  unit.record("multiply: 3 * 4 = 12", () => assertEqual(new MathUtils().multiply(3, 4), 12));
  unit.record("divide: 15 / 3 = 5", () => assertEqual(new MathUtils().divide(15, 3), 5));
  unit.record("divide by zero → throw", () =>
    assertThrows(() => new MathUtils().divide(10, 0), "Division by zero"));
  unit.record('reverse("hello") = "olleh"', () =>
    assertEqual(new StringUtils().reverse("hello"), "olleh"));
  unit.record('isPalindrome("racecar") = true', () =>
    assertTrue(new StringUtils().isPalindrome("racecar")));
  unit.record('isPalindrome("hello") = false', () =>
    assertTrue(!new StringUtils().isPalindrome("hello")));
  unit.record('truncate("Hello World", 5) = "Hello..."', () =>
    assertEqual(new StringUtils().truncate("Hello World", 5), "Hello..."));
  unit.record('truncate("Hi", 5) giữ nguyên', () =>
    assertEqual(new StringUtils().truncate("Hi", 5), "Hi"));
  await unit.run();

  // 2️⃣ Integration Testing
  const integ = new MiniTestRunner("2️⃣ Integration Testing — Mock DB / API");
  integ.record("insert & retrieve data (DB)", () => {
    const db = new MockDatabase();
    db.insert("user1", { name: "Alice", age: 30 });
    db.insert("user2", { name: "Bob", age: 25 });
    assertEqual(db.query<{ name: string; age: number }>("user1"), { name: "Alice", age: 30 });
    assertEqual(db.getAll().length, 2);
  });
  integ.record("delete removes data (DB)", () => {
    const db = new MockDatabase();
    db.insert("item1", { value: 100 });
    assertTrue(db.delete("item1"));
    assertEqual(db.query("item1"), undefined);
  });
  integ.record("HTTP client trả về response (API)", async () => {
    const client = new HttpClient();
    const res = await client.fetch("/api/users/1");
    assertEqual(res.status, 200);
    assertEqual(res.data, { url: "/api/users/1" });
  });
  await integ.run();

  // 3️⃣ TDD — Calculator
  const tdd = new MiniTestRunner("3️⃣ TDD — Calculator (test trước, code sau)");
  tdd.record("trạng thái ban đầu = 0", () => {
    const c = new Calculator();
    assertEqual(c.add(0), 0);
  });
  tdd.record("cộng 1 lần", () => {
    const c = new Calculator();
    assertEqual(c.add(5), 5);
  });
  tdd.record("cộng nhiều lần = tổng dồn", () => {
    const c = new Calculator();
    c.add(3);
    c.add(4);
    assertEqual(c.add(5), 12);
  });
  tdd.record("theo dõi lịch sử", () => {
    const c = new Calculator();
    c.add(2);
    c.add(3);
    assertEqual(c.getHistory(), [2, 3]);
  });
  tdd.record("clear đặt lại bộ đếm", () => {
    const c = new Calculator();
    c.add(10);
    c.clear();
    assertEqual(c.add(5), 5);
    assertEqual(c.getHistory(), [5]);
  });
  await tdd.run();

  // 4️⃣ Mock Patterns
  const mock = new MiniTestRunner("4️⃣ Mock Patterns — Spy / Stub / async mock");
  mock.record("spy theo dõi insert — đếm lời gọi & đối số", () => {
    const db = new MockDatabase();
    const spy = new InsertSpy(db);
    spy.insert("key1", "value1");
    spy.insert("key2", "value2");
    assertEqual(spy.calls.length, 2);
    assertTrue(spy.calledWith("key1", "value1"));
    assertTrue(spy.calledWith("key2", "value2"));
  });
  mock.record("stub trả về giá trị cố định", () => {
    const stub = new QueryStub();
    stub.stubWith({ stubbed: true });
    assertEqual(stub.query("any-key"), { stubbed: true });
  });
  mock.record("async mock — Promise resolved với dữ liệu giả", async () => {
    const client = new HttpClient();
    const mockFetch = async (url: string): Promise<{ success: boolean; count: number }> => {
      void url;
      return { success: true, count: 42 };
    };
    const callResult = await mockFetch("/api/data");
    assertEqual(callResult, { success: true, count: 42 });
    void client;
  });
  await mock.run();

  console.log("\n✅ Testing Techniques Demo hoàn tất — tất cả nhóm test đã thực thi (mini runner tự chứa, không cần framework).");
}

void runAll();

export {};