# 🤫 9.9 Secrets Management (Quản Lý Bí Mật)

> **Secret** (API key, DB password, token) không bao giờ nằm trong code/Git — chúng sống trong **Vault/KMS**, được **inject lúc runtime**, **rotate định kỳ**, và **redact khỏi logs**.

---

## 🎯 Vấn đề

Hardcode secret là breach chờ giờ: repo public/private leak, log dính key, nhân viên cũ vẫn giữ `.env` copy:

```
const API_KEY = "sk-live-abc123"; // commit → Git history mãi mãi 💥
logger.info(`connecting with ${dbUrl}`); // password lên log aggregator 💥
```

Xóa sau cũng vô ích — Git nhớ tất cả, attacker scan GitHub realtime.

---

## 💻 Code ví dụ

Mô phỏng env loader an toàn: required secrets, redaction khi log, phân biệt secret/config.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

// Loader: thiếu secret bắt buộc → fail-fast lúc boot, không chạy nửa chừng
function requireSecret(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`thiếu secret ${name}`);
  return v;
}

// Redact: mọi giá trị secret thành "***" trước khi log
function redact(obj: Record<string, unknown>, secrets: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj))
    out[k] = secrets.has(k) ? "***" : v;
  return out;
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Không leak qua Git/log | Secret chỉ tồn tại ở runtime + bản redact — audit thoải mái |
| Rotate không deploy | Đổi secret ở Vault/KMS, app reload — không sửa code |
| Least privilege + audit | Ai đọc secret nào, khi nào — log tập trung, thu hồi theo role |

---

## ⚠️ Lưu Ý

- Rotation 90 ngày cho key tĩnh; ưu tiên **dynamic secrets** (Vault cấp credential DB 1h tự hết hạn).
- Phân tầng: secret (Vault/KMS) vs config thường (env/ConfigMap) vs non-secret (code).
- `.env` local không commit; production lấy từ secret manager, không copy file tay.
- Lỡ leak: revoke + rotate ngay, quét Git history (gitleaks/trufflehog), coi key cũ đã lộ.

---

## 🎯 Khi nào dùng

- Mọi app có DB password, API key, JWT secret, TLS key, OAuth client secret — tức là gần như mọi production app.
- Chọn tool: Vault (dynamic + team lớn), cloud KMS/Secrets Manager (đơn giản), Sealed/External Secrets cho K8s-GitOps.

---

## 🔗 Liên quan

- **9.8 Password Hashing** — pepper là secret, lưu cùng hệ thống này.
- **8.7 GitOps** — Git chứa reference (`secretRef`), giá trị thật ở Vault.
- **9.6 Helmet Headers** — không expose secret qua response header/error.

---

## 📚 Tài liệu

- HashiCorp Vault — https://developer.hashicorp.com/vault/docs
- OWASP Secrets Management — https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- gitleaks — https://github.com/gitleaks/gitleaks

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.9-secrets-management
npx ts-node examples/index.ts
```

Demo: loader fail-fast khi thiếu secret → redact log → mô phỏng rotation (đổi key không đụng code).

---

## ⏭️ Bài tiếp theo

→ [9.10 mTLS & Zero Trust](../9.10-mtls-zero-trust/README.md)
