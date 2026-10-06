/**
 * 5.3.5 Tree Shaking — Loại bỏ export không dùng khỏi bundle
 *
 * TS thuần + Node built-in. Mô phỏng static analysis của bundler:
 * liệt kê exports của module, đối chiếu với imports thực tế,
 * "rung cây" để chỉ giữ phần được dùng.
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface ModuleExport {
  name: string;
  sizeKb: number;
  hasSideEffect: boolean;
}

interface BundleModule {
  file: string;
  exports: ModuleExport[];
}

// math.ts giả lập: 4 hàm pure, không side-effect
const mathModule: BundleModule = {
  file: "math.ts",
  exports: [
    { name: "add", sizeKb: 1, hasSideEffect: false },
    { name: "subtract", sizeKb: 1, hasSideEffect: false },
    { name: "multiply", sizeKb: 2, hasSideEffect: false },
    { name: "divide", sizeKb: 2, hasSideEffect: false },
  ],
};

// utils.ts giả lập: 1 hàm side-effect + 1 hàm pure
const utilsModule: BundleModule = {
  file: "utils.ts",
  exports: [
    { name: "init", sizeKb: 5, hasSideEffect: true },
    { name: "helper", sizeKb: 1, hasSideEffect: false },
  ],
};

function shake(modules: BundleModule[], usedImports: Record<string, string[]>): void {
  let beforeKb = 0;
  let afterKb = 0;
  console.log("  Phân tích từng module:");
  for (const mod of modules) {
    const used = new Set(usedImports[mod.file] ?? []);
    for (const exp of mod.exports) {
      beforeKb += exp.sizeKb;
      const isUsed = used.has(exp.name);
      // Giữ lại nếu: được import HOẶC có side-effect mà package.json chưa mark safe
      const keepSideEffect = exp.hasSideEffect; // sideEffects: false sẽ bỏ nếu không import
      const keep = isUsed || (keepSideEffect && used.has(exp.name));
      if (isUsed) {
        afterKb += exp.sizeKb;
        console.log(`    ✅ giữ   ${mod.file}#${exp.name} (${exp.sizeKb}KB, được import)`);
      } else if (exp.hasSideEffect) {
        console.log(`    🌳 rung   ${mod.file}#${exp.name} (${exp.sizeKb}KB, side-effect nhưng không import → bỏ với sideEffects:false)`);
      } else {
        console.log(`    🌳 rung   ${mod.file}#${exp.name} (${exp.sizeKb}KB, pure & không dùng → bỏ)`);
      }
      void keep;
      void keepSideEffect;
    }
  }
  console.log(`  → Bundle: ${beforeKb}KB → ${afterKb}KB (giảm ${beforeKb - afterKb}KB)`);
}

function main(): void {
  console.log("=== 5.3.5 Tree Shaking Demo (mô phỏng bundler) ===\n");

  console.log("❌ BAD — import * (không shake được):");
  console.log("  import * as math from './math' → bundler giữ cả 4 hàm.");
  shake([mathModule], { "math.ts": ["add", "subtract", "multiply", "divide"] });

  console.log("\n✅ GOOD — named import + sideEffects:false:");
  console.log("  import { add } from './math' → chỉ giữ add.");
  shake([mathModule], { "math.ts": ["add"] });

  console.log("\n✅ GOOD — utils có side-effect, chỉ dùng helper:");
  console.log('  package.json: { "sideEffects": false } → init bị rung dù có console.log.');
  shake([utilsModule], { "utils.ts": ["helper"] });

  console.log("\n📌 Điều kiện để shake hiệu quả:");
  console.log("   • Dùng ES Modules (import/export), KHÔNG dùng CommonJS require.");
  console.log("   • Ưu tiên named import thay vì import *.");
  console.log('   • Khai báo \"sideEffects\": false (hoặc list file có side-effect).');
}

main();

export {};
