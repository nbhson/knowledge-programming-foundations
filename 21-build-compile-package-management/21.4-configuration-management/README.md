# ⚙️ 21.4 Configuration Management (Quản Lý Cấu Hình)

> **Cấu hình là thứ thay đổi giữa các môi trường:** dev dùng DB local, prod dùng DB
> cluster + password thật. Sai cấu hình = lỗi phổ biến nhất sau khi deploy, và cũng
> là cửa ngõ rò rỉ secrets nếu xử lý ẩu.

> Liên quan: `09.9-secrets-management` (nơi cất secrets), `12-concurrency` (config reload nóng),
> `08-devops-cicd` (inject env trong pipeline).

---

## 🎯 Vấn Đề

"Chạy được trên máy tôi" 90% là lệch cấu hình: port, URL DB, secret, flag tính năng.
Config nằm đâu? Code, env, file, flag dòng lệnh, service config center? Mỗi nguồn
có mức độ ưu tiên — không quy định rõ là chaos:

```
12-FACTOR APP (tôn giáo của config):
  ✓ Config trong ENVIRONMENT, KHÔNG trong code
  ✓ Code giống hệt giữa dev/staging/prod — chỉ khác env
  ✗ Commit .env vào git = rò secret + lệch cấu hình
```

---

## 🧠 Thứ Tự Ưu Tiên Config

```
1. CLI flags          — chạy thử, đè mọi thứ
2. Environment vars   — container, CI, deploy
3. .env file          — dev local (gitignore!)
4. Config file        — mặc định của app (config.default.json)
5. Giá trị hard-coded  — chỉ để demo, không bao giờ ở prod
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Schema-validated config: fail FAST khi thiếu/m sai =====
import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  JWT_SECRET: z.string().min(32, "Secret phải ≥ 32 ký tự"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export const config = ConfigSchema.parse(process.env);
// ❌ Thiếu DB_URL → app CRASH ngay lúc khởi động (fail fast)
// → tốt hơn 1000 lần so với chạy 3 ngày rồi chết nửa đường

// ===== Freeze config: không ai đổi runtime được =====
Object.freeze(config);

// ===== Tiền tố theo môi trường — tránh nhầm DB dev với prod =====
const prefix = config.NODE_ENV === "production" ? "PROD_" : "DEV_";
const dbUrl = process.env[`${prefix}DATABASE_URL`];
// Dù sai biến env, cũng sai trong cùng môi trường — không leo qua 2 môi trường
```

```bash
# ===== Docker/K8s: inject env, không cắm secret vào image =====
docker run -e DATABASE_URL=postgres://... myapp        # runtime, không bake vào image
# secrets trong K8s: Secret + mount volume, KHÔNG ghi vào ConfigMap (xem 9.9)
```

---

## ⚖️ Config File Formats

| Định dạng | Ưu | Nhược | Dùng ở |
|---|---|---|---|
| ENV vars | chuẩn 12-factor, mọi runtime | không có cấu trúc | secret, container |
| JSON | phổ cập | không comment | API config |
| YAML | cấu trúc, có comment | dễ lỗi thụt dòng | K8s, CI |
| TOML | rõ ràng, ít lỗi | ít hỗ trợ hơn | Cargo, pyproject |

---

## ⚠️ Bẫy Thường Gặp

1. **Commit `.env`** — secret rò rỉ vĩnh viễn (git history không xóa được dễ dàng). Gitignore + dùng secret manager (xem 9.9).
2. **Secret trong log/error** — exception message in connection string có password. Redact trước khi log (xem 22.2).
3. **Config "giống nhau" dev vs prod** — khác nhiều nhất đúng lúc ít test nhất: production.
4. **Hot reload không có validation** — đổi config bằng tay, gõ sai, service chạy sai im lặng. Luôn validate lại sau reload.
5. **Trộn config theo tầng:** code đọc config trực tiếp khắp nơi → không test được. Tiêm config qua DI (xem 27-dependency-injection).
6. **Boolean env:** `ENABLE_X=false` — chuỗi "false" là truthy trong nhiều framework. Parse rõ ràng.

---

## 📝 Bài Tập Tự Vấn

1. Thiết kế config loading cho app chạy cả local/Docker/K8s — thứ tự ưu tiên?
2. Secret phải xoay (rotate) 90 ngày 1 lần — quy trình đổi mà không downtime?
3. Config nạp lúc startup vs hot-reload: trade-off, khi nào cần cái nào?

---

*Leaf thuộc [Lớp 21 — Build, Compile & Package Management](../README.md)*
