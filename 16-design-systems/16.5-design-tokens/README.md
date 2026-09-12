# 🔷 16.5 Design Tokens (Tokens Chi Tiết)

> **Design tokens** là các giá trị thiết kế được đặt tên — từ foundation đến component — giúp duy trì consistency và multi-theme support.

---

## 🎯 Token Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  TOKEN STRUCTURE                            │
│                                                             │
│  Foundation Tokens                                          │
│  ├─ color.*       → raw colors                             │
│  ├─ spacing.*     → scale (xs, sm, md, lg, xl)             │
│  ├─ typography.*  → font sizes, weights, line heights      │
│  └─ elevation.*   → shadows, z-index                       │
│                                                             │
│  Component Tokens                                           │
│  ├─ button.*      → uses foundation colors                 │
│  ├─ input.*       → border, background, focus states       │
│  └─ card.*        → background, shadow                     │
│                                                             │
│  Page/Context Tokens                                        │
│  ├─ page.*        → layout-specific                        │
│  └─ theme.*       → light/dark overrides                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Naming Conventions

```json
{
  "color": {
    "primary": {
      "value": "#3B82F6"
    },
    "primary": {
      "50": { "value": "#EFF6FF" },
      "100": { "value": "#DBEAFE" },
      "500": { "value": "#3B82F6" },
      "700": { "value": "#1D4ED8" }
    },
    "text": {
      "default": { "value": "#1F2937" },
      "muted": { "value": "#6B7280" }
    }
  },
  "spacing": {
    "unit": { "value": "4px" },
    "xs": { "value": "var(--spacing-unit) * 1" },
    "sm": { "value": "var(--spacing-unit) * 2" },
    "md": { "value": "var(--spacing-unit) * 4" },
    "lg": { "value": "var(--spacing-unit) * 6" },
    "xl": { "value": "var(--spacing-unit) * 8" }
  },
  "typography": {
    "fontFamily": {
      "sans": { "value": "Inter, system-ui, sans-serif" },
      "mono": { "value": "Fira Code, monospace" }
    },
    "fontSize": {
      "xs": { "value": "12px" },
      "sm": { "value": "14px" },
      "base": { "value": "16px" },
      "lg": { "value": "18px" },
      "xl": { "value": "24px" },
      "2xl": { "value": "32px" }
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
        "background": { "value": "#FFFFFF" },
        "text": { "value": "#1F2937" }
      }
    },
    "dark": {
      "color": {
        "background": { "value": "#111827" },
        "text": { "value": "#F9FAFB" }
      }
    }
  }
}
```

```css
/* CSS output */
:root {
  --color-background: #FFFFFF;
  --color-text: #1F2937;
}

[data-theme="dark"] {
  --color-background: #111827;
  --color-text: #F9FAFB;
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| Token tên theo giá trị `blue-500` | Tên theo ngữ nghĩa `color-primary-500` |
| Duplicate tokens across files | Single source of truth |
| Hardcode trong token | Dùng token trong token |
| Không có hierarchy | Foundation → Component → Theme |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Naming consistent (kebab-case) | Mixed naming conventions |
| Single source of truth | Tokens duplicated across files |
| Multi-theme native support | Hardcode per theme |

---

## 📚 Tài liệu

- 📖 [design-tokens/spec](https://github.com/design-tokens/community-group)
- 📖 [Style Dictionary — Token Transformation](https://amzn.github.io/style-dictionary/)

---

## ⏭️ Bài tiếp theo → [16.6 Consistency Guidelines](../16.6-consistency-guidelines/README.md)
