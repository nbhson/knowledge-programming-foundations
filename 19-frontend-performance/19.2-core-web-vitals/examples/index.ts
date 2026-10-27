/**
 * 19.2 Core Web Vitals — mô phỏng đo LCP/INP/CLS + xếp hạng theo ngưỡng Google
 * + checklist tối ưu theo từng chỉ số. Thuần số liệu, không cần trình duyệt.
 */

export {};

type MetricName = "LCP" | "INP" | "CLS";
type Rating = "good" | "needs-improvement" | "poor";

interface Threshold {
  good: number;
  poor: number;
  unit: string;
}

const THRESHOLDS: Record<MetricName, Threshold> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
};

/** Xếp hạng 1 chỉ số theo ngưỡng Google */
function rate(metric: MetricName, value: number): Rating {
  const t = THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

interface LayoutShift {
  impactFraction: number;
  distanceFraction: number;
  hadRecentInput: boolean; // shift sau input user → không tính (expected)
}

/** CLS = tổng impact × distance của các shift BẤT NGỜ (không sau input) */
function computeCls(shifts: LayoutShift[]): number {
  return shifts
    .filter((s) => !s.hadRecentInput)
    .reduce((sum, s) => sum + s.impactFraction * s.distanceFraction, 0);
}

/** p75 mô phỏng: sắp xếp mẫu rồi lấy phân vị 75 */
function p75(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
  return sorted[idx];
}

const CHECKLIST: Record<MetricName, string[]> = {
  LCP: ["preload ảnh hero + fetchpriority=high", "nén AVIF/WebP, đúng kích cỡ", "CDN + cache, SSR/SSG cho FCP"],
  INP: ["chia task JS dài (>50ms) bằng scheduler/yield", "debounce handler, đưa việc nặng vào worker", "gỡ third-party chặn main-thread"],
  CLS: ["đặt width/height cố định cho ảnh-ads-iframe", "font-display: swap + fallback tương đương", "không chèn banner muộn đẩy nội dung"],
};

function main(): void {
  console.log("=== 19.2 Core Web Vitals Demo ===");
  console.log("");

  console.log("1. Rate từng chỉ số (ngưỡng Google):");
  const samples: Array<[MetricName, number]> = [
    ["LCP", 1800],
    ["LCP", 3200],
    ["INP", 120],
    ["INP", 650],
    ["CLS", 0.05],
    ["CLS", 0.3],
  ];
  const icon: Record<Rating, string> = { good: "✅", "needs-improvement": "⚠️", poor: "❌" };
  for (const [m, v] of samples) {
    const r = rate(m, v);
    console.log(`   ${m}=${v}${THRESHOLDS[m].unit} → ${icon[r]} ${r}`);
  }
  console.log("");

  console.log("2. CLS mô phỏng (2 shift bất ngờ + 1 sau input → loại):");
  const cls = computeCls([
    { impactFraction: 0.4, distanceFraction: 0.3, hadRecentInput: false },
    { impactFraction: 0.2, distanceFraction: 0.25, hadRecentInput: false },
    { impactFraction: 0.9, distanceFraction: 0.9, hadRecentInput: true },
  ]);
  console.log(`   CLS=${cls.toFixed(3)} → ${icon[rate("CLS", cls)]} ${rate("CLS", cls)}`);
  console.log("");

  console.log("3. p75 trên RUM mô phỏng (LCP 8 mẫu):");
  const lcpSamples = [1200, 1500, 1800, 2100, 2400, 2900, 3600, 5200];
  const p75lcp = p75(lcpSamples);
  console.log(`   p75=${p75lcp}ms → ${icon[rate("LCP", p75lcp)]} ${rate("LCP", p75lcp)} (Google dùng p75, không phải trung bình)`);
  console.log("");

  console.log("4. Checklist tối ưu:");
  (Object.keys(CHECKLIST) as MetricName[]).forEach((m) => {
    console.log(`   ${m}:`);
    CHECKLIST[m].forEach((c) => console.log(`     - ${c}`));
  });
  console.log("");
  console.log("✅ Đo + rating LCP/INP/CLS + checklist hoạt động");
}

main();
