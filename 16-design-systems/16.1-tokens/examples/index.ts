/**
 * 16.1 Design Tokens — mô phỏng đăng ký, resolve và dark/light mode
 *
 * Design tokens là object lồng nhau kiểu { color: { primary: "#..." } }.
 * Registry sẽ flatten → resolve theo đường dẫn "color.primary" → sinh
 * chuỗi CSS variables cho từng theme (light / dark).
 * KHÔNG có DOM — mọi thứ là dữ liệu thuần + string.
 */

type TokensTree = Record<string, unknown>;

type TokenTheme = "light" | "dark";

class TokensSystem {
  private readonly base: Record<string, string>;
  private readonly darkOverrides: Record<string, string>;

  /**
   * @param tokens       token gốc (mặc định = light)
   * @param darkOverrides token chỉ áp dụng khi sang dark, đường dẫn dạng "color.surface"
   */
  constructor(tokens: TokensTree, darkOverrides: Record<string, string>) {
    this.base = {};
    this.darkOverrides = darkOverrides;
    TokensSystem.flatten(tokens, "", this.base);
  }

  /** Flatten object lồng nhau thành map đường dẫn → giá trị */
  private static flatten(node: TokensTree, prefix: string, out: Record<string, string>): void {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        TokensSystem.flatten(value as TokensTree, path, out);
      } else {
        out[path] = String(value);
      }
    }
  }

  /** resolve một token theo theme — dark override thắng nếu có */
  resolve(path: string, theme: TokenTheme): string {
    const value = theme === "dark" && path in this.darkOverrides ? this.darkOverrides[path] : this.base[path];
    if (value === undefined) {
      throw new Error(`Token "${path}" không tồn tại`);
    }
    return value;
  }

  /** Danh sách token theo theme (đã merge override) */
  entries(theme: TokenTheme): [string, string][] {
    const merged: Record<string, string> = { ...this.base };
    if (theme === "dark") {
      Object.assign(merged, this.darkOverrides);
    }
    return Object.entries(merged);
  }

  /** Sinh chuỗi CSS variables cho một theme */
  toCssVars(theme: TokenTheme): string[] {
    return this.entries(theme).map(([path, value]) => {
      return `  --${path.replace(/\./g, "-")}: ${value};`;
    });
  }
}

// ─────────────────── Định nghĩa design tokens (kiểu hierarchy) ───────────────────
const tokens: TokensTree = {
  color: {
    primary: "#3B82F6",
    "primary-strong": "#1D4ED8",
    text: "#1F2937",
    muted: "#6B7280",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    border: "#D1D5DB",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
  },
  typography: {
    size: {
      sm: "14px",
      base: "16px",
      lg: "18px",
    },
    weight: {
      normal: "400",
      bold: "700",
    },
  },
  radius: {
    sm: "4px",
    md: "8px",
  },
};

// Chỉ override phần khác khi vào dark mode — phần còn lại kế thừa light
const darkMode: Record<string, string> = {
  "color.text": "#F9FAFB",
  "color.muted": "#9CA3AF",
  "color.surface": "#111827",
  "color.surfaceAlt": "#1F2937",
  "color.border": "#374151",
  "color.primary": "#60A5FA",
};

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Design Tokens Demo ===");
console.log("");

const tokensSystem = new TokensSystem(tokens, darkMode);

console.log("1️⃣ Token gốc (object lồng nhau):");
console.log(JSON.stringify(tokens, null, 2).slice(0, 200) + "...");
console.log("");

console.log("2️⃣ Flatten + resolve theo đường dẫn:");
console.log(`   resolve("color.primary", light) → ${tokensSystem.resolve("color.primary", "light")}`);
console.log(`   resolve("color.primary", dark)  → ${tokensSystem.resolve("color.primary", "dark")}`);
console.log(`   resolve("spacing.md", light)    → ${tokensSystem.resolve("spacing.md", "light")}`);
console.log(`   resolve("typography.size.base", light) → ${tokensSystem.resolve("typography.size.base", "light")}`);
console.log("");

console.log("3️⃣ Dark mode chỉ override khác biệt, phần kia kế thừa:");
console.log(`   color.text    light=${tokensSystem.resolve("color.text", "light")} dark=${tokensSystem.resolve("color.text", "dark")}`);
console.log(`   color.surface light=${tokensSystem.resolve("color.surface", "light")} dark=${tokensSystem.resolve("color.surface", "dark")}`);
console.log(`   spacing.md    light=${tokensSystem.resolve("spacing.md", "light")} dark=${tokensSystem.resolve("spacing.md", "dark")} (không đổi)`);
console.log("");

console.log("4️⃣ Output CSS variables — theme LIGHT:");
tokensSystem.toCssVars("light").forEach((line) => console.log(line));
console.log("");
console.log("5️⃣ Output CSS variables — theme DARK:");
tokensSystem.toCssVars("dark").forEach((line) => console.log(line));

console.log("");
console.log("✅ Design Tokens: đăng ký, resolve và dark/light mode hoạt động");
export {};