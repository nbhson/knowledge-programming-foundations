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
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

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

## 🔎 Secret Scanning trong CI

Chặn secret trước khi nó vào Git history — cheaper than rotate:

| Tool | Đặc điểm |
|---|---|
| **gitleaks** | Nhanh, config regex dễ, chạy pre-commit + CI, phổ biến nhất |
| **trufflehog** | 800+ detector, **verify key còn sống** (live secret), scan Git history + cloud |
| **GitHub secret scanning + push protection** | Block push ngay trên GitHub nếu khớp pattern của 200+ provider |
| **pre-commit hook** | Chặn trước khi commit — nhanh nhất, rẻ nhất |

```yaml
# GitHub Actions: scan toàn bộ history mỗi push
- uses: gitleaks/gitleaks-action@v2
  env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

> Lỡ leak: coi là **đã lộ** (bot scan GitHub realtime trong vài giây) → revoke + rotate NGAY, xóa commit không đủ.

## 🪪 OIDC Federation thay Long-Lived Key

Thay vì lưu `AWS_ACCESS_KEY_ID` vào GitHub Secrets (key tĩnh, 90 ngày rotate, rò là toi), dùng **OIDC**: CI request token ngắn hạn (< 1 giờ) thông qua trust policy:

```
GitHub Actions ──JWT (repo, branch, workflow)──▶ AWS STS AssumeRoleWithWebIdentity ──▶ temp creds (15 phút–12h)
```

- Không có key nào lưu trong secrets — **không có gì để leak, không gì để rotate**.
- Trust policy giới hạn: repo + branch + audience → token của repo khác bị từ chối.
- Cùng pattern: GCP Workload Identity, Azure federated credentials, Vault JWT auth cho Kubernetes.
- Kèm theo: **short-lived credential mọi nơi có thể** (Vault dynamic DB creds 1h, IRSA cho K8s) — long-lived key chỉ dành cho legacy bắt buộc.

## 🔁 Rotation Strategy

| Loại secret | Chu kỳ | Cách |
|---|---|---|
| Dynamic secrets (Vault DB creds) | Tự động (vài giờ) | App xin credential mới mỗi session — rotate "miễn phí" |
| API key / DB password tĩnh | 90 ngày (hoặc theo policy) | Dual-key: cấp key mới song song → chuyển traffic → thu hồi key cũ, không downtime |
| TLS cert | 60–90 ngày | ACME tự động (Let's Encrypt), cert-manager |
| JWT signing key | Rotate định kỳ + JWKS kid | Cho phép verify key cũ trong window chuyển tiếp |
| Sau incident/leak | **NGAY LẬP TỨC** | Revoke trước, điều tra sau |

> App phải **đọc secret lúc runtime + reload được** (hot reload / restart nhẹ) — nếu phải redeploy để rotate thì rotate sẽ không bao giờ diễn ra.

## 📁 .env Không Commit + dotenv-safe

- `.env` vào `.gitignore` **ngay commit đầu tiên**; commit `.env.example` (tên biến, không giá trị) làm hợp đồng.
- Loader an toàn (fail-fast + không ghi đè env thật của production):
  ```typescript
  // dotenv-safe / envalid: thiếu biến bắt buộc → crash lúc boot, không chạy nửa chừng
  const env = cleanEnv(process.env, { DATABASE_URL: str(), JWT_SECRET: str() });
  ```
- Tool: `dotenv-vault`, `direnv` (local), SOPS + age (commit encrypted vào Git được), Sealed Secrets (K8s).
- Redaction ở tầng logger: mọi serializer nhận danh sách key nhạy cảm (`password`, `token`, `authorization`) → in `***`.

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
npx tsx examples/index.ts
```

Demo: loader fail-fast khi thiếu secret → redact log → mô phỏng rotation (đổi key không đụng code).

---

## ⏭️ Bài tiếp theo

→ [9.10 mTLS & Zero Trust](../9.10-mtls-zero-trust/README.md)
