# 🛡️ 3.1.9 Postel's Law (Robustness Principle)

> **"Hãy bảo thủ trong những gì bạn gửi, cởi mở trong những gì bạn chấp nhận."**
> (Be conservative in what you send, be liberal in what you accept.)
> Input chấp nhận rộng rãi, output luôn chặt chẽ và nhất quán.

---

## 🎯 Vấn đề

API/hàm quá khắt khe hoặc quá luộm thuộm đều gây đau:

- **Quá khắt khe với input** — client gửi `"18"` (string) thay vì `18` (number) → server 400, dù ý nghĩa rõ ràng
- **Quá luộm thuộm với output** — lúc trả `null`, lúc trả `undefined`, lúc thiếu field → mọi client phải đoán
- **Đổi format là vỡ** — thêm 1 field mới vào response → client cũ crash vì parser quá chặt
- **Lỗi lan truyền** — nhận rác vào, đẩy rác ra (garbage in, garbage out)

```
❌ KHẮT KHE + LUỘM THUỘM           ✅ POSTEL'S LAW
┌─────────────────────┐            ┌─────────────────────┐
│ Input: chỉ đúng     │            │ Input: chấp nhận    │
│   1 kiểu mới nhận   │  ──POSTEL─▶│   rộng, chuẩn hóa   │
│ Output: lúc null    │            │ Output: 1 format    │
│   lúc thiếu field   │            │   chặt, nhất quán   │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 2 mặt của nguyên tắc

```
POSTEL'S LAW
│
├─ 📥 LIBERAL IN WHAT YOU ACCEPT (chấp nhận rộng)
│   ├─ Tolerant Reader: bỏ qua field lạ, chỉ đọc field mình cần
│   ├─ Chuẩn hóa input: "18" → 18, " YES " → true, nhiều định dạng date → 1 Date
│   └─ Giá trị mặc định hợp lý cho field thiếu (không đoán mò nghiệp vụ)
│
└─ 📤 CONSERVATIVE IN WHAT YOU SEND (gửi chặt)
    ├─ Output đúng 1 schema đã công bố, không bao giờ thiếu field bắt buộc
    ├─ Kiểu dữ liệu nhất quán (luôn number, không lúc string lúc number)
    └─ Validate output trước khi gửi (contract test / schema validation)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: input khắt khe + output luộm thuộm
function parseAgeBad(input: number): number | null | undefined {
  if (typeof input !== "number") throw new Error("Must be number"); // "18" cũng chết
  if (input < 0) return null;      // lúc throw, lúc null, lúc number — client đoán mò
  return input;
}

// ✅ GOOD: Tolerant Reader — input rộng, output chặt
type ParseResult = { ok: true; age: number } | { ok: false; error: string };

function parseAge(input: unknown): ParseResult {
  const normalized = typeof input === "string" ? input.trim() : input; // chấp nhận " 18 "
  const age = typeof normalized === "string" && normalized !== ""
    ? Number(normalized) // chấp nhận "18"
    : normalized;
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 150) {
    return { ok: false, error: "Age must be an integer 0-150" }; // output luôn 1 shape
  }
  return { ok: true, age }; // output luôn 1 shape
}

// ✅ GOOD: Tolerant Reader bỏ qua field lạ (API forward-compatible)
function readUser(payload: unknown): { name: string } {
  if (typeof payload !== "object" || payload === null) throw new Error("Invalid payload");
  const name = (payload as Record<string, unknown>)["name"];
  if (typeof name !== "string" || name.trim() === "") throw new Error("Missing name");
  return { name: name.trim() }; // field lạ (ví dụ: "nickname" mới) bị bỏ qua, không crash
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🤝 **Tích hợp dễ** | Client gửi hơi khác 1 chút vẫn chạy, không 400 vô lý |
| 🛡️ **Ít vỡ khi evolve** | Thêm field mới vào API → client cũ (tolerant reader) vẫn sống |
| 🔍 **Client đoán được** | Output 1 schema duy nhất → client code đơn giản |
| 🐞 **Lỗi rõ ràng** | Input sai thật → trả lỗi có cấu trúc, không `null` mập mờ |

---

## ⚠️ Lưu ý — "Cởi mở" không có nghĩa "nhận rác"

| Vấn đề | Ví dụ |
|--------|-------|
| **Đoán mò nghiệp vụ** | Input thiếu `price` → tự điền `0` rồi tạo đơn hàng 0đ. Thiếu dữ liệu nghiệp vụ quan trọng → **báo lỗi**, đừng đoán |
| **Che giấu bug** | Tự "sửa" input sai thành đúng rồi im lặng → log warning để caller biết |
| **Bảo mật** | Tolerant với **format**, nghiêm ngặt với **nội dung**: vẫn validate kiểu, phạm vi, quyền, sanitize XSS/SQL injection |
| **Output "linh hoạt"** | Output phải **chặt nhất có thể** — tolerant chỉ áp dụng cho input |

> 💡 **Quy tắc:** Cởi mở với **cách diễn đạt** (format, khoảng trắng, kiểu tương đương),
> nghiêm ngặt với **ý nghĩa** (giá trị ngoài phạm vi, thiếu field bắt buộc, vi phạm bảo mật).

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Thiết kế public API / webhook | ✅ Tolerant reader + schema output chặt |
| Parse input người dùng (form, CSV, query param) | ✅ Chuẩn hóa rộng (trim, case-insensitive, alias) |
| Tiêu thụ API bên thứ 3 hay đổi format | ✅ Chỉ đọc field cần, bỏ qua field lạ |
| Thiếu dữ liệu nghiệp vụ cốt lõi | ❌ Báo lỗi rõ, đừng đoán mò |
| Output trả cho client | ❌ Luôn validate theo schema đã công bố |

---

## 🔗 Liên quan

- **3.2.2 OCP** — Tolerant reader giúp mở rộng API không sửa client cũ
- **3.1.10 Convention over Configuration** — Convention là 1 dạng "output chặt" mọi bên cùng theo
- **11.x Validation / API design** — Áp dụng trực tiếp khi thiết kế endpoint
- **7.x Testing** — Contract test là cách enforce "output chặt"

---

## 📁 Cấu trúc thư mục

```
3.1.9-postel-law/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.9-postel-law
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Robustness Principle - Wikipedia](https://en.wikipedia.org/wiki/Robustness_principle)
- 📖 [Tolerant Reader — Martin Fowler](https://martinfowler.com/bliki/TolerantReader.html)

---

## ⏭️ Bài tiếp theo

→ [3.1.10 Convention over Configuration](../3.1.10-convention-over-configuration/README.md)
