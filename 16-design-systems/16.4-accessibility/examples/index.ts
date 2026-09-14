/**
 * 16.4 Accessibility (A11y) — mô phỏng kiểm tra tiếp cận trên "component giả lập"
 *
 * Auditor mô phỏng các công cụ quét a11y (như axe) kiểm tra:
 *   - accessible name cho phần tử tương tác (aria-label/text)
 *   - contrast ratio (tính bằng công thức WCAG, hệ số tương đối luminance)
 *   - aria-hidden không được chứa phần tử focusable
 *   - focus order của các phần tử có thể Tab đến
 * KHÔNG có DOM — mỗi component được mô hình hóa bằng object A11yElement.
 */

// ─────────────────── Công thức WCAG: relative luminance & contrast ───────────────────
/** Đổi hex (#RGB hoặc #RRGGBB) thành 3 kênh RGB 0..255 */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const value = Number.parseInt(h, 16);
  if (Number.isNaN(value) || h.length !== 6) {
    throw new Error(`Mã màu không hợp lệ: ${hex}`);
  }
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** Sat tuyến tính 1 kênh sRGB theo chuẩn WCAG */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance L = 0.2126 R + 0.7152 G + 0.0722 B */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Contrast ratio theo WCAG: (L1 + 0.05) / (L2 + 0.05) */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ─────────────────── Giả lập component cần kiểm tra ───────────────────
interface A11yElement {
  id: string;
  elementType: string;
  accessibleName: string; // từ aria-label hoặc nội dung text
  focusable: boolean;
  ariaHidden?: boolean;
  ariaInvalid?: boolean;
  role?: string;
  color: string;
  background: string;
  fontSize: number; // px
  fontWeight?: string;
  sequence: number; // vị trí trong DOM order (focus order)
}

const VALID_ROLES = new Set([
  "button",
  "link",
  "dialog",
  "textbox",
  "checkbox",
  "alert",
  "tab",
  "menuitem",
  "switch",
]);

interface A11yViolation {
  elementId: string;
  rule: string;
  detail: string;
}

// ─────────────────── Auditor ───────────────────
class A11yAuditor {
  /** Quét toàn bộ quy tắc trên một danh sách element */
  run(elements: A11yElement[]): A11yViolation[] {
    const violations: A11yViolation[] = [];
    for (const el of elements) {
      this.checkAccessibleName(el, violations);
      this.checkAriaHidden(el, violations);
      this.checkRole(el, violations);
      this.checkContrast(el, violations);
    }
    this.checkFocusOrder(elements, violations);
    return violations;
  }

  /** Quy tắc 1: phần tử tương tác phải có accessible name */
  private checkAccessibleName(el: A11yElement, out: A11yViolation[]): void {
    if (el.focusable && el.accessibleName.trim() === "") {
      out.push({
        elementId: el.id,
        rule: "accessible-name",
        detail: `Phần tử tương tác <${el.elementType}> thiếu accessible name — thêm aria-label hoặc text`,
      });
    }
  }

  /** Quy tắc 2: aria-hidden không được chứa thể focusable */
  private checkAriaHidden(el: A11yElement, out: A11yViolation[]): void {
    if (el.ariaHidden && el.focusable) {
      out.push({
        elementId: el.id,
        rule: "aria-hidden-focus",
        detail: `Phần tử aria-hidden không được nhận tiêu điểm (focusable)`,
      });
    }
  }

  /** Quy tắc 3: role phải hợp lệ nếu khai báo */
  private checkRole(el: A11yElement, out: A11yViolation[]): void {
    if (el.role && !VALID_ROLES.has(el.role)) {
      out.push({
        elementId: el.id,
        rule: "bad-role",
        detail: `Role "${el.role}" không hợp lệ — dùng role chuẩn: ${[...VALID_ROLES].join(", ")}`,
      });
    }
  }

  /** Quy tắc 4: contrast tối thiểu — AA normal ≥ 4.5, large (≥18px hoặc bold ≥14px) ≥ 3 */
  private checkContrast(el: A11yElement, out: A11yViolation[]): void {
    const ratio = contrastRatio(el.color, el.background);
    const largeText = el.fontSize >= 18 || (el.fontSize >= 14 && el.fontWeight === "bold");
    const required = largeText ? 3 : 4.5;
    if (ratio < required) {
      out.push({
        elementId: el.id,
        rule: "color-contrast",
        detail: `Contrast ${ratio.toFixed(2)}:1 < ngưỡng ${required}:1 (${
          largeText ? "large text ≥3" : "normal text ≥4.5"
        }) — màu ${el.color} trên ${el.background}`,
      });
    }
  }

  /** Quy tắc 5: focus order — mọi phần tử focusable phải nằm trong thứ tự Tab, không bỏ sót */
  private checkFocusOrder(elements: A11yElement[], out: A11yViolation[]): void {
    const focusable = elements.filter((el) => el.focusable).sort((a, b) => a.sequence - b.sequence);
    console.log("⌨️  Focus order (thứ tự Tab):");
    focusable.forEach((el, i) => {
      console.log(`    ${i + 1}. ${el.elementType}#${el.id} (seq=${el.sequence}) ${el.accessibleName}`);
    });
    // Kiểm tra sequence không trùng nhau (giả lập trật tự DOM)
    const seqSet = new Set(elements.map((e) => e.sequence));
    if (seqSet.size !== elements.length) {
      out.push({
        elementId: elements[0].id,
        rule: "focus-order-dup",
        detail: "Có 2 element trùng vị trí DOM (sequence) — trật tự focus không xác định",
      });
    }
  }
}

/** Helper tạo element mặc định */
function el(partial: Partial<A11yElement> & { id: string }): A11yElement {
  return {
    elementType: "button",
    accessibleName: "",
    focusable: true,
    color: "#1F2937",
    background: "#FFFFFF",
    fontSize: 16,
    sequence: 0,
    ...partial,
  };
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Accessibility Demo ===");
console.log("");

console.log("1️⃣ Công cụ tính contrast theo chuẩn WCAG:");
console.log(`   contrastRatio("#1F2937", "#FFFFFF") = ${contrastRatio("#1F2937", "#FFFFFF").toFixed(2)}:1  (✅ pass ≥4.5)`);
console.log(`   contrastRatio("#9CA3AF", "#FFFFFF") = ${contrastRatio("#9CA3AF", "#FFFFFF").toFixed(2)}:1  (❌ fail <4.5)`);
console.log(`   contrastRatio("#60A5FA", "#111827") = ${contrastRatio("#60A5FA", "#111827").toFixed(2)}:1  (✅ pass ≥4.5)`);
console.log("");

console.log("2️⃣ Giả lập bộ component cần quét (mô hình object, không DOM):");
const elements: A11yElement[] = [
  el({ id: "login-btn", elementType: "button", accessibleName: "Đăng nhập", color: "#FFFFFF", background: "#3B82F6", sequence: 1 }),
  el({ id: "search-input", elementType: "input", role: "textbox", accessibleName: "", focusable: true, color: "#1F2937", background: "#FFFFFF", sequence: 2 }),
  el({ id: "decor-icon", elementType: "img", accessibleName: "", focusable: false, ariaHidden: true, color: "#1F2937", background: "#FFFFFF", sequence: 3 }),
  el({ id: "muted-note", elementType: "span", accessibleName: "Ghi chú nhạt", focusable: false, color: "#9CA3AF", background: "#FFFFFF", sequence: 4 }),
  el({ id: "search-btn", elementType: "button", accessibleName: "Tìm kiếm", color: "#FFFFFF", background: "#1D4ED8", sequence: 5 }),
];
elements.forEach((e) => {
  console.log(`   ${e.elementType}#${e.id} focusable=${e.focusable} aria-hidden=${e.ariaHidden ?? false} label="${e.accessibleName}"`);
});
console.log("");

console.log("3️⃣ Chạy auditor:");
const violations = new A11yAuditor().run(elements);
console.log("");
if (violations.length === 0) {
  console.log("  Không có vi phạm nào 🎉");
} else {
  console.log("  ❌ Danh sách vi phạm:");
  violations.forEach((v) => {
    console.log(`    - [${v.rule}] <${v.elementId}>: ${v.detail}`);
  });
}

console.log("");
console.log("✅ Accessibility: kiểm tra aria-*, contrast ratio và focus order mô phỏng thành công");
export {};