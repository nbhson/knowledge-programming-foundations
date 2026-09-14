/**
 * 16.2 Component Library — mô phỏng Button/Input/Card với variant & props
 *
 * Component KHÔNG render ra DOM — mỗi component render() ra một đối tượng
 * mô tả (tag, className, style lấy từ design token, children) và describe()
 * để in thành chuỗi dạng HTML như một "ảnh chụp" của component.
 */

// ─────────────────── Design tokens cho bộ component ───────────────────
type ComponentLibraryTokens = {
  color: {
    primary: string;
    secondary: string;
    text: string;
    surface: string;
    border: string;
    danger: string;
  };
  spacing: { xs: string; sm: string; md: string; lg: string };
  radius: { sm: string; md: string };
  fontSize: { sm: string; base: string; lg: string };
};

const componentLibraryTokens: ComponentLibraryTokens = {
  color: { primary: "#3B82F6", secondary: "#6B7280", text: "#1F2937", surface: "#FFFFFF", border: "#D1D5DB", danger: "#EF4444" },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px" },
  radius: { sm: "4px", md: "8px" },
  fontSize: { sm: "14px", base: "16px", lg: "18px" },
};

// ─────────────────── Kiểu render result (ngôn ngữ trung gian) ───────────────────
interface ComponentLibStyle {
  [prop: string]: string;
}

interface ComponentLibRenderResult {
  tag: string;
  className: string;
  attributes: string[];
  style: ComponentLibStyle;
  children: string;
}

/** In một render result thành chuỗi giống HTML kèm style */
function describeComponent(result: ComponentLibRenderResult): string {
  const attrs = result.attributes.length > 0 ? ` ${result.attributes.join(" ")}` : "";
  const style = Object.entries(result.style)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n");
  return `  <${result.tag} class="${result.className}"${attrs}>\n  ${result.children}\n  </${result.tag}>\n  [style]\n${style}`;
}

// ─────────────────── Component: Button ───────────────────
type ComponentLibButtonVariant = "primary" | "secondary" | "ghost";
type ComponentLibButtonSize = "sm" | "md" | "lg";

interface ComponentLibButtonProps {
  variant?: ComponentLibButtonVariant;
  size?: ComponentLibButtonSize;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  onClick?: () => void;
}

class ComponentLibButton {
  constructor(private readonly props: ComponentLibButtonProps) {}

  render(): ComponentLibRenderResult {
    const t = componentLibraryTokens;
    const sizes: Record<ComponentLibButtonSize, string> = {
      sm: t.spacing.xs + " " + t.spacing.sm,
      md: t.spacing.sm + " " + t.spacing.md,
      lg: t.spacing.md + " " + t.spacing.lg,
    };
    const variantBg: Record<ComponentLibButtonVariant, string> = {
      primary: t.color.primary,
      secondary: t.color.secondary,
      ghost: "transparent",
    };
    const attributes: string[] = [];
    if (this.props.disabled) attributes.push("disabled");
    if (this.props.loading) attributes.push('aria-busy="true"');
    if (this.props.onClick) attributes.push(`data-onclick="${this.props.label}"`);

    return {
      tag: "button",
      className: `btn btn--${this.props.variant ?? "primary"} btn--${this.props.size ?? "md"}`,
      attributes,
      style: {
        background: variantBg[this.props.variant ?? "primary"],
        color: this.props.variant === "ghost" ? t.color.primary : t.color.surface,
        padding: sizes[this.props.size ?? "md"],
        "border-radius": t.radius.md,
        "font-size": t.fontSize.base,
      },
      children: this.props.loading ? "⏳ " + this.props.label + "…" : this.props.label,
    };
  }

  describe(): string {
    return describeComponent(this.render());
  }
}

// ─────────────────── Component: Input ───────────────────
interface ComponentLibInputProps {
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

class ComponentLibInput {
  constructor(private readonly props: ComponentLibInputProps) {}

  render(): ComponentLibRenderResult {
    const t = componentLibraryTokens;
    const hasError = this.props.error !== undefined && this.props.error !== "";
    const attributes: string[] = [];
    attributes.push(`placeholder="${this.props.placeholder ?? ""}"`);
    if (this.props.required) attributes.push("required");
    if (this.props.disabled) attributes.push("disabled");
    if (hasError) attributes.push(`aria-invalid="true"`);

    return {
      tag: "input",
      className: `input${hasError ? " input--error" : ""}`,
      attributes,
      style: {
        padding: t.spacing.sm,
        "border-radius": t.radius.sm,
        "font-size": t.fontSize.base,
        "border-color": hasError ? t.color.danger : t.color.border,
        background: t.color.surface,
      },
      children: this.props.label,
    };
  }

  describe(): string {
    return describeComponent(this.render());
  }
}

// ─────────────────── Component: Card (composite) ───────────────────
interface ComponentLibCardProps {
  title: string;
  body: string;
  footer: string;
}

class ComponentLibCard {
  constructor(private readonly props: ComponentLibCardProps) {}

  render(): ComponentLibRenderResult {
    const t = componentLibraryTokens;
    return {
      tag: "div",
      className: "card",
      attributes: ["role=\"region\""],
      style: {
        background: t.color.surface,
        padding: t.spacing.lg,
        "border-radius": t.radius.md,
        color: t.color.text,
      },
      children: [
        `<h3>${this.props.title}</h3>`,
        `<p>${this.props.body}</p>`,
        `<footer>${this.props.footer}</footer>`,
      ].join("\n  "),
    };
  }

  describe(): string {
    return describeComponent(this.render());
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Component Library Demo ===");
console.log("");

console.log("1️⃣ Button — các variant & size (style lấy từ design token):");
[
  new ComponentLibButton({ label: "Đăng nhập" }),
  new ComponentLibButton({ label: "Hủy", variant: "secondary", size: "sm" }),
  new ComponentLibButton({
    label: "Đang xử lý…",
    variant: "ghost",
    loading: true,
    disabled: true,
  }),
  new ComponentLibButton({
    label: "Xóa tài khoản",
    variant: "primary",
    size: "lg",
    disabled: true,
  }),
].forEach((btn) => {
  console.log(btn.describe());
  console.log("");
});

console.log("2️⃣ Input — nhận props, có trạng thái error:");
console.log(new ComponentLibInput({ label: "Họ tên", placeholder: "Nguyễn Văn A", required: true }).describe());
console.log("");
console.log(new ComponentLibInput({ label: "Email", placeholder: "a@b.com", error: "Email không hợp lệ" }).describe());
console.log("");

console.log("3️⃣ Card — composite component bọc nội dung:");
console.log(new ComponentLibCard({ title: "Hóa đơn #1024", body: "Tổng tiền: 250.000 VNĐ", footer: "Đã thanh toán" }).describe());

console.log("");
console.log("✅ Component Library: Button/Input/Card dùng design token, có variant & props nhất quán");
export {};