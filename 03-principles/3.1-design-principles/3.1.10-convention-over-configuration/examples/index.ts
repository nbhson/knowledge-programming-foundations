/**
 * 3.1.10 Convention over Configuration Demo
 *
 * Trường hợp phổ biến theo quy ước (tên file → route),
 * chỉ cấu hình tường minh cho ngoại lệ (redirect).
 */

export {};

// --- ❌ BAD: config thủ công mọi route ---
const manualRoutes: Record<string, string> = {
  "/dashboard": "DashboardPage",
  "/admin": "AdminPage",
  "/settings": "SettingsPage",
  // thêm 1 trang = thêm 1 dòng map — quên là 404
};

function resolveBad(path: string): string {
  const page = manualRoutes[path];
  if (page === undefined) {
    throw new Error(`404: no route for ${path}`);
  }
  return `render ${page}`;
}

// --- ✅ GOOD: convention — route suy ra từ tên file ---
function fileToRoute(filePath: string): string {
  // Convention (kiểu Next.js pages/): pages/admin.tsx → /admin,
  // pages/blog/[slug].tsx → /blog/:slug, pages/index.tsx → /
  return filePath
    .replace(/^pages/, "")
    .replace(/\.tsx$/, "")
    .replace(/\[(\w+)\]/g, ":$1")
    .replace(/\/index$/, "/");
}

// Chỉ ngoại lệ mới cần config tường minh (escape hatch)
const routeOverrides: Record<string, string> = {
  "/old-admin": "/admin", // redirect cho URL legacy
};

function resolveGood(pageFiles: readonly string[], path: string): string {
  const redirect = routeOverrides[path];
  if (redirect !== undefined) {
    return `redirect → ${redirect} (config tường minh cho ngoại lệ)`;
  }
  for (const file of pageFiles) {
    if (fileToRoute(file) === path) {
      return `render ${file} (theo convention)`;
    }
  }
  throw new Error(`404: no page for ${path}`);
}

// --- Demo ---
function main(): void {
  console.log("=== Convention over Configuration Demo ===");
  console.log("");

  // ❌ BAD: thêm trang mới phải sửa bảng map
  console.log(`❌ BAD manual resolve /admin: ${resolveBad("/admin")}`);
  try {
    resolveBad("/reports"); // trang mới chưa kịp thêm vào map → 404
  } catch (error) {
    console.log(`❌ BAD manual resolve /reports: ${(error as Error).message} (quên thêm map!)`);
  }
  console.log("");

  // ✅ GOOD: thêm file là có route, không sửa config nào
  const pageFiles: readonly string[] = [
    "pages/index.tsx",
    "pages/dashboard.tsx",
    "pages/admin.tsx",
    "pages/blog/[slug].tsx",
    "pages/reports.tsx", // trang mới: chỉ thêm file, route /reports tự có
  ];
  const paths = ["/", "/dashboard", "/blog/:slug", "/reports", "/old-admin", "/unknown"];
  for (const path of paths) {
    try {
      console.log(`✅ GOOD resolve ${path}: ${resolveGood(pageFiles, path)}`);
    } catch (error) {
      console.log(`✅ GOOD resolve ${path}: ${(error as Error).message}`);
    }
  }
  console.log("");

  // ✅ GOOD: Prisma-style — tên model theo convention, ngoại lệ mới @map
  const modelToTable = (model: string): string => `${model.toLowerCase()}s`; // User → users
  console.log(`✅ GOOD Prisma-style: model User → table "${modelToTable("User")}" (convention)`);
  console.log(`   → ngoại lệ mới cần @map/@relation tường minh, còn lại khỏi config`);
  console.log("");
  console.log("✅ Convention: 80% theo quy ước khỏi config, 20% ngoại lệ config tường minh");
}

main();
