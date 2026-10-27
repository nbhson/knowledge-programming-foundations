/**
 * 19.4 Image & Font Optimization — mô phỏng chọn ứng viên srcset,
 * sinh snippet <img> responsive + @font-face tối ưu + checklist audit.
 * Thuần TS, không cần trình duyệt.
 */

export {};

interface ImageCandidate {
  url: string;
  width: number;
  bytes: number;
}

/** Mô phỏng browser: chọn ảnh đủ nét nhỏ nhất cho khung × DPR */
function pickCandidate(candidates: ImageCandidate[], displayWidth: number, dpr: number): ImageCandidate {
  const needed = displayWidth * dpr;
  const sorted = [...candidates].sort((a, b) => a.width - b.width);
  for (const c of sorted) {
    if (c.width >= needed) return c;
  }
  return sorted[sorted.length - 1];
}

/** Snippet <img> responsive: srcset + sizes + width/height (chống CLS) + lazy */
function responsiveImg(srcBase: string, alt: string, width: number, height: number): string {
  return (
    `<img src="${srcBase}-800.webp" ` +
    `srcset="${srcBase}-400.avif 400w, ${srcBase}-800.webp 800w, ${srcBase}-1600.webp 1600w" ` +
    `sizes="(max-width: 600px) 100vw, 800px" width="${width}" height="${height}" ` +
    `loading="lazy" decoding="async" alt="${alt}">`
  );
}

/** Snippet hero (LCP): preload + high priority, KHÔNG lazy */
function heroImg(srcBase: string, alt: string, width: number, height: number): string {
  return (
    `<link rel="preload" as="image" href="${srcBase}-1600.webp" fetchpriority="high">\n` +
    `<img src="${srcBase}-1600.webp" width="${width}" height="${height}" ` +
    `fetchpriority="high" decoding="async" alt="${alt}">`
  );
}

/** Snippet @font-face tối ưu: woff2 + swap + subset gợi ý */
function fontFace(family: string, url: string): string {
  return (
    `@font-face {\n  font-family: '${family}';\n  src: url('${url}') format('woff2');\n` +
    `  font-display: swap;\n  unicode-range: U+0000-00FF, U+0102-0103, U+1EA0-1EF9;\n}`
  );
}

function main(): void {
  console.log("=== 19.4 Image & Font Optimization Demo ===");
  console.log("");

  const candidates: ImageCandidate[] = [
    { url: "photo-400.avif", width: 400, bytes: 30000 },
    { url: "photo-800.webp", width: 800, bytes: 80000 },
    { url: "photo-1600.webp", width: 1600, bytes: 250000 },
    { url: "photo-goc.jpg", width: 4000, bytes: 5000000 },
  ];

  console.log("1. Browser chọn ảnh theo khung hiển thị (mô phỏng):");
  const scenarios: Array<[number, number]> = [
    [375, 2],
    [800, 1],
    [1920, 1],
  ];
  for (const [w, dpr] of scenarios) {
    const pick = pickCandidate(candidates, w, dpr);
    const saved = 5000000 - pick.bytes;
    console.log(`   khung ${w}px × DPR ${dpr} (cần ${w * dpr}px) → ${pick.url} (${pick.bytes} bytes, tiết kiệm ~${saved} so với gốc 5MB)`);
  }
  console.log("");

  console.log("2. Snippet <img> thường (lazy, chống CLS):");
  console.log(`   ${responsiveImg("/img/photo", "Ảnh sản phẩm", 800, 600)}`);
  console.log("");

  console.log("3. Snippet hero LCP (preload + high, KHÔNG lazy):");
  console.log(`   ${heroImg("/img/hero", "Banner chính", 1600, 900).replace(/\n/g, "\n   ")}`);
  console.log("");

  console.log("4. Snippet font tối ưu:");
  console.log(`   ${fontFace("Inter", "/fonts/inter-latin.woff2").replace(/\n/g, "\n   ")}`);
  console.log("");

  console.log("5. Checklist audit:");
  const checklist = [
    "Ảnh có srcset + AVIF/WebP, đúng kích cỡ khung (không serve gốc 5MB)",
    "Mọi <img> có width/height (chống CLS), hero có fetchpriority=high",
    "Font woff2 + font-display: swap + preload ≤2 file + subset",
    "Ảnh dưới fold lazy-load; ảnh hero KHÔNG lazy",
  ];
  checklist.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
  console.log("");
  console.log("✅ Chọn srcset + sinh snippet + checklist hoạt động");
}

main();
