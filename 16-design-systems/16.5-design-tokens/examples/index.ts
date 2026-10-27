/**
 * 16.5 Design Tokens (Deep Dive) — trọng tâm: scale, alias & theming
 *
 * Khác 16.1 (resolve + dark/light cơ bản), ở đây ta tập trung:
 *   - Sinh spacing scale từ đơn vị cơ sở (4px)
 *   - Typography scale (fontSize + lineHeight)
 *   - Component token tham chiếu foundation token (alias, tự resolve đệ quy)
 *   - Sinh CSS variables cho nhiều theme từ foundation + overrides
 * KHÔNG có DOM — mọi thứ là dữ liệu thuần.
 */

// ─────────────────── 1. SPACING SCALE (sinh từ unit) ───────────────────
const SPACING_UNIT = 4;
const SPACING_STEPS: [string, number][] = [
  ["xs", 1],
  ["sm", 2],
  ["md", 4],
  ["lg", 6],
  ["xl", 8],
  ["2xl", 12],
];

const spacingScale: Record<string, string> = {};
for (const [name, factor] of SPACING_STEPS) {
  spacingScale[name] = `${SPACING_UNIT * factor}px`;
}

// ─────────────────── 2. TYPOGRAPHY SCALE ───────────────────
interface TypographyScaleItem {
  fontSize: string;
  lineHeight: string;
}

const typographyScale: Record<string, TypographyScaleItem> = {
  xs: { fontSize: "12px", lineHeight: "16px" },
  sm: { fontSize: "14px", lineHeight: "20px" },
  base: { fontSize: "16px", lineHeight: "24px" },
  lg: { fontSize: "18px", lineHeight: "28px" },
  xl: { fontSize: "24px", lineHeight: "32px" },
  "2xl": { fontSize: "32px", lineHeight: "40px" },
};

// ─────────────────── 3. FOUNDATION + COMPONENT TOKENS (alias) ───────────────────
type TokenTheme = "light" | "dark";

interface TokenRef {
  ref: string; // "color.primary"
}

/**
 * Một số token là "alias" (ref) trỏ tới token khác — cho phép component
 * token tái sử dụng foundation token theo kiểu var(--x).
 */
class TokensDeepDive {
  private readonly foundation: Record<string, string>;
  private readonly component: Record<string, string | TokenRef>;
  private readonly scales: Record<string, string>;
  private readonly themeOverrides: Record<TokenTheme, Record<string, string>>;

  constructor() {
    this.foundation = {
      "color.primary": "#3B82F6",
      "color.primaryStrong": "#1D4ED8",
      "color.surface": "#FFFFFF",
      "color.surfaceAlt": "#F3F4F6",
      "color.text": "#1F2937",
      "color.textMuted": "#6B7280",
      "color.border": "#D1D5DB",
      "color.danger": "#EF4444",
      "color.success": "#10B981",
    };
    // Component token dùng ref → giữ 1 nguồn sự thật
    this.component = {
      "button.background": { ref: "color.primary" },
      "button.text": { ref: "color.surface" },
      "button.padding": "spacing.md spacing.lg",
      "button.radius": "radius.md",
      "input.border": { ref: "color.border" },
      "input.background": { ref: "color.surfaceAlt" },
      "card.background": { ref: "color.surface" },
      "card.shadow": "0 1px 2px rgba(0,0,0,0.05)",
    };
    // Scale (thành viên của "hệ thống" token) — dùng cho padding/radius resolution
    this.scales = {
      "spacing.md": "16px",
      "spacing.lg": "24px",
      "radius.md": "8px",
    };
    this.themeOverrides = {
      light: {},
      dark: {
        "color.surface": "#111827",
        "color.surfaceAlt": "#1F2937",
        "color.text": "#F9FAFB",
        "color.textMuted": "#9CA3AF",
        "color.border": "#374151",
        "color.primary": "#60A5FA",
        "color.primaryStrong": "#3B82F6",
        "color.danger": "#F87171",
      },
    };
  }

  /** Resolve một token, bao gồm đuổi theo ref (alias) */
  resolveToken(path: string, theme: TokenTheme): string {
    const raw =
      this.component[path] ??
      this.foundation[path] ??
      this.scales[path];

    if (typeof raw === "object") {
      // Token alias — resolve đệ quy theo ref
      return this.resolveToken(raw.ref, theme);
    }
    if (raw === undefined) {
      throw new Error(`Token "${path}" chưa được định nghĩa`);
    }
    // Giá trị tổng hợp: "spacing.md spacing.lg" → resolve từng phần
    if (raw.includes(" ")) {
      return raw
        .split(" ")
        .map((part) =>
          part in this.component || part in this.foundation || part in this.scales
            ? this.resolveToken(part, theme)
            : part,
        )
        .join(" ");
    }
    // Giá trị đơn nhưng chính nó là tham chiếu tới token khác ("radius.md")
    if (raw in this.component || raw in this.foundation || raw in this.scales) {
      return this.resolveToken(raw, theme);
    }
    // Token thuộc scale (spacing/radius) không thay đổi theo theme
    if (path in this.scales) {
      return raw;
    }
    return this.applyTheme(path, raw, theme);
  }

  private applyTheme(path: string, rawValue: string, theme: TokenTheme): string {
    if (theme === "light") return rawValue;
    const override = this.themeOverrides.dark[path];
    return override ?? rawValue;
  }

  /** Sinh danh sách CSS variables cho một theme (gồm cả component tokens) */
  toCssVars(theme: TokenTheme): string[] {
    const lines: string[] = [];
    for (const path of Object.keys(this.foundation)) {
      lines.push(`  --${path.replace(/\./g, "-")}: ${this.resolveToken(path, theme)};`);
    }
    for (const path of Object.keys(this.component)) {
      lines.push(`  --${path.replace(/\./g, "-")}: ${this.resolveToken(path, theme)};`);
    }
    return lines;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Design Tokens Deep Dive Demo ===");
console.log("");

const tokensDD = new TokensDeepDive();

console.log("1️⃣ Spacing scale sinh từ unit 4px:");
console.log("   unit = 4px → đều là bội số của 4 (nhất quán)");
for (const [name, value] of Object.entries(spacingScale)) {
  console.log(`     --spacing-${name}: ${value}`);
}
console.log("");

console.log("2️⃣ Typography scale (fontSize + lineHeight):");
for (const [name, item] of Object.entries(typographyScale)) {
  console.log(`     --type-${name}: ${item.fontSize} / ${item.lineHeight}`);
}
console.log("");

console.log("3️⃣ Component token resolve qua alias (token tham chiếu token):");
console.log(`   button.background → ref color.primary → ${tokensDD.resolveToken("button.background", "light")}`);
console.log(`   button.padding    → "spacing.md spacing.lg" → ${tokensDD.resolveToken("button.padding", "light")}`);
console.log(`   card.background   → ref color.surface  → ${tokensDD.resolveToken("card.background", "dark")}`);
console.log("");

console.log("4️⃣ Theme thay đổi chỉ qua override foundation — component tự cập nhật:");
console.log(`   button.background light=${tokensDD.resolveToken("button.background", "light")} dark=${tokensDD.resolveToken("button.background", "dark")}`);
console.log(`   card.background   light=${tokensDD.resolveToken("card.background", "light")}   dark=${tokensDD.resolveToken("card.background", "dark")}`);
console.log(`   input.border      light=${tokensDD.resolveToken("input.border", "light")}   dark=${tokensDD.resolveToken("input.border", "dark")}`);
console.log("");

console.log("5️⃣ Output CSS variables — theme LIGHT:");
tokensDD.toCssVars("light").forEach((l) => console.log(l));
console.log("");
console.log("6️⃣ Output CSS variables — theme DARK:");
tokensDD.toCssVars("dark").forEach((l) => console.log(l));

console.log("");
console.log("✅ Design Tokens: spacing/typography scale, alias resolve và multi-theme hoạt động");
export {};