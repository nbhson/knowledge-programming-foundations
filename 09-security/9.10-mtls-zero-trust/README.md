# 🛡️ 9.10 mTLS & Zero Trust (Không Tin Bất Cứ Ai)

> **Zero Trust**: không tin bất kỳ ai chỉ vì "ở trong mạng nội bộ" — mọi request đều **xác thực, phân quyền, mã hóa**. **mTLS** là cách service chứng minh danh tính cho nhau bằng certificate cả hai chiều.

---

## 🎯 Vấn đề

Mô hình "castle-and-moat" (trong VPC là an toàn) sụp khi 1 service bị chiếm: attacker đi ngang (lateral movement) không ai chặn:

```
attacker chiếm reporting-service → gọi payment API nội bộ → không ai hỏi certificate → rút tiền 💥
```

Zero Trust: mỗi service có identity (certificate ngắn hạn), mỗi call verify + authorize.

---

## 💻 Code ví dụ

Mô phỏng mTLS handshake (đổi cert 2 chiều) + policy check (zero-trust authorize từng request).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface Cert { cn: string; expiresAt: number; revoked: boolean }

// mTLS: client verify server + server verify client (khác TLS 1 chiều)
function mtlsHandshake(client: Cert, server: Cert, now: number): string | null {
  if (client.revoked || server.revoked) return "certificate bị revoke";
  if (client.expiresAt < now || server.expiresAt < now) return "certificate hết hạn";
  return null; // handshake thành công, kênh mã hóa 2 chiều
}

// Zero-trust: DÙ handshake ok, mỗi request vẫn check policy
function authorize(caller: string, action: string, policy: Record<string, string[]>): boolean {
  return policy[caller]?.includes(action) ?? false; // default deny
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Chặn lateral movement | Service bị chiếm không gọi bừa được — thiếu cert/policy hợp lệ |
| Identity mạnh hơn IP | IP spoof/đổi được; certificate ngắn hạn + rotate tự động thì không |
| Audit từng call | Ai gọi gì, khi nào — policy decision log phục vụ incident response |

---

## ⚠️ Lưu Ý

- PKI là phần khó nhất: CA nội bộ, rotate cert ngắn hạn (giờ/ngày), CRL/OCSP cho revoke — dùng mesh (Istio/Linkerd) hoặc SPIFFE thay vì tự làm.
- mTLS chỉ là **xác thực + mã hóa**, vẫn cần **authorization** riêng (policy theo service/method).
- Cert hết hạn đồng loạt = outage tự tạo: giám sát expiry + rotate dần (canary cert).
- Performance: handshake tốn CPU — dùng session resumption + keep-alive.

---

## 🎯 Khi nào dùng

- Microservices nội bộ (service-to-service), đặc biệt payment/PII, đa cluster/cloud.
- Kết hợp: mTLS (identity) + RBAC/ABAC policy (quyền) + deny-by-default network policy.

---

## 🔗 Liên quan

- **11.9 TLS Handshake** — mTLS là TLS + client certificate.
- **9.3 OAuth2** — user identity (OAuth) vs workload identity (mTLS/SPIFFE).
- **8.5 Kubernetes** — NetworkPolicy + service mesh triển khai zero-trust thực tế.

---

## 📚 Tài liệu

- NIST Zero Trust (SP 800-207) — https://csrc.nist.gov/publications/detail/sp/800-207/final
- SPIFFE/SPIRE — https://spiffe.io/
- Istio mTLS — https://istio.io/latest/docs/concepts/security/

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.10-mtls-zero-trust
npx ts-node examples/index.ts
```

Demo: handshake thành công → cert hết hạn/revoke bị từ chối → handshake ok nhưng policy deny (zero-trust không tin mù).

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm Security — tiếp tục Database:

→ [10.1 SQL Basics](../../10-database/10.1-sql-basics/README.md)
