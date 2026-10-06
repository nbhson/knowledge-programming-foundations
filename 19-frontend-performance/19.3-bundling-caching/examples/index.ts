/**
 * 19.3 Bundling & Caching — mô phỏng chunking + content-hash manifest
 * + so sánh deploy cũ/mới (file nào đổi tên) + cache headers. Thuần TS.
 */

export {};

/** Hash nội dung FNV-1a 32-bit (demo; production dùng sha256 cắt ngắn) */
function contentHash(content: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

interface Chunk {
  name: string;
  content: string;
  file: string;
}

/** Chia + đặt tên file theo hash: nội dung đổi → tên đổi → cache tự vô hiệu đúng file */
function buildManifest(specs: Array<{ name: string; content: string }>): Chunk[] {
  return specs.map((s) => ({
    name: s.name,
    content: s.content,
    file: `${s.name}.${contentHash(s.content)}.js`,
  }));
}

/** So sánh 2 manifest: file nào giữ cache, file nào phải tải lại */
function diffManifests(oldM: Chunk[], newM: Chunk[]): Array<{ name: string; status: "cached" | "refetch"; file: string }> {
  const oldByName = new Map(oldM.map((c) => [c.name, c.file]));
  return newM.map((c) => ({
    name: c.name,
    status: oldByName.get(c.name) === c.file ? "cached" : "refetch",
    file: c.file,
  }));
}

/** Cache header: file hashed → immutable 1 năm; entry/html → no-cache */
function cacheHeader(fileName: string): string {
  const hashed = /\.[0-9a-f]{8}\.js$/.test(fileName);
  return hashed ? "public, max-age=31536000, immutable" : "no-cache";
}

/** Ước tính bytes user phải tải lại sau deploy */
function refetchBytes(
  diff: Array<{ status: string; file: string }>,
  sizes: Map<string, number>,
): { refetch: number; total: number } {
  let total = 0;
  let refetch = 0;
  for (const d of diff) {
    const logical = d.file.split(".")[0] + ".js";
    const size = sizes.get(logical) ?? 0;
    total += size;
    if (d.status === "refetch") refetch += size;
  }
  return { refetch, total };
}

function main(): void {
  console.log("=== 19.3 Bundling & Caching Demo ===");
  console.log("");

  const v1 = [
    { name: "vendor", content: "react+react-dom v18.2.0 (ít đổi)" },
    { name: "app", content: "App.tsx v1: giỏ hàng cơ bản" },
    { name: "route-checkout", content: "Checkout.tsx v1" },
  ];
  const v2 = [
    { name: "vendor", content: "react+react-dom v18.2.0 (ít đổi)" }, // không đổi
    { name: "app", content: "App.tsx v2: thêm banner khuyến mãi" }, // đổi
    { name: "route-checkout", content: "Checkout.tsx v1" }, // không đổi
  ];
  const sizes = new Map<string, number>([
    ["vendor.js", 140000],
    ["app.js", 60000],
    ["route-checkout.js", 30000],
  ]);

  const m1 = buildManifest(v1);
  const m2 = buildManifest(v2);
  console.log("1. Manifest v1 (tên file chứa hash nội dung):");
  m1.forEach((c) => console.log(`   ${c.name}.js → ${c.file}`));
  console.log("");

  console.log("2. Deploy v2 (chỉ sửa app.tsx) → diff:");
  const diff = diffManifests(m1, m2);
  diff.forEach((d) =>
    console.log(`   ${d.name}.js → ${d.status === "cached" ? "♻️ dùng cache" : "⬇️ tải lại"} (${d.file})`),
  );
  const { refetch, total } = refetchBytes(diff, sizes);
  console.log(`   User tải lại ${refetch}/${total} bytes (${((refetch / total) * 100).toFixed(0)}%) thay vì 100%`);
  console.log("");

  console.log("3. Cache headers:");
  console.log(`   ${m2[0].file} → "${cacheHeader(m2[0].file)}"`);
  console.log(`   index.html → "${cacheHeader("index.html")}" (luôn tươi để trỏ manifest mới)`);
  console.log("");
  console.log("✅ Chunking + manifest + diff deploy + cache headers hoạt động");
}

main();
