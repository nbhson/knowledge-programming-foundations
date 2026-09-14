# 🔷 16.5 Design Tokens Deep Dive (Tokens Chi Tiết)

> **Design tokens** là các giá trị thiết kế được đặt tên — từ foundation đến component — giúp duy trì consistency và multi-theme support. Deep dive này mở rộng 16.1 với cấu trúc chi tiết và naming strategy.

---

## 🎯 Token Structure — Detailed Taxonomy

```
┌─────────────────────────────────────────────────────────────┐
│                  TOKEN STRUCTURE                            │
│                                                             │
│  ① Foundation Tokens (atomic values)                      │
│  ├─ color.*       → raw colors (palette)                    │
│  ├─ spacing.*     → scale (xs, sm, md, lg, xl)             │
│  ├─ typography.*  → font sizes, weights, line heights      │
│  ├─ elevation.*   → shadows, z-index                       │
│  └─ motion.*      → duration, easing curves                │
│                                                             │
│  ② Component Tokens (semantic, built on foundation)        │
│  ├─ button.*      → uses foundation colors + spacing       │
│  ├─ input.*       → border, background, focus states       │
│  ├─ card.*        → background, shadow, border             │
│  └─ badge.*       → colors, sizes                          │
│                                                             │
│  ③ Page/Context Tokens (theme-specific overrides)          │
│  ├─ page.*        → layout-specific (page bg, gutter)     │
│  └─ theme.*       → light/dark mode overrides             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Naming Conventions — Complete Reference

### Foundation Colors

```json
{
  "color": {
    "primary": {
      "50":  { "value": "#EFF6FF", "description": "Lightest tint" },
      "100": { "value": "#DBEAFE", "description": "" },
      "200": { "value": "#BFDBFE", "description": "" },
      "300": { "value": "#93C5FD", "description": "" },
      "400": { "value": "#60A5FA", "description": "" },
      "500": { "value": "#3B82F6", "description": "Base primary" },
      "600": { "value": "#2563EB", "description": "Hover state" },
      "700": { "value": "#1D4ED8", "description": "Active state" },
      "900": { "value": "#1E3A8A", "description": "Darkest shade" }
    },
    "neutral": {
      "50":  { "value": "#F9FAFB" },
      "100": { "value": "#F3F4F6" },
      "200": { "value": "#E5E7EB" },
      "300": { "value": "#D1D5DB" },
      "400": { "value": "#9CA3AF" },
      "500": { "value": "#6B7280" },
      "600": { "value": "#4B5563" },
      "700": { "value": "#374151" },
      "800": { "value": "#1F2937" },
      "900": { "value": "#111827" }
    },
    "semantic": {
      "success": { "value": "#10B981" },
      "warning": { "value": "#F59E0B" },
      "error":   { "value": "#EF4444" },
      "info":    { "value": "#3B82F6" }
    }
  }
}
```

**Naming rule:** Dùng **semantic names** (`primary`, `neutral`, `success`) thay vì **descriptive** (`blue`, `gray`, `green`). Semantic names survive rebranding.

### Spacing Scale

```json
{
  "spacing": {
    "unit": { "value": "4px", "description": "Base unit — all spacing is multiple of this" },
    "xs":  { "value": "var(--spacing-unit) * 1" },   /* 4px  */
    "sm":  { "value": "var(--spacing-unit) * 2" },   /* 8px  */
    "md":  { "value": "var(--spacing-unit) * 4" },   /* 16px */
    "lg":  { "value": "var(--spacing-unit) * 6" },   /* 24px */
    "xl":  { "value": "var(--spacing-unit) * 8" },   /* 32px */
    "2xl": { "value": "var(--spacing-unit) * 12" },  /* 48px */
    "3xl": { "value": "var(--spacing-unit) * 16" }   /* 64px */
  }
}
```

**Why formula-based spacing:** `var(--spacing-unit) * 4` means changing `--spacing-unit` from 4px to 5px auto-scales ALL spacing tokens. No manual update needed.

### Typography

```json
{
  "typography": {
    "fontFamily": {
      "sans": { "value": "Inter, system-ui, -apple-system, sans-serif" },
      "mono": { "value": "Fira Code, 'Courier New', monospace" }
    },
    "fontSize": {
      "xs":  { "value": "12px" },
      "sm":  { "value": "14px" },
      "base": { "value": "16px" },
      "lg":  { "value": "18px" },
      "xl":  { "value": "24px" },
      "2xl": { "value": "32px" },
      "3xl": { "value": "40px" }
    },
    "fontWeight": {
      "normal":    { "value": "400" },
      "medium":    { "value": "500" },
      "semibold":  { "value": "600" },
      "bold":      { "value": "700" }
    },
    "lineHeight": {
      "tight":   { "value": "1.25" },
      "normal":  { "value": "1.5" },
      "relaxed": { "value": "1.75" }
    },
    "letterSpacing": {
      "tight":  { "value": "-0.025em" },
      "normal": { "value": "0" },
      "wide":   { "value": "0.025em" }
    }
  }
}
```

---

## 🌗 Multi-Theme Support

```json
{
  "theme": {
    "light": {
      "color": {
        "background":  { "value": "#FFFFFF" },
        "surface":     { "value": "#F9FAFB" },
        "text":        { "value": "#1F2937" },
        "text-muted":  { "value": "#6B7280" },
        "border":      { "value": "#E5E7EB" }
      },
      "shadow": {
        "sm": { "value": "0 1px 2px rgba(0,0,0,0.05)" },
        "md": { "value": "0 4px 6px rgba(0,0,0,0.1)" }
      }
    },
    "dark": {
      "color": {
        "background":  { "value": "#111827" },
        "surface":     { "value": "#1F2937" },
        "text":        { "value": "#F9FAFB" },
        "text-muted":  { "value": "#9CA3AF" },
        "border":      { "value": "#374151" }
      },
      "shadow": {
        "sm": { "value": "0 1px 2px rgba(0,0,0,0.3)" },
        "md": { "value": "0 4px 6px rgba(0,0,0,0.4)" }
      }
    }
  }
}
```

```css
/* CSS output từ Style Dictionary */
:root {
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
}

[data-theme="dark"] {
  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-text-muted: #9CA3AF;
  --color-border: #374151;
}
```

> 💡 **Dark mode tip:** Foundation tokens (color.primary, spacing.md) **không đổi** giữa light/dark. Chỉ semantic/theme tokens đổi. Giữ foundation immutable giúp component logic không cần aware of theme.

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Giải thích |
|----------|-------------|-----------|
| Token tên theo giá trị `blue-500` | Tên theo ngữ nghĩa `color-primary-500` | Value đổi → tên lỗi thời |
| Duplicate tokens across files | Single source of truth (1 JSON file) | Multiple sources = inconsistency risk |
| Hardcode trong token | Dùng token trong token (`var(--spacing-md)`) | Formula-based tokens enable scaling |
| Không có hierarchy | Foundation → Component → Theme | Random tokens = unmanageable |
| Token cho mỗi component instance | Token cho mỗi design decision | `--button-a-bg` vs `--color-primary` |
| Mixed naming conventions | Enforce kebab-case xuyên suốt | `fontSize` vs `font-size` confusion |

---

## 📐 Token Governance — Quản lý tokens

Tokens không phải "set and forget". Cần governance process:

```
Token Lifecycle:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Propose  │ →  │ Review   │ →  │ Approve  │ →  │ Publish  │
│ (design) │    │ (team)   │    │ (lead)   │    │ (CI)     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ↑                                                        │
     └─────────────────── Feedback loop ←─────────────────────┘
```

**Quy tắc governance:**
- Mỗi token mới cần **use case** rõ ràng (không create token cho 1 lần dùng)
- Token改名 cần **migration plan** (breaking change)
- Token deprecated không xóa ngay — keep với deprecation warning
- Token value đổi phải **audit impact** (grep tất cả usage trước khi đổi)

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Naming consistent (kebab-case) | Mixed naming conventions |
| Single source of truth (1 JSON/DS tool) | Tokens duplicated across files |
| Multi-theme native support (light/dark) | Hardcode per theme |
| Foundation tokens immutable | Override foundation từ component |
| Token governance process | Ad-hoc token creation |
| Formula-based spacing/sizing | Fixed px values everywhere |

---

## 📚 Tài liệu

- 📖 [design-tokens/spec — W3C CG](https://github.com/design-tokens/community-group)
- 📖 [Style Dictionary — Token Transformation](https://amzn.github.io/style-dictionary/)
- 📖 [Design Tokens Fundamentals — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- 📖 [Token Schema — W3C Community Group Report](https://design-tokens.github.io/community-group/format/)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.5-design-tokens
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [16.6 Consistency Guidelines](../16.6-consistency-guidelines/README.md)
