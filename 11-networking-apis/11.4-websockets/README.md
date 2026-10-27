# 🔌 11.4 WebSockets (Giao Thức Real-Time)

> **WebSocket** là giao thức truyền tải hai chiều (bidirectional) qua một kết nối TCP duy nhất — lý tưởng cho real-time apps. Khác HTTP request/response cycle, WebSocket mở **persistent connection** cho phép server push data xuống client bất cứ lúc nào mà không cần client request. Điều này mở ra khả năng: chat real-time, live notifications, collaborative editing, online gaming, stock tickers — những use case mà HTTP polling không thể đáp ứng hiệu quả.

---

## 🎯 WebSocket vs HTTP — Fundamental difference

```
HTTP (Half-duplex, request/response cycle):
─────────────────────────────────────────────
Client                              Server
  │                                    │
  │─── GET /api/messages ────────────▶│
  │                                    │
  │◀── 200 OK, messages: [...] ───────│
  │                                    │
  │  (wait 5 seconds...)               │
  │                                    │
  │─── GET /api/messages ────────────▶│  ← Every 5s = 5x overhead
  │◀── 200 OK, messages: [...] ───────│     (most return empty)
  │                                    │
  │  (wait 5 seconds...)               │
  │                                    │
  │─── GET /api/messages ────────────▶│
  │◀── 200 OK, NEW_MESSAGE ───────────│
  └────────────────────────────────────┘
  Latency: up to 5s (depends on poll interval)
  Bandwidth: 3 requests for 1 new message

WebSocket (Full-duplex, persistent connection):
───────────────────────────────────────────────
Client                              Server
  │                                    │
  │─── GET /ws/chat HTTP/1.1 ────────▶│  Upgrade: websocket
  │   Upgrade: websocket               │
  │                                    │
  │◀── 101 Switching Protocols ───────│
  │                                    │
  │═══════ Persistent Connection ═══════│
  │                                    │
  │─── [chat message] ───────────────▶│  Client → Server anytime
  │◀── [chat message] ────────────────│  Server → Client anytime
  │─── [typing indicator] ───────────▶│
  │◀── [new_message_notification] ────│
  │                                    │
  └────────────────────────────────────┘
  Latency: < 100ms (immediate push)
  Bandwidth: minimal (only when data changes)
```

| Feature | HTTP (Polling) | WebSocket | Lợi ích WebSocket |
|---------|---------------|-----------|-------------------|
| Direction | Client → Server only (request-driven) | Bidirectional (both sides can send anytime) | Server có thể push notification ngay lập tức |
| Connection | Stateless, close sau response | Persistent, sống đến khi close | Không phải mở mới connection mỗi request |
| Latency | Cao (poll interval + network RTT) | Thấp (< 100ms) | Real-time UX: chat, gaming, collaboration |
| Overhead | Headers mỗi request (~1KB) | Minimal handshake (~200 bytes) | Giảm bandwidth especially on mobile |
| Use case | CRUD APIs, static content | Chat, live updates, gaming, collaboration | Những app cần immediacy |

---

## 11.4.1 WebSocket Handshake — From HTTP to WS

WebSocket không phải protocol riêng — nó **upgrade** HTTP connection sang WebSocket protocol qua handshake:

```
Client                              Server
  │                                    │
  │─── GET /ws/chat HTTP/1.1 ────────▶│
  │   Host: api.example.com            │
  │   Upgrade: websocket               │  ← Request upgrade to WS protocol
  │   Connection: Upgrade              │
  │   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ== │  ← Random 16-byte key
  │   Sec-WebSocket-Version: 13        │
  │   Origin: https://app.example.com  │
  │                                    │
  │◀─── HTTP/1.1 101 Switching Protocols──│
  │   Upgrade: websocket               │  ← Server agrees to upgrade
  │   Connection: Upgrade              │
  │   Sec-WebSocket-Accept: s3pPL...   │  ← HMAC-SHA1(key + GUID)
  │                                    │
  │═══════ WebSocket Connection Opened ══════│
  │   Full-duplex binary/text frames   │
  │   Bidirectional communication      │
  │                                    │
  │─── [text frame: "hello"] ────────▶│
  │◀─── [text frame: "hi back"] ──────│
  │                                    │
  │─── [close frame] ────────────────▶│
  │◀─── [close frame] ────────────────│
  │   Connection closed                │
```

**Điểm quan trọng:** handshake ban đầu là HTTP thông thường → CORS, authentication, rate limiting hoạt động như bình thường. Sau handshake, connection độc lập với HTTP — không còn headers per message.

---

## 11.4.2 Server Setup (ws library) — Production patterns

```typescript
// server.ts — WebSocket server với ws library
import { WebSocketServer, WebSocket, CloseEvent } from 'ws';
import { EventEmitter } from 'events';
import { authenticate } from './auth';  // Your auth middleware

class ChatServer extends EventEmitter {
  wss: WebSocketServer;
  // Map: WebSocket → { id: string, user: User }
  clients: Map<WebSocket, { id: string; user: any }> = new Map();

  constructor(port: number) {
    super();
    this.wss = new WebSocketServer({ port, maxPayload: 1024 * 1024 }); // 1MB max
    this.setupConnections();
  }

  private setupConnections(): void {
    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      // Authenticate via query parameter or header (handshake is HTTP)
      const token = new URL(req.url!, 'http://localhost').searchParams.get('token');
      let user: any = null;
      try {
        user = await authenticate(token);
      } catch {
        ws.close(4401, 'Unauthorized');
        return;
      }

      const clientId = user.id;
      this.clients.set(ws, { id: clientId, user });
      console.log(`✅ Client connected: ${clientId} (total: ${this.clients.size})`);

      // Welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        message: `Chào ${clientId}! Bạn có ${this.clients.size} người đang online.`,
        timestamp: new Date().toISOString(),
      }));

      // Broadcast user online status
      this.broadcast({
        type: 'user_online',
        clientId,
        count: this.clients.size,
      }, ws);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message, clientId, user);
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      // Handle disconnect
      ws.on('close', (code: number, reason: Buffer) => {
        this.clients.delete(ws);
        console.log(`❌ Client disconnected: ${clientId} (code: ${code}, reason: ${reason.toString()})`);
        this.broadcast({
          type: 'user_offline',
          clientId,
          count: this.clients.size,
          timestamp: new Date().toISOString(),
        });
        this.emit('clientDisconnected', clientId);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${clientId}:`, error.message);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any, senderId: string, senderUser: any): void {
    switch (message.type) {
      case 'chat':
        // Validate message
        if (!message.text || message.text.length > 2000) {
          ws.send(JSON.stringify({ type: 'error', message: 'Text must be 1-2000 characters' }));
          return;
        }
        // Broadcast to ALL clients (including sender for echo)
        this.broadcast({
          type: 'chat',
          clientId: senderId,
          userName: senderUser.name,
          text: message.text,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'typing':
        // Typing indicator — only send to specific room/channel
        if (message.roomId) {
          this.broadcastToRoom(message.roomId, {
            type: 'typing',
            clientId: senderId,
            userName: senderUser.name,
          }, ws);
        }
        break;

      case 'ping':
        // Health check — respond with pong
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
    }
  }

  // Broadcast to all connected clients (optionally exclude sender)
  private broadcast(payload: object, excludeWs?: WebSocket): void {
    const data = JSON.stringify(payload);
    this.clients.forEach((clientInfo, clientWs) => {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });
  }

  // Broadcast to clients in a specific room/channel
  private broadcastToRoom(roomId: string, payload: object, excludeWs?: WebSocket): void {
    const data = JSON.stringify(payload);
    this.clients.forEach((clientInfo, clientWs) => {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        // Assume clientInfo has rooms array
        const info = this.clients.get(clientWs)!;
        if (info.rooms?.includes(roomId)) {
          clientWs.send(data);
        }
      }
    });
  }

  // Send to specific client
  private sendTo(clientId: string, payload: object): boolean {
    for (const [ws, info] of this.clients.entries()) {
      if (info.id === clientId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return true;
      }
    }
    return false;
  }

  // Get stats
  getStats() {
    return {
      connectedClients: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([ws, info]) => ({
        id: info.id,
        user: info.user?.name,
      })),
    };
  }
}

const server = new ChatServer(8080);
console.log('🚀 WebSocket server running on ws://localhost:8080');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down WebSocket server...');
  server.wss.close(() => {
    console.log('All connections closed');
    process.exit(0);
  });
  // Force close after 5s
  setTimeout(() => process.exit(0), 5000);
});
```

---

## 11.4.3 Client (Browser WebSocket) — Complete implementation

```typescript
// client.ts — Browser WebSocket client với auto-reconnect
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class ChatClient {
  ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  onMessage?: (data: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;

  connect(url: string, token?: string): void {
    // Add auth token to URL
    const wsUrl = token ? `${url}?token=${token}` : url;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      this.onOpen?.();
      this.startPing();  // Heartbeat every 30s
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch {
        console.warn('Received non-JSON message:', event.data);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`❌ Disconnected: code=${event.code}, reason=${event.reason || 'none'}`);
      this.onClose?.(event.code, event.reason || '');
      this.stopPing();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error: Event) => {
      console.error('⚠️ WebSocket error:', error);
      this.onError?.(error);
    };
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);  // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      this.onReconnect?.(1);
      this.reconnectTimer = null;
      // connect() will be called by app code
    }, 3000);  // Reconnect after 3 seconds
  }

  send(type: string, payload: object = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn('❌ WebSocket not connected. readyState:', this.ws?.readyState);
    }
  }

  close(): void {
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'Client closing');
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Usage example
const client = new ChatClient();

client.onOpen = () => {
  console.log('Connection established!');
};

client.onMessage = (data) => {
  switch (data.type) {
    case 'welcome':
      console.log(`Welcome: ${data.message}`);
      break;
    case 'chat':
      console.log(`${data.userName}: ${data.text}`);
      break;
    case 'typing':
      console.log(`${data.userName} is typing...`);
      break;
    case 'pong':
      console.log(`Pong received at ${new Date(data.timestamp).toLocaleTimeString()}`);
      break;
    case 'user_online':
      console.log(`New user online. Total: ${data.count}`);
      break;
    case 'error':
      console.error('Server error:', data.message);
      break;
  }
};

client.connect('ws://localhost:8080', 'your-jwt-token');

// Send chat message
client.send('chat', { text: 'Xin chào mọi người!' });

// Send typing indicator
client.send('typing', { roomId: 'general' });
```

---

## 11.4.4 EventSource / SSE (Server-Sent Events) — One-way streaming

**SSE** là API HTML5 cho phép client nhận stream events từ server qua HTTP — one-directional (server → client only). Different from WebSocket: simpler, built-in auto-reconnect, works over standard HTTP (no special protocol upgrade).

```typescript
// Server — SSE endpoint (Express)
import express from 'express';
const app = express();

// Store active SSE connections
const clients: Array<{ res: express.Response; id: string }> = [];

app.get('/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  clients.push({ res, id: clientId });
  console.log(`📡 SSE client connected: ${clientId} (total: ${clients.length})`);

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Clean up on disconnect
  req.on('close', () => {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) clients.splice(index, 1);
    console.log(`📡 SSE client disconnected: ${clientId}`);
  });
});

// Broadcast function — send event to all SSE clients
function broadcastSSE(event: string, data: object): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(({ res }) => {
    if (!res.writableEnded) {
      res.write(payload);
    }
  });
}

// Example: broadcast new message every 5 seconds
setInterval(() => {
  broadcastSSE('update', { time: new Date().toISOString(), value: Math.random() });
}, 5000);

// Example: broadcast on database event
// db.on('newOrder', (order) => broadcastSSE('order_created', order));

const PORT = 3000;
app.listen(PORT, () => console.log(`SSE server at http://localhost:${PORT}/stream`));
```

```typescript
// Client — EventSource API (browser)
const eventSource = new EventSource('/stream');

// Default 'message' event
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Default event:', data);
};

// Custom event type
eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connected as:', data.clientId);
});

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Update at ${data.time}: ${data.value.toFixed(4)}`);
});

// Error handling
eventSource.onerror = (event) => {
  console.error('SSE connection error:', event);
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('SSE connection closed permanently');
  }
  // EventSource auto-reconnects on error (unlike WebSocket)
};

// Close connection
eventSource.close();
```

### SSE vs WebSocket — When to use which

| Feature | WebSocket | SSE | Khi nào chọn |
|---------|-----------|-----|-------------|
| Direction | Bidirectional | Server → Client only | Need client → server? → WebSocket |
| Protocol | WS/WSS (separate from HTTP) | HTTP (text/event-stream) | Need to work through HTTP proxies? → SSE |
| Auto-reconnect | Manual (write logic) | Browser built-in | Don't want reconnect logic? → SSE |
| Binary data | ✅ | ❌ (text only) | Need to send images/audio? → WebSocket |
| Complexity | Higher (handshake, framing) | Lower (simple HTTP stream) | Simple use case? → SSE |
| Browser support | 95%+ | 95%+ (older browsers better support) | Support IE? → neither, use long polling |
| Best for | Chat, gaming, collaborative editing | Notifications, live scores, stock ticks | Server-only push? → SSE |

---

## 11.4.5 Scaling WebSockets — Multiple server instances

WebSocket persistent connection means you **cannot** load-balance like HTTP (where any server can handle any request). Với nhiều server instances, cần strategy để route messages đúng server:

```
Client A ──▶ Server 1 (holds connection)
Client B ──▶ Server 2 (holds connection)
Client C ──▶ Server 1 (holds connection)

Server 1 wants to broadcast to Client B (on Server 2):
→ Cannot send directly! Need message broker.

Solution: Redis Pub/Sub hoặc Redis Streams làm message broker
```

```typescript
// Redis-backed WebSocket broadcasting (multi-server)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

class DistributedChatServer {
  private serverId = `server_${Math.random().toString(36).slice(2)}`;
  private redisSubscriber: Redis;
  private redisPublisher: Redis;

  constructor(wss: WebSocketServer) {
    this.redisPublisher = new Redis(process.env.REDIS_URL!);
    this.redisSubscriber = new Redis(process.env.REDIS_URL!);

    // Subscribe to broadcast channel
    this.redisSubscriber.subscribe('chat:broadcast', (err, count) => {
      if (err) console.error('Subscribe error:', err);
      console.log(`Subscribed to chat:broadcast (${count} channels)`);
    });

    this.redisSubscriber.on('message', (channel, message) => {
      const { type, payload, excludeServer } = JSON.parse(message);
      if (type === 'broadcast' && excludeServer !== this.serverId) {
        // Forward to local clients
        this.broadcastToLocal(payload);
      }
    });

    this.wss = wss;
  }

  // When local client sends message, publish to Redis
  handleLocalMessage(message: object): void {
    this.redisPublisher.publish('chat:broadcast', JSON.stringify({
      type: 'broadcast',
      payload: message,
      excludeServer: this.serverId,
    }));
  }

  private broadcastToLocal(payload: object): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    });
  }
}
```

> 💡 **Pattern:** mỗi WebSocket server instance subscribe vào Redis channel, publish message lên Redis khi nhận từ local client. Các server khác nhận message từ Redis và forward tới local clients. Result: message broadcasted across all connected clients regardless of which server họ connect to.

---

## 📋 WebSocket vs SSE vs Polling — Comparison

| Feature | WebSocket | SSE | Long Polling | Short Polling |
|---------|-----------|-----|--------------|---------------|
| **Direction** | Bi-directional | Server→Client only | Server→Client (request-driven) | Both (but client-initiated) |
| **Protocol** | WS/WSS (upgrade from HTTP) | HTTP (text/event-stream) | HTTP | HTTP |
| **Connection** | Persistent single | Persistent single | Semi-persistent (new conn per request) | New connection each time |
| **Overhead** | Thấp (handshake once) | Thấp (HTTP headers per event) | Trung bình (new TCP+TLS each poll) | Cao (full request overhead each poll) |
| **Browser support** | Tốt (95%+) | Tốt (95%+) | Mọi nơi | Mọi nơi |
| **Auto-reconnect** | Manual (write logic) | Browser built-in | Manual | Manual |
| **Binary data** | ✅ | ❌ | ✅ | ✅ |
| **Complexity** | Trung bình | Thấp | Thấp | Thấp nhất |
| **Best for** | Chat, gaming, collaborative editing, trading | Notifications, live scores, stock feeds, progress bars | Legacy browser support, simple fallback | Very simple status checks |

---

## 🔗 Liên Quan

- **11.3 GraphQL** — GraphQL Subscriptions use WebSocket transport internally
- **11.5 REST Clients** — HTTP client libraries (fallback when WebSocket unavailable)
- **10.6 Redis** — Redis Pub/Sub cho multi-server WebSocket broadcasting

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| ws library docs | https://github.com/websockets/ws |
| MDN — WebSocket API | https://developer.mozilla.org/en-US/docs/Web/API/WebSocket_API |
| MDN — EventSource API | https://developer.mozilla.org/en-US/docs/Web/API/EventSource |
| Server-Sent Events Spec | https://html.spec.whatwg.org/multipage/server-sent-events.html |
| Socket.IO (production WS library) | https://socket.io/ |

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.4-websockets
npx ts-node examples/index.ts
```

Demo bao gồm: WebSocket server (chat), client với auto-reconnect, SSE stream, và broadcast patterns. Để ý cách handshake hoạt động qua HTTP và transition sang WebSocket protocol.

---

## ⏭️ Bài tiếp theo → [11.5 REST Clients](../11.5-rest-clients/README.md)
