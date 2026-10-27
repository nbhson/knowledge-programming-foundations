# 🔐 11.9 TLS Handshake (Bắt Tay Mã Hóa)

> **TLS** biến đường truyền trần thành kênh mã hóa: thương lượng version + cipher suite mạnh nhất chung, xác thực server bằng certificate, đổi khóa phiên. **1.3** gọn hơn 1.2 (1-RTT, bỏ cipher yếu); **mTLS** thêm client cert.

---

## 🎯 Vấn đề

HTTP trần: password/token đọc được ở mọi middlebox. TLS sai (version cũ, cert hết hạn, cipher yếu) thì mã hóa cũng như không:

```
TLS 1.0 + RC4 → attacker giải mã được 💥 | cert hết hạn → browser đỏ lòm 💥
```

---

## 💻 Code ví dụ

Mô phỏng cipher negotiation: client/server chọn suite mạnh nhất cùng hỗ trợ + quyết định TLS version.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

const STRENGTH: Record<string, number> = {
  "TLS_AES_128_GCM_SHA256": 3,      // 1.3, mạnh
  "TLS_ECDHE_RSA_AES128_GCM": 2,    // 1.2, ổn
  "TLS_RSA_WITH_RC4_128": 0,        // yếu — loại
};

function negotiate(client: string[], server: string[]): string | null {
  const common = client.filter((c) => server.includes(c) && (STRENGTH[c] ?? 0) > 0);
  return common.sort((a, b) => STRENGTH[b] - STRENGTH[a])[0] ?? null;
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Biết 1.2 vs 1.3 | 1.3: 1-RTT (nhanh), forward secrecy bắt buộc, bỏ RSA key exchange/RC4/SHA1 |
| Cipher đúng | Chỉ AEAD (AES-GCM/ChaCha20) + ECDHE — negotiation tự chọn mạnh nhất chung |
| mTLS khi cần | Service-to-service identity 2 chiều (chi tiết ở 9.10) |

---

## ⚠️ Lưu Ý

- Tối thiểu TLS 1.2, ưu tiên 1.3; tắt SSLv3/TLS 1.0/1.1 và cipher yếu ở server.
- Cert: rotate trước hạn 30 ngày, giám sát expiry, dùng ACME/Let's Encrypt tự động.
- HSTS để browser không bao giờ dùng HTTP trần sau lần đầu.
- SNI: 1 IP phục vụ nhiều domain HTTPS — client cũ không SNI sẽ lỗi (hiếm nay).

---

## 🆚 TLS 1.3 vs TLS 1.2

| Khía cạnh | TLS 1.2 | TLS 1.3 |
|---|---|---|
| **Handshake** | 2-RTT (full) | 1-RTT (gần một nửa thời gian) |
| **0-RTT resumption** | Không | Có (early data) — caveat replay bên dưới |
| **Key exchange** | RSA, DH, ECDHE (nhiều lựa chọn) | Chỉ (EC)DHE + forward secrecy bắt buộc |
| **Cipher suites** | ~30 suite, gồm cái yếu (CBC, RC4) | 5 suite AEAD thôi (AES-GCM, ChaCha20) |
| **Signature/Cert** | Mọi thứ negotiate 2 lượt | Bỏ bớt round, compress handshake |
| **Hỗ trợ (2026)** | Legacy bắt buộc giữ | Mọi browser/server hiện đại — mặc định |

**0-RTT caveat**: early data gửi trước khi hoàn tất handshake — **chống replay không hoàn chỉnh**: attacker bắt lại và gửi lại early data. Chỉ dùng cho **GET idempotent**, không đặt trong early data: chuyển tiền, POST tạo order.

## 📜 Certificate Transparency (CT)

- Mọi CA bắt buộc log cert cấp ra vào **public CT logs** (được Google Chrome/Safari yêu cầu) — CA cấp cert trái phép sẽ bị phát hiện công khai.
- Check: crt.sh, Google CT search — **monitor subdomain/domain của bạn** để biết cert lạ cấp ra (dấu hiệu CA bị compromise hoặc misconfiguration).
- SCT (Signed Certificate Timestamp) đính kèm cert — client verify cert có trong log.
- Với doanh nghiệp: **giám sát CT log** để phát hiện typosquat subdomain và rogue cert sớm.

## ♻️ Let's Encrypt + ACME (Auto-renewal)

- **ACME protocol**: client (certbot/cert-manager/acme.sh) chứng minh sở hữu domain qua HTTP-01/DNS-01 challenge → cấp cert tự động, **rotate mỗi 60–90 ngày không cần người**.
- K8s: `cert-manager` + `Issuer` CRD = cert tự sinh + renew + mount secret — đừng xin cert bằng tay nữa.
- Precedence: DNS-01 cho wildcard cert (`*.example.com`), HTTP-01 cho domain đơn.
- Giám sát vẫn cần: cert hết hạn đồng loạt (CA sự cố, misconfig DNS-01) từng gây outage lớn — **alert trước hạn 30 ngày** là lớp phòng thủ cuối cùng.

## 🔁 Session Resumption

Handshake tốn kém (CPU crypto + 1 RTT) — client quay lại nhanh hơn bằng tái sử dụng session:

| Cơ chế | Cách hoạt động | Ghi chú |
|---|---|---|
| **Session tickets (TLS 1.3)** | Server cấp ticket mã hóa, client gửi lại lần sau → resumption 1-RTT hoặc 0-RTT | Chuẩn hiện đại (PSK) |
| **Session ID (TLS 1.2)** | Server lưu session state, client nhắc lại ID | Cần server-side cache, khó load-balance |
| Lợi ích | Bỏ bước negotiate + cert verify lần 2 → tiết kiệm ~1 RTT + CPU | Connection pool/keep-alive còn tốt hơn: không handshake chút nào |

> Thực tế: **keep-alive + connection pooling** vẫn là tối ưu số 1; resumption là dự phòng khi phải mở connection mới.

---

## 🎯 Khi nào dùng

- Mọi production traffic: HTTPS everywhere (TLS 1.2+, HSTS).
- mTLS: service nội bộ cần identity 2 chiều; 0-RTT (1.3): GET idempotent, không cho POST non-idempotent (replay risk).

---

## 🔗 Liên quan

- **9.10 mTLS & Zero Trust** — client cert + policy sau handshake.
- **9.6 Helmet Headers** — HSTS ép HTTPS sau khi TLS xong.
- **11.10 HTTP/2-HTTP/3-QUIC** — QUIC tích hợp TLS 1.3 vào handshake UDP.

---

## 📚 Tài liệu

- TLS 1.3 RFC 8446 — https://www.rfc-editor.org/rfc/rfc8446.html
- Cloudflare: TLS 1.3 — https://blog.cloudflare.com/why-tls-1-3-isnt-in-your-browser-yet/

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.9-tls-handshake
npx tsx examples/index.ts
```

Demo: 1.2 (2-RTT) vs 1.3 (1-RTT) → negotiate cipher mạnh nhất chung → từ chối cipher yếu → nhắc mTLS.

---

## ⏭️ Bài tiếp theo

→ [11.10 HTTP/2, HTTP/3 & QUIC](../11.10-http2-http3-quic/README.md)
