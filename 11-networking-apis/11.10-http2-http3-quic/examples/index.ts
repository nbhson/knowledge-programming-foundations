/**
 * 11.10 HTTP/2, HTTP/3 & QUIC — multiplexing, HPACK/QPACK, 0-RTT + so sánh
 *
 * Minh họa:
 * - Bảng so sánh 1.1 / 2 / 3.
 * - HPACK: header lặp → gửi index (nén ~85%).
 * - Packet loss: H2 chặn tất cả streams (TCP HOL) vs H3 chỉ 1 stream.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────── HPACK/QPACK tối giản: bảng tra cứu ───────────
class HeaderTable {
  private table = new Map<string, number>();
  private seq = 0;

  encode(headers: Record<string, string>): string {
    return Object.entries(headers)
      .map(([k, v]) => {
        const key = `${k}: ${v}`;
        const idx = this.table.get(key);
        if (idx !== undefined) return `[idx ${idx}]`;
        this.seq++;
        this.table.set(key, this.seq);
        return `${k}: ${v} (mới, lưu idx ${this.seq})`;
      })
      .join(" | ");
  }
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== HTTP/2, HTTP/3 & QUIC Demo ===\n");

  console.log("So sánh:");
  console.log("  feature        | 1.1              | 2 (TCP)            | 3 (QUIC/UDP)");
  console.log("  multiplex      | ❌ tuần tự/conn   | ✅ nhiều streams   | ✅ + per-stream loss");
  console.log("  nén header     | ❌ full mỗi req   | ✅ HPACK           | ✅ QPACK");
  console.log("  HOL blocking   | có (app+TCP)      | có (TCP)           | không (per-stream)");
  console.log("  nối lại        | 3 RTT             | 3 RTT              | 0-RTT");
  console.log("  migration      | đứt khi đổi IP   | đứt khi đổi IP    | sống (conn-less)");

  console.log("\nHPACK: request 2 gửi lại headers giống request 1:");
  const table = new HeaderTable();
  const h = { ":method": "GET", ":path": "/api/users", "user-agent": "app/1.0" };
  console.log(`  req1: ${table.encode(h)}`);
  console.log(`  req2: ${table.encode(h)} ← chỉ còn index, ~85% nhỏ hơn ✅`);

  console.log("\nPacket loss 1 packet khi tải 4 streams song song:");
  console.log("  H2/TCP : packet mất chặn TẤT CẢ 4 streams tới khi retransmit xong ⏳");
  console.log("  H3/QUIC: chỉ stream chứa packet đó chờ, 3 streams còn lại chạy tiếp ✅");

  log0RTT();

  console.log("\n✅ Bài học: bật H2 cho mọi site; H3 cho user mobile/mạng lossy; 0-RTT chỉ cho GET idempotent.");
}

function log0RTT(): void {
  console.log("\n0-RTT: client nối lại server quen → gửi data ngay trong packet đầu (không chờ handshake).");
}

main();

export {};
