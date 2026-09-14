/**
 * 13.5 CAP Theorem — Demo
 *
 * Mô phỏng network partition giữa Node A và Node B, rồi so sánh:
 *   - Hệ thống AP: partition vẫn trả response (data có thể STALE)
 *   - Hệ thống CP: partition từ chối response để giữ consistency
 *
 * Quy tắc CAP: chỉ chọn được 2 trong 3 (C, A, P).
 * Partition Tolerance là bắt buộc trong distributed system → phải chọn CP hoặc AP.
 */

class CAPNode {
  readonly name: string;
  private store = new Map<string, string>();

  constructor(name: string, seed: Record<string, string> = {}) {
    this.name = name;
    for (const [key, value] of Object.entries(seed)) {
      this.store.set(key, value);
    }
  }

  write(key: string, value: string): void {
    this.store.set(key, value);
  }

  read(key: string): string | undefined {
    return this.store.get(key);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }

  cloneFrom(source: CAPNode): void {
    for (const key of source.keys()) {
      const value = source.read(key);
      if (value !== undefined) this.store.set(key, value);
    }
  }
}

type CAPMode = "AP" | "CP";

/**
 * Hệ thống 2 node: client ghi vào Node A, đọc từ Node B.
 * Khi partition, đường replicate A → B bị đứt.
 */
class CAPSystem {
  readonly nodeA: CAPNode;
  readonly nodeB: CAPNode;
  readonly mode: CAPMode;
  private partitioned = false;

  constructor(mode: CAPMode) {
    this.mode = mode;
    this.nodeA = new CAPNode("Node A (primary)", { balance: "100" });
    this.nodeB = new CAPNode("Node B (replica)", { balance: "100" });
  }

  setPartition(on: boolean): void {
    this.partitioned = on;
    console.log(
      `  🧨 Partition: ${on ? "ĐỨT kết nối A↔B — 2 node mất liên lạc" : "đã phục hồi kết nối A↔B"}`
    );
  }

  isPartitioned(): boolean {
    return this.partitioned;
  }

  /** Ghi số dư mới vào Node A, cố replicate sang Node B */
  transfer(newBalance: string): void {
    this.nodeA.write("balance", newBalance);
    console.log(`  ✍️  Ghi balance=${newBalance} vào Node A ...`);
    if (this.partitioned) {
      console.log("  ❌ Replicate sang Node B: THẤT BẠI (partition) — Node B vẫn giữ data cũ");
    } else {
      this.nodeB.write("balance", newBalance);
      console.log(`  ✅ Replicate sang Node B: thành công — cả 2 đều balance=${newBalance}`);
    }
  }

  /** Đọc số dư từ Node B (phía xa client) */
  readBalance(): string {
    const value = this.nodeB.read("balance") ?? "-";
    if (!this.partitioned) {
      return `balance=${value} (Node B, không partition → chính xác)`;
    }
    if (this.mode === "AP") {
      return `balance=${value} (AP: vẫn PHỤC VỤ từ Node B nhưng data có thể STALE — phía A đã ghi ${this.nodeA.read("balance")})`;
    }
    return `(CP: TỪ CHỐI đọc vì partition — không thể đảm bảo Node B có data mới nhất)`;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== CAP Theorem Demo ===");
console.log("");

console.log("1️⃣ Bình thường (không partition) — C, A, P cùng thỏa:");
const normal = new CAPSystem("AP");
normal.setPartition(false);
normal.transfer("150");
console.log(`  📖 ${normal.readBalance()}`);
console.log("");

console.log("2️⃣ PARTITION xảy ra — chọn chế độ AP (Availability):");
const ap = new CAPSystem("AP");
ap.setPartition(true);
ap.transfer("200");
console.log(`  📖 ${ap.readBalance()}`);
console.log("  💡 AP = luôn có TÍNH SẴN SÀNG, chấp nhận data cũ (eventual consistency)");
console.log("");

console.log("3️⃣ PARTITION xảy ra — chế độ CP (Consistency):");
const cp = new CAPSystem("CP");
cp.setPartition(true);
cp.transfer("200");
console.log(`  📖 ${cp.readBalance()}`);
console.log("  💡 CP = KHÔNG trả response để bảo đảm CONSISTENCY — hy sinh availability");
console.log("");

console.log("4️⃣ Partition hết — CP phục hồi và đồng bộ lại:");
cp.setPartition(false);
cp.nodeB.cloneFrom(cp.nodeA);
cp.transfer("200");
console.log(`  📖 ${cp.readBalance()}`);
console.log("");

console.log("5️⃣ Bảng quyết định CAP:");
console.log("  ┌────────┬──────────────┬───────────────────────────────┐");
console.log("  │ Chế độ │ Khi partition │ Đánh đổi                       │");
console.log("  ├────────┼──────────────┼───────────────────────────────┤");
console.log("  │   AP   │ Serve stale  │ Data có thể cũ (feed, cache)   │");
console.log("  │   CP   │ Reject read  │ Mất availability (banking)     │");
console.log("  └────────┴──────────────┴───────────────────────────────┘");
console.log("  💬 Partition Tolerance bắt buộc với distributed system → chỉ được chọn AP HOẶC CP.");
console.log("");
console.log("✅ CAP cho thấy khi phân chia mạng, phải đánh đổi: AP (còn phục vụ nhưng data cũ) hay CP (chính xác nhưng từ chối phục vụ)");

export {};