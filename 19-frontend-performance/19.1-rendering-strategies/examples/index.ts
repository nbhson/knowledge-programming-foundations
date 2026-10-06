/**
 * 19.1 Rendering Strategies — ma trận chọn CSR/SSR/SSG/ISR theo tính chất route
 * + mô phỏng build routing + checklist hydration. Thuần số liệu, không cần framework.
 */

export {};

type Strategy = "CSR" | "SSR" | "SSG" | "ISR";
type UpdateFreq = "realtime" | "hourly" | "rarely";

interface RouteSpec {
  path: string;
  dynamic: boolean;
  updateFreq: UpdateFreq;
  seoNeeded: boolean;
}

interface Decision {
  route: string;
  strategy: Strategy;
  reason: string;
  buildStep: string;
}

/** Ma trận chọn chiến lược render */
function pickStrategy(route: RouteSpec): Decision {
  if (!route.dynamic && route.updateFreq === "rarely") {
    return {
      route: route.path,
      strategy: "SSG",
      reason: "tĩnh, ít đổi → render 1 lần lúc build, serve từ CDN",
      buildStep: "prerender lúc build",
    };
  }
  if (!route.dynamic && route.updateFreq !== "realtime") {
    return {
      route: route.path,
      strategy: "ISR",
      reason: "tĩnh nhưng cập nhật theo giờ → tái sinh nền sau N giây",
      buildStep: "prerender + revalidate=3600s",
    };
  }
  if (route.dynamic && route.seoNeeded) {
    return {
      route: route.path,
      strategy: "SSR",
      reason: "động + cần SEO → render mỗi request trên server",
      buildStep: "render lúc request (server)",
    };
  }
  return {
    route: route.path,
    strategy: "CSR",
    reason: "động, không cần SEO (app nội bộ) → browser render, server nhẹ",
    buildStep: "ship shell + JS, render ở browser",
  };
}

/** Mô phỏng output của build routing */
function simulateBuild(routes: RouteSpec[]): Decision[] {
  return routes.map(pickStrategy);
}

/** Checklist hydration: HTML server phải khớp render client lần đầu */
function hydrationChecklist(): string[] {
  return [
    "Render deterministic (không dùng Date.now()/Math.random() ở lần render đầu)",
    "Không có khoảng trắng/chuỗi khác biệt giữa server và client",
    "Dữ liệu fetch ở server được serialize truyền xuống client (dehydrated state)",
    "Lazy-load component chỉ sau hydrate (không block lần sơn đầu)",
  ];
}

function main(): void {
  console.log("=== 19.1 Rendering Strategies Demo ===");
  console.log("");

  const routes: RouteSpec[] = [
    { path: "/", dynamic: false, updateFreq: "rarely", seoNeeded: true },
    { path: "/blog", dynamic: false, updateFreq: "hourly", seoNeeded: true },
    { path: "/search?q=...", dynamic: true, updateFreq: "realtime", seoNeeded: true },
    { path: "/admin/dashboard", dynamic: true, updateFreq: "realtime", seoNeeded: false },
  ];

  console.log("1. Ma trận chọn chiến lược:");
  for (const d of simulateBuild(routes)) {
    console.log(`   ${d.route} → ${d.strategy} (${d.reason}; ${d.buildStep})`);
  }
  console.log("");

  console.log("2. So sánh nhanh:");
  console.log("   SSG: TTFB thấp nhất | ISR: SSG + tươi | SSR: SEO động, tốn server | CSR: rẻ server, chậm FCP");
  console.log("");

  console.log("3. Hydration checklist:");
  hydrationChecklist().forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
  console.log("");
  console.log("✅ Ma trận chọn + simulate build + hydration checklist hoạt động");
}

main();
