# 🗂️ 24.1 File Descriptors & Streams (Mô Tả Tệp & Luồng)

> **File descriptor là số nguyên đại diện "cửa" mở tới dữ liệu.** Có giới hạn
> (thường 1024 mặc định!) — quên đóng = "Too many open files". Stream = đọc/ghi
> từng mảnh thay vì cả file vào RAM — cách duy nhất xử lý file lớn hơn memory.

> Liên quan: `12.10-backpressure` (stream nghẽn), `21.3-cli-shell-scripting`
> (stdout/stderr chính là fd), `18.2-memory-storage` (RAM vs disk).

---

## 🎯 Vấn Đề

```js
// ❌ Đọc CẢ file 5GB vào RAM:
const content = fs.readFileSync("huge.log", "utf8"); // OOM, process chết
// ✅ Stream: đọc từng chunk 64KB, xử lý rồi quên — RAM ổn định bất kể file lớn
```

Và mỗi file/socket mở là 1 fd — server xử lý 5000 concurrent connection + quên
đóng response → chạm giới hạn ulimit → chết toàn bộ service.

---

## 🧠 File Descriptor & Standard Streams

```
FD 0 = stdin  (đầu vào chuẩn)
FD 1 = stdout (đầu ra chuẩn)
FD 2 = stderr (lỗi)         → trong shell: 2>err.log, 1>out.log
Mỗi open()/socket tạo fd mới: 3, 4, 5... đóng bằng close(fd)
ulimit -n: giới hạn fd mỗi process (mặc định 1024 — server thật phải tăng)
```

---

## 💻 Code Ví Dụ

```typescript
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

// ===== Stream: xử lý file lớn mà không tốn RAM =====
// Đọc file 5GB, đếm số dòng — RAM chỉ dùng ~1 buffer
async function countLines(path: string): Promise<number> {
  let lines = 0, leftover = "";
  const stream = createReadStream(path, { encoding: "utf8" });
  for await (const chunk of stream) {
    lines += (leftover + chunk).split("\n").length - 1;
    leftover = (leftover + chunk).slice((leftover + chunk).lastIndexOf("\n") + 1);
  }
  return lines + (leftover ? 1 : 0);
}

// ===== pipeline: nối stream + tự dọn khi lỗi (QUAN TRỌNG hơn manual pipe) =====
await pipeline(
  createReadStream("access.log"),
  createGzip(),                    // nén khi data chảy qua — không nằm đệm cả file
  createWriteStream("access.log.gz"),
);
// pipeline tự: destroy cả 3 stream nếu 1 cái lỗi — không leak fd

// ===== Bẫy kinh điển: pipe không xử lý lỗi =====
// readStream.pipe(gzip).pipe(writeStream);
// writeStream lỗi → readStream KHÔNG đóng → leak fd. Dùng pipeline luôn.

// ===== Backpressure: producer nhanh hơn consumer =====
// writable.write(chunk) trả FALSE khi buffer đầy → phải đợi 'drain'
// (hoặc dùng pipeline — nó tự xử lý backpressure cho bạn)

// ===== Sync vs Async: sync chặn EVENT LOOP =====
// fs.readFileSync trong server → toàn bộ request khác đứng đợi disk!
// Chỉ dùng sync lúc khởi động (đọc config), không bao giờ trong request handler.
```

---

## ⚖️ Đọc Ghi File: 3 Cách

| Cách | RAM | Tốc độ | Dùng khi |
|---|---|---|---|
| `readFile` (sync/async cả file) | = file size | nhanh với file nhỏ | config, file < vài MB |
| Stream | hằng số nhỏ | line-by-line | file lớn, ETL, log |
| `mmap` (memory-mapped) | OS quản | ngẫu nhiên nhanh | DB engine, edit binary |

---

## ⚠️ Bẫy Thường Gặp

1. **Quên close/destroy stream khi lỗi** — leak fd, chạm ulimit, server chết. Dùng `pipeline`.
2. **readFileSync trong request handler** — chặn event loop, mọi request khác đứng.
3. **Đọc cả file lớn vào RAM** — dùng stream.
4. **Không xử lý backpressure** — `write()` trả false mà vẫn viết tiếp → OOM.
5. **fsync vs write:** write vào OS cache ≠ an toàn trên đĩa — mất điện mất dữ liệu. DB ghi quan trọng phải fsync.
6. **Tập tin tạm không xóa khi crash** — dùng `trap` (bash) hoặc try/finally + tmpdir tự dọn.

---

## 📝 Bài Tập Tự Vấn

1. Server "Too many open files" sau vài giờ chạy — quy trình tìm fd leak?
2. Đọc file 20GB và đếm tần suất từng từ: thiết kế pipeline stream?
3. `fsync` mỗi lần ghi vs ghi batch: trade-off độ bền vs throughput?

---

*Leaf thuộc [Lớp 24 — File Systems & IO](../README.md)*
