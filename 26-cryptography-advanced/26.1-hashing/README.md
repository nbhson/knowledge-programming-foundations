# #️⃣ 26.1 Hashing (Băm)

> **Hash = hàm một chiều: dữ liệu → vân tay cố định kích thước.** Không thể đảo ngược,
> đổi 1 bit đầu vào → output đổi hoàn toàn (avalanche). Nền của password storage,
> file integrity, hash table, blockchain.

> Liên quan: `9.8-password-hashing` (ứng dụng lưu password), `20.2-bit-manipulation`,
> `6.2-core-data-structures` (hash table thường).

---

## 🎯 Vấn Đề

Cần so sánh dữ liệu lớn không cần lưu bản gốc, kiểm tra file bị sửa, hoặc KHÔNG
lưu password thô mà vẫn xác minh được login. Hash giải quyết nhưng có yêu cầu
chặt — dùng sai thuật toán là lỗ hổng:

```
MD5     — ĐÃ PHÁ VỠ (collision thực tế từ 2004) — không dùng cho bảo mật
SHA-1   — collision thực tế 2017 (SHAttered) — không dùng cho bảo mật
SHA-256 — vẫn an toàn (SHA-2 family)
SHA-3   — chuẩn mới nhất
bcrypt/argon2 — DÀNH CHO PASSWORD (chậm có chủ đích — xem 26.3)
```

---

## 🧠 3 Tính Chất Bắt Buộc Của Hash Mật Mã

```
1. PRE-IMAGE RESISTANCE    — cho hash h, tìm m sao cho hash(m) = h là BẤT KHẢ (one-way)
2. SECOND-PREIMAGE         — cho m, khó tìm m' ≠ m với hash(m) = hash(m)
3. COLLISION RESISTANCE    — khó tìm cặp m₁ ≠ m₂ có cùng hash
   (collision mạnh hơn pre-image — nếu có collision có chủ đích thì hash đã chết)
Avalanche effect: đổi 1 bit input → ~50% bit output đổi
```

---

## 💻 Code Ví Dụ

```typescript
import { createHash, createHmac, randomBytes } from "node:crypto";

// ===== SHA-256: hash chung (KHÔNG dùng cho password!) =====
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
console.log(hash("hello"));
// Tính chất: deterministic, 1 chiều, avalanche, fixed length

// ===== Kiểm tra toàn vẹn file: biết file bị hỏng/thay đổi =====
// Download 1 file, so hash với bản gốc — khác 1 bit là hash khác hoàn toàn
// → nền của checksum, git commit, blockchain block hash

// ===== HMAC: hash + secret key — xác thực tính nguyên vẹn + nguồn gốc =====
const key = randomBytes(32);
const mac = createHmac("sha256", key).update("message quan trọng").digest("hex");
// HMAC khác hash thường: cần key → không forge được nếu không biết key
// Dùng cho: JWT signature, webhook verification (GitHub webhook = HMAC!)

// ===== Bloom filter: "chắc chắn CÓ THỂ có, chắc chắn KHÔNG có" =====
// Nhiều hash bit index — trả "không có" là chắc chắn, "có" có thể false positive
class BloomFilter {
  private bits: Uint8Array;
  constructor(size: number, private hashes: number) { this.bits = new Uint8Array(size); }
  private idx(item: string, i: number) {
    let h = 2166136261;
    for (const c of item + i) { h ^= c.charCodeAt(0); h = (h * 16777619) >>> 0; }
    return h % this.bits.length;
  }
  add(v: string) { for (let i = 0; i < this.hashes; i++) this.set(this.hash(v, i)); }
  has(v: string): boolean { return [...Array(this.hashes).keys()].every(i => this.get(this.hash(v, i))); }
}
// Dùng: cache "URL này đã crawl chưa", "email này trong danh sách spam?" — trước khi hỏi DB

// ===== Tại sao KHÔNG dùng SHA-256 trực tiếp cho password =====
// SHA-256 nhanh (hàng tỉ lần/giây trên GPU) → brute force password yếu cực nhanh
// → password cần KDF CHẬM có chủ đích: bcrypt/argon2 (xem 26.3)
```

---

## ⚖️ Thuật Toán Hash

| Thuật toán | Đầu ra | Trạng thái | Dùng |
|---|---|---|---|
| MD5 | 128 bit | ❌ đã phá | không dùng cho bảo mật |
| SHA-1 | 160 bit | ❌ collision 2017 | deprecated |
| SHA-256 | 256 bit | ✓ | chung, checksum |
| SHA-3 | 256/512 bit | ✓ (thiết kế mới) | tương lai dài hạn |
| bcrypt/argon2 | tùy | ✓ (chậm có chủ đích) | password riêng |

---

## ⚠️ Bẫy Thường Gặp

1. **SHA-256 cho password** — quá nhanh, GPU brute force dễ. Dùng bcrypt/argon2 (chậm).
2. **Không salt password hash** — rainbow table phá. Salt random riêng từng user.
3. **So sánh hash bằng `===`** — timing attack. Dùng `crypto.timingSafeEqual` (so sánh constant-time).
4. **Dùng hash cho "mã hóa"** — hash một chiều, KHÔNG giải mã được. Muốn lấy lại data → encryption (26.2).
5. **MD5/SHA-1 cho chữ ký file** — collision thật sự tồn tại (SHAttered 2017). Tối thiểu SHA-256.
6. **Hash của file lớn không stream** — hash cả file vào RAM; dùng streaming hash.

---

## 📝 Bài Tập Tự Vấn

1. Vì sao HMAC-SHA256 an toàn hơn việc `hash(secret + message)`?
2. Timing attack là gì? Viết code so sánh token an toàn timing.
3. Thiết kế "download kiểm tra toàn vẹn": server cung cấp hash, client kiểm tra — quy trình?

---

*Leaf thuộc [Lớp 26 — Cryptography Advanced](../README.md)*
