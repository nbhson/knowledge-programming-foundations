# ⚖️ 13.1 Load Balancer (Cân Bằng Tải)

> **Load Balancer** phân phối traffic đến nhiều server instances — tăng availability và scalability.

---

## 🎯 Mô Hình Hoạt Động

```
         Traffic
           │
           ▼
    ┌──────────────┐
    │  Load        │
    │  Balancer    │
    └──────┬───────┘
           │
    ┌──────┼──────┬────────┐
    ▼      ▼      ▼        ▼
 ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
 │App 1│ │App 2│ │App 3│ │App 4│
 └─────┘ └─────┘ └─────┘ └─────┘
```

---

## 13.1.1 L4 vs L7 Load Balancing

| Level | OSI Layer | Hoạt Động | Ví Dụ |
|-------|-----------|-----------|-------|
| **L4** | Transport | Dựa trên IP + Port | IPVS, HAProxy TCP |
| **L7** | Application | Dựa trên HTTP headers, URL, cookie | Nginx, AWS ALB |

```
L4 (Transport):
  Client ──▶ [LB: cân bằng theo IP/hash] ──▶ Server A/B/C

L7 (Application):
  Client ──▶ [LB: đọc URL /header /cookie] ──▶ Server A/B/C
             "gửi /api/users đến Server B"
```

---

## 13.1.2 Load Balancing Algorithms

### Round Robin
```
Request 1 ──▶ Server A
Request 2 ──▶ Server B
Request 3 ──▶ Server C
Request 4 ──▶ Server A  ← quay lại đầu
```

### Least Connections
```
Server A: 10 connections
Server B: 3 connections  ← chọn server ít nhất
Server C: 8 connections
```

### Weighted Round Robin
```
Server A (weight 3): nhận 3 requests
Server B (weight 1): nhận 1 request
Server C (weight 2): nhận 2 requests
```

### Hash-based
```
URL /api/users/123 ──▶ hash("123") mod 3 ──▶ Server B
• Cùng user ID luôn đến cùng server (sticky sessions)
```

---

## 13.1.3 Nginx Configuration

```nginx
upstream app_servers {
    # Least connections algorithm
    least_conn;
    
    server app1.example.com:3000 weight=3;
    server app2.example.com:3000 weight=2;
    server app3.example.com:3000 weight=1;
    
    # Health check
    server app4.example.com:3000 backup;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeout settings
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
    
    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## 13.1.4 Health Checks

```typescript
// Express health check middleware
app.get('/health', (req, res) => {
  const checks = {
    database: await db.ping(),
    redis: await redis.ping(),
    memory: process.memoryUsage().heapUsed / 1024 / 1024
  };
  
  const healthy = Object.values(checks).every(v => v);
  
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

## 🔗 Liên Quan

- **13.2 Caching Strategies** — Cache trước load balancer
- **13.6 Scalable Architecture** — Horizontal scaling + LB

---

## 📚 Tài Liệu

- 📖 [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/)

---

## ⏭️ Bài Tiếp Theo

→ [13.2 Caching Strategies](../13.2-caching-strategies/README.md)
