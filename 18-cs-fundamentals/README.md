# 🖥️ Lớp 18: CS Fundamentals (Nền Tảng Khoa Học Máy Tính)

> **CS Fundamentals** là kiến thức "dưới mặt nước" của mọi chương trình:
> hệ điều hành, bộ nhớ, mã hóa dữ liệu, số học máy tính và trình biên dịch —
> hiểu chúng giúp bạn debug nhanh hơn và viết code ít bất ngờ hơn.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 18.1 | Operating Systems | Process/thread, scheduling, deadlock | [18.1-operating-systems](18.1-operating-systems/README.md) |
| 18.2 | Memory & Storage | Stack/heap, virtual memory, cache locality | [18.2-memory-storage](18.2-memory-storage/README.md) |
| 18.3 | Encoding Data | ASCII/UTF-8, endianness, base64/hex | [18.3-encoding-data](18.3-encoding-data/README.md) |
| 18.4 | Numbers & Math | IEEE-754, 0.1+0.2, BigInt/Decimal, overflow | [18.4-numbers-math](18.4-numbers-math/README.md) |
| 18.5 | Compilers & Interpreters | Lex/parse/eval, mini expression evaluator | [18.5-compilers-interpreters](18.5-compilers-interpreters/README.md) |

---

## 📖 Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│  PHẦN CỨNG (CPU / RAM / Disk)                           │
│       │                                                 │
│       ▼                                                 │
│  18.1 OS ──► quản lý process, thread, lịch CPU          │
│  18.2 MEMORY ──► stack/heap, trang nhớ ảo, cache        │
│       │                                                 │
│       ▼                                                 │
│  18.3 ENCODING ──► bit → ký tự → byte (UTF-8, base64)   │
│  18.4 NUMBERS ──► bit → số (IEEE-754, BigInt)           │
│       │                                                 │
│       ▼                                                 │
│  18.5 COMPILERS ──► text → token → AST → kết quả        │
└─────────────────────────────────────────────────────────┘
```

| Leaf | Câu hỏi trả lời |
|---|---|
| 18.1 OS | Ai được dùng CPU tiếp theo? Khi nào hệ thống kẹt (deadlock)? |
| 18.2 Memory | Biến sống ở đâu? Vì sao duyệt mảng theo hàng nhanh hơn theo cột? |
| 18.3 Encoding | "é" tốn mấy byte? Vì sao ảnh gửi qua JSON phải base64? |
| 18.4 Numbers | Vì sao `0.1 + 0.2 !== 0.3`? Khi nào dùng BigInt? |
| 18.5 Compilers | Code text biến thành hành động thế nào? |

---

## 🗺️ Lộ Trình Học

1. **18.1 → 18.2**: hiểu tiến trình và bộ nhớ — hai tài nguyên OS quản lý.
2. **18.3 → 18.4**: hiểu dữ liệu ở mức bit — chữ và số thực ra chỉ là byte.
3. **18.5**: khép lại bằng cách ngôn ngữ lập trình biến text thành thực thi.

Thứ tự gợi ý: `18.1 → 18.2 → 18.3 → 18.4 → 18.5`.

---

## ▶️ Chạy Ví Dụ

```bash
# Ví dụ mô phỏng Round-Robin scheduler
cd 18-cs-fundamentals/18.1-operating-systems
npx ts-node examples/index.ts

# Ví dụ mini expression evaluator
cd ../18.5-compilers-interpreters
npx ts-node examples/index.ts
```

Mọi ví dụ thuần TypeScript, strict ES2020, không dependencies ngoài.

---

## ⏭️ Bài Tiếp Theo

→ [18.1 Operating Systems](18.1-operating-systems/README.md) — process, thread và scheduling.
