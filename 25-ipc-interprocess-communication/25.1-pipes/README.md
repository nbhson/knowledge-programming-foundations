# 🚰 25.1 Pipes & FIFOs (Ống Dẫn)

> **Pipe là "băng chuyền 1 chiều" giữa 2 process.** `grep error log.txt | wc -l`
> chính là pipe: stdout của grep chảy vào stdin của wc. Kernel đệm dữ liệu, producer
> chậm/consumer nhanh đều hoạt động — backpressure miễn phí.

> Liên quan: `21.3-cli-shell-scripting` (pipes trong shell), `12.10-backpressure`,
> `25.4-signals-signal-handling` (SIGPIPE khi đầu kia đóng).

---

## 🎯 Vấn Đề

2 process độc lập, memory cách ly — làm sao chuyển dữ liệu trực tiếp?
- Pipe vô danh: tạo bằng `pipe()` trước `fork()` → chỉ dùng cho process cha/con.
- FIFO (named pipe): có tên trên filesystem → process bất kỳ mở được.

```
pipe():  write_end ──buffer kernel──> read_end
shell:   cat file | grep "err" | wc -l    (3 process, 2 pipe)
```

---

## 💻 Code Ví Dụ

```typescript
import { spawn } from "node:child_process";

// ===== Pipe trong shell: stdout process trước → stdin process sau =====
const child = spawn("bash", ["-c", "cat huge.log | grep ERROR | wc -l"]);
child.stdout.on("data", (chunk) => console.log(`Số dòng ERROR: ${chunk}`));

// ===== Node: IPC 2 chiều với process con =====
import { fork } from "node:child_process";
const worker = fork("./worker.js");
worker.send({ task: "resize", image: "a.png" });       // qua IPC channel built-in
worker.on("message", (msg) => console.log("Worker trả:", msg));
// worker.js: process.on("message", ...); process.send({ done: true })
// Channel này thực chất là unix socket/pipe được OS quản — serialize tự động

// ===== Named pipe (FIFO): 2 process KHÔNG liên quan họ hàng =====
// mkfifo /tmp/myfifo
// terminal 1: cat /tmp/fifo        (đợi dữ liệu)
// terminal 2: echo "hello" > /tmp/fifo  → terminal 1 nhận "hello"

// ===== SIGPIPE: viết vào pipe khi đầu đọc đã đóng =====
// VD: head -1 hugefile | my_program
//     head thoát sớm → grep viết tiếp → nhận SIGPIPE → chết êm (đúng hành vi Unix)
```

---

## ⚖️ Pipe vs Named Pipe (FIFO)

| | Pipe (ẩn danh) | Named pipe (FIFO) |
|---|---|---|
| Phạm vi | process cha/con | mọi process |
| Tồn tại | chỉ khi process sống | file tồn tại đến khi xóa |
| Shell | `cmd1 | cmd2` | `mkfifo`, `>` viết, `<` đọc |

---

## ⚠️ Bẫy Thường Gặp

1. **Pipe buffer đầy:** mặc định ~64KB — consumer đọc chậm mà producer không đọc 'drain' → deadlock (cả 2 chờ nhau).
2. **Quên đóng write end:** reader chờ EOF mãi vì writer chưa đóng. Đóng hết fd không dùng.
3. **SIGPIPE giết process:** ghi vào pipe không còn reader → signal SIGPIPE mặc định KILL process. Xử lý hoặc bỏ qua có ý thức.
4. **Deadlock khi chờ 2 chiều:** process A ghi đệm đầy trong khi B chờ A đọc → kẹt. Đọc/ghi song song (select/poll).
5. **Con trỏ vị trí file không chia sẻ qua pipe** — pipe chỉ là byte stream, không có khái niệm "vị trí file".

---

## 📝 Bài Tập Tự Vấn

1. Viết Node script: chạy `ps aux | grep node | wc -l` bằng 2 child process nối pipe.
2. Pipe 64KB đầy khi producer chưa kịp đọc — điều gì xảy ra 2 bên? Làm sao tránh deadlock?
3. Named pipe vs TCP localhost: khi nào dùng cái nào?

---

*Leaf thuộc [Lớp 25 — IPC](../README.md)*
