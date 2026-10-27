# 📡 11.11 Realtime Protocols (WebSocket vs SSE vs MQTT vs WebRTC)

> Không có protocol realtime "tốt nhất" — chỉ có "đúng việc": **WebSocket** 2 chiều web, **SSE** push 1 chiều đơn giản, **MQTT** IoT nhẹ qua broker, **WebRTC datachannel** P2P trễ thấp. Chọn sai = phức tạp hoặc tốn tài nguyên vô ích.

---

## 🎯 Vấn đề

Polling mỗi 2s cho giá cổ phiếu: 99% request trả "không có gì mới" mà vẫn tốn server. Nhưng dùng WebSocket cho notification 1 chiều thì phải tự code reconnect — trong khi SSE browser tự nối lại:

```
polling:   30 req/phút × 10k user = 300k req/phút rác 💥
SSE:       1 connection/user, server push khi có mới ✅ (1 chiều đủ thì đừng WebSocket)
```

---

## 💻 Code ví dụ

Ma trận chọn protocol + mô phỏng định tuyến use-case → protocol đúng.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

type Protocol = "WebSocket" | "SSE" | "MQTT" | "WebRTC-DC" | "Polling";

function choose(useCase: { twoWay: boolean; iot: boolean; p2p: boolean; freq: string }): Protocol {
  if (useCase.iot) return "MQTT";                          // sensor, broker, QoS, nhẹ
  if (useCase.p2p) return "WebRTC-DC";                     // game/voice P2P trễ thấp
  if (!useCase.twoWay) return useCase.freq === "low" ? "Polling" : "SSE";
  return "WebSocket";                                      // chat, collab edit
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Đúng công cụ | SSE 20 dòng thay WebSocket 200 dòng cho notification; MQTT thay HTTP cho sensor pin yếu |
| Scale được | SSE/HTTP dễ load-balance hơn WS stateful; MQTT broker chia tải IoT |
| UX realtime thật | Push tức thì thay vì polling trễ + rác |

---

## ⚠️ Lưu Ý

- WebSocket stateful: scale cần sticky session hoặc Redis pub/sub giữa instances.
- SSE chỉ text (không binary), tối đa ~6 connections/domain (HTTP/1.1) — H2 multiplex gỡ được.
- MQTT cần broker (Mosquitto/EMQX) + auth/TLS — đừng mở broker trần lên internet.
- WebRTC signaling vẫn cần server (WS/HTTP) để trao đổi SDP/ICE trước khi P2P.

---

## 🆚 So sánh WebSocket vs SSE vs WebTransport vs Long-Polling (2026)

| Tiêu chí | WebSocket | SSE | WebTransport | Long-Polling |
|---|---|---|---|---|
| **Chiều** | 2 chiều full-duplex | 1 chiều (server→client) | 2 chiều, unreliable + reliable streams | 1 chiều giả lập (request treo) |
| **Nền tảng** | TCP (sau HTTP upgrade) | HTTP thuần | **HTTP/3 / QUIC (UDP)** | HTTP |
| **Binary** | ✅ | ❌ (chỉ text) | ✅ (cả unreliable datagram) | ❌ |
| **Proxy/LB trung gian** | Đôi khi chặn upgrade | Ít vấn đề (HTTP thường) | Cần H3 end-to-end (đang dần phổ biến) | Không vấn đề |
| **Reconnect tự động** | ❌ tự code | ✅ browser tự reconnect + `Last-Event-ID` | Client tự xử lý | ✅ (mỗi lần request mới) |
| **Trạng thái 2026** | Chuẩn gold cho 2 chiều | Ổn định, đơn giản nhất | **Chrome đã hỗ trợ**, đang mở rộng (Firefox/Safari theo sau) | Legacy fallback |
| **Hợp nhất** | Chat, game, collab | Notification, feed, AI streaming | Game cloud, media trễ thấp, lossy datagram | Fallback khi không gì khác chạy được |

## 💓 Reconnection + Heartbeat Pattern

Connection chết "âm thầm" (NAT timeout, mạng chuyển 4G→WiFi) — không heartbeat thì app tưởng còn connected:

```
Server: ping mỗi 15–30s (WS frame ping hoặc SSE comment ": keepalive")
Client: không nhận gì trong 45s → coi như chết → đóng + reconnect backoff
Client reconnect: exponential backoff (1s → 2s → 4s → max 30s) + jitter — tránh thundering herd
Resume: gửi Last-Event-ID (SSE) / seq number (WS) → server replay phần bỏ lỡ (từ Redis buffer)
```

- **Heartbeat 2 chiều bắt buộc** với WS: một số proxy đóng idle connection sau 60s không traffic — ping định kỳ giữ connection sống.
- Reconnect phải **backoff + jitter**, không retry tức thì: server vừa hồi phục mà 10k client reconnect cùng lúc = sập lại.
- State sau reconnect: re-subscribe topic, đồng bộ lại state (snapshot + diff) — đừng giả định connection mới = state cũ còn nguyên.

## 🎯 Vì sao SSE thường là lựa chọn đúng

- **Đơn giản**: HTTP thuần — không cần thư viện WS, không cần sticky session đặc biệt, mọi LB/proxy hiểu HTTP.
- **Tự động**: browser tự reconnect + tự gửi `Last-Event-ID` — server chỉ cần phát event có id tăng dần.
- Đủ dùng cho phần lớn use-case thực tế: notification, live feed, **AI token streaming** (ChatGPT-style dùng SSE!), progress bar, dashboard.
- Chỉ cần 2 chiều thật sự (chat, game, collab editing) mới chuyển lên WebSocket — và trả giá bằng reconnect/heartbeat/scale tự lo.

---

## 🎯 Khi nào dùng

| Protocol | Dùng khi |
|---|---|
| WebSocket | Chat, collab, game server-authoritative, 2 chiều web |
| SSE | Notification, live score, stock feed (server→client) |
| MQTT | IoT sensor, publish/subscribe qua broker, QoS 0/1/2 |
| WebRTC-DC | P2P trễ thấp (voice/game), file trực tiếp |
| Polling | Update hiếm (vài phút/lần), đơn giản là đủ |

---

## 🔗 Liên quan

- **11.4 WebSockets** — handshake + broadcast patterns chi tiết.
- **11.6 Rate Limiting** — giới hạn WebSocket connects tránh spam connection.
- **10.6 Redis** — pub/sub Redis broadcast WS/SSE qua nhiều instances.

---

## 📚 Tài liệu

- MDN WebSocket / SSE — https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- MQTT Essentials — https://www.hivemq.com/mqtt-essentials/
- WebRTC DataChannel — https://webrtc.org/

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.11-realtime-protocols
npx ts-node examples/index.ts
```

Demo: 6 use-case (chat, notification, sensor, game P2P, dashboard, upload) → protocol được chọn + lý do.

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm Networking — tiếp tục Concurrency:

→ [12.1 Async/Await](../../12-concurrency/12.1-async-await/README.md)
