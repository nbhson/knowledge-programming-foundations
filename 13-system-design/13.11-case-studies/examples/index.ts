/**
 * 13.11 Case Studies — Demo
 *
 * Mô phỏng mini cho 3 case phỏng vấn system design:
 *   - URL shortener: base62 encode + capacity estimation
 *   - Chat 1-1: message store + hội thoại theo thứ tự
 *   - Twitter feed: fan-out push vs pull (đếm chi phí)
 * Chạy: npx ts-node examples/index.ts (từ thư mục 13.11-case-studies)
 */

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Encode id tăng dần → short code (cách đơn giản nhất, không đụng độ). */
function encodeBase62(n: number): string {
  if (n === 0) return "0";
  let code = "";
  let x = n;
  while (x > 0) {
    code = BASE62[x % 62] + code;
    x = Math.floor(x / 62);
  }
  return code;
}

class UrlShortener {
  private counter = 1;
  private readonly codeToUrl = new Map<string, string>();

  shorten(longUrl: string): string {
    const code = encodeBase62(this.counter++);
    this.codeToUrl.set(code, longUrl);
    return code;
  }

  resolve(code: string): string | null {
    return this.codeToUrl.get(code) ?? null;
  }
}

interface Capacity {
  readonly avgQps: number;
  readonly peakQps: number;
  readonly storagePerDayGb: number;
}

/** Ước lượng back-of-envelope: QPS trung bình/peak + storage/ngày. */
function estimateCapacity(opts: {
  dailyActiveUsers: number;
  reqPerUserPerDay: number;
  bytesPerReq: number;
  peakFactor?: number;
}): Capacity {
  const peakFactor = opts.peakFactor ?? 5;
  const totalReq = opts.dailyActiveUsers * opts.reqPerUserPerDay;
  const avgQps = Math.round(totalReq / 86400);
  return {
    avgQps,
    peakQps: avgQps * peakFactor,
    storagePerDayGb: (totalReq * opts.bytesPerReq) / 1e9,
  };
}

interface ChatMessage {
  readonly from: string;
  readonly to: string;
  readonly text: string;
  readonly seq: number;
}

/** Chat 1-1: store append-only, đọc hội thoại theo seq (khái niệm). */
class ChatStore {
  private readonly messages: ChatMessage[] = [];
  private seq = 1;

  send(from: string, to: string, text: string): void {
    this.messages.push({ from, to, text, seq: this.seq++ });
  }

  conversation(a: string, b: string): ChatMessage[] {
    return this.messages.filter(
      (m) => (m.from === a && m.to === b) || (m.from === b && m.to === a)
    );
  }
}

/** Feed: so chi phí push (fan-out on write) vs pull (fan-out on read). */
class FeedModel {
  /** Push: mỗi post ghi vào inbox của từng follower → write amplification = #followers. */
  pushWrites(postsPerDay: number, followers: number): number {
    return postsPerDay * followers;
  }

  /** Pull: mỗi lần mở timeline đọc từ K người follow → read amplification = #followees. */
  pullReads(timelineOpensPerDay: number, followees: number): number {
    return timelineOpensPerDay * followees;
  }
}

function main(): void {
  console.log("=== System Design Case Studies Demo ===");
  console.log("");

  // Case 1: URL shortener
  console.log("1️⃣ URL shortener — base62 + capacity:");
  const shortener = new UrlShortener();
  const urls = ["https://example.com/a-very/long/article", "https://example.com/sale", "https://example.com/docs"];
  for (const u of urls) {
    const code = shortener.shorten(u);
    console.log(`   ${u} → https://sho.rt/${code} (resolve: ${shortener.resolve(code) === u ? "OK" : "FAIL"})`);
  }
  const urlCap = estimateCapacity({ dailyActiveUsers: 10_000_000, reqPerUserPerDay: 2, bytesPerReq: 500 });
  console.log(`   Capacity: avg ~${urlCap.avgQps} QPS, peak ~${urlCap.peakQps} QPS, storage ~${urlCap.storagePerDayGb.toFixed(1)} GB/ngày`);
  console.log("");

  // Case 2: Chat 1-1
  console.log("2️⃣ Chat 1-1 — WebSocket + message store:");
  const chat = new ChatStore();
  chat.send("alice", "bob", "Ê, review PR giúp t");
  chat.send("bob", "alice", "Ok, 5 phút nữa");
  chat.send("alice", "bob", "Nhớ check cả migration nhé");
  for (const m of chat.conversation("alice", "bob")) {
    console.log(`   #${m.seq} ${m.from} → ${m.to}: ${m.text}`);
  }
  const chatCap = estimateCapacity({ dailyActiveUsers: 50_000_000, reqPerUserPerDay: 40, bytesPerReq: 200 });
  console.log(`   Capacity: avg ~${chatCap.avgQps} QPS, peak ~${chatCap.peakQps} QPS`);
  console.log("");

  // Case 3: Twitter feed
  console.log("3️⃣ Twitter feed — push vs pull:");
  const feed = new FeedModel();
  const celebPush = feed.pushWrites(5, 10_000_000); // celeb 10M followers post 5 lần/ngày
  const normalPull = feed.pullReads(2_000_000, 300); // 2M user mở timeline, mỗi người follow 300
  console.log(`   Push (celeb): 5 posts × 10M followers = ${celebPush.toLocaleString()} writes/ngày → quá tải!`);
  console.log(`   Pull (normal): 2M opens × 300 followees = ${normalPull.toLocaleString()} reads/ngày → nặng read`);
  console.log("   → Hybrid: user thường dùng push, celeb (fan-out lớn) dùng pull (fan-out on read)");
  console.log("");
  console.log("✅ Công thức chung: requirements → capacity → API → data model → architecture → deep dive");
}

main();

export {};
