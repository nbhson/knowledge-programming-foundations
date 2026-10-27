# 🔀 Lớp 25: IPC — Inter-Process Communication (Giao Tiếp Giữa Các Tiến Trình)

> **Các process cách ly bộ nhớ với nhau — muốn nói chuyện phải qua "kênh" của OS.**
> Pipe, socket, shared memory, signal — nền của kiến trúc microservice, job queue,
> và mọi CLI tool gọi lẫn nhau.

> Liên quan: `12-concurrency` (threads CÙNG process, IPC là GIỮA process),
> `11.7-tcp-udp` (socket), `18.1-operating-systems` (process model),
> `13.8-message-queues` (IPC ở mức hệ phân tán).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 25.1 | Pipes & FIFOs | stdin/stdout, named pipe | [25.1-pipes](25.1-pipes/README.md) |
| 25.2 | Shared Memory | nhanh nhất, cần đồng bộ | [25.2-shared-memory](25.2-shared-memory/README.md) |
| 25.3 | Unix Domain Sockets | IPC cục bộ hiệu năng cao | [25.3-unix-domain-sockets](25.3-unix-domain-sockets/README.md) |
| 25.4 | Signals & Signal Handling | SIGTERM, graceful shutdown | [25.4-signals-signal-handling](25.4-signals-signal-handling/README.md) |

---

## 📖 Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│                    KỄNH LIÊN LẠC IPC                    │
├──────────────────────────────────────────────────────────┤
│  PIPES (25.1)     — một chiều, có họ hàng (fork)         │
│  NAMED PIPE/FIFO  — một chiều, process bất kỳ            │
│  SHARED MEMORY    — nhanh nhất, cần tự đồng bộ (lock)     │
│  UNIX SOCKET      — hai chiều, giống TCP nhưng nội bộ      │
│  SIGNALS          — thông báo sự kiện (SIGTERM, SIGKILL)   │
│  MESSAGE QUEUE    — hàng đợi kernel                        │
└──────────────────────────────────────────────────────────┘
     Tốc độ: shared memory > unix socket > pipe > TCP localhost
```

---

## 🎯 Khi Nào Cần IPC?

| Tình huống | Cơ chế |
|---|---|
| CLI output nối vào CLI khác | Pipe (`grep | wc -l`) |
| Worker pool (multi-core CPU) | Shared memory + message |
| Redis/PostgreSQL cục bộ | Unix domain socket |
| Docker dừng container gracefully | SIGTERM handler |

---

## 🔗 Liên Kết Chéo

- **Thread trong cùng process:** `12-concurrency`
- **Message queue phân tán:** `13.8-message-queues`
- **Process shutdown đúng cách:** `08.9-observability` (graceful shutdown metric)

---

## 📖 Tài Nguyên Tham Khảo

- *The Linux Programming Interface* — Kerrisk (chương pipes, signals, sockets)
- Beej's Guide to Unix IPC (free)
- Node.js `child_process`, `worker_threads` docs
