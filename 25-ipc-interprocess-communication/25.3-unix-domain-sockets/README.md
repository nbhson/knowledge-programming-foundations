# 🔌 25.3 Unix Domain Sockets (Socket Cục Bộ)

> **Socket nói chuyện như TCP, nhưng đi qua kernel nội bộ — không qua network stack.**
> Nhanh hơn TCP localhost, có permission như file, và là cách Redis/PostgreSQL/Docker
> giao tiếp mặc định trên cùng máy.

> Liên quan: `11.7-tcp-udp` (TCP/IP), `24.2-path-manipulation` (socket là file),
> `9.10-mtls-zero-trust` (mTLS), `13.9-api-gateway-discovery`.

---

## 🎯 Vấn Đề

App và Redis cùng 1 máy — qua TCP localhost: vẫn qua full TCP stack (handshake,
checksum, port). Unix domain socket: giống API socket TCP nhưng path là FILE,
truyền qua kernel — nhanh hơn, không chiếm port, kiểm soát quyền bằng file permission.

```
TCP localhost : app → loopback interface → kernel → Redis  (stack mạng đầy đủ)
Unix socket   : app ─────── kernel ───────→ Redis          (không qua IP stack)
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Node.js: Unix socket server =====
import net from "node:net";
const server = net.createServer((socket) => {
  socket.on("data", (d) => socket.write(`echo: ${d}`));
});
server.listen("/tmp/myapp.sock");   // path thay vì port!

// Client:
const client = net.connect({ path: "/tmp/myapp.sock" });
client.write("ping");
client.on("data", (d) => console.log(d.toString()));

// ===== Quyền truy cập = quyền FILE (không cần auth riêng) =====
// chmod 770 /run/myapp.sock + group app → chỉ user trong group mới kết nối được
// TCP localhost: bất kỳ process nào trên máy đều kết nối được (phải tự auth)

// ===== Docker: mount socket vào container =====
// docker run -v /var/run/docker.sock:/var/run/docker.sock ...
// container nói chuyện với Docker daemon qua socket — phổ biến trong CI
// ⚠️ mount docker.sock = cấp quyền root của host — chỉ mount khi hiểu rõ!
```

---

## ⚖️ Unix Socket vs TCP localhost

| Tiêu chí | Unix socket | TCP localhost |
|---|---|---|
| Tốc độ | nhanh hơn (không TCP overhead) | chậm hơn chút |
| Bảo mật | file permission | mọi process máy kết nối được |
| Port conflict | không | có |
|跨 network | không | có |
| Dùng cho | cùng máy | phân tán |

---

## ⚠️ Bẫy Thường Gặp

1. **Quên unlink socket file cũ** — server restart báo "address in use". `unlink` trước khi bind (hoặc SO_REUSEADDR).
2. **Path quá dài** — đường dẫn socket giới hạn ~108 ký tự (sun_path). Tránh thư mục lồng sâu.
3. **Docker mount socket = root host** — hiểu rủi ro trước khi mount docker.sock vào container.
4. **Không unlink khi crash** — bind lần sau lỗi "address already in use". Bắt lỗi EADDRINUSE và unlink rồi thử lại.
5. **Nhầm socket file với regular file** — `rm` socket file là an toàn khi không server nào đang nghe, nhưng `cat` nó không được.

---

## 📝 Bài Tập Tự Vấn

1. Benchmark TCP localhost vs Unix socket cho 10k nhỏ request/s — kết quả? Vì sao?
2. Container A nói chuyện với container B trên cùng host — 3 cách, ưu nhược?
3. Quy trình graceful shutdown: server ngừng nhận connection mới, xử lý hết yêu cầu đang chạy, rồi thoát.

---

*Leaf thuộc [Lớp 25 — IPC](../README.md)*
