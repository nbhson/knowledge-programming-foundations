# 🛤️ 24.2 Path Manipulation (Đường Dẫn Cross-Platform)

> **Path là bug cross-platform kinh điển nhất:** Windows dùng `\`, Unix dùng `/`;
> Windows không phân biệt hoa thường, Linux phân biệt; `C:\` vs `/`.
> Xử lý path bằng string concatenate là nguồn bug l mê.

> Liên quan: `24.1-file-descriptors-streams` (mở file), `9.4-xss-csrf`
> (path traversal là lỗ hổng bảo mật thật), `21.3-cli-shell-scripting`.

---

## 🎯 Vấn Đề

```js
// ❌ Ghép chuỗi:
const p = dir + "/" + filename;        // Windows: sai dấu \
const path2 = base + "/" + userInput;  // Path traversal: "../../etc/passwd"!
// user nhập "../../../etc/passwd" → đọc file hệ thống → bảo mật nổ

// ✅ Path API: đúng dấu \ hay /, xử lý .., chuẩn hóa
```

---

## 🧠 Path Traversal — Lỗ Hổng Bảo Mật Thực

```
app.get("/files/:name", (req, res) => {
  res.sendFile(`/data/${req.params.name}`);   // ❌
});
// GET /files/..%2F..%2Fetc%2Fpasswd → đọc file hệ thống!

Phòng thủ:
  1. path.resolve + kiểm tra kết quả nằm TRONG thư mục cho phép
  2. whitelist tên file (chữ/số/gạch), không bao giờ ghép raw input
```

---

## 💻 Code Ví Dụ

```typescript
import path from "node:path";

// ===== Luôn dùng path.join — đừng nối chuỗi =====
path.join("src", "components", "Button.tsx"); // "src/components/Button.tsx"
// path.join tự xử lý: "./a" + ".." → "."

// ===== path.join vs path.resolve vs __dirname =====
path.resolve("a", "b");     // tuyệt đối, từ cwd: /cwd/a/b
path.join("a", "..", "b");  // "b" — normalize, không kiểm tra tồn tại
path.relative("/a/b", "/a/c/d"); // "../c/d" — path từ A đến B

// ===== Kiểm tra path nằm TRONG thư mục cho phép (chống traversal) =====
import path from "node:path";
function safeJoin(base: string, userInput: string): string {
  const resolved = path.resolve(base, userInput);
  if (!resolved.startsWith(path.resolve(base) + path.sep)) {
    throw new Error("Path traversal detected!");
  }
  return resolved;
}
safeJoin("/data/uploads", "../../etc/passwd"); // throw — bảo vệ được

// ===== Cross-platform: không hard-code "/" hay "\\" =====
path.join("a", "b");      // mac/linux: "a/b"; Windows: "a\b"
path.win32.join("a", "b"); // ép Windows style — dùng khi parse path Windows trên Linux (CI)
path.posix.join("a", "b"); // luôn "/"

// ===== Symlink: path thật ≠ path hiển thị =====
// /link → /real: path.resolve("/link/file") không "đi theo" symlink
// fs.realpath() mới cho path vật lý — quan trọng khi check whitelist
```

---

## ⚖️ Ký Tự Đặc Biệt Trong Path

| Ký tự | Rủi ro | Xử lý |
|---|---|---|
| `..` | traversal ra ngoài | normalize + check prefix |
| `\0` (null byte) | cắt chuỗi ở C | chặn từ input |
| Khoảng trắng, unicode | shell quote sai | quote kỹ, mảng args |
| `~` | expansion trong shell | quote trước khi exec |
| Quá dài (>255 byte/tên) | lỗi OS | hash tên file dài |

---

## ⚠️ Bẫy Thường Gặp

1. **Nối path bằng string concat** — sai dấu `/`, lệch platform. Dùng `path.join`.
2. **Chấp nhận `..` từ user input** — path traversal (OWASP). Normalize rồi check prefix.
3. **Case sensitivity:** Windows/macOS không phân biệt, Linux phân biệt → bug chỉ xuất hiện trên 1 OS. Đưa về lower-case khi so sánh.
4. **URL path ≠ file path** — decode `%2e%2e` thành `..` rồi mới ghép path → traversal. Validate TRƯỚC khi decode.
5. **Temp file tên đoán được** (`/tmp/data`) — attacker tạo sẵn symlink. Dùng `mkdtemp`, mode 0600.
6. **Giới hạn tên file theo OS** — độ dài tối đa khác nhau, ký tự cấm (`:` trên Windows).

---

## 📝 Bài Tập Tự Vấn

1. Endpoint tải file `/download?name=report.pdf` — viết `safeJoin(baseDir, name)` chống traversal.
2. App chạy cả Windows/Linux — chiến lược lưu path trong config (relative? separator?)
3. Upload file: tên user tự đặt chứa emoji + space + `../` — quy trình lưu an toàn?

---

*Leaf thuộc [Lớp 24 — File Systems & IO](../README.md)*
