# 🎨 Lớp 16: Design Systems (Hệ Thống Thiết Kế)

> **Design System** là **nguồn sự thật duy nhất** (source of truth) cho tất cả các thành phần thiết kế và mã nguồn của sản phẩm, giúp đảm bảo tính nhất quán và hiệu quả trong phát triển giao diện người dùng. Đây không phải chỉ là component library — đó là **systematic approach** đến UI development.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm |
|---|--------|----------|
| 16.1 | [Design Tokens](16.1-tokens/README.md) | Khái niệm + phân loại cơ bản: màu sắc, typography, spacing |
| 16.2 | [Component Library](16.2-component-library/README.md) | Atomic Design, state management |
| 16.3 | [Storybook](16.3-storybook/README.md) | Component documentation |
| 16.4 | [Accessibility (A11y)](16.4-accessibility/README.md) | WCAG, screen readers |
| 16.5 | [Design Tokens Deep Dive](16.5-design-tokens/README.md) | Nâng cao: chuẩn W3C DTCG, multi-brand theming, versioning/migration, Style Dictionary |
| 16.6 | [Consistency Guidelines](16.6-consistency-guidelines/README.md) | Spacing, typography scale |

---

## 🎯 Core Principles

### 1. Single Source of Truth

```
Thiết kế (Figma/Sketch)
         │
         ▼
    Design Tokens ← nguồn dữ liệu duy nhất
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Code  Docs  Component Library
```

**Tại sao Single Source of Truth quan trọng?**
- Khi thiết kế thay đổi (rebrand, dark mode), chỉ cần update **1 nơi** (token file) → code tự động reflect
- Không có "design drift" — developer và designer nói cùng 1 ngôn ngữ
- Prevent "I used #3B82F6 here but the design says #3A81E5" inconsistency

### 2. Consistency Across Platforms

```
Web:    Button → color: var(--color-primary), size: var(--size-md)
iOS:    Button → color: UIColor(named: "primary"), size: .medium
Android: Button → color: R.color.primary, size: @dimen/md
React Native: Button → color: tokens.color.primary, size: tokens.spacing.md
```

**Key insight:** Design tokens là **bridge** giữa design và code. Same token name, different implementation per platform.

### 3. Scalability

```
✅ Token-based (scalable):
   --spacing-sm = 8px
   --spacing-md = 16px
   --spacing-lg = 24px
   → Đổi 1 token → toàn bộ hệ thống update

❌ Hard-coded (không scalable):
   padding: 8px;  // Where does 8 come from?
   margin: 16px;  // What if we need to change?
   → Phải grep + replace thủ công, dễ sót
```

---

## 📊 Token Hierarchy — 3 layers

```
┌─────────────────────────────────────────────────────┐
│  ① Foundation Tokens (nguyên liệu thô)              │
│     ── color.primary (#3B82F6),                     │
│        spacing.base (4px), font.size.base (16px)    │
├─────────────────────────────────────────────────────┤
│  ② Component Tokens (ghép từ foundation)            │
│     ── button.padding (var(--spacing-md)),          │
│        input.border-radius (var(--radius-sm))       │
├─────────────────────────────────────────────────────┤
│  ③ Page/Theme Tokens (context-specific overrides)   │
│     ── page.background (var(--color-surface)),      │
│        card.shadow (0 2px 8px rgba(0,0,0,0.1))     │
└─────────────────────────────────────────────────────┘
```

**Flow:** Foundation → Component → Theme. Mỗi lớp kế thừa từ lớp dưới. Không bao giờ override foundation từ component.

---

## 🔑 Why Design Systems Matter

| Problem without DS | Solution with DS |
|--------------------|------------------|
| Mỗi dev tự pick màu → UI inconsistent | Tokens = 1 source of truth |
| Component giống nhau nhưng code khác | Reusable component library |
| Designers và developers nói khác ngôn ngữ | Tokens as shared vocabulary |
| Onboarding dev mới mất tuần | Storybook docs + component usage examples |
| Dark mode = rewrite CSS | Theme tokens override foundation |

---

## 🧩 Design System ≠ Component Library

| Aspect | Component Library | Design System |
|--------|------------------|---------------|
| Scope | UI components only | Components + tokens + guidelines + docs |
| Governance | Code-only | Code + design + process |
| Audience | Developers | Devs + designers + PMs |
| Example | Material-UI, Ant Design | Google Material Design, Shopify Polaris |

> 💡 Component library là **part** của design system, không phải toàn bộ. Design system bao gồm cả guidelines, tokens, contribution guide, và governance process.

---

## 🔗 Related Chapters

- **16.1 Design Tokens** — Foundation of everything
- **16.2 Component Library** — Building reusable components
- **16.3 Storybook** — Documentation and visual testing
- **16.4 Accessibility** — Ensuring inclusive experiences
- **16.5 Design Tokens Deep Dive** — Nâng cao: chuẩn W3C DTCG, multi-brand theming, versioning/migration, Style Dictionary
- **16.6 Consistency Guidelines** — Spacing, typography scale

> 💡 **Phân biệt 16.1 và 16.5:** **16.1** = khái niệm + phân loại tokens cơ bản
> (token là gì, 3 tầng Foundation → Component → Theme, đặt tên semantic, dùng trong CSS/TS).
> **16.5** = deep dive nâng cao vận hành ở quy mô production
> (chuẩn file W3C DTCG, multi-brand theming, versioning/migration tokens, tooling Style Dictionary).
> Chưa rõ token là gì → học 16.1 trước; cần scale nhiều brand/platform → đọc tiếp 16.5.

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Design Tokens Guide — W3C CG](https://design-tokens.github.io/community-group/format/)
- 📖 [Style Dictionary — Amazon](https://amzn.github.io/style-dictionary/)
- 📖 [Storybook Documentation](https://storybook.js.org/)
- 📖 [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- 📖 [Design Systems — Vahe Bayandour](https://designsystemsbook.com/)
- 📖 [Atomic Design — Brad Frost](http://atomicdesign.bradfrost.com/)

---

## ⏭️ Bắt Đầu Học

→ [16.1 Design Tokens](16.1-tokens/README.md)
