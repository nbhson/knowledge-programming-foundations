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

**Tại sao cần LB?** Single server có nhiều giới hạn cứng:
- **Resource ceiling:** CPU/RAM/IO/network không thể scale vô hạn trên 1 machine.
- **Blast radius:** 1 instance crash = toàn bộ service sập.
- **Zero-downtime deploy:** không thể restart 1 server đang nhận traffic.
- **SSL/TLS termination:** việc decrypt SSL ở LB giúp backend đơn giản hơn.

LB giải quyết bằng cách **trở thành single entry point**, ẩn đi phía sau nhiều instance.

**Chi phí thêm:**
- 1–2ms latency (network hop thêm)
- 1 single point of failure — cần HA pair (keepalived/VIP) hoặc anycast DNS
- Operational complexity (config, health check tuning)

---

## 13.1.1 L4 vs L7 Load Balancing

| Level | OSI Layer | Hoạt Động | Ví Dụ | Giải thích sâu |
|-------|-----------|-----------|-------|----------------|
| **L4** | Transport | Dựa trên IP + Port | IPVS, HAProxy TCP, AWS NLB | Nhanh hơn (~micro giây quyết định), không inspect payload. Không thể route `/api/users` → service A, `/images` → service B. Hỗ trợ TLS passthrough. |
| **L7** | Application | Dựa trên HTTP headers, URL, cookie | Nginx, AWS ALB, Envoy | Chậm hơn (~hàng ms) vì parse HTTP; nhưng powerful: content-based routing, rate limit per path, WAF, sticky session via cookie. Có thể terminate TLS → backend nhận HTTP plain (hoặc TLS nội bộ). |

```
L4 (Transport):
  Client ──▶ [LB: cân bằng theo IP/hash] ──▶ Server A/B/C

L7 (Application):
  Client ──▶ [LB: đọc URL /header /cookie] ──▶ Server A/B/C
              "gửi /api/users đến Server B"
```

> 💡 **Thực tiễn phổ biến:** dùng LB L7 làm edge (nghe HTTP/S), rồi L4 làm internal (TCP/UDP). AWS: ALB (L7) → targets có thể là NLB (L4) → EC2.

---

## 13.1.2 Load Balancing Algorithms

### Round Robin
```
Request 1 ──▶ Server A
Request 2 ──▶ Server B
Request 3 ──▶ Server C
Request 4 ──▶ Server A  ← quay lại đầu
```
- **Khi nào:** server đồng cấu hình, request đồng đều.
- **Nhược điểm:** không biết server đang bận/rảnh.

### Least Connections
```
Server A: 10 connections
Server B: 3 connections  ← chọn server ít nhất
Server C: 8 connections
```
- **Khi nào:** request có thời gian xử lý khác nhau (streaming, long-polling).
- **Lý do:** chia tải theo active connection thực tế, không theo count request.

### Weighted Round Robin
```
Server A (weight 3): nhận 3 requests
Server B (weight 1): nhận 1 request
Server C (weight 2): nhận 2 requests
```
- **Khi nào:** server khác specs (1 cái mạnh, 1 yếu); muốn phân bổ theo capacity.
- **Lưu ý:** weight cần revisit khi scale từng node khác nhau.

### Hash-based (Sticky)
```
URL /api/users/123 ──▶ hash("123") mod 3 ──▶ Server B
• Cùng user ID luôn đến cùng server (sticky sessions)
```
- **Khi nào:** cần session affinity (local cache per-instance, WebSocket sticky).
- **Nhược điểm:** hot-key problem — user ID `999999` tràn vào cùng 1 server.

### Least Latency
- Chọn server có response time trung bình thấp nhất (measured).
- Phức tạp hơn, cần monitoring liên tục, nhưng tối ưu UX.

**Bảng tổng kết algorithm:**

| Algorithm | Phân phối | Độ phức tạp | Use case |
|-----------|-----------|-------------|----------|
| Round Robin | Đồng đều lý thuyết | Thấp | Default choice, stateless services |
| Least Conn | Theo actual load | Thấp | Long-lived connections (WebSockets) |
| Weighted RR | Theo config | Thấp | Heterogeneous fleet |
| Hash | Deterministic | Thấp | Sticky session, CDN edge |
| Least Latency | Dynamic | Trung bình | SLO-driven, global anycast |

---

## 13.1.3 Nginx Configuration

```nginx
upstream app_servers {
    # Least connections algorithm
    least_conn;

    server app1.example.com:3000 weight=3 max_conns=200;
    server app2.example.com:3000 weight=2;
    server app3.example.com:3000 weight=1;

    # Backup server — chỉ nhận traffic khi tất cả primary đều down
    server app4.example.com:3000 backup;

    # Keepalive connections để giảm TCP handshake overhead
    keepalive 32;
}

server {
    listen 80;
    server_name example.com;

    # Redirect HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings — tune theo SLA
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;

        # Buffer settings — trade-off memory vs performance
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Rate limiting zone (defined in http block)
        limit_req zone=general burst=20 nodelay;
    }

    # Health check endpoint — expose ra ngoài, LB dùng để probe
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

**Tại sao cần `proxy_set_header X-Forwarded-*`?** Backend nằm sau LB không thấy IP thật của client — các header này chuyển thông tin này. Cần **trust** đúng upstream: nếu LB public expose ra internet, hacker có thể giả mạo header. Dùng whitelist CIDR hoặc reverse proxy nội bộ để mitigate.

**Rate limiting mẫu (nginx config block `http {}`):**

```nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
```

> 💡 Lưu ý: rate limit theo `$binary_remote_addr` chỉ chặn 1 IP, không chặn 1 user (vì user có thể dùng nhiều IP qua proxy/NAT). Đối với user-centric limit, dùng Redis + sliding window.

---

## 13.1.4 Health Checks

```typescript
// Express health check middleware
app.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    database: await db.ping(),
    redis: await redis.ping(),
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeSec: Math.round(process.uptime()),
  };

  const healthy = checks.database && checks.redis && checks.memoryMb < 800;

  res.status(healthy ? 200 : 503).json(checks);
});
```

**3 loại health check (Kubernetes standard):**

| Type | Mục đích | Ví dụ |
|------|----------|-------|
| **Liveness** | "Has the process died?" |.ping() / uptime threshold |
| **Readiness** | "Is the instance ready to receive traffic?" |-dependency ready (DB, cache) |
| **Startup** | "Is the app still booting?" | long-running init tasks |

**Liveness vs Readiness khác nhau ở đâu?** Liveness sai → restart container (có thể mất connection đang phục vụ). Readiness sai → gỡ khỏi pool traffic nhưng không restart (giữ process sống).

> ⚠️ **Flapping:** nếu health check quá nhạy (interval ngắn, threshold thấp), service liên tục vào/ra pool → 503 oscillation. Set interval 5–10s, threshold 2–3 lần liên tiếp fail mới action.

---

## 🎯 Khi nào dùng Load Balancer?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|-----------|
| ≥ 2 server instances | ✅ Bắt buộc | Tránh single point of failure, cho phép zero-downtime rolling deploy |
| SSL termination cần tập trung | ✅ Phù hợp | Giảm burden cho backend, centralize cert rotation |
| Rate limiting global | ✅ Phù hợp | Central enforcement dễ quản lý hơn per-instance |
| 1 server nhỏ (< 100 req/s) | ⚠️ Tùy chọn | Chi phí vận hành outweigh benefit; dùng nginx làm reverse proxy cũng được |
| Backend stateful | ✅ Phù hợp + sticky session | Đảm bảo request cùng user tới cùng instance (session locality) |

---

## 🔗 Liên Quan

- **13.2 Caching Strategies** — Cache trước load balancer để giảm origin load
- **13.6 Scalable Architecture** — Horizontal scaling + LB là cặp song hành

> 💡 **eBPF-based LB / service mesh (Cilium):** ở cluster lớn (hàng nghìn pods), routing/load balancing ở kernel layer qua eBPF thay thế iptables/kube-proxy — ít overhead hơn, scale tốt hơn và cho policy per-pod.

---

## 📚 Tài Liệu

- 📖 [Nginx Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/)
- 📖 [AWS ALB/NLB docs](https://docs.aws.amazon.com/elasticloadbalancing/)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.1-load-balancer
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.2 Caching Strategies](../13.2-caching-strategies/README.md)
