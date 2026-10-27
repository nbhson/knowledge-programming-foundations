/**
 * 11.2 REST API Design - CRUD Server + Client Demo
 *
 * Mô phỏng một REST server (routes + handler + status code) và
 * một client gọi API theo đúng chuẩn RESTful:
 *
 *   GET    /api/users      → danh sách (200)
 *   POST   /api/users      → tạo mới (201)
 *   GET    /api/users/:id  → chi tiết (200 / 404)
 *   PATCH  /api/users/:id  → cập nhật một phần (200)
 *   DELETE /api/users/:id  → xóa (204 / 404)
 *
 * KHÔNG dùng express/fetch thật — tự viết router + handler bằng TS thuần.
 */

// ─────────────────────────── Kiểu dữ liệu ───────────────────────────

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data: T | null;
  meta: Record<string, number | string> | null;
  error: ApiError | null;
}

// ─────────────────────────── REST Server ───────────────────────────

type Handler = (params: Record<string, string>, body?: Record<string, unknown>, query?: URLSearchParams) => ApiResponse<unknown>;

class RestServer {
  private routes = new Map<string, Handler>();

  private key(method: HttpMethod, path: string): string {
    return `${method} ${path}`;
  }

  get(path: string, handler: Handler): void {
    this.routes.set(this.key("GET", path), handler);
  }

  post(path: string, handler: Handler): void {
    this.routes.set(this.key("POST", path), handler);
  }

  patch(path: string, handler: Handler): void {
    this.routes.set(this.key("PATCH", path), handler);
  }

  delete(path: string, handler: Handler): void {
    this.routes.set(this.key("DELETE", path), handler);
  }

  // Định tuyến: "GET /api/users/1" → tìm route khớp pattern, trích :id
  dispatch(method: HttpMethod, url: string, body?: Record<string, unknown>): ApiResponse<unknown> {
    const [path, queryString] = url.split("?");
    for (const [routeKey, handler] of this.routes) {
      const [routeMethod, routePath] = routeKey.split(" ");
      if (routeMethod !== method) continue;

      const params = this.match(routePath, path);
      if (params !== null) {
        const query = new URLSearchParams(queryString);
        return handler(params, body, query);
      }
    }
    return { data: null, meta: null, error: { code: "NOT_FOUND", message: `Không có route ${method} ${path}` } };
  }

  private match(routePath: string, path: string): Record<string, string> | null {
    const routeParts = routePath.split("/");
    const pathParts = path.split("/");
    if (routeParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}

// ─────────────────────────── In-memory store ───────────────────────────

const users: User[] = [];

function listUsers(): ApiResponse<unknown> {
  return { data: users, meta: { total: users.length, page: 1, limit: 100 }, error: null };
}

function getUserById(id: string): ApiResponse<unknown> {
  const user = users.find((u) => u.id === id);
  if (!user) return { data: null, meta: null, error: { code: "NOT_FOUND", message: `User ${id} không tồn tại` } };
  return { data: user, meta: null, error: null };
}

function createUser(body?: Record<string, unknown>): ApiResponse<unknown> {
  const name = body?.name;
  const email = body?.email;
  if (typeof name !== "string" || typeof email !== "string") {
    return { data: null, meta: null, error: { code: "VALIDATION_ERROR", message: "name và email là bắt buộc" } };
  }
  const user: User = { id: String(users.length + 1), name, email, createdAt: new Date().toISOString() };
  users.push(user);
  return { data: user, meta: null, error: null };
}

function patchUser(params: Record<string, string>, body?: Record<string, unknown>): ApiResponse<unknown> {
  const user = users.find((u) => u.id === params.id);
  if (!user) return { data: null, meta: null, error: { code: "NOT_FOUND", message: `User ${params.id} không tồn tại` } };
  if (typeof body?.name === "string") user.name = body.name;
  if (typeof body?.email === "string") user.email = body.email;
  return { data: user, meta: null, error: null };
}

function deleteUser(params: Record<string, string>): ApiResponse<unknown> {
  const index = users.findIndex((u) => u.id === params.id);
  if (index === -1) return { data: null, meta: null, error: { code: "NOT_FOUND", message: `User ${params.id} không tồn tại` } };
  users.splice(index, 1);
  return { data: null, meta: null, error: null };
}

// ─────────────────────────── REST Client ───────────────────────────

class RestClient {
  constructor(private readonly server: RestServer, private readonly baseUrl: string) {}

  private async request(method: HttpMethod, path: string, body?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    const res = this.server.dispatch(method, path, body);
    console.log(`  ➡️  ${method} ${this.baseUrl}${path} ${body ? "body=" + JSON.stringify(body) : ""}`);
    const status = res.error
      ? res.error.code === "NOT_FOUND"
        ? 404
        : res.error.code === "VALIDATION_ERROR"
          ? 400
          : 500
      : method === "POST"
        ? 201
        : method === "DELETE"
          ? 204
          : 200;
    const statusText = res.error ? res.error.code : method === "POST" ? "Created" : method === "DELETE" ? "No Content" : "OK";
    console.log(`  ⬅️  ${status} ${statusText}`);
    return res;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    const res = await this.request("GET", path);
    return res as ApiResponse<T>;
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    const res = await this.request("POST", path, body);
    return res as ApiResponse<T>;
  }

  async patch<T>(path: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    const res = await this.request("PATCH", path, body);
    return res as ApiResponse<T>;
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const res = await this.request("DELETE", path);
    return res as ApiResponse<T>;
  }
}

// ───────────────────────────────── Demo ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== REST API Demo ===");
  console.log("");

  // Cấu hình server: đăng ký CRUD routes
  const server = new RestServer();
  server.get("/api/users", listUsers);
  server.get("/api/users/:id", (params) => getUserById(params.id));
  server.post("/api/users", (_params, body) => createUser(body));
  server.patch("/api/users/:id", (params, body) => patchUser(params, body));
  server.delete("/api/users/:id", (params) => deleteUser(params));
  console.log("🖥️  Routes đã đăng ký:");
  console.log("    GET    /api/users        → list");
  console.log("    GET    /api/users/:id    → get by id");
  console.log("    POST   /api/users        → create");
  console.log("    PATCH  /api/users/:id    → update partial");
  console.log("    DELETE /api/users/:id    → delete");
  console.log("");

  // Tham chiếu server cho client
  const client = new RestClient(server, "http://localhost:3000");

  console.log("1️⃣ POST /api/users — tạo 2 users:");
  await client.post("/api/users", { name: "John", email: "john@example.com" });
  await client.post("/api/users", { name: "Jane", email: "jane@example.com" });
  console.log("");

  console.log("2️⃣ POST thiếu field — trả về 400 VALIDATION_ERROR:");
  const bad = await client.post("/api/users", { name: "NoEmail" });
  console.log(`   → error.code = ${bad.error?.code}, message = ${bad.error?.message}`);
  console.log("");

  console.log("3️⃣ GET /api/users/:id — lấy chi tiết:");
  const detail = await client.get<{ data: User }>("/api/users/1");
  const user1 = detail.data as User | null;
  console.log(`   → id=${user1?.id}, name=${user1?.name}, email=${user1?.email}`);
  console.log("");

  console.log("4️⃣ GET user không tồn tại — 404:");
  const missing = await client.get("/api/users/999");
  console.log(`   → error.code = ${missing.error?.code}`);
  console.log("");

  console.log("5️⃣ PATCH /api/users/1 — cập nhật một phần:");
  const patched = await client.patch<User>("/api/users/1", { name: "Johnny" });
  console.log(`   → name sau patch = ${(patched.data as User | null)?.name}`);
  console.log("");

  console.log("6️⃣ DELETE /api/users/2 — xóa:");
  await client.delete("/api/users/2");
  const afterDelete = await client.get<{ data: User[] }>("/api/users");
  console.log(`   → tổng users còn lại = ${(afterDelete.data as User[] | null)?.length}`);
  console.log("");

  console.log("✅ REST: resource-based URL + đúng HTTP method + status code chuẩn (200/201/204/400/404)");
}

run();
export {};