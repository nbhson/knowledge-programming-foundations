# 🧬 24.3 Binary File IO (Đọc Ghi Nhị Phân)

> **Mọi file về bản chất là bytes — "text" chỉ là quy ước encoding.** PNG, PDF,
> SQLite, class file Java... đều là binary format có cấu trúc. Đọc/ghi binary
> đúng = kiểm soát từng byte: magic number, endianness, alignment.

> Liên quan: `18.3-encoding-data` (byte ↔ ký tự), `20.2-bit-manipulation` (bit level),
> `20.4-serialization-formats` (định dạng dữ liệu), `20.3-floating-point-precision`.

---

## 🎯 Vấn Đề

```js
// Đọc PNG như text → dữ liệu hỏng vì UTF-8 decode biến đổi byte
// Cần: đọc raw bytes, hiểu cấu trúc header, biết endianness
PNG header: 89 50 4E 47 0D 0A 1A 0A  ("magic number" nhận diện format)
Sau đó: chunk = [length(4B)][type(4B)][data][crc(4B)]
```

---

## 🧠 Khái Niệm Cốt Lõi

```
MAGIC NUMBER  — byte đầu nhận diện format: PNG (89 50 4E 47), PDF (%PDF), ZIP (PK)
ENDIANNESS    — int 32-bit 0x12345678 lưu: [12,34,56,78] (big) hay [78,56,34,12] (little)
ALIGNMENT     — struct C chèn padding để truy cập nhanh → sizeof ≠ tổng các trường
BUFFER        — vùng nhớ thô, không có "kiểu" — bạn tự diễn giải
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Buffer: vùng nhớ bytes thô =====
const buf = Buffer.alloc(8);            // 8 bytes zero
buf.writeUInt32LE(0x12345678, 0);       // ghi int32 little-endian tại offset 0
buf.writeUInt32BE(0x12345678, 4);       // big-endian tại offset 4
console.log(buf.toString("hex"));
// "7856341278563412"? Không — LE: 78 56 34 12; BE: 12 34 56 78
// → cùng 1 số, 2 thứ tự byte — endianness quyết định

// ===== DataView: đọc nhiều kiểu trên 1 buffer =====
const dv = new DataView(buf.buffer);
dv.getUint32(0, true);   // little-endian: 0x12345678
dv.getUint32(4, false);  // big-endian:  0x12345678

// ===== Đọc PNG header: kiểm tra magic number =====
function isPng(bytes: Uint8Array): boolean {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return magic.every((b, i) => bytes[i] === b);
}

// ===== Struct: định nghĩa layout binary (giống struct C) =====
// Header: version(u8) | flags(u8) | width(u16 LE) | height(u16 LE) | timestamp(f64)
interface ImgHeader { version: number; flags: number; width: number; height: number; ts: number }
function parseHeader(b: Buffer): ImgHeader {
  return {
    version: b.readUInt8(0),
    flags:   b.readUInt8(1),
    width:   b.readUInt16LE(2),   // 2 bytes
    height:  b.readUInt16LE(4),
    ts:      b.readDoubleLE(6),   // 8 bytes — tổng offset 14
  };
}
// Bẫy: QUÊN offset hoặc sai endianness → giá trị "rác" không báo lỗi!

// ===== Ghi binary + round-trip test (bắt buộc) =====
function writeHeader(h: ImgHeader): Buffer {
  const b = Buffer.alloc(14);
  b.writeUInt8(h.version, 0);
  b.writeUInt8(h.flags, 1);
  b.writeUInt16LE(h.width, 2);
  b.writeUInt16LE(h.height, 4);
  b.writeDoubleLE(h.ts, 6);
  return b;
}
// Round-trip: parseHeader(writeHeader(x)) phải === x — test này bắt mọi sai lệch layout
```

---

## ⚖️ Text vs Binary Format

| Tiêu chí | Text (JSON/CSV) | Binary (Protobuf/binary struct) |
|---|---|---|
| Đọc bằng mắt | ✓ | ✗ (cần tool) |
| Kích thước | lớn | nhỏ 2-10x |
| Schema thay đổi | dễ | cần versioning chặt |
| Precision | có thể mất | chính xác (byte-level) |
| Xử lý lỗi | parse lỗi rõ | lệch 1 byte = toàn bộ sai |

---

## ⚠️ Bẫy Thường Gặp

1. **Sai endianness** — đọc big-endian file bằng little-endian API → số "khủng khiếp" mà không lỗi. Kiểm tra spec format + round-trip test.
2. **Sai offset** — sửa struct quên cập nhật offset kế tiếp → toàn bộ phía sau lệch.
3. **Padding của compiler** — struct C có padding, đọc theo tổng kích thước field là sai. Dùng `#pragma pack` hoặc đọc từng field.
4. **Buffer/ArrayBuffer nhầm lẫn** — `Buffer.byteLength` ≠ `string.length` (UTF-8 nhiều byte/ký tự).
5. **Xử lý file dùng text API** — `fs.readFile(path, "utf8")` biến đổi bytes. Binary: không truyền encoding.
6. **Không round-trip test** — ghi rồi đọc lại phải bằng nhau; không có test = bug im lặng.

---

## 📝 Bài Tập Tự Vấn

1. Viết parser đọc phần header của BMP (54 byte) — width/height ở offset nào, endian gì?
2. Round-trip test cho struct — viết test bắt lỗi khi đổi layout.
3. Tại sao PNG dùng magic number thay vì extension file? (gợi ý: extension do user đặt)

---

*Leaf thuộc [Lớp 24 — File Systems & IO](../README.md)*
