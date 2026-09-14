/**
 * 11.1 HTTP Basics - Request/Response Demo
 *
 * Mô phỏng HTTP request/response bằng object + hàm:
 * - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * - Status code + reason phrase (200 OK, 404 Not Found...)
 * - Headers (request + response)
 * - Body (JSON payload)
 *
 * KHÔNG dùng fetch thật — tất cả mô phỏng bằng hàm async + setTimeout.
 */

// ─────────────────────────── Hỗ trợ chung ───────────────────────────

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error",
};

interface HttpHeaders {
  get(name: string): string | undefined;
  set(name: string, value: string): void;
}

class MiniHeaders implements HttpHeaders {
  private store = new Map<string, string>();

  get(name: string): string | undefined {
    return this.store.get(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this.store.set(name.toLowerCase(), value);
  }

  toObject(): Record<string, string> {
    return Object.fromEntries(this.store.entries());
  }
}

interface MiniRequest {
  method: HttpMethod;
  url: string;
  path: string;
  query: URLSearchParams;
  headers: HttpHeaders;
  body?: Record<string, unknown>;
}

interface MiniResponse {
  status: number;
  statusText: string;
  headers: HttpHeaders;
  body?: unknown;
  json<T>(): T | undefined;
}

function createResponse(status: number, body?: unknown, headers?: HttpHeaders): MiniResponse {
  const resHeaders = headers ?? new MiniHeaders();
  if (body !== undefined && !resHeaders.get("Content-Type")) {
    resHeaders.set("Content-Type", "application/json");
  }
  return {
    status,
    statusText: STATUS_TEXT[status] ?? `Code ${status}`,
    headers: resHeaders,
    body,
    json<T>(): T | undefined {
      return body as T | undefined;
    },
  };
}

function parseRequest(method: HttpMethod, url: string, headers?: HeadersInit, body?: unknown): MiniRequest {
  const [path, queryString] = url.split("?");
  const reqHeaders = new MiniHeaders();
  for (const [k, v] of Object.entries(headers ?? {})) {
    reqHeaders.set(k, String(v));
  }
  return { method, url, path, query: new URLSearchParams(queryString), headers: reqHeaders, body: body as Record<string, unknown> | undefined };
}

type HeadersInit = Record<string, string>;

// ─────────────────────────── Server mô phỏng ───────────────────────────

// Intercept "phân lớp" — mô phỏng một server HTTP đơn giản với route handler
const serverHandler = async (req: MiniRequest): Promise<MiniResponse> => {
  // Authorization check giả lập qua header
  const auth = req.headers.get("Authorization");
  if (req.path === "/api/private" && auth !== "Bearer token-123") {
    return createResponse(401, { error: "Unauthorized" });
  }

  if (req.path === "/api/private") {
    return createResponse(200, { secret: "chỉ người có token mới xem được" });
  }

  if (req.path === "/api/users" && req.method === "GET") {
    return createResponse(200, { users: [{ id: 1, name: "Son" }] });
  }

  if (req.path === "/api/users" && req.method === "POST") {
    // 201 Created — tài nguyên được tạo
    const user = { id: 2, ...(req.body ?? {}) };
    return createResponse(201, { data: user });
  }

  if (req.path === "/api/nonexistent") {
    return createResponse(404, { error: "Không tìm thấy tài nguyên" });
  }

  return createResponse(500, { error: "Lỗi máy chủ" });
};

// ─────────────────────────── Client mô phỏng ───────────────────────────

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function miniFetch(method: HttpMethod, url: string, init?: { headers?: HeadersInit; body?: unknown }): Promise<MiniResponse> {
  const req = parseRequest(method, url, init?.headers, init?.body);
  console.log(`  ➡️  ${req.method} ${req.url}${req.body ? "  body=" + JSON.stringify(req.body) : ""}`);
  await delay(10);
  const res = await serverHandler(req);
  console.log(`  ⬅️  ${res.status} ${res.statusText}  [${res.headers.get("Content-Type") ?? "-"}]`);
  return res;
}

// ───────────────────────────────── Demo ───────────────────────────────

async function run(): Promise<void> {
  console.log("=== HTTP Basics Demo ===");
  console.log("");

  console.log("1️⃣ HTTP Methods + Status Codes:");
  await miniFetch("GET", "/api/users");
  await miniFetch("POST", "/api/users", {
    headers: { "Content-Type": "application/json" },
    body: { name: "John", email: "john@example.com" },
  });
  await miniFetch("GET", "/api/nonexistent");
  console.log("");

  console.log("2️⃣ Headers (request + response):");
  await miniFetch("GET", "/api/users", {
    headers: {
      Authorization: "Bearer token-123",
      Accept: "application/json",
      "X-Request-ID": "req-abc-123",
    },
  });
  console.log("");

  console.log("3️⃣ Authentication via header — thiếu/đúng token:");
  await miniFetch("GET", "/api/private");
  await miniFetch("GET", "/api/private", {
    headers: { Authorization: "Bearer token-123" },
  });
  console.log("");

  console.log("4️⃣ Query params — pagination:");
  const listReq = parseRequest("GET", "/api/users?page=2&limit=10");
  console.log(`  path=${listReq.path}, page=${listReq.query.get("page")}, limit=${listReq.query.get("limit")}`);
  console.log("");

  console.log("2xx = thành công, 4xx = lỗi client, 5xx = lỗi server — client dựa vào status để xử lý.");
  console.log("✅ HTTP làm nền tảng: method + URL + headers + status code để giao tiếp client-server");
}

run();
export {};