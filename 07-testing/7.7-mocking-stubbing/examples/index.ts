/**
 * 7.7 Mocking & Stubbing — Mock object viết tay
 *
 * Minh họa test doubles không cần thư viện:
 * - STUB: repository trả về dữ liệu cố định → service không phụ thuộc DB thật.
 * - MOCK: email service ghi lại calls → verify "gọi đúng 1 lần, đúng args".
 * - SPY:  bọc hàm thật, đếm số lần gọi mà vẫn giữ behavior.
 * - FAKE: in-memory DB thay thế database thật.
 */

// ──────────────────── Interface (contract) ────────────────────
interface MockUser {
  id: number;
  name: string;
  email: string;
}

interface MockUserRepository {
  findById(id: number): MockUser | null;
}

interface MockEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// ──────────────────── Service cần test ────────────────────
class MockUserService {
  constructor(
    private repo: MockUserRepository,
    private email: MockEmailService,
  ) {}

  async notifyUser(id: number): Promise<string> {
    const user = this.repo.findById(id);
    if (!user) throw new Error("User not found");
    await this.email.send(user.email, "Xin chào", `Hi ${user.name}, chào mừng bạn!`);
    return user.name;
  }
}

// ──────────────────── STUB: repo trả dữ liệu cố định ────────────────────
class MockStubUserRepository implements MockUserRepository {
  private readonly users: Record<number, MockUser> = {
    1: { id: 1, name: "John", email: "john@test.com" },
  };
  findById(id: number): MockUser | null {
    return this.users[id] ?? null;
  }
}

// ──────────────────── MOCK: email service ghi lại từng call ────────────────────
interface MockSentCall {
  to: string;
  subject: string;
  body: string;
  at: number;
}

class MockMockEmailService implements MockEmailService {
  calls: MockSentCall[] = [];
  shouldFail = false;

  async send(to: string, subject: string, body: string): Promise<void> {
    this.calls.push({ to, subject, body, at: Date.now() });
    if (this.shouldFail) throw new Error("SMTP unreachable");
  }
}

// ──────────────────── SPY: bọc hàm thật + đếm calls ────────────────────
type MockAnyFn = (...args: number[]) => number;

class MockSpy {
  private called = 0;
  private fn: MockAnyFn;

  constructor(fn: MockAnyFn) {
    this.fn = fn;
  }

  invoke(...args: number[]): number {
    this.called++;
    return this.fn(...args); // vẫn gọi logic thật
  }

  timesCalled(): number {
    return this.called;
  }
}

// ──────────────────── FAKE: in-memory DB ────────────────────
class MockFakeUserRepository implements MockUserRepository {
  private users = new Map<number, MockUser>();
  constructor() {
    this.users.set(1, { id: 1, name: "Alice", email: "alice@test.com" });
    this.users.set(2, { id: 2, name: "Bob", email: "bob@test.com" });
  }
  findById(id: number): MockUser | null {
    return this.users.get(id) ?? null;
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Mocking & Stubbing Demo ===");
console.log("Test doubles viết tay: Stub / Mock / Spy / Fake.\n");

async function runStubAndMock(): Promise<void> {
  console.log("1️⃣ STUB + MOCK:");

  const stubRepo = new MockStubUserRepository();
  const mockEmail = new MockMockEmailService();
  const service = new MockUserService(stubRepo, mockEmail);

  // Act
  const name = await service.notifyUser(1);

  // Assert bằng Mock
  const okCalledOnce = mockEmail.calls.length === 1;
  const okArgs =
    mockEmail.calls[0].to === "john@test.com" && mockEmail.calls[0].subject === "Xin chào";
  console.log(`  ✅ Name nhận về: ${name} (nhờ STUB — không cần DB thật)`);
  console.log(`  ✅ MOCK verify: send() được gọi ${mockEmail.calls.length} lần → ${okCalledOnce ? "đúng 1 lần" : "sai"}`);
  console.log(`  ✅ MOCK verify: args đúng → ${okArgs ? "yes" : "no"} (to=${mockEmail.calls[0].to}, subject=${mockEmail.calls[0].subject})`);

  // Error path: user không tồn tại → service throw, email KHÔNG được gọi
  let threw = false;
  try {
    await service.notifyUser(999);
  } catch {
    threw = true;
  }
  console.log(`  ✅ MOCK verify: user 999 → throw ${threw}, email vẫn ${mockEmail.calls.length} lần (không phát sinh)`);
}

function runSpy(): void {
  console.log("\n2️⃣ SPY: giữ behavior thật + đếm số lần gọi");
  const realAdd = (a: number, b: number) => a + b;
  const spy = new MockSpy(realAdd);

  console.log(`  Kết quả thật: spiedAdd(2,3)=${spy.invoke(2, 3)}, spiedAdd(4,5)=${spy.invoke(4, 5)}`);
  console.log(`  ✅ SPY verify: hàm thật được gọi ${spy.timesCalled()} lần (behavior vẫn nguyên vẹn)`);
}

async function runFake(): Promise<void> {
  console.log("\n3️⃣ FAKE: in-memory DB thay thế database thật");
  const fakeRepo = new MockFakeUserRepository();
  const service = new MockUserService(fakeRepo, new MockMockEmailService());

  console.log(`  ✅ FAKE findById(2).name = ${fakeRepo.findById(2)?.name} — vẫn là 1 repository hợp lệ`);
  const n = await service.notifyUser(1);
  console.log(`  ✅ FAKE + service hoạt động: notifyUser(1) → ${n}`);
}

console.time("⏱️  Demo chạy");
runStubAndMock().then(async () => {
  runSpy();
  await runFake();
  console.timeEnd("⏱️  Demo chạy");
  console.log("\n✅ Mock giúp test cô lập: nhanh, deterministic, không đụng dependency thật");
});

export {};