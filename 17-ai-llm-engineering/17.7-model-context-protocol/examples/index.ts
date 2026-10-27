/**
 * 17.7 Model Context Protocol (MCP) — mô phỏng chuẩn kết nối AI ↔ Tools/Data.
 * KHÔNG chạy MCP server thật, KHÔNG gọi API — mọi thứ là mô phỏng in-memory
 * để hiểu kiến trúc: Host → Client ↔ Server → (tools / resources / prompts).
 */

export {};

/** Loại capability mà MCP server expose */
type CapabilityKind = "tool" | "resource" | "prompt";

interface ToolDef {
  kind: "tool";
  name: string;
  description: string;
  inputSchema: Record<string, string>; // mô phỏng JSON Schema
}

interface ResourceDef {
  kind: "resource";
  name: string;
  description: string;
  uri: string;
  read(): string; // Resources = read-only data
}

interface PromptDef {
  kind: "prompt";
  name: string;
  description: string;
  template: string; // Prompts = templated interaction
  render(args: Record<string, string>): string;
}

type Capability = ToolDef | ResourceDef | PromptDef;

/** ===== MCP SERVER: expose tools/resources/prompts theo chuẩn ===== */
class McpServer {
  readonly name: string;
  private capabilities: Capability[] = [];

  constructor(name: string) {
    this.name = name;
  }

  register(cap: Capability): void {
    this.capabilities.push(cap);
  }

  /** Client gọi list_capabilities() khi bắt tay (handshake) */
  listCapabilities(): Array<{ kind: CapabilityKind; name: string; description: string }> {
    return this.capabilities.map((c) => ({ kind: c.kind, name: c.name, description: c.description }));
  }

  /** Client gọi tool: server validate scope rồi chạy */
  callTool(name: string, args: Record<string, string>): string {
    const tool = this.capabilities.find((c) => c.kind === "tool" && c.name === name);
    if (!tool || tool.kind !== "tool") return `Error: server không có tool "${name}"`;
    // Mô phỏng scoped permission: mỗi tool khai báo tham số bắt buộc
    for (const key of Object.keys(tool.inputSchema)) {
      if (!(key in args)) return `Error: thiếu tham số "${key}" theo schema`;
    }
    return this.runTool(name, args);
  }

  private runTool(name: string, args: Record<string, string>): string {
    if (name === "lookup_order") {
      const orders: Record<string, string> = { A1: "đã giao", A2: "đang vận chuyển" };
      return orders[args.id] ?? `không tìm thấy đơn ${args.id}`;
    }
    if (name === "calc") {
      const expr = (args.expression ?? "").trim();
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) return "Error: biểu thức không hợp lệ";
      return String(Function(`"use strict"; return (${expr});`)() as number);
    }
    return "Error: tool chưa được cài đặt trong demo";
  }

  /** Client đọc resource (read-only) */
  readResource(uri: string): string {
    const res = this.capabilities.find((c) => c.kind === "resource" && c.uri === uri);
    if (res && res.kind === "resource") return res.read();
    return `Error: không có resource ${uri}`;
  }
}

/** ===== MCP HOST + CLIENT: app (IDE/chatbot) kết nối nhiều server qua chuẩn chung ===== */
class McpClient {
  private servers: McpServer[] = [];

  connect(server: McpServer): void {
    this.servers.push(server);
  }

  /** Gom capabilities của TẤT CẢ server — client không cần biết từng server API riêng */
  listAllCapabilities(): string[] {
    return this.servers.flatMap((s) =>
      s.listCapabilities().map((c) => `[${s.name}] ${c.kind}:${c.name} — ${c.description}`),
    );
  }

  /** "Agent" chọn server+tool rồi gọi — cùng 1 protocol cho mọi server */
  invoke(serverName: string, tool: string, args: Record<string, string>): string {
    const server = this.servers.find((s) => s.name === serverName);
    if (!server) return `Error: chưa connect server "${serverName}"`;
    return server.callTool(tool, args);
  }

  read(serverName: string, uri: string): string {
    const server = this.servers.find((s) => s.name === serverName);
    return server ? server.readResource(uri) : `Error: chưa connect "${serverName}"`;
  }
}

function main(): void {
  console.log("=== 17.7 Model Context Protocol (MCP) Demo (mô phỏng) ===");
  console.log("");

  // 1. MCP Server định nghĩa 3 loại capability
  const companyServer = new McpServer("company-tools");
  companyServer.register({
    kind: "tool",
    name: "lookup_order",
    description: "Tra cứu trạng thái đơn hàng",
    inputSchema: { id: "string" },
  });
  companyServer.register({
    kind: "tool",
    name: "calc",
    description: "Tính biểu thức số học",
    inputSchema: { expression: "string" },
  });
  companyServer.register({
    kind: "resource",
    name: "return-policy",
    description: "Chính sách hoàn tiền (read-only)",
    uri: "docs://policy/return",
    read: () => "Hoàn tiền trong 30 ngày kể từ ngày nhận hàng.",
  });
  companyServer.register({
    kind: "prompt",
    name: "support-reply",
    description: "Template trả lời khách",
    template: "Bạn là CSKH. Dựa trên chính sách: {policy}. Trả lời câu hỏi: {question}",
    render: (args) => args.template.replace("{policy}", args.policy).replace("{question}", args.question),
  });
  console.log("1. MCP Server 'company-tools' expose capabilities:");
  for (const c of companyServer.listCapabilities()) console.log(`   [${c.kind}] ${c.name} — ${c.description}`);
  console.log("");

  // 2. Host (app AI) + Client kết nối — cùng protocol cho mọi server
  const host = new McpClient();
  host.connect(companyServer);
  console.log("2. Host connect qua MCP Client — capabilities nhìn thấy từ client:");
  for (const line of host.listAllCapabilities()) console.log(`   ${line}`);
  console.log("");

  // 3. Client gọi tool + đọc resource + render prompt
  console.log("3. Client gọi qua chuẩn MCP:");
  console.log(`   callTool('lookup_order', {id:'A2'}) → "${host.invoke("company-tools", "lookup_order", { id: "A2" })}"`);
  console.log(`   callTool('calc', {expression:'100+200'}) → "${host.invoke("company-tools", "calc", { expression: "100+200" })}"`);
  console.log(`   readResource('docs://policy/return') → "${host.read("company-tools", "docs://policy/return")}"`);
  console.log(`   prompt 'support-reply' → render template với policy + question (templated interaction)`);
  console.log("");

  // 4. Validate schema + server lạ
  console.log("4. An toàn:");
  console.log(`   Thiếu tham số → "${host.invoke("company-tools", "lookup_order", {})}"`);
  console.log(`   Server chưa connect → "${host.invoke("weather-api", "forecast", { city: "Hanoi" })}"`);
  console.log("");
  console.log("✅ MCP host/client/server + tools/resources/prompts hoạt động (mô phỏng local)");
}

main();
