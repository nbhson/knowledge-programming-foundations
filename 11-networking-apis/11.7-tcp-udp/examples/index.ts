/**
 * 11.7 TCP vs UDP — handshake, reliability + mô phỏng sequence/ack
 *
 * Minh họa: mất packet #2 và #4 trong 5 packets:
 * - TCP: retransmit → nhận đủ 5/5, đúng thứ tự.
 * - UDP: còn 3/5, không retransmit, thứ tự không đảm bảo.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface Packet {
  seq: number;
  data: string;
}

function tcpSend(packets: Packet[], lost: Set<number>): { received: string[]; retransmits: number } {
  const got = new Map<number, string>();
  let retransmits = 0;
  for (const p of packets) {
    if (lost.has(p.seq)) {
      retransmits++; // timeout → gửi lại → lần 2 luôn tới (mô phỏng)
    }
    got.set(p.seq, p.data);
  }
  // TCP sắp xếp lại theo seq trước khi giao app
  const received = [...got.entries()].sort((a, b) => a[0] - b[0]).map(([, d]) => d);
  return { received, retransmits };
}

function udpSend(packets: Packet[], lost: Set<number>): string[] {
  // bắn rồi quên: mất là mất, tới sao dùng vậy
  return packets.filter((p) => !lost.has(p.seq)).map((p) => p.data);
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== TCP vs UDP Demo ===\n");
  console.log("Handshake TCP: SYN → SYN-ACK → ACK (1.5 RTT trước byte data đầu tiên)");
  console.log("UDP: không handshake — bắn ngay\n");

  const packets: Packet[] = [1, 2, 3, 4, 5].map((n) => ({ seq: n, data: `p${n}` }));
  const lost = new Set([2, 4]);
  console.log(`Mất packet seq {2, 4} trên đường truyền:\n`);

  const tcp = tcpSend(packets, lost);
  console.log(`TCP: nhận ${tcp.received.length}/5 [${tcp.received.join(", ")}] đúng thứ tự, retransmits=${tcp.retransmits} ✅`);

  const udp = udpSend(packets, lost);
  console.log(`UDP: nhận ${udp.length}/5 [${udp.join(", ")}] — mất là mất, app tự chịu ⚡`);

  console.log("\nChọn nhanh: cần ĐÚNG (tiền/file/API) → TCP; cần NHANH realtime (game/voice/DNS) → UDP; muốn cả hai → QUIC.");
}

main();

export {};
