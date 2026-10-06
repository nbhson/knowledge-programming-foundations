# ⚡ 11.10 HTTP/2, HTTP/3 & QUIC (Multiplexing, Nén Header, 0-RTT)

> HTTP/1.1 mở nhiều connection (đắt) vì 1 connection xử lý tuần tự. **HTTP/2** multiplex nhiều stream trên 1 TCP + nén header (HPACK). **HTTP/3** chuyển sang **QUIC/UDP**: hết head-of-line blocking ở tầng TCP, migration mượt, 0-RTT.

---

## 🎯 Vấn đề

HTTP/1.1 tải 100 assets: 6 connections/browser, mỗi cái handshake riêng, header 1KB lặp lại mỗi request:

```
100 req × (TCP+TLS handshake + full headers) = chậm + tốn 💥
HTTP/2: 1 connection, nhiều stream song song, header nén ✅
HTTP/2 + packet loss: 1 packet mất chặn TẤT CẢ stream (TCP HOL) 💥
HTTP/3/QUIC: mất packet chỉ chặn 1 stream ✅
```

---

## 💻 Code ví dụ

So sánh thời gian tải N assets ở 3 phiên bản + minh họa nén header kiểu HPACK/QPACK (bảng tra cứu).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

function loadTime(version: "1.1" | "2" | "3", assets: number): string {
  if (version === "1.1") return `${assets} tuần tự / 6 conn + full headers mỗi req`;
  if (version === "2") return `1 conn multiplex ${assets} streams + HPACK (~85% nhỏ hơn)`;
  return `1 QUIC conn, per-stream retransmit, 0-RTT khi nối lại`;
}

// HPACK/QPACK: header lặp lại → gửi index thay vì chuỗi đầy đủ
function hpack(headers: Record<string, string>, table: Map<string, number>): string {
  return Object.entries(headers)
    .map(([k, v]) => (table.has(`${k}:${v}`) ? `[idx ${table.get(`${k}:${v}`)}]` : `${k}: ${v}`))
    .join(" | ");
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Multiplexing | 1 connection cho mọi thứ — hết giới hạn 6 connections, hết domain sharding |
| Header nén | HPACK/QPACK giảm ~85% header — API nhiều request nhỏ hưởng lợi lớn |
| QUIC | Hết TCP HOL, migration đổi WiFi→4G không đứt, 0-RTT nối lại tức thì |

---

## ⚠️ Lưu Ý

- Server push (H2) đã lỗi thời: thay bằng preload/prefetch phía client.
- 0-RTT chỉ cho request idempotent (GET) — POST có nguy cơ replay.
- UDP/QUIC có thể bị firewall chặn: giữ fallback H2/TCP.
- Bật H2/H3 là việc của server/CDN (1 checkbox) — code app gần như không đổi.

---

## 🎯 Khi nào dùng

- Bật H2 cho mọi HTTPS site; H3 khi CDN/hạ tầng hỗ trợ (người dùng mobile/lossy hưởng lợi nhất).
- gRPC bắt buộc H2 trở lên (multiplex + binary framing).

---

## 🔗 Liên quan

- **11.7 TCP vs UDP** — QUIC xây reliability trên UDP.
- **11.9 TLS Handshake** — QUIC tích hợp TLS 1.3 (handshake gộp).
- **11.2 REST API** — versioning/headers chịu ảnh hưởng trực tiếp từ nén H2/H3.

---

## 📚 Tài liệu

- HTTP/3 RFC 9114 — https://www.rfc-editor.org/rfc/rfc9114.html
- QUIC RFC 9000 — https://www.rfc-editor.org/rfc/rfc9000.html
- Cloudflare HTTP/3 — https://blog.cloudflare.com/http-3-vs-http-2/

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.10-http2-http3-quic
npx ts-node examples/index.ts
```

Demo: bảng so sánh 3 versions → HPACK nén headers → packet loss ảnh hưởng H2 (all streams) vs H3 (1 stream).

---

## ⏭️ Bài tiếp theo

→ [11.11 Realtime Protocols](../11.11-realtime-protocols/README.md)
