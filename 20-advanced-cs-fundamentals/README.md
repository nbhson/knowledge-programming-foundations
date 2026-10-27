# 🎓 Lớp 20: Advanced CS Fundamentals (Nền Tảng CS Nâng Cao)

> **Nền tảng "ngoài sách giáo khoa":** toán rời rạc, thao tác bit, số học dấu phẩy động,
> định dạng serialize và xử lý text — những thứ mọi linter, ORM, crypto, game engine
> đều dựa vào nhưng ít ai học bài bản.

> Liên quan: `18-cs-fundamentals` (nền tảng cơ bản), `06-data-structures-and-algorithms` (độ phức tạp),
> `26-cryptography-advanced` (bit & toán học ứng dụng).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 20.1 | Discrete Mathematics | Sets, logic, đếm, đồ thị, chứng minh | [20.1-discrete-mathematics](20.1-discrete-mathematics/README.md) |
| 20.2 | Bit Manipulation | AND/OR/XOR, shift, mask, endianness | [20.2-bit-manipulation](20.2-bit-manipulation/README.md) |
| 20.3 | Floating Point Precision | IEEE-754, epsilon, overflow, Decimal | [20.3-floating-point-precision](20.3-floating-point-precision/README.md) |
| 20.4 | Serialization Formats | JSON, XML, YAML, Protobuf, Avro | [20.4-serialization-formats](20.4-serialization-formats/README.md) |
| 20.5 | Text & Regex Processing | Regex, automata, matching algorithms | [20.5-text-regex-processing](20.5-text-regex-processing/README.md) |

---

## 📖 Tổng Quan

```
        TOÁN RỜI RẠC (20.1)  ◄── ngôn ngữ của mọi chứng minh CS
               │
        BIT (20.2)  ◄── tầng thấp nhất: mọi thứ là 0/1
               │
   ┌───────────┴───────────┐
   ▼                       ▼
  SỐ (20.3)              TEXT (20.5)
  IEEE-754, precision    regex, matching
   │                       │
   └───────────┬───────────┘
               ▼
        ĐỊA DẠNG (20.4)  ◄── đóng gói dữ liệu để lưu/truyền: JSON, Protobuf...
```

---

## 🎯 Khi Nào Cần Đến Đây?

| Tình huống | Folder cần đọc |
|---|---|
| Test hết 0.1 + 0.2 ≠ 0.3, tiền bị sai vài xu | 20.3 Floating Point |
| Làm embedded, flag options, permission bitmask | 20.2 Bit Manipulation |
| Service A (Go) gửi struct cho service B (TS) bị lệch dữ liệu | 20.4 Serialization |
| Regex chạy chậm treo CPU (ReDoS) | 20.5 Text & Regex |
| Đọc paper CS không hiểu ký hiệu ∑, ∈, O(·) chính thức | 20.1 Discrete Math |

---

## 🔗 Liên Kết Chéo

- **Encoding byte ↔ ký tự:** xem `18-cs-fundamentals/18.3-encoding-data`
- **Số học cơ bản (0.1+0.2):** xem `18-cs-fundamentals/18.4-numbers-math` — 20.3 đi sâu hơn
- **Hash dùng bit rất nhiều:** xem `26-cryptography-advanced/26.1-hashing`
- **Độ phức tạp Big-O:** xem `06-data-structures-and-algorithms/6.1-time-complexity`

---

## 📖 Tài Nguyên Tham Khảo

- *Concrete Mathematics* — Graham, Knuth, Patashnik (toán rời rạc cho lập trình)
- *Hacker's Delight* — Henry Warren (thủ thuật bit kinh điển)
- *What Every Computer Scientist Should Know About Floating-Point Arithmetic* — David Goldberg
- MIT 6.042J *Mathematics for Computer Science* (free trên OCW)
