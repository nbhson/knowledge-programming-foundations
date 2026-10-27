# 🔌 11.7 TCP vs UDP (Handshake & Reliability)

> **TCP** đảm bảo đến nơi, đúng thứ tự (giá là handshake + retransmit); **UDP** bắn rồi quên (nhanh, không đảm bảo) — QUIC/HTTP-3 thậm chí xây reliability riêng trên UDP.

---

## 🎯 Vấn đề

Chọn sai transport: dùng UDP cho chuyển tiền (mất packet = mất tiền), hoặc đòi TCP cho game bắn súng realtime (retransmit packet cũ 500ms chẳng còn ý nghĩa):

```
TCP:  SYN → SYN-ACK → ACK → data + ACK từng packet, mất → gửi lại ✅ chắc, chậm hơn
UDP:  bắn datagram, không ACK, không thứ tự ⚡ nhanh, mất thì thôi
```

---

## 💻 Code ví dụ

Mô phỏng sequence/ACK: TCP retransmit packet mất, UDP bỏ qua.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface Packet { seq: number; data: string }

// TCP: receiver ACK từng seq, sender gửi lại cái thiếu
function tcpSend(packets: Packet[], lostSeq: Set<number>): { received: string[]; retransmits: number } {
  const got = new Map<number, string>();
  let retransmits = 0;
  for (const p of packets) {
    if (lostSeq.has(p.seq)) { retransmits++; } // timeout → gửi lại → tới
    got.set(p.seq, p.data);
  }
  return { received: packets.map((p) => got.get(p.seq) as string), retransmits };
}

// UDP: mất là mất, receiver nhận gì dùng nấy
function udpSend(packets: Packet[], lostSeq: Set<number>): string[] {
  return packets.filter((p) => !lostSeq.has(p.seq)).map((p) => p.data);
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| TCP: đúng tuyệt đối | Mất packet tự gửi lại, đúng thứ tự — API, file, DB, tiền |
| UDP: trễ thấp nhất | Không handshake/ACK — game, voice/video, DNS lookup |
| Hiểu để debug | "API chậm" có thể là TCP retransmit do packet loss, không phải code |

---

## ⚠️ Lưu Ý

- TCP head-of-line blocking: 1 packet mất chặn cả stream — HTTP/3+QUIC (trên UDP) fix bằng per-stream retransmit.
- UDP không có congestion/flow control: app tự lo (hoặc dùng QUIC/RTP đã lo sẵn).
- Firewall/NAT thường ưu ái TCP: UDP port random có thể bị chặn — test môi trường user.

---

## 🚦 TCP Congestion Control (CUBIC, BBR)

TCP tự điều chỉnh tốc độ gửi theo mạng (không flood link) — ảnh hưởng trực tiếp throughput API của bạn:

| Thuật toán | Cách hoạt động | Ghi chú |
|---|---|---|
| **CUBIC** (mặc định Linux/Windows) | Window tăng theo hàm lập phương sau mỗi loss event — tăng nhanh, thu hẹp khi mất packet | Ổn định, chuẩn de-facto > 10 năm |
| **BBR** (Google, 2016) | Đo **bandwidth + RTT** thay vì chờ loss — gửi đúng đường ống, không đầy buffer | Cải thiện lớn trên mạng loss cao/vệ tinh; Chrome/YouTube/QUIC dùng BBR |
| Loss-based (Reno) | Mất packet = giảm 50% window | Cũ, kém trên đường loss cao |

- Debug: `ss -ti` xem `cwnd` (congestion window) + `retrans` — API chậm bất thường có thể là cwnd nhỏ do loss.
- Bật BBR server: `sysctl net.ipv4.tcp_congestion_control=bbr` — thường cho lợi ích rõ trên link chất lượng kém.

## 🐌 Nagle vs TCP_NODELAY

- **Nagle's algorithm**: gom các packet nhỏ lại chờ ACK trước để giảm overhead — tốt cho telnet, **tệ cho API/game** (thêm delay 40–200ms).
- **TCP_NODELAY** (tắt Nagle): gửi ngay mỗi write — mặc định bật trong hầu hết HTTP client/server hiện đại.
- Hiện tượng "1 request chậm 200ms không rõ lý do" → kiểm tra Nagle + **delayed ACK** tương tác nhau (Nagle đợi delayed-ACK của peer).
- Quy tắc: app request-response qua TCP → tắt Nagle; gửi stream nhỏ liên tục (telemetry) → cân nhắc giữ Nagle + tự buffer.

## 🎮 Khi nào UDP là lựa chọn ĐÚNG

| Use case | Vì sao UDP, không phải TCP |
|---|---|
| **Game FPS/action** | Trạng thái cũ (vị trí 300ms trước) vô giá trị — retransmit làm tình huống tệ hơn; client-side prediction + interpolation |
| **Voice/Video (WebRTC/RTP)** | Trễ > 150ms phá hội thoại; mất 1 frame chấp nhận được, chờ retransmit thì không |
| **DNS** | 1 query = 1 packet nhỏ, handshake TCP tốn gấp 2–3 lần; có fallback TCP cho response > 512B (EDNS/DNS over TCP) |
| **QUIC/HTTP-3** | Xây reliability + TLS 1.3 + multiplexing riêng trên UDP — lấy lợi thế UDP, tự lo phần cần thiết |
| **IoT/telemetry** | Sensor gửi mẫu mỗi 5s — mất 1 mẫu không sao, tiết kiệm pin (không keep-alive) |

> Đừng quên: UDP thuần = tự xử lý congestion, reordering, path MTU. Muốn reliability có kiểm soát → QUIC thay vì tự viết trên UDP thô.

---

## 🎯 Khi nào dùng

- TCP: HTTP/API, DB, file, email — mặc định cho mọi thứ cần đúng.
- UDP: realtime (game/voice/video), DNS, broadcast, IoT sensor — mất 1 mẫu chấp nhận được.
- QUIC: muốn cả hai — reliability kiểu TCP trên nền UDP.

---

## 🔗 Liên quan

- **11.10 HTTP/2-HTTP/3-QUIC** — QUIC xây lại TCP-tốt-hơn trên UDP.
- **11.9 TLS Handshake** — TLS chạy trên TCP (1.2/1.3); QUIC tích hợp TLS 1.3 sẵn.
- **11.4 WebSockets** — chạy trên TCP, kế thừa reliability + thứ tự.

---

## 📚 Tài liệu

- *Computer Networking: A Top-Down Approach* — Kurose & Ross
- Cloudflare: TCP vs UDP — https://www.cloudflare.com/learning/ddos/glossary/tcp-udp/

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.7-tcp-udp
npx ts-node examples/index.ts
```

Demo: mất packet 2/5 → TCP đủ 5/5 (1 retransmit) vs UDP còn 4/5 + sai thứ tự có thể.

---

## ⏭️ Bài tiếp theo

→ [11.8 DNS](../11.8-dns/README.md)
