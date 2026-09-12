# 📐 16.6 Consistency Guidelines (Hướng Dẫn Tính Nhất Quán)

> **Consistency** là nền tảng của design system — cùng một pattern, cùng một feel ở mọi nơi giúp user quen thuộc và developer dễ maintain.

---

## 🎯 Design Consistency Principles

```
┌─────────────────────────────────────────────────────────────┐
│                  CONSISTENCY PRINCIPLES                     │
│                                                             │
│  1. Visual Consistency — Cùng look & feel                  │
│  │  → Colors, spacing, typography uniform                   │
│                                                             │
│  2. Behavioral Consistency — Cùng interaction patterns     │
│  │  → Same hover, focus, active states                      │
│                                                             │
│  3. Structural Consistency — Cùng component structure      │
│  │  → Props API, naming, composition                       │
│                                                             │
│  4. Documentation Consistency — Cùng style docs            │
│  └─ → Stories, README, examples format                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📏 Spacing System

```typescript
// ✅ Spacing scale — dùng tokens
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

// Component uses spacing tokens
const styles = {
  padding: spacing.md,
  gap: spacing.sm,
  marginBottom: spacing.lg,
};
```

```css
/* CSS variables */
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

.component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

---

## 🔤 Typography Scale

```json
{
  "typography": {
    "scale": {
      "xs": { "value": "12px", "lineHeight": "16px" },
      "sm": { "value": "14px", "lineHeight": "20px" },
      "base": { "value": "16px", "lineHeight": "24px" },
      "lg": { "value": "18px", "lineHeight": "28px" },
      "xl": { "value": "24px", "lineHeight": "32px" },
      "2xl": { "value": "32px", "lineHeight": "40px" }
    },
    "weight": {
      "normal": { "value": "400" },
      "medium": { "value": "500" },
      "semibold": { "value": "600" },
      "bold": { "value": "700" }
    }
  }
}
```

---

## 🧱 Component Composition

```tsx
// ✅ Consistent prop API across components
interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

interface SpacingProps {
  padding?: string;
  margin?: string;
}

// Button
function Button({ children, variant, size, ...props }: ButtonProps & BaseProps) {
  return <button className={`btn btn--${variant} btn--${size}`} {...props}>{children}</button>;
}

// Card
function Card({ children, padding, ...props }: CardProps & BaseProps) {
  return <div className="card" style={{ padding }} {...props}>{children}</div>;
}

//统一命名规则
// Component: PascalCase
// Props: camelCase
// Events: on + PascalCase
```

---

## 🎨 Visual Consistency

```css
/* ✅ Sử dụng tokens */
:root {
  --color-primary: #3B82F6;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}

/* Component dùng tokens */
.btn {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| Hardcode values trong component | Dùng tokens |
| Inconsistent spacing (4px, 8px, 10px random) | Spacing scale |
| Different button styles for same action | Single Button component |
| Mixed naming (buttonBtn vs Button) | Consistent naming |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Spacing/typography scale | Values ngẫu nhiên |
|统一的 component API | Mỗi component 1 style |
| Tokens everywhere | Hardcode colors/spacing |
|一致的 naming conventions | Mixed naming |

---

## 📚 Tài liệu

- 📖 [Design System Patterns — Brad Frost](https://bradfrost.com/blog/post/design-system-patterns/)
- 📖 [Atomic Design — Brad Frost](http://atomicdesign.bradfrost.com/)

---

## ⏭️ Bạn đã hoàn thành Nhóm 16: Design Systems! 🎉
