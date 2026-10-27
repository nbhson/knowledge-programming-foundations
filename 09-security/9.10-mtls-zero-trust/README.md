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

## 🪪 SPIFFE/SPIRE: Identity cho Workload

Vấn đề: mTLS cần cert — nhưng **ai cấp cert cho service, làm sao service biết mình là ai?**

- **SPIFFE** (Secure Production Identity Framework For Everyone): chuẩn định danh workload — URI dạng `spiffe://cluster/ns/prod/sa/payment-service`.
- **SPIRE** server cấp **SVID** (SPIFFE Verifiable Identity Document = X.509 cert hoặc JWT) cho workload qua agent, **tự rotate** (TTL ngắn, mặc định 1 giờ).
- Workload không cần secret/hardcode — SPIRE agent xác thực workload qua nền tảng (K8s service account, AWS instance identity…).
- Kết quả: identity nhất quán **cross-cluster, cross-cloud** — service mesh và policy engine đều dùng chung.

## 🕸️ Service Mesh: mTLS tự động

Tự viết mTLS (CA, rotate, revoke, CA cấp phát) là đau đầu — mesh làm hộp ở sidecar/eBPF layer:

| Mesh | Cách cấp mTLS | Điểm mạnh |
|---|---|---|
| **Istio** | Envoy sidecar + Citadel (CA) | Đầy đủ nhất: mTLS + authz policy + telemetry, `PeerAuthentication` bật STRICT |
| **Linkerd** | Rust proxy siêu nhẹ, mTLS mặc định | Đơn giản, ít tài nguyên hơn Istio |
| **Cilium (sidecar-free)** | eBPF ở kernel, không sidecar | Hiệu năng cao, network policy + mTLS trong kernel |
| **SPIRE + mesh riêng lẻ** | SPIFFE identity cho mọi mesh | Đa cloud, đa mesh dùng chung identity |

- Bật mTLS mesh-wide = 1 CRD, không sửa code app: app nói HTTP trần, sidecar mã hóa hộ.
- Gradual rollout: `PERMISSIVE` (chấp nhận cả HTTP + mTLS) → quan sát → `STRICT` (chỉ mTLS) — tránh outage khi chuyển.

## 🎯 Zero Trust = Identity-based Policy, Không phải Network Perimeter

Sai lầm phổ biến: "có VPN + VPC private subnet là zero trust". **Không phải:**

| Tư duy cũ (perimeter) | Zero trust đúng |
|---|---|
| Tin theo **vị trí mạng** (trong VPC = tin) | Tin theo **identity** (cert/token + policy từng request) |
| Firewall chặn port, bên trong mở toang | Deny-by-default từng service-to-service call |
| IP là định danh | Cert ngắn hạn (SPIFFE SVID) là định danh |
| Audit theo log truy cập mạng | Audit từng request: ai (identity), gọi gì (method), cho phép không (policy decision) |

- Nguyên tắc NIST 800-207: **"never trust, always verify"** — mỗi request được authenticate + authorize riêng, kể cả trong cùng cluster.
- Stack thực tế: mTLS (xác thực) + policy engine (OPA/Cedar/Istio AuthorizationPolicy — phân quyền) + network policy (chặn tầng L3/L4) — ba lớp, mỗi lớp một việc.

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
