/**
 * 13.1 Load Balancer — Demo
 *
 * Mô phỏng các thuật toán cân bằng tải:
 *   - Round Robin (vòng quay tuần tự)
 *   - Least Connections (server ít kết nối nhất)
 *   - Health Check (bỏ qua server không khỏe, tự phục hồi)
 */

interface LBServerHandle {
  readonly name: string;
  readonly capacity: number;
  isHealthy(): boolean;
  setHealthy(healthy: boolean): void;
  getActiveConnections(): number;
  getRequestCount(): number;
  handleRequest(requestId: number): string;
}

class LBServer implements LBServerHandle {
  readonly name: string;
  readonly capacity: number;
  private healthy = true;
  private activeConnections = 0;
  private requestCount = 0;

  constructor(name: string, capacity: number = 1) {
    this.name = name;
    this.capacity = capacity;
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  setHealthy(healthy: boolean): void {
    this.healthy = healthy;
    console.log(
      `    🩺 [${this.name}] health check → ${healthy ? "PASS (khỏe mạnh)" : "FAIL (offline)"}`
    );
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  handleRequest(requestId: number): string {
    this.activeConnections++;
    this.requestCount++;
    console.log(`    📨 [${this.name}] nhận request #${requestId} (active: ${this.activeConnections})`);
    this.activeConnections--;
    return `Request #${requestId} → ${this.name}`;
  }

  addArtificialLoad(load: number): void {
    this.activeConnections += load;
  }
}

abstract class LBBalancer {
  protected readonly servers: LBServer[];

  constructor(servers: LBServer[]) {
    this.servers = servers;
  }

  protected healthyServers(): LBServer[] {
    return this.servers.filter((s) => s.isHealthy());
  }

  /** Chọn server tiếp theo theo chiến lược của lớp con */
  abstract pickNext(): LBServer;

  dispatch(requestId: number): string {
    const pool = this.healthyServers();
    if (pool.length === 0) {
      console.log(`    🚫 Không còn server khỏe mạnh — request #${requestId} bị từ chối (503)`);
      return "503 Service Unavailable";
    }
    const server = this.pickNext();
    return server.handleRequest(requestId);
  }
}

class LBRoundRobinBalancer extends LBBalancer {
  private cursor = 0;

  pickNext(): LBServer {
    const pool = this.healthyServers();
    const server = pool[this.cursor % pool.length];
    this.cursor++;
    return server;
  }
}

class LBLeastConnectionsBalancer extends LBBalancer {
  pickNext(): LBServer {
    const pool = this.healthyServers();
    return pool.reduce((best, current) =>
      current.getActiveConnections() < best.getActiveConnections() ? current : best
    );
  }
}

class LBWeightedRoundRobinBalancer extends LBBalancer {
  private remaining = new Map<string, number>();

  pickNext(): LBServer {
    const pool = this.healthyServers();
    for (const server of pool) {
      const left = this.remaining.get(server.name) ?? 0;
      if (left <= 0) {
        this.remaining.set(server.name, server.capacity);
      }
    }
    const candidate = pool.find((s) => (this.remaining.get(s.name) ?? 0) > 0);
    const next = candidate ?? pool[0];
    this.remaining.set(next.name, (this.remaining.get(next.name) ?? 0) - 1);
    return next;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Load Balancer Demo ===");
console.log("");

const lbServers = [
  new LBServer("App 1", 3),
  new LBServer("App 2", 1),
  new LBServer("App 3", 2),
];

console.log("1️⃣ Round Robin — 6 request luân phiên qua 3 server:");
const rr = new LBRoundRobinBalancer(lbServers);
for (let i = 1; i <= 6; i++) {
  console.log(`  ${rr.dispatch(i)}`);
}
console.log("");

console.log("2️⃣ Health Check — App 2 bị fail, bị bỏ qua khỏi pool:");
lbServers[1].setHealthy(false);
for (let i = 7; i <= 9; i++) {
  console.log(`  ${rr.dispatch(i)}`);
}
lbServers[1].setHealthy(true);
console.log("");
console.log(`  Sau khi App 2 khỏe lại → tổng request mỗi server: App1=${lbServers[0].getRequestCount()}, App2=${lbServers[1].getRequestCount()}, App3=${lbServers[2].getRequestCount()}`);
console.log("");

console.log("3️⃣ Least Connections — App 1/C đang tải nặng nên chọn App 2:");
lbServers[0].addArtificialLoad(8);
lbServers[1].addArtificialLoad(1);
lbServers[2].addArtificialLoad(5);
const lc = new LBLeastConnectionsBalancer(lbServers);
for (let i = 10; i <= 13; i++) {
  console.log(`  ${lc.dispatch(i)}`);
}
console.log("");

console.log("4️⃣ Weighted Round Robin — App 1 (weight 3), App 3 (weight 2), App 2 (weight 1):");
const wrr = new LBWeightedRoundRobinBalancer([
  new LBServer("App 1", 3),
  new LBServer("App 2", 1),
  new LBServer("App 3", 2),
]);
for (let i = 14; i <= 18; i++) {
  console.log(`  ${wrr.dispatch(i)}`);
}
console.log("");

console.log("5️⃣ Không server khỏe mạnh — LB trả 503:");
const deadServer = new LBServer("App X");
deadServer.setHealthy(false);
console.log(`  ${new LBRoundRobinBalancer([deadServer]).dispatch(99)}`);
console.log("");
console.log("✅ Load Balancer phân phối request theo round-robin, least-connections, kết hợp health check");

export {};