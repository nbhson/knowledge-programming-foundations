# 🔌 11.4 WebSockets (Giao Thức Real-Time)

> **WebSocket** là giao thức truyền tải hai chiều (bidirectional) qua một kết nối TCP duy nhất — lý tưởng cho real-time apps.

---

## 🎯 WebSocket vs HTTP

```
HTTP (Half-duplex):                     WebSocket (Full-duplex):
─────────────────────                    ─────────────────────
Client ───── Request ─────────────▶ Server
Client ◀──── Response ───────────── Server
Client waits...                        ════════════════════
                                       Bidirectional stream
                                       Client ↔ Server forever
```

| Feature | HTTP | WebSocket |
|---------|------|-----------|
| Direction | Request/Response | Bidirectional |
| Connection | Stateless, close sau response | Persistent connection |
| Latency | Cao (mỗi request mới) | Thấp (giữ kết nối) |
| Overhead | Headers mỗi lần | Minimal header |
| Use case | CRUD APIs | Chat, live updates, gaming |

---

## 11.4.1 Server Setup (ws library)

```typescript
// server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

class ChatServer extends EventEmitter {
  wss: WebSocketServer;
  clients: Map<WebSocket, string> = new Map();

  constructor(port: number) {
    super();
    this.wss = new WebSocketServer({ port });
    this.setupConnections();
  }

  private setupConnections(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substr(2, 9);
      this.clients.set(ws, clientId);
      console.log(`✅ Client connected: ${clientId} (total: ${this.clients.size})`);

      // Gửi welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        message: `Chào ${clientId}!`
      }));

      ws.on('message', (data: Buffer) => {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message, clientId);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`❌ Client disconnected: ${clientId}`);
        this.broadcast({
          type: 'user_left',
          clientId
        }, ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any, senderId: string): void {
    switch (message.type) {
      case 'chat':
        this.broadcast({
          type: 'chat',
          clientId: senderId,
          text: message.text,
          timestamp: new Date().toISOString()
        }, ws);
        break;
      case 'typing':
        ws.broadcast?.({ type: 'typing', clientId: senderId });
        break;
    }
  }

  private broadcast(payload: object, excludeWs?: WebSocket): void {
    const data = JSON.stringify(payload);
    this.clients.forEach((clientId, client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

const server = new ChatServer(8080);
console.log('🚀 WebSocket server running on ws://localhost:8080');
```

---

## 11.4.2 Client (Browser WebSocket)

```typescript
// client.ts — Browser WebSocket
class ChatClient {
  ws: WebSocket | null = null;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: (code: number) => void;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      this.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Received:', data);
      this.onMessage?.(data);
    };

    this.ws.onclose = (event) => {
      console.log(`❌ Disconnected: code=${event.code}`);
      this.onClose?.(event.code);
      // Tự động reconnect sau 3s
      setTimeout(() => this.connect(url), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('⚠️ WebSocket error:', error);
    };
  }

  send(type: string, payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn('❌ WebSocket not connected');
    }
  }

  close(): void {
    this.ws?.close();
  }
}

// Usage
const client = new ChatClient();
client.connect('ws://localhost:8080');

client.onMessage = (data) => {
  if (data.type === 'chat') {
    console.log(`${data.clientId}: ${data.text}`);
  }
};

client.send('chat', { text: 'Xin chào mọi người!' });
```

---

## 11.4.3 EventSource / SSE (Server-Sent Events)

**SSE** — One-directional (server → client), dùng cho push notification:

```typescript
// Server — gửi event streams
import express from 'express';
const app = express();

app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Gửi sự kiện định kỳ
  const interval = setInterval(() => {
    const data = JSON.stringify({ time: new Date().toISOString(), value: Math.random() });
    res.write(`event: update\ndata: ${data}\n\n`);
  }, 1000);

  // Hủy khi client disconnect
  req.on('close', () => clearInterval(interval));
});

// Client — EventSource API
const eventSource = new EventSource('/stream');

eventSource.addEventListener('update', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Event: ${data.time} → ${data.value}`);
});

eventSource.onerror = () => {
  console.error('⚠️ SSE connection error');
};
```

---

## 📋 WebSocket vs SSE vs Polling

| Feature | WebSocket | SSE | Polling |
|---------|-----------|-----|---------|
| Direction | 2 chiều | Server → Client | Client → Server |
| Connection | Persistent | Persistent | Mỗi request mới |
| Binary data | ✅ | ❌ | ✅ |
| Auto reconnect | Manual | Browser tự động | N/A |
| Độ trễ | Thấp nhất | Thấp | Cao |
| Phù hợp | Chat, game | Live score, news | Simple apps |

---

## 🔗 Liên Quan

- **11.3 GraphQL** — Subscriptions qua WebSocket
- **11.5 REST Clients** — HTTP client libraries

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| ws library docs | https://github.com/websockets/ws |
| MDN — WebSocket API | https://developer.mozilla.org/en-US/docs/Web/API/WebSocket_API |
| Server-Sent Events | https://html.spec.whatwg.org/multipage/server-sent-events.html |

---

## ⏭️ Bài tiếp theo → [11.5 REST Clients](../11.5-rest-clients/README.md)
