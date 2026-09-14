/**
 * 16.6 Consistency Guidelines — mô phỏng "lint-guide" rà soát component
 *
 * Mỗi component được trích xuất thành một "snapshot" (dữ liệu thuần),
 * sau đó ConsistencyLintGuide chạy qua một danh sách CHECKLIST và in
 * kết quả pass/fail cho từng mục + tổng kết tỉ lệ đạt.
 */

// ─────────────────── Snapshot của một component sau khi bóc tách ───────────────────
interface ConsistencyComponentSnapshot {
  name: string;
  /** token mà component dùng (danh sách tên) */
  tokensUsed: string[];
  /** màu hardcode xuất hiện trong styles */
  hardcodedColors: string[];
  /** các giá trị spacing xuất hiện trong styles */
  spacingValues: string[];
  /** các giá trị border-radius */
  radiusValues: string[];
  /** tên props của component */
  propNames: string[];
}

// Bộ chuẩn của design system (source of truth)
const CONSISTENCY_SPACING_SCALE = new Set(["4px", "8px", "16px", "24px", "32px", "48px"]);
const CONSISTENCY_RADIUS_SCALE = new Set(["4px", "8px", "16px"]);
const CONSISTENCY_SEMANTIC_TOKENS = new Set([
  "color.primary",
  "color.surface",
  "color.text",
  "spacing.md",
  "spacing.lg",
  "radius.md",
]);

// ─────────────────── Checklist & lint-guide ───────────────────
interface ConsistencyCheckResult {
  checkId: string;
  checkName: string;
  pass: boolean;
  detail: string;
}

interface ConsistencyCheckRule {
  id: string;
  name: string;
  evaluate: (snapshot: ConsistencyComponentSnapshot) => ConsistencyCheckResult;
}

class ConsistencyLintGuide {
  private rules: ConsistencyCheckRule[] = [];

  constructor() {
    this.registerRules();
  }

  private registerRules(): void {
    this.rules.push({
      id: "token-usage",
      name: "Dùng design tokens (không hardcode màu)",
      evaluate: (s) => ({
        checkId: "token-usage",
        checkName: "Dùng design tokens (không hardcode màu)",
        pass: s.hardcodedColors.length === 0,
        detail:
          s.hardcodedColors.length === 0
            ? `toàn bộ màu lấy từ tokens (${s.tokensUsed.length} token)`
            : `hardcode hex: ${s.hardcodedColors.join(", ")} — thay bằng token`,
      }),
    });

    this.rules.push({
      id: "spacing-scale",
      name: "Spacing thuộc scale chuẩn",
      evaluate: (s) => {
        const bad = s.spacingValues.filter((v) => !CONSISTENCY_SPACING_SCALE.has(v));
        return {
          checkId: "spacing-scale",
          checkName: "Spacing thuộc scale chuẩn",
          pass: bad.length === 0,
          detail:
            bad.length === 0
              ? `values đều nằm trong [4,8,16,24,32,48]px (${s.spacingValues.join(", ")})`
              : `có giá trị "chui ra ngoài" scale: ${bad.join(", ")} (vd 7px, 13px)`,
        };
      },
    });

    this.rules.push({
      id: "radius-scale",
      name: "Border-radius thuộc scale chuẩn",
      evaluate: (s) => {
        const bad = s.radiusValues.filter((v) => !CONSISTENCY_RADIUS_SCALE.has(v));
        return {
          checkId: "radius-scale",
          checkName: "Border-radius thuộc scale chuẩn",
          pass: bad.length === 0,
          detail:
            bad.length === 0
              ? `radius values: ${s.radiusValues.join(", ")}`
              : `radius bất thường: ${bad.join(", ")} — chỉ dùng 4/8/16px`,
        };
      },
    });

    this.rules.push({
      id: "semantic-token",
      name: "Token dùng đúng ngữ nghĩa",
      evaluate: (s) => {
        const semantic = s.tokensUsed.filter((t) => CONSISTENCY_SEMANTIC_TOKENS.has(t));
        const nonSemantic = s.tokensUsed.filter((t) => !CONSISTENCY_SEMANTIC_TOKENS.has(t));
        return {
          checkId: "semantic-token",
          checkName: "Token dùng đúng ngữ nghĩa",
          pass: nonSemantic.length === 0 && semantic.length > 0,
          detail:
            nonSemantic.length === 0
              ? `dùng token theo ngữ nghĩa (${semantic.join(", ")})`
              : `token không rõ nghĩa: ${nonSemantic.join(", ") || "(rỗng)"}`,
        };
      },
    });

    this.rules.push({
      id: "naming-convention",
      name: "Component PascalCase, props camelCase",
      evaluate: (s) => {
        const badProps = s.propNames.filter((p) => !/^[a-z][a-zA-Z0-9]*$/.test(p));
        const nameOk = /^[A-Z]/.test(s.name);
        return {
          checkId: "naming-convention",
          checkName: "Component PascalCase, props camelCase",
          pass: nameOk && badProps.length === 0,
          detail: nameOk
            ? badProps.length === 0
              ? `tên ${s.name}; props: ${s.propNames.join(", ")}`
              : `props viết sai camelCase: ${badProps.join(", ")}`
            : `tên component phải PascalCase (${s.name})`,
        };
      },
    });
  }

  /** Chạy toàn bộ checklist trên 1 component */
  run(snapshot: ConsistencyComponentSnapshot): ConsistencyCheckResult[] {
    console.log(`🔍 Rà soát component "${snapshot.name}":`);
    const results = this.rules.map((rule) => rule.evaluate(snapshot));
    for (const r of results) {
      console.log(`   ${r.pass ? "✅" : "❌"} [${r.checkId}] ${r.checkName}`);
      console.log(`      → ${r.detail}`);
    }
    const passCount = results.filter((r) => r.pass).length;
    const ratio = Math.round((passCount / results.length) * 100);
    console.log(`   📊 Đạt ${passCount}/${results.length} checks (${ratio}%)`);
    console.log("");
    return results;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Consistency Guidelines Demo ===");
console.log("");

const guide = new ConsistencyLintGuide();

console.log("📋 CHECKLIST của design system:");
console.log("   1. token-usage   — không hardcode màu");
console.log("   2. spacing-scale — spacing ∈ {4,8,16,24,32,48}px");
console.log("   3. radius-scale  — radius ∈ {4,8,16}px");
console.log("   4. semantic-token— token đặt tên theo ngữ nghĩa");
console.log("   5. naming        — Component PascalCase, props camelCase");
console.log("");

console.log("1️⃣ Component tuân thủ chuẩn — Button:");
guide.run({
  name: "Button",
  tokensUsed: ["color.primary", "color.surface", "spacing.md", "spacing.lg", "radius.md"],
  hardcodedColors: [],
  spacingValues: ["16px", "24px"],
  radiusValues: ["8px"],
  propNames: ["variant", "size", "label", "onClick"],
});

console.log("2️⃣ Component vi phạm nhiều mục — MenuItem:");
guide.run({
  name: "menuItem",
  tokensUsed: ["brand-blue", "md", "special-coloring"],
  hardcodedColors: ["#FF5500", "#123ABC"],
  spacingValues: ["7px", "16px", "13px"],
  radiusValues: ["3px"],
  propNames: ["Bg", "TEXT", "getData"],
});

console.log("3️⃣ Hành vi một team nên làm sau khi chạy lint-guide:");
console.log("   - Sửa hardcode #FF5500 → color.danger (token)",
  "| 7px → spacing-sm (8px) | 3px → radius-sm (4px)");

console.log("");
console.log("✅ Consistency Guidelines: lint-guide rà soát component theo checklist, in pass/fail");
export {};