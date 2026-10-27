# ✅ 23.4 Schema & Validation (Schema Dữ Liệu & Xác Thực)

> **Dữ liệu từ bên ngoài là không tin cậy:** API request, env var, message từ queue,
> file upload. Validation không phải "nice to have" — là firewall đầu tiên của
> ứng dụng. Schema = hợp đồng dữ liệu được kiểm tra tự động.

> Liên quan: `20.4-serialization-formats` (định dạng), `5.10-api-design` (validate request),
> `9.1-owasp-top10` (injection thường từ input chưa validate).

---

## 🎯 Vấn Đề

```ts
// ❌ tin tưởng input:
const { email, age } = req.body;      // age có phải số? email có thật?
users.insert({ email, age });         // string "18" hay số 18? -1? 999999?
// → dữ liệu bẩn vào DB, logic nổ im lặng, thậm chí injection

// TypeScript có "type safety" — nhưng CHỈ lúc compile!
// runtime data (req.body, JSON.parse, API response) có thể là BẤT KỲ ĐIỀU GÌ
```

---

## 🧠 Validate ở Ranh Giới (Parse, Don't Validate)

```
❌ Validate rải rác: mỗi hàm check lại "age có phải số không" → lặp, quên chỗ
✅ Parse 1 lần ở ranh giới: outside → validate → TRONG hệ thống đảm bảo đúng kiểu
   validate(userInput): User | throw → từ đó dùng User an toàn tuyệt đối
"Make illegal states unrepresentable" — kiểu dữ liệu tự chứng minh tính đúng
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Zod: schema là NGUỒN SỰ THẬT + suy ra kiểu =====
import { z } from "zod";

const UserInput = z.object({
  email: z.string().email(),
  age: z.coerce.number().int().min(0).max(150),   // "18" → 18 (coerce)
  role: z.enum(["admin", "user"]).default("user"),
});

type User = z.infer<typeof UserInput>;  // type TS sinh TỪ schema — không lệch nhau
const parsed = UserInput.safeParse(req.body);
if (!parsed.success) return res.status(400).json(parsed.error.issues);
// safeParse: không throw — trả kết quả để tự xử lý

// ===== Transform: parse + normalize 1 bước =====
const Register = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  age: z.coerce.number(),   // "18" → 18
});

// ===== Union & refinement: logic phức tạp, khai báo rõ =====
const Payment = z.discriminatedUnion("method", [
  z.object({ method: z.literal("card"), cardNumber: z.string().min(12) }),
  z.object({ method: z.literal("bank"), accountNo: z.string().min(6) }),
]);
// → "payment" phải có method khớp 1 trong 2 hình dạng — discriminated union

// ===== JSON Schema: chuẩn quốc tế, tool-agnostic =====
const schema = {
  type: "object",
  properties: { email: { type: "string", format: "email" }, age: { type: "integer", minimum: 0 } },
  required: ["email"],
  additionalProperties: false,   // chặn field lạ — chống injection
};
// validate bằng ajv; JSON Schema dùng được qua ngôn ngữ (Python/Go/TS cùng 1 schema)
```

---

## ⚖️ Validation Vị Trí Nào?

| Tầng | Kiểm tra gì | Ví dụ |
|---|---|---|
| Client UI | UX: báo lỗi sớm | form html5 validation |
| API layer | schema chặt (Zod/Joi) | chặn dữ liệu sai ngay cổng |
| Business logic | quy tắc nghiệp vụ | tồn kho đủ? đúng hạn chuyển? |
| DB | constraint cuối cùng | UNIQUE, NOT NULL, CHECK |

Nguyên tắc: validate ở TẤT CẢ tầng (defense in depth), nhưng schema phải là
**một nguồn sự thật** — sinh từ 1 schema (xem `21.4` để config cũng qua schema).

---

## ⚠️ Bẫy Thường Gặp

1. **Tin TypeScript type cho runtime data** — `as User` là lie. Any từ network phải qua schema.
2. **Validate client mà không validate server** — attacker bỏ qua UI, gọi API trực tiếp.
3. **`safeParse` mà không xử lý failure** — kiểm tra rồi vẫn dùng giá trị chưa validate.
4. **Error message lộ internals** — trả nguyên Zod error ra client tiết lộ cấu trúc DB. Chuẩn hóa lỗi (xem 14.3).
5. **Validate một lần ở gateway rồi tin tuyệt đối** — tầng service khác gọi với dữ liệu khác schema. Validate ở ranh giới MỌI service.
6. **Đặt qua middleware nhưng quên thêm field mới** — schema là hợp đồng, đổi API phải đổi schema + test.

---

## 📝 Bài Tập Tự Vấn

1. Thiết kế schema cho endpoint `POST /orders` — bắt buộc, tùy chọn, coerced fields?
2. "Parse, don't validate" nghĩa là gì? Khác gì validate rải rác mỗi hàm?
3. Dùng 1 schema cho cả request validation và DB schema (Prisma) — làm sao tránh trùng lặp?

---

*Leaf thuộc [Lớp 23 — Text, Parsing & AST](../README.md)*
