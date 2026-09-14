/**
 * 5.10.1 REST API Design — Mini Router CRUD Demo
 *
 * Mô phỏng một mini REST server: router, in-memory store,
 * status code chuẩn cho từng thao tác CRUD:
 *
 *   GET    /api/books        → 200 (danh sách)
 *   POST   /api/books        → 201 (tạo)
 *   GET    /api/books/:id    → 200 / 404
 *   PUT    /api/books/:id    → 200 (cập nhật toàn bộ)
 *   DELETE /api/books/:id    → 204 / 404
 *
 * KHÔNG dùng express/fetch — tự viết router + dispatch bằng TS thuần.
 */

// ─────────────────────────── Kiểu dữ liệu ───────────────────────────

const MINI_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;
type MiniMethod = (typeof MINI_METHODS)[number];

interface Book {
  id: string;
  title: string;
  author: string;
}

interface MiniResult {
  status: number;
  data: unknown;
}

type MiniHandler = (params: Record<string, string>, body?: Record<string, unknown>) => MiniResult;

// ─────────────────────────── Mini REST Router ───────────────────────────

class MiniRestRouter {
  private routes = new Map<string, MiniHandler>();

  private key(method: MiniMethod, path: string): string {
    return `${method} ${path}`;
  }

  register(method: MiniMethod, path: string, handler: MiniHandler): void {
    this.routes.set(this.key(method, path), handler);
  }

  // "POST /api/books" → tìm handler khớp method + pattern, trích ":id"
  dispatch(method: MiniMethod, path: string, body?: Record<string, unknown>): MiniResult {
    for (const [routeKey, handler] of this.routes) {
      const [routeMethod, routePath] = routeKey.split(" ");
      if (routeMethod !== method) continue;

      const params = this.match(routePath, path);
      if (params !== null) return handler(params, body);
    }
    return { status: 404, data: { error: `Không có route ${method} ${path}` } };
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

// ─────────────────────────── Mini REST service ───────────────────────────

class MiniBookStore {
  private books = new Map<string, Book>();
  private seq = 0;

  create(title: string, author: string): Book {
    const book: Book = { id: String(++this.seq), title, author };
    this.books.set(book.id, book);
    return book;
  }

  findAll(): Book[] {
    return [...this.books.values()];
  }

  findById(id: string): Book | undefined {
    return this.books.get(id);
  }

  update(id: string, title: string, author: string): Book | undefined {
    const book = this.books.get(id);
    if (!book) return undefined;
    book.title = title;
    book.author = author;
    return book;
  }

  remove(id: string): boolean {
    return this.books.delete(id);
  }
}

// ─────────────────────────── Handlers (resource controller) ───────────────────────────

const store = new MiniBookStore();

function handleList(_params: Record<string, string>): MiniResult {
  return { status: 200, data: store.findAll() };
}

function handleGetOne(params: Record<string, string>): MiniResult {
  const book = store.findById(params.id);
  return book ? { status: 200, data: book } : { status: 404, data: { error: `Book ${params.id} không tồn tại` } };
}

function handleCreate(_params: Record<string, string>, body?: Record<string, unknown>): MiniResult {
  const title = body?.title;
  const author = body?.author;
  if (typeof title !== "string" || typeof author !== "string") {
    return { status: 400, data: { error: "title và author là bắt buộc" } };
  }
  return { status: 201, data: store.create(title, author) };
}

function handlePut(params: Record<string, string>, body?: Record<string, unknown>): MiniResult {
  const title = body?.title;
  const author = body?.author;
  if (typeof title !== "string" || typeof author !== "string") {
    return { status: 400, data: { error: "title và author là bắt buộc" } };
  }
  const updated = store.update(params.id, title, author);
  return updated ? { status: 200, data: updated } : { status: 404, data: { error: `Book ${params.id} không tồn tại` } };
}

function handleDelete(params: Record<string, string>): MiniResult {
  return store.remove(params.id) ? { status: 204, data: null } : { status: 404, data: { error: `Book ${params.id} không tồn tại` } };
}

// ─────────────────── Phương thức HTTP → ý nghĩa REST ───────────────────

class MiniHttpSemantics {
  static describe(method: MiniMethod): string {
    switch (method) {
      case "GET":
        return "đọc (không đổi trạng thái)";
      case "POST":
        return "tạo tài nguyên mới";
      case "PUT":
        return "cập nhật toàn bộ (idempotent)";
      case "DELETE":
        return "xóa tài nguyên";
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== MiniRestRouter Demo ===");
  console.log("");

  const router = new MiniRestRouter();
  router.register("GET", "/api/books", handleList);
  router.register("GET", "/api/books/:id", handleGetOne);
  router.register("POST", "/api/books", handleCreate);
  router.register("PUT", "/api/books/:id", handlePut);
  router.register("DELETE", "/api/books/:id", handleDelete);
  console.log("🖥️  Routes đã khai báo (resource-based /api/books):");
  console.log("    GET    /api/books        → danh sách (200)");
  console.log("    GET    /api/books/:id    → chi tiết (200/404)");
  console.log("    POST   /api/books        → tạo (201)");
  console.log("    PUT    /api/books/:id    → cập nhật (200/404)");
  console.log("    DELETE /api/books/:id    → xóa (204/404)");
  console.log("");

  const show = (method: MiniMethod, path: string, body?: Record<string, unknown>): MiniResult => {
    const res = router.dispatch(method, path, body);
    console.log(`  ➡️  ${method} ${path} ${body ? JSON.stringify(body) : ""}`);
    console.log(`  ⬅️  ${res.status} → ${res.data === null ? "(no content)" : JSON.stringify(res.data)}`);
    return res;
  };

  console.log("1️⃣ POST — tạo 2 books (201):");
  show("POST", "/api/books", { title: "Clean Code", author: "Robert C. Martin" });
  show("POST", "/api/books", { title: "Refactoring", author: "Martin Fowler" });
  console.log(`   → semantic: ${MiniHttpSemantics.describe("POST")}`);
  console.log("");

  console.log("2️⃣ POST thiếu field — 400 VALIDATION:");
  const bad = show("POST", "/api/books", { title: "No Author" });
  console.log(`   → status = ${bad.status}`);
  console.log("");

  console.log("3️⃣ GET /api/books — danh sách (200):");
  show("GET", "/api/books");
  console.log("");

  console.log("4️⃣ GET /api/books/:id — chi tiết (200) + id không tồn tại (404):");
  show("GET", "/api/books/1");
  show("GET", "/api/books/999");
  console.log("");

  console.log("5️⃣ PUT /api/books/1 — cập nhật toàn bộ (200):");
  show("PUT", "/api/books/1", { title: "Clean Code (2nd Ed)", author: "Robert C. Martin" });
  console.log(`   → semantic: ${MiniHttpSemantics.describe("PUT")} (idempotent)`);
  console.log("");

  console.log("6️⃣ DELETE /api/books/2 — xóa (204):");
  show("DELETE", "/api/books/2");
  show("GET", "/api/books");
  console.log(`   → semantic: ${MiniHttpSemantics.describe("DELETE")}`);
  console.log("");

  console.log("✅ REST: resource-based URL + đúng HTTP method + status code chuẩn (200/201/204/400/404)");
}

run();
export {};