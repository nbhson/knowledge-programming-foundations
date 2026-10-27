/**
 * 11.11 Realtime Protocols — WebSocket vs SSE vs MQTT vs WebRTC-datachannel + ma trận chọn
 *
 * Minh họa ma trận quyết định: 6 use-case → protocol đúng + lý do.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
type Protocol = "WebSocket" | "SSE" | "MQTT" | "WebRTC-DC" | "Polling";

interface UseCase {
  name: string;
  twoWay: boolean;
  peers: string; // "server" | "iot" | "p2p"
  freq: "high" | "low";
}

function choose(u: UseCase): { proto: Protocol; why: string } {
  if (u.peers === "iot") return { proto: "MQTT", why: "nhẹ, broker, QoS, sensor pin yếu" };
  if (u.peers === "p2p") return { proto: "WebRTC-DC", why: "P2P trễ thấp, không qua server" };
  if (!u.twoWay) {
    if (u.freq === "low") return { proto: "Polling", why: "update hiếm — đơn giản là đủ" };
    return { proto: "SSE", why: "push 1 chiều, auto-reconnect, 20 dòng code" };
  }
  return { proto: "WebSocket", why: "2 chiều web, full-duplex, 1 connection" };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Realtime Protocol Picker Demo ===\n");

  const cases: UseCase[] = [
    { name: "chat nhóm", twoWay: true, peers: "server", freq: "high" },
    { name: "notification đơn hàng", twoWay: false, peers: "server", freq: "high" },
    { name: "cảm biến nhiệt độ (1000 node)", twoWay: false, peers: "iot", freq: "high" },
    { name: "call/game P2P", twoWay: true, peers: "p2p", freq: "high" },
    { name: "trạng thái đơn (5 phút/lần)", twoWay: false, peers: "server", freq: "low" },
    { name: "sửa doc cùng lúc", twoWay: true, peers: "server", freq: "high" },
  ];

  for (const u of cases) {
    const r = choose(u);
    console.log(`  ${u.name.padEnd(28)} → ${r.proto.padEnd(10)} (${r.why})`);
  }

  console.log("\nMa trận nhớ nhanh:");
  console.log("  2 chiều web → WS · push 1 chiều → SSE · IoT → MQTT · P2P → WebRTC-DC · hiếm → polling");
  console.log("\n✅ Bài học: đủ 1 chiều thì đừng WebSocket; IoT đừng HTTP; P2P đừng qua server.");
}

main();

export {};
