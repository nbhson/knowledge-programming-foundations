/**
 * 13.10 Consensus & Raft — Demo
 *
 * Mô phỏng khái niệm Raft (không phải implementation đầy đủ):
 *   - Leader election theo term + quorum (majority): thắng khi votes > N/2
 *   - Split vote: 2 candidate cùng term → không ai đủ quorum → tăng term bầu lại
 *   - Log replication: leader commit entry khi đủ quorum ack (chịu được minority lỗi)
 * Ghi chú: Paxos là tiền đề lý thuyết; Raft chọn khả năng hiểu được (understandability).
 * Chạy: npx ts-node examples/index.ts (từ thư mục 13.10-consensus-raft)
 */

type RaftState = "follower" | "candidate" | "leader";

class RaftNode {
  state: RaftState = "follower";
  term = 0;
  votedFor: number | null = null;
  alive = true;
  readonly log: string[] = [];

  constructor(readonly id: number) {}
}

class RaftCluster {
  readonly nodes: RaftNode[];

  constructor(size: number = 5) {
    this.nodes = [];
    for (let i = 1; i <= size; i++) this.nodes.push(new RaftNode(i));
  }

  get quorum(): number {
    return Math.floor(this.nodes.length / 2) + 1;
  }

  aliveNodes(): RaftNode[] {
    return this.nodes.filter((n) => n.alive);
  }

  kill(id: number): void {
    const n = this.nodes.find((x) => x.id === id);
    if (n) {
      n.alive = false;
      if (n.state === "leader") n.state = "follower";
      console.log(`    💥 node ${id} sập (partition/crash) — còn sống: ${this.aliveNodes().length}/${this.nodes.length}`);
    }
  }

  /** 1 candidate bầu ở term mới; follower vote cho candidate đầu tiên có term lớn hơn. */
  startElection(candidateId: number, term: number): boolean {
    const cand = this.nodes.find((n) => n.id === candidateId);
    if (!cand || !cand.alive) return false;
    cand.state = "candidate";
    cand.term = term;
    cand.votedFor = candidateId;
    let votes = 1; // tự vote cho mình
    for (const n of this.nodes) {
      if (n.id === candidateId || !n.alive) continue;
      if (term > n.term && n.votedFor !== term) {
        n.term = term;
        n.votedFor = candidateId;
        votes++;
      }
    }
    const won = votes >= this.quorum;
    cand.state = won ? "leader" : "follower";
    console.log(`    🗳️  term ${term}: node ${candidateId} được ${votes}/${this.aliveNodes().length} phiếu (quorum=${this.quorum}) → ${won ? "LEADER 👑" : "thua, chờ term sau"}`);
    return won;
  }

  /** 2 candidate cùng term → split vote (minh họa vì sao cần randomized timeout). */
  splitVote(term: number, first: number, second: number): void {
    console.log(`    🗳️  term ${term}: node ${first} và node ${second} cùng tranh cử...`);
    const alive = this.aliveNodes().map((n) => n.id);
    // Follower vote cho candidate xuất hiện trước trong thứ tự áp đảo (chia đôi phiếu).
    const half = Math.ceil((alive.length - 2) / 2);
    const votesFirst = 1 + Math.min(half, alive.length - 2);
    const votesSecond = alive.length - votesFirst;
    console.log(`    ↳ node ${first}: ${votesFirst} phiếu, node ${second}: ${votesSecond} phiếu — không ai đạt quorum=${this.quorum} → split vote, tăng term bầu lại`);
  }

  /** Leader replicate entry; commit khi đủ quorum ack từ node sống. */
  replicate(entry: string): boolean {
    const leader = this.nodes.find((n) => n.state === "leader" && n.alive);
    if (!leader) {
      console.log(`    📝 replicate "${entry}" → THẤT BẠI (không có leader)`);
      return false;
    }
    let acks = 1; // leader tự có entry
    for (const n of this.nodes) {
      if (n.id === leader.id || !n.alive) continue;
      if (n.term <= leader.term) {
        n.term = leader.term;
        n.log.push(entry);
        acks++;
      }
    }
    leader.log.push(entry);
    const committed = acks >= this.quorum;
    console.log(`    📝 leader ${leader.id} replicate "${entry}": ack ${acks}/${this.aliveNodes().length} (quorum=${this.quorum}) → ${committed ? "COMMITTED ✔" : "NOT COMMITTED ✘ (mất quorum)"}`);
    return committed;
  }
}

function main(): void {
  console.log("=== Consensus & Raft Demo (5 nodes, quorum=3) ===");
  console.log("");

  const cluster = new RaftCluster(5);

  console.log("1️⃣ Election — node 1 thắng ở term 1:");
  cluster.startElection(1, 1);
  console.log("");

  console.log("2️⃣ Log replication khi đủ quorum:");
  cluster.replicate("SET x=1");
  cluster.replicate("SET y=2");
  console.log("");

  console.log("3️⃣ Split vote — 2 candidate cùng term 2 (lý do cần randomized election timeout):");
  cluster.splitVote(2, 2, 3);
  console.log("   → term 3: node 2 bầu lại một mình:");
  cluster.startElection(2, 3);
  console.log("");

  console.log("4️⃣ Chịu lỗi minority — sập 2/5 node, cluster vẫn commit (3 >= quorum 3):");
  cluster.kill(4);
  cluster.kill(5);
  cluster.replicate("SET z=3");
  console.log("");

  console.log("5️⃣ Mất quorum — sập thêm 1 node (chỉ còn 2/5), không commit được:");
  cluster.kill(3);
  cluster.replicate("SET w=4");
  console.log("");
  console.log("✅ Raft: election theo term + majority vote; commit khi đủ quorum → an toàn khi mất minority");
}

main();

export {};
