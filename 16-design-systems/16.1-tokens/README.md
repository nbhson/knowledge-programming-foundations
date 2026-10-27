# 🎨 16.1 Tokens (Design Tokens)

> **Design tokens** là các biến trung tâm lưu trữ giá trị thiết kế — màu, khoảng cách, typography — giúp hệ thống đồng nhất và dễ scale. Tokens là nền tảng của mọi design system.

---

## 🎯 Design Tokens Là Gì?

Tokens là **named values** đại diện cho quyết định thiết kế. Chúng abstract hóa raw values (color, px, rem) thành semantic names.

```
❌ Hardcoded values trong component
├─ color: "#3B82F6"         → "đây là primary blue hay secondary?"
├─ padding: "16px"          → "16px là gì? spacing chuẩn hay arbitrary?"
└─ font-size: "14px"        → "14px hay 16px? tại sao?"

✅ Design tokens — 1 nơi lưu, nhiều nơi dùng
├─ --color-primary: "#3B82F6"       → semantic, dễ hiểu intent
├─ --spacing-md: "16px"             → part of spacing scale
└─ --font-size-sm: "14px"           → part of typography scale
```

> 💡 **Lợi ích then chốt:** Đổi 1 token → toàn bộ hệ thống tự động cập nhật. Không cần sửa từng component. Đây là **single point of control**.

---

## 📊 Token Hierarchy — 3 Layers

```
┌─────────────────────────────────────────────────────────┐
│                  TOKEN HIERARCHY                        │
│                                                         │
│  ① Foundation Tokens                                    │
│  ├─ Color: --color-primary, --color-text, ...          │
│  ├─ Spacing: --spacing-xs(4px), --spacing-md(16px)     │
│  ├─ Typography: --font-size-sm, --font-weight-bold     │
│  ├─ Radius: --radius-sm(4px), --radius-md(8px)         │
│  └─ Easing: --ease-default, --ease-bounce              │
│                                                         │
│  ② Component Tokens (build on foundation)              │
│  ├─ --button-bg: var(--color-primary)                  │
│  ├─ --button-padding: var(--spacing-md)                │
│  ├─ --input-border: var(--color-text-muted)            │
│  └─ --card-shadow: var(--shadow-md)                    │
│                                                         │
│  ③ Page/Theme Tokens (context overrides)               │
│  ├─ --page-bg: var(--color-surface)                    │
│  └─ --theme-dark-bg: #1F2937                           │
└─────────────────────────────────────────────────────────┘
```

**Quy tắc flow:** Foundation → Component → Theme. Component token luôn reference foundation token, không bao giờ hardcode raw value.

---

## 💻 Token Format (JSON — W3C Design Tokens Spec)

```json
{
  "color": {
    "primary": { "value": "#3B82F6", "description": "Primary brand color" },
    "secondary": { "value": "#8B5CF6", "description": "Secondary accent" },
    "text": { "value": "#1F2937", "description": "Primary text color" },
    "text-muted": { "value": "#6B7280", "description": "Secondary/inactive text" },
    "surface": { "value": "#FFFFFF", "description": "Card/page background" },
    "success": { "value": "#10B981" },
    "warning": { "value": "#F59E0B" },
    "error": { "value": "#EF4444" }
  },
  "spacing": {
    "unit": { "value": "4px", "description": "Base spacing unit" },
    "xs":  { "value": "var(--spacing-unit) * 1" },
    "sm":  { "value": "var(--spacing-unit) * 2" },
    "md":  { "value": "var(--spacing-unit) * 4" },
    "lg":  { "value": "var(--spacing-unit) * 6" },
    "xl":  { "value": "var(--spacing-unit) * 8" },
    "2xl": { "value": "var(--spacing-unit) * 12" }
  },
  "typography": {
    "fontFamily": {
      "sans":  { "value": "Inter, system-ui, sans-serif" },
      "mono":  { "value": "Fira Code, monospace" }
    },
    "fontSize": {
      "xs":  { "value": "12px" },
      "sm":  { "value": "14px" },
      "base": { "value": "16px" },
      "lg":  { "value": "18px" },
      "xl":  { "value": "24px" },
      "2xl": { "value": "32px" }
    },
    "fontWeight": {
      "normal": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    },
    "lineHeight": {
      "tight":   { "value": "1.25" },
      "normal":  { "value": "1.5" },
      "relaxed": { "value": "1.75" }
    }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "16px" },
    "full": { "value": "9999px" }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px rgba(0,0,0,0.05)" },
    "md": { "value": "0 4px 6px rgba(0,0,0,0.1)" },
    "lg": { "value": "0 10px 15px rgba(0,0,0,0.1)" }
  }
}
```

---

## 🔄 Sử Dụng Tokens trong CSS & TypeScript

### CSS Custom Properties

```css
/* Import tokens as CSS variables */
:root {
  --color-primary: #3B82F6;
  --color-text: #1F2937;
  --spacing-md: 16px;
  --font-size-base: 16px;
  --radius-md: 8px;
}

.button {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
}
```

### TypeScript / React Component

```tsx
// ✅ Component reads from CSS variables (tokens)
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      {...props}
    >
      {children}
    </button>
  );
};

// In CSS:
// .btn--primary { background: var(--color-primary); }
// .btn--md { padding: var(--spacing-sm) var(--spacing-md); }
```

### JavaScript runtime tokens (for JS logic)

```typescript
// tokens.ts — exported for JS usage
export const tokens = {
  colors: {
    primary: '#3B82F6',
    text: '#1F2937',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
} as const;

// Usage in component logic
const padding = tokens.spacing.md; // 16 (px)
const color = tokens.colors.primary; // '#3B82F6'
```

---

## 🏗️ Naming Convention

| Cấp độ | Pattern | Ví Dụ | Lý do |
|--------|---------|-------|-------|
| Foundation | `--{type}-{name}` | `--color-primary`, `--spacing-md` | Clear category + semantic name |
| Component | `--{component}-{property}` | `--button-bg`, `--input-border` | Scoped to component context |
| Theme | `--theme-{name}` | `--theme-dark-bg` | Explicitly tied to theme mode |

> 💡 **Quy tắc vàng:** Đặt tên theo **ngữ nghĩa** (semantic), không theo giá trị.
> - ✅ `--color-primary` — rõ mục đích (brand color)
> - ❌ `--color-blue` — nếu đổi brand color sang đỏ thì phải đổi tên token

**Semantic vs Descriptive naming examples:**

| ✅ Semantic (good) | ❌ Descriptive (bad) | Tại sao |
|-------------------|---------------------|---------|
| `--color-primary` | `--color-blue` | Blue có thể đổi, primary luôn là primary |
| `--spacing-md` | `--spacing-16px` | 16px có thể đổi scale |
| `--font-size-base` | `--font-size-16` | 16 có thể đổi |
| `--radius-sm` | `--radius-4px` | 4px có thể đổi |

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Giải thích |
|----------|-------------|-----------|
| Hardcode màu `#3B82F6` | Dùng `var(--color-primary)` | Hardcode = không scale được, khó đổi theme |
| Hardcode spacing `16px` | Dùng `var(--spacing-md)` | Breaking spacing scale consistency |
| Token riêng lẻ cho mỗi component | Token kế thừa từ foundation | Duplicate tokens → multiple sources of truth |
| Đặt tên token theo giá trị | Đặt tên theo ngữ nghĩa | Value đổi → token name lỗi thời |
| Token quá chi tiết (over-nested) | Group logic, giảm complexity | `--button-primary-bg-hover` vs `--color-primary` (dùng opacity) |
| Foundation token bị override bừa | Giữ foundation immutable | Override foundation phá vỡ hệ thống |

---

## 🛠️ Công Cụ Quản Lý Tokens

| Công Cụ | Mô Tả | Link |
|---------|-------|------|
| **Style Dictionary** | Amazon — chuyển token JSON → CSS, iOS, Android, Flutter | [github](https://github.com/amzn/style-dictionary) |
| **Tokens Studio** | Plugin Figma → JSON tokens — sync design ↔ code | [tokens.studio](https://tokens.studio) |
| **Chromatic Tokens** | Thiết kế tokens trong Figma, sync tự động | [chromatic.com](https://www.chromatic.com) |
| **Theme UI** | React tokens integration với Gatsby/MDX | [theme-ui.com](https://theme-ui.com) |
| **styled-system** | System props dựa trên tokens | [styled-system.com](https://styled-system.com) |

**Workflow điển hình:**
1. Designer tạo tokens trong Figma (Tokens Studio plugin)
2. Export → JSON token file
3. Style Dictionary transform → CSS variables + TypeScript types
4. Component library đọc từ CSS variables
5. CI pipeline validate token consistency

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Tokens chỉ là CSS variables" | Tokens là design decisions; CSS variables là 1 output format. Có thể output iOS Swift, Android XML, Flutter Dart |
| "Càng nhiều token càng tốt" | Token overflow (500+ tokens) gây confusion. Chỉ tạo token khi value được reuse ≥ 2 lần |
| "Foundation tokens không bao giờ đổi" | Foundation có thể đổi — nhưng phải có migration plan, không đổi đột ngột |
| "Token = theme" | Token là values; theme là collection of token overrides cho context cụ thể |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Token ở 1 nơi duy nhất (JSON/DS tool) | Hardcode trong component |
| Đặt tên theo ngữ nghĩa | Đặt tên theo giá trị hiện tại |
| Foundation → Component → Theme hierarchy | Token rời rạc không có hierarchy |
| Dùng công cụ sync từ design tool | Sync thủ công Figma ↔ code |
| Export TypeScript types từ tokens | Hardcode types manually |

---

## 📚 Tài Liệu

- 📖 [Design Tokens Fundamentals — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- 📖 [.tokens Spec — W3C Community Group](https://github.com/design-tokens/community-group/blob/main/formats/design-tokens/README.md)
- 📖 [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- 📖 [Design Tokens — Bramus](https://bramus.github.io/design-tokens/)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.1-tokens
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [16.2 Component Library](../16.2-component-library/README.md)
