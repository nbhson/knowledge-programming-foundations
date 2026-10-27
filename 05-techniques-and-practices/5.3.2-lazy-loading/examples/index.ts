/**
 * 5.3.2 Lazy Loading — Trì hoãn tải tài nguyên tới khi thực sự cần
 *
 * TS thuần + Node built-in, KHÔNG có React/DOM. Mô phỏng dynamic import
 * bằng hàm trả về Promise chứa "module giả", kết hợp cache 1 lần load.
 * So sánh: tải TẤT CẢ ngay lập tức vs tải THEO NHU CẦU (on demand).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────── Module giả (fake chunks) ─────────────────────────

interface LazyModule {
  name: string;
  sizeKb: number;
  description: string;
}

/** Mô phỏng 1 file chunk: tải = tốn bandwidth, có size thật */
function fakeChunk(name: string, sizeKb: number): Promise<LazyModule> {
  console.log(`      [NET] đang tải "${name}" ... ${sizeKb}KB`);
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name, sizeKb, description: `${name} đã sẵn sàng` }), 10);
  });
}

// ─────────────────── Lazy wrapper (dynamic import) ────────────────────

/**
 * Giả lập `import('...')`: function nhận loader trả Promise chứa module.
 * Lần đầu gọi mới thực sự "tải"; các lần sau trả về module đã có trong cache.
 */
function lazyLoad(loader: () => Promise<LazyModule>): () => Promise<LazyModule> {
  let cached: Promise<LazyModule> | null = null;

  return () => {
    if (cached === null) {
      cached = loader();
    } else {
      console.log("      [LAZY] module đã nằm trong cache — không tải lại");
    }
    return cached;
  };
}

// ─────────────────── Network counter giả ──────────────────────────────

class NetworkUsage {
  private downloaded = 0;
  private downloadedNames = new Set<string>();

  /** Chỉ tính phí 1 lần cho mỗi chunk — tải lại từ cache = miễn phí */
  async download(chunk: Promise<LazyModule>): Promise<LazyModule> {
    const mod = await chunk;
    if (!this.downloadedNames.has(mod.name)) {
      this.downloadedNames.add(mod.name);
      this.downloaded += mod.sizeKb;
    }
    return mod;
  }

  get totalKb(): number {
    return this.downloaded;
  }
}

// ─────────────────── Cách làm tốt: lazy on demand ─────────────────────

function createApp(net: NetworkUsage): {
  openChart(): Promise<LazyModule>;
  openAdmin(): Promise<LazyModule>;
  openReport(): Promise<LazyModule>;
} {
  // Tất cả "import" ở đây đều LAZY — chỉ tải khi gọi tới
  const chart = lazyLoad(() => fakeChunk("HeavyChart", 1024));
  const admin = lazyLoad(() => fakeChunk("AdminPanel", 2048));
  const report = lazyLoad(() => fakeChunk("ReportGenerator", 512));

  return {
    openChart: async () => net.download(chart()),
    openAdmin: async () => net.download(admin()),
    openReport: async () => net.download(report()),
  };
}

// ────────────────────────── Demo chạy ─────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(4);
}

async function main(): Promise<void> {
  console.log("=== 5.3.2 Lazy Loading Demo (TS thuần — mô phỏng dynamic import) ===\n");

  console.log("❌ CÁCH XẤU — import tất cả ngay (eager):");
  const netBad = new NetworkUsage();
  const eager1 = fakeChunk("HeavyChart", 1024);
  const eager2 = fakeChunk("AdminPanel", 2048);
  const eager3 = fakeChunk("ReportGenerator", 512);
  await netBad.download(eager1);
  await netBad.download(eager2);
  await netBad.download(eager3);
  console.log(`      Initial load = ${pad(netBad.totalKb)}KB (tải cả 3 dù chưa dùng)\n`);

  console.log("✅ CÁCH TỐT — lazy loading, tải theo nhu cầu:");
  const net = new NetworkUsage();
  const app = createApp(net);
  console.log(`      App khởi động → chưa tải gì (${net.totalKb}KB)`);

  console.log("      User vào Dashboard & mở biểu đồ:");
  await app.openChart(); // lần đầu → mới tải HeavyChart
  console.log(`      Đã tải: ${pad(net.totalKb)}KB (chỉ HeavyChart)`);

  console.log("      User lại mở biểu đồ (lần 2):");
  await app.openChart(); // cache → không tải lại
  console.log(`      Đã tải: ${pad(net.totalKb)}KB (không đổi)`);

  console.log("      Admin đăng nhập → mở AdminPanel:");
  await app.openAdmin(); // lần đầu → mới tải AdminPanel
  console.log(`      Đã tải: ${pad(net.totalKb)}KB`);

  console.log("      User mở báo cáo:");
  await app.openReport();
  console.log(`      Đã tải: ${pad(net.totalKb)}KB (tổng khi dùng hết mọi thứ)`);

  console.log(`\n📊 So sánh:`);
  console.log(`   • Initial load khi app khởi động: eager ${pad(netBad.totalKb)}KB vs lazy 0KB`);
  console.log(`   • Cùng dùng hết 3 module thì tổng bandwidth đều ${pad(net.totalKb)}KB —`);
  console.log('     nhưng Lazy chỉ "trả tiền" đúng lúc cần → khởi động nhanh, tiết kiệm cho user không dùng hết.');
  console.log("   → Ứng dụng thật (React.lazy, Webpack dynamic import) cũng chạy cùng cơ chế này.");
}

void main();

export {};