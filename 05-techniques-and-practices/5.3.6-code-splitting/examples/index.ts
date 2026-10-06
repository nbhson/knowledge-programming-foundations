/**
 * 5.3.6 Code Splitting — Chia bundle lớn thành chunks tải theo route
 *
 * TS thuần + Node built-in. Mô phỏng bundler chia routes thành chunks
 * và dynamic import() chỉ tải chunk khi user vào route đó.
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface RouteChunk {
  route: string;
  chunk: string;
  sizeKb: number;
  loader: () => Promise<string>;
}

function fakeImport(chunk: string, sizeKb: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`${chunk} (${sizeKb}KB) đã tải`), 10);
  });
}

const routes: RouteChunk[] = [
  { route: "/", chunk: "dashboard.js", sizeKb: 150, loader: () => fakeImport("dashboard.js", 150) },
  { route: "/admin", chunk: "admin.js", sizeKb: 200, loader: () => fakeImport("admin.js", 200) },
  { route: "/settings", chunk: "settings.js", sizeKb: 80, loader: () => fakeImport("settings.js", 80) },
  { route: "/reports", chunk: "reports.js", sizeKb: 150, loader: () => fakeImport("reports.js", 150) },
];

class ChunkCache {
  private loaded = new Map<string, string>();
  downloadedKb = 0;

  async navigate(route: string): Promise<void> {
    const r = routes.find((x) => x.route === route);
    if (!r) {
      console.log(`   [404] route ${route} không tồn tại`);
      return;
    }
    const cached = this.loaded.get(r.chunk);
    if (cached) {
      console.log(`   [CACHE] ${route} → ${r.chunk} đã có, không tải lại`);
      return;
    }
    console.log(`   [NET] tải ${r.chunk} (${r.sizeKb}KB) cho route ${route}...`);
    const content = await r.loader();
    this.loaded.set(r.chunk, content);
    this.downloadedKb += r.sizeKb;
    console.log(`   [OK] ${route} render xong (tổng đã tải: ${this.downloadedKb}KB)`);
  }
}

async function main(): Promise<void> {
  console.log("=== 5.3.6 Code Splitting Demo (mô phỏng route chunks) ===\n");

  const total = routes.reduce((s, r) => s + r.sizeKb, 0);
  console.log("❌ BAD — 1 bundle duy nhất:");
  console.log(`   app.js = ${total}KB, user mở homepage cũng tải cả admin/reports.\n`);

  console.log("✅ GOOD — route-level splitting + lazy load:");
  const app = new ChunkCache();
  console.log("  User mở homepage /:");
  await app.navigate("/");
  console.log("  User vào /admin:");
  await app.navigate("/admin");
  console.log("  User quay lại / (đã cache):");
  await app.navigate("/");
  console.log("  User vào /reports:");
  await app.navigate("/reports");

  console.log(`\n📊 So sánh initial load:`);
  console.log(`   • Không split: tải ngay ${total}KB`);
  console.log(`   • Có split: homepage chỉ tải 150KB (giảm ${total - 150}KB initial)`);
  console.log("   → Production: React.lazy + Suspense, webpackPrefetch cho route quan trọng.");
}

void main();

export {};
