/**
 * 5.10 API Design — Overview Demo
 *
 * Minh họa tổng quan 4 phong cách thiết kế API:
 *   - REST    : resource-based, HTTP methods
 *   - GraphQL : 1 endpoint, client chọn field
 *   - gRPC    : binary protobuf, high performance
 *   - Pagination: offset vs cursor cho dữ liệu lớn
 *
 * KHÔNG dùng lib ngoài — mô phỏng bằng TS thuần.
 */

// ─────────────────────────── Catalog các API style ───────────────────────────

interface ApiStyleChoice {
  key: string;
  name: string;
  format: string;
  endpoints: string;
  caching: string;
  performance: string;
  bestFor: string;
}

interface ApiNeeds {
  caching: boolean;
  highPerformance: boolean;
  clientSelectsFields: boolean;
}

class ApiStyleCatalog {
  private readonly styles: readonly ApiStyleChoice[] = [
    {
      key: "REST",
      name: "REST",
      format: "JSON",
      endpoints: "Nhiều resource URL",
      caching: "HTTP cache tự động",
      performance: "Tốt",
      bestFor: "Public API, CRUD",
    },
    {
      key: "GraphQL",
      name: "GraphQL",
      format: "JSON",
      endpoints: "1 endpoint /graphql",
      caching: "Phức tạp",
      performance: "Tốt",
      bestFor: "Mobile app cần đúng field",
    },
    {
      key: "gRPC",
      name: "gRPC",
      format: "Protobuf (binary)",
      endpoints: "Nhiều RPC method",
      caching: "Không",
      performance: "Xuất sắc",
      bestFor: "Microservices nội bộ",
    },
  ];

  all(): readonly ApiStyleChoice[] {
    return this.styles;
  }

  // Gợi ý giao thức phù hợp dựa trên nhu cầu
  recommend(needs: ApiNeeds): string {
    if (needs.highPerformance && !needs.caching) return "gRPC";
    if (needs.clientSelectsFields) return "GraphQL";
    if (needs.caching) return "REST";
    return "REST";
  }
}

// ─────────────────────────── Mini giao dịch REST ───────────────────────────

class ApiDesignTodo {
  readonly id: number;
  title: string;
  done: boolean;

  constructor(id: number, title: string) {
    this.id = id;
    this.title = title;
    this.done = false;
  }
}

class ApiDesignStore {
  private items = new Map<number, ApiDesignTodo>();
  private seq = 0;

  create(title: string): { status: 201; data: ApiDesignTodo } {
    const todo = new ApiDesignTodo(++this.seq, title);
    this.items.set(todo.id, todo);
    return { status: 201, data: todo };
  }

  list(): { status: 200; data: ApiDesignTodo[] } {
    return { status: 200, data: [...this.items.values()] };
  }

  find(id: number): { status: 200; data: ApiDesignTodo } | { status: 404; data: null } {
    const found = this.items.get(id);
    return found ? { status: 200, data: found } : { status: 404, data: null };
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== API Design Demo ===");
  console.log("");

  console.log("1️⃣ Bảng so sánh 4 phong cách API:");
  const catalog = new ApiStyleCatalog();
  for (const s of catalog.all()) {
    console.log(`  ${s.key.padEnd(8)} | ${s.format.padEnd(18)} | ${s.endpoints.padEnd(22)} | Cache: ${s.caching.padEnd(14)} | ${s.bestFor}`);
  }
  console.log("");
  console.log("  Pagination (offset vs cursor) — dùng cho dữ liệu lớn:");
  console.log("    Offset: page/limit, skip càng sâu càng chậm");
  console.log("    Cursor: encode vị trí, ổn định với feed thay đổi");
  console.log("");

  console.log("2️⃣ Gợi ý protocol theo nhu cầu:");
  const scenarios: Array<{ need: ApiNeeds; label: string }> = [
    { label: "Microservices nội bộ, cần tốc độ cao", need: { caching: false, highPerformance: true, clientSelectsFields: false } },
    { label: "Mobile app, client tự chọn field", need: { caching: false, highPerformance: false, clientSelectsFields: true } },
    { label: "Public API, cần HTTP cache", need: { caching: true, highPerformance: false, clientSelectsFields: false } },
  ];
  for (const sc of scenarios) {
    console.log(`  • ${sc.label} → ${catalog.recommend(sc.need)}`);
  }
  console.log("");

  console.log("3️⃣ Mini REST CRUD — status code chuẩn:");
  const store = new ApiDesignStore();
  const created = store.create("Học API Design");
  console.log(`  POST /todos → ${created.status} ${created.data.title} (id=${created.data.id})`);
  const listed = store.list();
  console.log(`  GET  /todos → ${listed.status}, ${listed.data.length} item`);
  const found = store.find(created.data.id);
  console.log(`  GET  /todos/${created.data.id} → ${found.status}, done=${found.data?.done}`);
  const missing = store.find(999);
  console.log(`  GET  /todos/999 → ${missing.status} (không tồn tại)`);
  console.log("");

  console.log("✅ API Design: chọn đúng protocol cho đúng bài toán (REST/GraphQL/gRPC + pagination)");
}

run();
export {};