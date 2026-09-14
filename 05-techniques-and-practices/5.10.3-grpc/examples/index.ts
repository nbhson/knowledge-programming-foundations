/**
 * 5.10.3 gRPC — Service Definition + Unary/Streaming Demo
 *
 * Mô phỏng gRPC bằng TS thuần:
 *   - Service definition dạng proto string
 *   - MiniGrpcServer: đăng ký handler (unary + server-streaming)
 *   - MiniGrpcChannel: gọi request/response như gRPC client
 *
 * KHÔNG dùng @grpc/grpc-js/protobuf — chỉ mô phỏng binary transport.
 */

// ─────────────────────────── Proto service definition ───────────────────────────

const PROTO_SOURCE = `
syntax = "proto3";

service BookService {
  rpc GetBook (GetBookRequest) returns (Book);
  rpc ListBooks (ListBooksRequest) returns (BookList);
  rpc WatchBooks (WatchRequest) returns (stream Book);   // server-streaming
}

message GetBookRequest  { string id = 1; }
message ListBooksRequest { int32 limit = 1; }
message WatchRequest     { string topic = 1; }
message Book {
  string id = 1;
  string title = 2;
  string author = 3;
}
message BookList { repeated Book books = 1; }
`.trim();

// ─────────────────────────── Dữ liệu mẫu ───────────────────────────

interface MiniGrpcBook {
  id: string;
  title: string;
  author: string;
}

const MiniGrpcBooks: MiniGrpcBook[] = [
  { id: "1", title: "Clean Code", author: "Robert C. Martin" },
  { id: "2", title: "Refactoring", author: "Martin Fowler" },
  { id: "3", title: "Design Patterns", author: "GoF" },
];

// ─────────────────────────── Mini gRPC Server ───────────────────────────

type MiniGrpcHandler = (request: Record<string, unknown>) => unknown;

class MiniGrpcServer {
  private services = new Map<string, MiniGrpcHandler>();

  registerService(serviceName: string, handlers: Record<string, MiniGrpcHandler>): void {
    console.log(`  🧩 Service '${serviceName}' đăng ký các RPC:`);
    for (const [method, handler] of Object.entries(handlers)) {
      this.services.set(`${serviceName}.${method}`, handler);
      console.log(`     • rpc ${method}`);
    }
  }

  findHandler(service: string, method: string): MiniGrpcHandler | undefined {
    return this.services.get(`${service}.${method}`);
  }
}

// ─────────────────────────── Mini gRPC Channel ───────────────────────────

class MiniGrpcChannel {
  constructor(private readonly server: MiniGrpcServer, private readonly address: string) {}

  // Unary call: 1 request → 1 response
  unary(service: string, method: string, request: Record<string, unknown>): unknown {
    const handler = this.getHandler(service, method);
    console.log(`  🗣️  ${this.address}: unary ${service}.${method}(${JSON.stringify(request)})`);
    const response = handler(request);
    console.log(`  📥 response: ${JSON.stringify(response)}`);
    return response;
  }

  // Server-streaming call: 1 request → nhiều response
  serverStream(service: string, method: string, request: Record<string, unknown>): void {
    const handler = this.getHandler(service, method);
    const stream = handler(request) as unknown[];
    console.log(`  🗣️  ${this.address}: server-stream ${service}.${method}(topic=${String(request.topic)})`);
    for (const item of stream) {
      console.log(`     📦 stream event: ${JSON.stringify(item)}`);
    }
  }

  private getHandler(service: string, method: string): MiniGrpcHandler {
    const found = this.server.findHandler(service, method);
    if (!found) throw new Error(`RPC ${service}.${method} không tồn tại`);
    return found;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== MiniGrpcChannel Demo ===");
  console.log("");

  console.log("1️⃣ Proto service definition:");
  console.log(PROTO_SOURCE.split("\n").map((l) => `   ${l}`).join("\n"));
  console.log("");

  const server = new MiniGrpcServer();
  server.registerService("BookService", {
    GetBook: (req) => MiniGrpcBooks.find((b) => b.id === String(req.id)) ?? { error: "NOT_FOUND" },
    ListBooks: (req) => {
      const limit = typeof req.limit === "number" ? req.limit : MiniGrpcBooks.length;
      return { books: MiniGrpcBooks.slice(0, limit) };
    },
    WatchBooks: (req) => {
      const topic = String(req.topic);
      return MiniGrpcBooks.filter((b) => b.title.includes(topic) || topic === "all").map((b) => ({
        ...b,
        event: "book.updated",
      }));
    },
  });
  console.log("");

  const channel = new MiniGrpcChannel(server, "localhost:50051");

  console.log("2️⃣ Unary GetBook — 1 request, 1 response:");
  channel.unary("BookService", "GetBook", { id: "2" });
  console.log("");

  console.log("3️⃣ Unary ListBooks với argument limit=2:");
  channel.unary("BookService", "ListBooks", { limit: 2 });
  console.log("");

  console.log("4️⃣ Server-streaming WatchBooks — nhiều message về 1 request:");
  channel.serverStream("BookService", "WatchBooks", { topic: "all" });
  console.log("");

  console.log("✅ gRPC: proto định nghĩa contract + unary/server-streaming RPC trên 1 channel");
}

run();
export {};