# 📡 25.4 Signals & Signal Handling (Tín Hiệu)

> **Signal là "tiếng gõ cửa" của OS vào process:** dừng lại (SIGTERM), kết thúc
> ngay (SIGKILL), reload config (SIGHUP), Ctrl+C (SIGINT). Graceful shutdown —
> không mất request, không mất dữ liệu — phụ thuộc hoàn toàn vào xử lý SIGTERM đúng.

> Liên quan: `08.10-sre-slo` (shutdown mà không drop request), `12-concurrency`
> (background task đang chạy), `21.4-configuration-management` (SIGHUP reload config).

---

## 🎯 Vấn Đề

`docker stop` gửi SIGTERM, chờ 10s, rồi SIGKILL. Nếu app không xử lý SIGTERM:
- Request đang xử lý bị cắt giữa chừng
- Dữ liệu ghi dở mất
- Kết nối DB không đóng sạch → pool bị rò rỉ

```
SIGTERM  — "xin mời dừng" (có thể xử lý: dọn dẹp rồi thoát)
SIGKILL  — "dừng NGAY" (KHÔNG thể xử lý/bị chặn — kernel giết thẳng)
SIGINT   — Ctrl+C từ bàn phím
SIGHUP   — truyền thống: reload config
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Node.js graceful shutdown chuẩn =====
const connections = new Set<net.Socket>();
const server = net.createServer((socket) => {
  connections.add(socket);
  socket.on("close", () => connections.delete(socket));
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;      // tránh xử lý 2 lần
  shuttingDown = true;
  console.log(`Nhận ${signal} — graceful shutdown`);
  server.close(() => process.exit(0));          // ngừng nhận connection mới
  // Chờ tối đa 10s cho các yêu cầu đang chạy
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM")); // docker stop gửi cái này
process.on("SIGINT",  () => void shutdown("SIGINT"));  // Ctrl+C
// Sau khi shutdown xong: đóng DB pool, flush log, commit checkpoint

// ===== SIGHUP: reload config không downtime =====
process.on("SIGHUP", () => {
  config = loadConfig();  // đọc lại file config (xem 21.4)
  logger.info("Config reloaded");
});

// ===== Bắt lỗi "unhandled" — before exit (không bắt được SIGKILL) =====
process.on("beforeExit", (code) => console.log("Sắp thoát:", code));
// ⚠️ SIGKILL không bắt được — OS giết ngay; chuẩn bị dữ liệu TRƯỚC, đừng trông chờ signal
```

---

## ⚖️ SIGTERM vs SIGKILL vs SIGINT

| Signal | Bắt được? | Ý nghĩa | Ai gửi |
|---|---|---|---|
| SIGTERM | ✓ | "hãy dừng gọn" | `kill`, docker stop, k8s |
| SIGKILL | ✗ (kernel giết ngay) | "dừng bằng mọi giá" | OS, kill -9 |
| SIGINT | ✓ | Ctrl+C | terminal |
| SIGHUP | ✓ | reload config (truyền thống) | `kill -HUP` |

---

## ⚠️ Bẫy Thường Gặp

1. **Quên handler SIGTERM** — container bị kill sau timeout, request giữa chừng mất.
2. **Shutdown xử lý quá lâu** — nên có timeout (VD 10s) rồi thoát cưỡng bức, tránh treo container.
3. **SIGKILL không chặn được** — dữ liệu quan trọng phải tự persist định kỳ, không trông chờ signal.
4. **Load balancer không biết pool đang drain** — khi nhận SIGTERM, bỏ khỏi service discovery trước rồi mới thoát (k8s preStop hook).
5. **Danh sách connection không set mới để đóng sau khi xử lý xong** — handler phải kiểm tra cờ `shuttingDown` trước khi xử lý.

---

## 📝 Bài Tập Tự Vấn

1. Viết web server Node graceful shutdown: ngừng nhận mới, chờ yêu cầu đang chạy, đóng DB, flush log, thoát.
2. Kubernetes rolling update: pod cũ cần hoàn thành job 30s nhưng terminationGracePeriodSeconds = 10 — sửa gì?
3. Tại sao SIGKILL không bị chặn? Vậy dữ liệu an toàn thế nào khi bị SIGKILL?

---

*Leaf thuộc [Lớp 25 — IPC](../README.md)*
