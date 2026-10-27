# 💾 Lớp 24: File Systems & IO (Hệ Thống Tệp & Nhập/Xuất)

> **File là nơi dữ liệu tồn tại lâu dài nhất — qua cả process restart.**
> Nhưng đĩa chậm, file descriptor có giới hạn, path cross-platform khác nhau,
> stream có thể nghẽn. Hiểu để dùng hiệu quả và tránh resource leak.

> Liên quan: `18.2-memory-storage` (stack/heap vs disk), `20.4-serialization-formats`
> (định dạng file), `24-file-systems-io/24.2-path-manipulation` (cross-platform path).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 24.1 | File Descriptors & Streams | fd, buffering, pipe | [24.1-file-descriptors-streams](24.1-file-descriptors-streams/README.md) |
| 24.2 | Path Manipulation | cross-platform, symlinks | [24.2-path-manipulation](24.2-path-manipulation/README.md) |
| 24.3 | Binary File IO | buffer, ArrayBuffer, binary format | [24.3-binary-file-io](24.3-binary-file-io/README.md) |

---

## 📖 Tổng Quan

```
Ứng dụng viết/đọc bytes
    │
    ▼
File Descriptor (số nguyên) ── tờ giấy đại diện tệp trong OS
    │
    ▼
Kernel buffer (OS) ── đệm đọc/ghi, giảm I/O call
    │
    ▼
Disk cache ── L1/L2/L3 cache của disk controller
    │
    ▼
PHYSICAL DISK ── SSD/HDD
```

---

## 🔗 Liên Kết Chéo

- **File locking, race condition:** `12.5-race-conditions`
- **Config file:** `21.4-configuration-management`
- **Log file:** `22.2-logging-best-practices`

---

## 📖 Tài Nguyên Tham Khảo

- *The Linux Programming Interface* — Michael Kerrisk (file descriptor chuẩn)
- Node.js `fs` docs, `fs/promises`
- POSIX file APIs
