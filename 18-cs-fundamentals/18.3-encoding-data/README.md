# 🔤 18.3 Encoding Data (Mã Hóa Dữ Liệu)

> **Máy tính chỉ lưu bit:** mọi chữ, ảnh, số gửi đi đều phải mã hóa thành byte theo quy ước chung
> (ASCII/UTF-8, endianness, base64/hex) — sai quy ước một đầu là đầu kia đọc ra rác.

---

## 🎯 Vấn Đề

"é" lưu mấy byte? Vì sao file CSV tiếng Việt mở ra toàn "Ã©"? Vì sao JSON không gửi được ảnh raw
mà phải base64 (phình +33%)? Vì sao cùng 4 byte `0x01020304` máy này đọc ra số khác máy kia
(endianness)? Mỗi câu hỏi là một lớp encoding khác nhau: ký tự → byte (UTF-8), byte → text an toàn (base64/hex),
thứ tự byte (endian).

```
"é" (U+00E9) ──UTF-8──► [0xC3, 0xA9] (2 byte) ──đọc nhầm Latin-1──► "Ã©" (mojibake)
Ảnh raw bytes ──base64──► "iVBORw0..." (text, +33% dung lượng) ──► gửi qua JSON an toàn
```

---

## 💻 Code Ví Dụ

```typescript
// UTF-8 thủ công cho BMP cơ bản: ASCII 1 byte, còn lại 2 byte (đủ minh họa nguyên lý)
function utf8EncodeChar(codePoint: number): number[] {
  if (codePoint < 0x80) return [codePoint];
  return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
}

function utf8DecodeChar(bytes: number[]): { codePoint: number; size: number } {
  if (bytes[0] < 0x80) return { codePoint: bytes[0], size: 1 };
  return { codePoint: ((bytes[0] & 0x1f) << 6) | (bytes[1] & 0x3f), size: 2 };
}

// Base64 thuần TS (bảng chữ cái chuẩn RFC 4648), Hex cho debug/hash
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Endianness với DataView: cùng 4 byte, đọc BE vs LE ra 2 số khác nhau
function endianDemo(): { be: number; le: number } {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint8(0, 0x01); view.setUint8(1, 0x02); view.setUint8(2, 0x03); view.setUint8(3, 0x04);
  return { be: view.getUint32(0, false), le: view.getUint32(0, true) };
}
```

> Encode/decode đầy đủ (UTF-8, base64, hex, endianness, mojibake demo) trong `examples/index.ts` —
> chạy bằng `npx tsx examples/index.ts`. Không dùng Buffer (thuần ES2020).

---

## ✅ Lợi Ích

| Kỹ năng | Lợi ích |
|---|---|
| Đọc được mojibake | Chẩn đoán lỗi font/CSV/API sai charset trong 1 phút |
| base64/hex đúng chỗ | Gửi binary qua JSON, debug hash/signature |
| Endianness | Đọc đúng giao thức mạng/file binary (network order = big-endian) |
| UTF-8 mental model | Hiểu vì sao `string.length` khác số ký tự hiển thị (surrogate/emoji) |

---

## ⚠️ Lưu Ý

- Base64 phình +33% — ảnh lớn nên gửi binary/multipart, đừng nhét base64 vào JSON trừ khi bắt buộc.
- `string.length` trong JS đếm UTF-16 code units: emoji `"😀".length === 2` — dùng `Array.from(s).length` để đếm ký tự.
- Luôn khai báo charset (header `utf-8`, `<meta charset>`) ở cả hai đầu; đừng đoán mò encoding.

---

## 🎯 Khi Nào Dùng

- Gọi API/file bị lỗi tiếng Việt: kiểm tra charset trước khi đổ lỗi backend.
- Upload/download file, WebSocket binary, crypto/hash: hex/base64/DataView là công cụ chính.
- Parse giao thức mạng, file định dạng custom: đọc đúng endian + offset.

---

## 🚀 Đi Sâu Thêm

**Base64 overhead +33% — khi nào dùng, khi nào không:**
- 3 bytes → 4 base64 chars (+ 25%) + padding (`=`). Ảnh 1MB gửi base64 trong JSON → ~1.33MB. → Gửi ảnh qua JSON chỉ khi bắt buộc (canvas toDataURL, JWT claim). Thực tế: multipart/form-data hoặc binary stream.
- Encode tùy chọn: **base16 (hex)** cho debug/hash/output dễ đọc; **base64url** (RFC 4648 §5) thay `+/\=` bằng `-_.` an toàn trong URL/base64 JSON.

**UTF-8 vs UTF-16 — chọn gì:**

| | UTF-8 | UTF-16 |
|---|---|---|
| ASCII (A–Z, 0–9) | 1 byte | 2 byte |
| Latin + European | 1–2 byte | 2 byte |
| CJK (Hán, Hiragana...) | 3 byte | 2–4 byte |
| Khi nào dùng | Web/JSON/HTTP (mặc định), Unix, English-heavy | Windows (API Win32), JavaScript engines (V8 dùng UTF-16 bên trong), CJK-heavy storage |
| BOM (Byte Order Mark) | Không cần (self-synchronizing) | Cần `\xFF\xFE` (LE) hoặc `\xFE\xFF` (BE) |

- Web: **luôn UTF-8**. File `.txt` / `.html` / `.json` / HTTP `Content-Type: utf-8` → dùng UTF-8, không thêm BOM (BOM thường gây lỗi JSON parse hoặc hiển thị ký tự lạ ở đầu file).

**Surrogate pairs — emoji ≠ 1 ký tự trong JS:**

```typescript
"😀".length          // = 2  (U+1F600 = surrogate pair: 0xD83D 0xDE00)
"é".length           // = 1  (U+00E9, 1 code unit UTF-16)

// Đếm ký tự Unicode thực sự:
Array.from("😀🎉").length  // = 2  (dùng spread, tự split surrogate pairs)

// Regex:
/\p{Emoji}/gu.test("😀")  // = true (Unicode property escapes, ES2018+)
```

- Bug phổ biến: `str.substring(0, 5)` cắt giữa surrogate pair → ra ký tự rác. Dùng `Intl.Segmenter` hoặc `Array.from(str).slice(0, 5).join('')`.

---

## 🔗 Liên Quan

- [18.4 Numbers & Math](../18.4-numbers-math/README.md) — số cũng là byte (IEEE-754).
- [09-security](../../09-security/README.md) — encoding vs encryption vs hashing (đừng nhầm base64 là bảo mật).
- [11-networking-apis](../../11-networking-apis/README.md) — charset trong HTTP headers.

---

## 📚 Tài Liệu

- 📖 [UTF-8 Everywhere](https://utf8everywhere.org/)
- 📖 [MDN: TextEncoder / DataView](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder)
- 📖 *RFC 4648 — Base16/Base32/Base64* (IETF)

---

## ⏭️ Bài Tiếp Theo

→ [18.4 Numbers & Math](../18.4-numbers-math/README.md)
