# 📐 16.6 Consistency Guidelines (Hướng Dẫn Tính Nhất Quán)

> **Consistency** là nền tảng của design system — cùng một pattern, cùng một feel ở mọi nơi giúp user quen thuộc và developer dễ maintain. Inconsistency tạo cognitive load cho user và maintenance debt cho team.

---

## 🎯 Design Consistency Principles — 4 Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                  CONSISTENCY PRINCIPLES                     │
│                                                             │
│  1. Visual Consistency — Cùng look & feel                  │
│  │  → Colors, spacing, typography uniform                   │
│  │  → Component appearance matches design spec              │
│  ├───────────────────────────────────────────────────────  │
│  2. Behavioral Consistency — Cùng interaction patterns     │
│  │  → Same hover, focus, active states                      │
│  │  → Predictable animations and transitions                │
│  ├───────────────────────────────────────────────────────  │
│  3. Structural Consistency — Cùng component structure      │
│  │  → Props API consistent across components               │
│  │  → Naming conventions uniform                            │
│  ├───────────────────────────────────────────────────────  │
│  4. Documentation Consistency — Cùng style docs            │
│  └─ → Stories, README, examples format                      │
│     → Every component follows same doc template            │
└─────────────────────────────────────────────────────────────┘
```

**Tại sao consistency quan trọng?**
- **User side:** Familiarity reduces cognitive load — user learned 1 pattern, applies to everything
- **Dev side:** Predictable patterns = faster development, fewer bugs, easier onboarding
- **Design side:** Single design language, not 100 different "looks"

---

## 📏 Spacing System

Spacing là phần bị inconsistency nhiều nhất — developer tự pick `8px`, `10px`, `12px` tùy tiện.

```typescript
// ✅ Spacing scale — dùng tokens, NOT arbitrary values
const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Component uses spacing tokens exclusively
const styles = {
  padding: spacing.md,      // 16px — NOT 15px or 17px
  gap: spacing.sm,          // 8px
  marginBottom: spacing.lg, // 24px
};
```

```css
/* CSS variables — source of truth */
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}

.component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  /* ❌ NEVER: padding: 15px; margin: 17px; */
}
```

**Spacing rules:**
1. Luôn dùng token, không bao giờ hardcode px value
2. Spacing scale nên theo **base unit** (thường 4px) — tất cả giá trị là multiple của base
3. Khi design spec có value không nằm trong scale → tạo token mới, không hardcode

---

## 🔤 Typography Scale

Typography inconsistency phổ biến: 1 component dùng 14px, component khác dùng 15px cho "same" text.

```json
{
  "typography": {
    "scale": {
      "xs":  { "value": "12px", "lineHeight": "16px" },
      "sm":  { "value": "14px", "lineHeight": "20px" },
      "base": { "value": "16px", "lineHeight": "24px" },
      "lg":  { "value": "18px", "lineHeight": "28px" },
      "xl":  { "value": "24px", "lineHeight": "32px" },
      "2xl": { "value": "32px", "lineHeight": "40px" },
      "3xl": { "value": "40px", "lineHeight": "48px" }
    },
    "weight": {
      "normal":   { "value": "400" },
      "medium":   { "value": "500" },
      "semibold": { "value": "600" },
      "bold":     { "value": "700" }
    },
    "family": {
      "sans":  { "value": "Inter, system-ui, sans-serif" },
      "mono":  { "value": "Fira Code, monospace" }
    }
  }
}
```

**Typography usage matrix:**

| Element | Size | Weight | Line Height | Token |
|---------|------|--------|-------------|-------|
| Heading 1 | 32px | 700 | 40px | `--typography-scale-2xl` |
| Heading 2 | 24px | 700 | 32px | `--typography-scale-xl` |
| Body | 16px | 400 | 24px | `--typography-scale-base` |
| Caption | 12px | 400 | 16px | `--typography-scale-xs` |
| Button text | 14px | 500 | 20px | `--typography-scale-sm` |

---

## 🧱 Component Composition — Consistent API

Tất cả components trong library phải có prop API consistent.

```tsx
// ✅ Consistent prop API across components
interface BaseProps {
  className?: string;        // override class
  style?: React.CSSProperties; // inline style override
  disabled?: boolean;        // standard disabled state
  id?: string;               // DOM id
}

// Button
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}: ButtonProps & BaseProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}

// Card — same base props pattern
function Card({
  children,
  padding = 'md',
  className = '',
  ...props
}: CardProps & BaseProps) {
  return (
    <div
      className={`card card--${padding} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

// Naming rules (consistent across all components):
// Component: PascalCase        — Button, Card, Modal
// Props:    camelCase          — variant, disabled, isLoading
// Events:   on + PascalCase    — onClick, onOpen, onSubmit
```

**Prop naming conventions:**
| Pattern | Example | Used for |
|---------|---------|----------|
| `is*` boolean | `isLoading`, `isOpen` | Conditional state |
| `has*` boolean | `hasError`, `hasImage` | Presence check |
| `on*` callback | `onClick`, `onOpen` | Event handlers |
| `as*` type | `asComponent`, `asTag` | Polymorphic props |
| `*-able` | `scrollable`, `resizable` | Capability flags |

---

## 🎨 Visual Consistency — Design Tokens in Action

```css
/* ✅ Single source of truth — tokens define everything */
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}

/* Components use tokens — not hardcoded values */
.btn {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
}

.input {
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Hậu quả của anti-pattern |
|----------|-------------|-------------------------|
| Hardcode values trong component | Dùng tokens | Không scale được, không dark mode |
| Inconsistent spacing (4px, 8px, 10px random) | Spacing scale | UI trông "loose", không professional |
| Different button styles for same action | Single Button component | User confusion: "2 buttons khác nhau làm gì?" |
| Mixed naming (buttonBtn vs Button) | Consistent naming | Cognitive load tăng, lookup time tăng |
| Duplicate tokens across files | Single token file | Multiple sources = drift over time |
| Component có prop API khác nhau | Unified BaseProps | Developer phải ghi nhớ các API khác nhau |

---

## 📋 Consistency Audit Checklist

Sử dụng checklist này để audit design system định kỳ:

### Visual Consistency
- [ ] Tất cả màu sắc từ tokens, không hardcode
- [ ] Spacing các component đều dùng spacing scale
- [ ] Border radius nhất quán (sm/md/lg, không arbitrary values)
- [ ] Shadow tokens được reuse, không redefine

### Behavioral Consistency
- [ ] Hover/focus/active states cùng pattern across components
- [ ] Animation duration consistent (thường 150ms–300ms)
- [ ] Error state pattern same (red border + message)
- [ ] Loading state pattern same (skeleton vs spinner)

### Structural Consistency
- [ ] Props API có common BaseProps interface
- [ ] Event handlers naming: `onEventName` (camelCase PascalCase)
- [ ] Component file structure: `Component.tsx`, `Component.types.ts`, `index.ts`
- [ ] Barrel export pattern nhất quán

### Documentation Consistency
- [ ] Mỗi component có Storybook story
- [ ] Docs template same: description → props table → examples
- [ ] README có usage example

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Consistency = boring, không sáng tạo" | Consistency = foundation để sáng tạo có cấu trúc. Airbnb Design System vẫn creative |
| "Cần consistency 100%" | 80/20 rule: 80% components follow pattern, 20% exceptional cases allowed với justification |
| "Consistency guidelines = rules không đổi" | Guidelines evolve — mỗi quarter review, update khi pattern không còn phù hợp |
| "Developer nào cũng phải thuộc guidelines" | Guidelines should be enforced by tokens + linters, not memorization |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Spacing/typography scale (token-based) | Values ngẫu nhiên không có hệ thống |
| Unified component API (BaseProps pattern) | Mỗi component 1 style API |
| Tokens everywhere (no hardcode) | Hardcode colors/spacing trong component |
| Consistent naming conventions | Mixed naming (camelCase + PascalCase trộn) |
| Regular consistency audit | Bỏ qua inconsistency cho đến khi thành debt |

---

## 📚 Tài liệu

- 📖 [Design System Patterns — Brad Frost](https://bradfrost.com/blog/post/design-system-patterns/)
- 📖 [Atomic Design — Brad Frost](http://atomicdesign.bradfrost.com/)
- 📖 [Design Systems — Vahe Bayandour](https://designsystemsbook.com/)
- 📖 [Smashing Design Systems](https://www.smashingmagazine.com/design-systems/)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.6-consistency-guidelines
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn đã hoàn thành Nhóm 16: Design Systems! 🎉
