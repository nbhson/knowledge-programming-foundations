/**
 * 11.4 WebSockets - Connection / Event / Broadcast Demo
 *
 * Mô phỏng giao thức WebSocket (full-duplex, real-time) bằng TS thuần:
 * - MiniEventEmitter: tự viết EventEmitter (on/emit/off)
 * - MiniWSServer: quản lý connection, nhận message, broadcast tới client khác
 * - MiniWSClient: kết nối server, gửi/nhận message, đóng kết nối
 *
 * KHÔNG dùng `ws` / `WebSocket` thật — mô phỏng bằng Promise + setTimeout.
 */

// ─────────────────────────── Mini EventEmitter ───────────────────────────

type Listener<T> = (payload: T) => void;

class MiniEventEmitter<T = unknown> {
  private listeners = new Map<string, Listener<T>[]>();

  on(event: string, listener: Listener<T>): void {
    const list = this.listeners.get(event) ?? [];
    list.push(listener);
    this.listeners.set(event, list);
  }

  off(event: string, listener: Listener<T>): void {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, list.filter((l) => l !== listener));
  }

  protected emit(event: string, payload: T): void {
    const list = this.listeners.get(event) ?? [];
    for (const listener of [...list]) {
      listener(payload);
    }
  }
}

// ─────────────────────────── Message models ───────────────────────────

interface WsMessage {
  type: string;
  clientId: string;
  text?: string;
}

interface WsConnectionEvent {
  clientId: string;
  total: number;
}

interface WsReceivedEvent {
  clientId: string;
  message: WsMessage;
}

interface WsBroadcastEvent {
  clientId: string; // người gửi
  message: WsMessage;
  receivers: string[]; // các client khác nhận được
}

// ─────────────────────────── Mini WebSocket Server ───────────────────────────

class MiniWSServer extends MiniEventEmitter {
  private clients = new Map<string, MiniWSClient>();

  // Client gọi đến để "bắt tay" (handshake) — mô phỏng HTTP Upgrade
  connect(client: MiniWSClient): void {
    client.setServer(this);
    this.clients.set(client.id, client);
    this.emit("connection", { clientId: client.id, total: this.clients.size });
    client.on("disconnect", () => {
      this.clients.delete(client.id);
      console.log(`  🔌 ${client.id} đã ngắt kết nối (còn ${this.clients.size} client)`);
    });
  }

  handleMessage(from: MiniWSClient, message: Omit<WsMessage, "clientId">): void {
    // Nhận message từ 1 client → phát tới tất cả client KHÁC (broadcast)
    const receivers = [...this.clients.entries()]
      .filter(([id, client]) => id !== from.id && !client.isClosed())
      .map(([id]) => id);

    for (const receiver of receivers) {
      const target = this.clients.get(receiver);
      if (target) {
        target.deliver({ ...message, clientId: from.id });
      }
    }

    if (message.type === "chat") {
      this.emit("broadcast", { clientId: from.id, message, receivers });
    }
  }

  broadcastFromServer(payload: Omit<WsMessage, "clientId">): void {
    for (const client of this.clients.values()) {
      if (!client.isClosed()) {
        client.deliver({ type: payload.type, clientId: "server", text: payload.text });
      }
    }
  }
}

// ─────────────────────────── Mini WebSocket Client ───────────────────────────

class MiniWSClient extends MiniEventEmitter<WsMessage | string> {
  isSocketClosed = false;
  private server: MiniWSServer | null = null;
  readonly id: string;
  private inbox: WsMessage[] = [];

  constructor(id: string) {
    super();
    this.id = id;
  }

  setServer(server: MiniWSServer): void {
    this.server = server;
  }

  connect(server: MiniWSServer, url: string): void {
    // Mô phỏng quá trình kết nối real-time bất đồng bộ
    setTimeout(() => {
      server.connect(this);
    }, 0);
  }

  send(message: Omit<WsMessage, "clientId">): void {
    setTimeout(() => {
      if (!this.server || this.isClosed()) {
        console.log(`  ⚠️  ${this.id}: chưa kết nối hoặc đã đóng — không gửi được`);
        return;
      }
      this.server.handleMessage(this, message);
    }, 10);
  }

  // Server gọi khi có message broadcast tới client này
  deliver(message: WsMessage): void {
    this.inbox.push(message);
    setTimeout(() => {
      this.emit("message", message);
    }, 5);
  }

  close(): void {
    this.isSocketClosed = true;
    this.emit("disconnect", this.id);
  }

  isClosed(): boolean {
    return this.isSocketClosed;
  }
}

// ───────────────────────────────── Demo ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== WebSocket Demo ===");
  console.log("");

  const server = new MiniWSServer();
  server.on("connection", (event) => {
    if (isConnEvent(event)) {
      console.log(`  🌐 Client kết nối: ${event.clientId} (tổng: ${event.total})`);
    }
  });
  server.on("broadcast", (event) => {
    if (isBroadcastEvent(event)) {
      const sender = event.clientId === "server" ? "server" : event.clientId;
      console.log(`  📢 [${sender}] ${event.message.text} → broadcast tới ${event.receivers.join(", ") || "(không ai)"}`);
    }
  });

  console.log("1️⃣ Ba client kết nối tới server (ws://localhost:8080):");
  const alice = new MiniWSClient("alice");
  const bob = new MiniWSClient("bob");
  const carol = new MiniWSClient("carol");
  alice.connect(server, "ws://localhost:8080");
  bob.connect(server, "ws://localhost:8080");
  carol.connect(server, "ws://localhost:8080");
  await sleep(30);
  console.log("");

  console.log("2️⃣ Alice gửi tin nhắn chat → server broadcast cho Bob, Carol:");
  alice.on("message", (message) => {
    if (isWsMessage(message)) console.log(`  💬 alice nhận được: [${message.clientId}] ${message.text}`);
  });
  bob.on("message", (message) => {
    if (isWsMessage(message)) console.log(`  💬 bob nhận được: [${message.clientId}] ${message.text}`);
  });
  carol.on("message", (message) => {
    if (isWsMessage(message)) console.log(`  💬 carol nhận được: [${message.clientId}] ${message.text}`);
  });
  alice.send({ type: "chat", text: "Xin chào mọi người!" });
  await sleep(30);
  console.log("");

  console.log("3️⃣ Server chủ động gửi thông báo hệ thống tới tất cả client:");
  server.broadcastFromServer({ type: "system", text: "Maintenance lúc 2h sáng" });
  await sleep(30);
  console.log("");

  console.log("4️⃣ Carol đóng kết nối, server xóa khỏi danh sách:");
  carol.close();
  await sleep(20);
  console.log("");

  console.log("5️⃣ Alice gửi khi chưa kết nối — message bị chặn:");
  const ghost = new MiniWSClient("ghost");
  ghost.send({ type: "chat", text: "Không ai nghe thấy" });
  await sleep(20);
  console.log("");

  console.log("✅ WebSocket: kết nối bền vững full-duplex + broadcast real-time qua event emitter");
}

function isWsMessage(v: unknown): v is WsMessage {
  return typeof v === "object" && v !== null && "type" in v && "clientId" in v;
}

function isConnEvent(v: unknown): v is WsConnectionEvent {
  return typeof v === "object" && v !== null && "clientId" in v && "total" in v;
}

function isBroadcastEvent(v: unknown): v is WsBroadcastEvent {
  return typeof v === "object" && v !== null && "receivers" in v;
}

run();
export {};