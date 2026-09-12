# 🎨 Lớp 16: Design Systems (Hệ Thống Thiết Kế)

> **Design System** là **nguồn sự thật duy nhất** (source of truth) cho tất cả các thành phần thiết kế và mã nguồn của sản phẩm, giúp đảm bảo tính nhất quán và hiệu quả trong phát triển giao diện người dùng.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm |
|---|--------|----------|
| 16.1 | [Design Tokens](16.1-tokens/README.md) | Màu sắc, typography, spacing |
| 16.2 | [Component Library](16.2-component-library/README.md) | Atomic Design, state management |
| 16.3 | [Storybook](16.3-storybook/README.md) | Component documentation |
| 16.4 | [Accessibility (A11y)](16.4-accessibility/README.md) | WCAG, screen readers |
| 16.5 | [Design Tokens Deep Dive](16.5-design-tokens/README.md) | Token naming, structure |
| 16.6 | [Consistency Guidelines](16.6-consistency-guidelines/README.md) | Spacing, typography scale |

---

## 🎯 Core Principles

### 1. Single Source of Truth

```
设计稿（Figma/Sketch）
        │
        ▼
   Design Tokens  ← 唯一数据源
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Code  Docs  组件库
```

### 2. Consistency Across Platforms

```
Web:    Button → color: var(--color-primary), size: var(--size-md)
iOS:    Button → color: UIColor.primary, size: .medium
Android: Button → color: R.color.primary, size: @dimen/md
```

### 3. Scalability

```
✅ Good: Token-based
   --spacing-sm = 8px
   --spacing-md = 16px
   --spacing-lg = 24px

❌ Bad: Hard-coded
   padding: 8px;  // Where does 8 come from?
   margin: 16px;  // What if we need to change?
```

---

## 📊 Token Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  Foundation Tokens                                  │
│  ── color.primary, spacing.base, font.size.base    │
├─────────────────────────────────────────────────────┤
│  Component Tokens                                   │
│  ── button.padding, input.border-radius             │
├─────────────────────────────────────────────────────┤
│  Page Tokens                                        │
│  ── layout.gutter, card.margin                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 Related Chapters

- **16.1 Design Tokens** — Cơ sở của design system
- **16.2 Component Library** — Xây dựng components
- **16.3 Storybook** — Tài liệu hóa components
- **16.4 Accessibility** — Đảm bảo tiếp cận
- **16.5 Design Tokens Deep Dive** — Chi tiết tokens
- **16.6 Consistency Guidelines** — Nguyên tắc nhất quán

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Design Tokens Guide](https://design-tokens.github.io/community-group/format/)
- 📖 [Style Dictionary](https://amzn.github.io/style-dictionary/)
- 📖 [Storybook Documentation](https://storybook.js.org/)
- 📖 [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## ⏭️ Bắt Đầu Học

→ [16.1 Design Tokens](16.1-tokens/README.md)
