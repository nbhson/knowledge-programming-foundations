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
