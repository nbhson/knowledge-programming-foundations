/**
 * 5.1.2 Integration Testing — Kiểm thử nhiều thành phần hoạt động cùng nhau
 *
 * Demo TS thuần tự chứa: mini test-runner (record + assertEqual/assertThrows),
 * KHÔNG dùng framework ngoài; dùng DB trong bộ nhớ (in-memory) để mô phỏng.
 * 1. User API + Database   — create/get/update/delete, ràng buộc email
 * 2. Service + Repository  — OrderService + OrderRepository
 * 3. REST CRUD cycle       — mô phỏng HTTP handler với status code
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

// ────────────────────────── 1. User API + "Database" ──────────────────

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Giả lập DB trong bộ nhớ + API layer — tích hợp 2 thành phần */
class UserApi {
  private users: User[] = [];
  private nextId = 1;

  reset(): void {
    this.users = [];
    this.nextId = 1;
  }

  async createUser(name: string, email: string): Promise<User> {
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    if (this.users.some((u) => u.email === email)) throw new Error("Email already exists");
    const user: User = { id: this.nextId++, name, email, createdAt: new Date() };
    this.users.push(user);
    return user;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async updateUserEmail(id: number, email: string): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) throw new Error("User not found");
    if (!EMAIL_RE.test(email)) throw new Error("Invalid email");
    user.email = email;
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }
}

// ───────────────────── 2. Service + Repository ────────────────────────

interface Order {
  id: number;
  userId: number;
  total: number;
  status: "pending" | "confirmed" | "shipped";
}

class OrderRepository {
  private orders: Order[] = [];
  private nextId = 1;

  async create(order: Omit<Order, "id">): Promise<Order> {
    const orderWithId: Order = { ...order, id: this.nextId++ };
    this.orders.push(orderWithId);
    return orderWithId;
  }

  async findById(id: number): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }
}

class OrderService {
  constructor(private repo: OrderRepository) {}

  async placeOrder(userId: number, total: number): Promise<Order> {
    if (total <= 0) throw new Error("Order total must be positive");
    return this.repo.create({ userId, total, status: "pending" });
  }

  async confirmOrder(orderId: number): Promise<Order> {
    const order = await this.repo.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order cannot be confirmed");
    order.status = "confirmed";
    return order;
  }
}

// ───────────────────── 3. REST CRUD cycle ─────────────────────────────

interface HttpResponse {
  status: number;
  body: unknown;
}

/** Mô phỏng REST controller nhúng trực tiếp UserApi + OrderService */
class RestServer {
  constructor(
    private users: UserApi,
    private orders: OrderService,
  ) {}

  // POST /api/users
  async handleCreateUser(body: { name: string; email: string }): Promise<HttpResponse> {
    try {
      const user = await this.users.createUser(body.name, body.email);
      return { status: 201, body: user };
    } catch (err) {
      return { status: 400, body: { error: err instanceof Error ? err.message : "Bad request" } };
    }
  }

  // GET /api/users/:id
  async handleGetUser(id: number): Promise<HttpResponse> {
    const user = await this.users.findUserById(id);
    return user ? { status: 200, body: user } : { status: 404, body: { error: "Not found" } };
  }

  // POST /api/orders
  async handleCreateOrder(body: { userId: number; total: number }): Promise<HttpResponse> {
    try {
      const order = await this.orders.placeOrder(body.userId, body.total);
      return { status: 201, body: order };
    } catch (err) {
      return { status: 400, body: { error: err instanceof Error ? err.message : "Bad request" } };
    }
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

async function runAll(): Promise<void> {
  console.log("=== 5.1.2 Integration Testing Demo (mini test-runner tự chứa) ===\n");

  const userGroup = new MiniTestRunner("1️⃣ User API + Database");
  userGroup.record("tạo → truy vấn lại toàn bộ luồng", async () => {
    const api = new UserApi();
    const created = await api.createUser("John Doe", "john@example.com");
    const retrieved = await api.findUserById(created.id);
    assertTrue(retrieved !== null);
    assertEqual(retrieved && retrieved.name, "John Doe");
    assertEqual(retrieved && retrieved.email, "john@example.com");
    assertEqual(retrieved && retrieved.id, created.id);
  });
  userGroup.record("email trùng → từ chối", async () => {
    const api = new UserApi();
    await api.createUser("John", "john@example.com");
    await assertRejects(() => api.createUser("Jane", "john@example.com"), "Email already exists");
  });
  userGroup.record("email sai định dạng → từ chối", async () => {
    const api = new UserApi();
    await assertRejects(() => api.createUser("John", "invalid-email"), "Invalid email");
  });
  userGroup.record("update email + delete hoạt động phối hợp", async () => {
    const api = new UserApi();
    const user = await api.createUser("Tom", "tom@example.com");
    const updated = await api.updateUserEmail(user.id, "tom@new.com");
    assertEqual(updated.email, "tom@new.com");
    assertTrue(await api.deleteUser(user.id));
    assertEqual(await api.findUserById(user.id), null);
  });
  await userGroup.run();

  const orderGroup = new MiniTestRunner("2️⃣ Service + Repository");
  orderGroup.record("placeOrder → confirmOrder liền mạch", async () => {
    const svc = new OrderService(new OrderRepository());
    const order = await svc.placeOrder(1, 150000);
    assertEqual(order.status, "pending");
    const confirmed = await svc.confirmOrder(order.id);
    assertEqual(confirmed.status, "confirmed");
  });
  orderGroup.record("total âm → từ chối", async () => {
    const svc = new OrderService(new OrderRepository());
    await assertRejects(() => svc.placeOrder(1, -100), "Order total must be positive");
  });
  orderGroup.record("không confirm đơn đã confirm", async () => {
    const svc = new OrderService(new OrderRepository());
    const order = await svc.placeOrder(1, 100000);
    await svc.confirmOrder(order.id);
    await assertRejects(() => svc.confirmOrder(order.id), "Order cannot be confirmed");
  });
  await orderGroup.run();

  const restGroup = new MiniTestRunner("3️⃣ REST CRUD cycle");
  restGroup.record("POST /api/users → 201, GET /api/users/1 → 200", async () => {
    const api = new UserApi();
    const svc = new OrderService(new OrderRepository());
    const server = new RestServer(api, svc);
    const create = await server.handleCreateUser({ name: "Product A", email: "a@b.com" });
    assertEqual(create.status, 201);
    const get = await server.handleGetUser((create.body as User).id);
    assertEqual(get.status, 200);
    assertEqual((get.body as User).email, "a@b.com");
  });
  restGroup.record("POST email trùng → 400", async () => {
    const api = new UserApi();
    const svc = new OrderService(new OrderRepository());
    const server = new RestServer(api, svc);
    await server.handleCreateUser({ name: "A", email: "dup@b.com" });
    const create = await server.handleCreateUser({ name: "B", email: "dup@b.com" });
    assertEqual(create.status, 400);
  });
  restGroup.record("POST đơn hàng total âm → 400", async () => {
    const api = new UserApi();
    const svc = new OrderService(new OrderRepository());
    const server = new RestServer(api, svc);
    const res = await server.handleCreateOrder({ userId: 1, total: -50 });
    assertEqual(res.status, 400);
  });
  await restGroup.run();

  console.log("\n✅ Integration testing Demo hoàn tất — nhiều component (API + DB + Service) phối hợp đúng như kỳ vọng.");
}

void runAll();

export {};