# 🎨 16.1 Tokens (Design Tokens)

> **Design tokens** là các biến trung tâm lưu trữ giá trị thiết kế — màu, khoảng cách, typography — giúp hệ thống đồng nhất và dễ scale.

---

## 🎯 Design Tokens Là Gì?

```
❌ Hardcoded values trong component
├─ color: "#3B82F6"
├─ padding: "16px"
└─ font-size: "14px"

✅ Design tokens — 1 nơi lưu, nhiều nơi dùng
├─ --color-primary: "#3B82F6"
├─ --spacing-md: "16px"
└─ --font-size-sm: "14px"

Component chỉ đọc token, không hardcode
```

> 💡 **Lợi ích:** Đổi 1 token → toàn bộ hệ thống tự động cập nhật. Không cần sửa từng component.

---

## 📊 Token Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                  TOKEN HIERARCHY                        │
│                                                         │
│  Foundation Tokens                                      │
│  ├─ Color: --color-primary, --color-text, ...          │
│  ├─ Spacing: --spacing-xs(4px), --spacing-md(16px)     │
│  ├─ Typography: --font-size-sm, --font-weight-bold     │
│  └─ Easing: --ease-default, --ease-bounce              │
│                                                         │
│  Component Tokens                                       │
│  ├─ --button-bg: var(--color-primary)                  │
│  ├─ --button-padding: var(--spacing-md)                │
│  └─ --input-border: var(--color-text-muted)            │
│                                                         │
│  Page/Theme Tokens                                      │
│  ├─ --page-bg: var(--color-surface)                    │
│  └─ --card-shadow: 0 2px 8px rgba(0,0,0,0.1)           │
└─────────────────────────────────────────────────────────┘
```

> **Foundation** → **Component** → **Theme**: mỗi lớp kế thừa từ lớp dưới.

---

## 💻 Token Format (JSON)

```json
{
  "color": {
    "primary": { "value": "#3B82F6" },
    "text": { "value": "#1F2937" },
    "surface": { "value": "#FFFFFF" }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  },
  "typography": {
    "size-sm": { "value": "14px" },
    "size-base": { "value": "16px" },
    "weight-bold": { "value": "700" }
  }
}
```

---

## 🔄 Sử Dụng Tokens

```css
/* CSS variables từ tokens */
:root {
  --color-primary: #3B82F6;
  --spacing-md: 16px;
}

.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
}
```

```tsx
// React component dùng tokens
const Button = ({ children }) => (
  <button style={{ background: 'var(--color-primary)' }}>
    {children}
  </button>
);
```

---

## 🏗️命名规范 (Naming Convention)

| Cấp độ | Pattern | Ví Dụ |
|--------|---------|-------|
| Foundation | `--{type}-{name}` | `--color-primary`, `--spacing-md` |
| Component | `--{component}-{property}` | `--button-bg`, `--input-border` |
| Theme | `--theme-{name}` | `--theme-dark-bg` |

> 💡 **Quy tắc:** Đặt tên theo **ngữ nghĩa** (semantic), không theo giá trị.
> - ✅ `--color-primary` — rõ mục đích
> - ❌ `--color-blue` — nếu đổi màu thì phải đổi tên token

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| Hardcode màu `#3B82F6` | Dùng `var(--color-primary)` |
| Hardcode spacing `16px` | Dùng `var(--spacing-md)` |
| Token riêng lẻ cho mỗi component | Token kế thừa từ foundation |
| Đặt tên token theo giá trị | Đặt tên theo ngữ nghĩa |
| Token quá chi tiết (over-nested) | Group logic, giảm complexity |

---

## 🛠️ Công Cụ Quản Lý Tokens

| Công Cụ | Mô Tả |
|---------|-------|
| **Style Dictionary** | Amazon — chuyển token sang CSS, iOS, Android |
| **Tokens Studio** | Plugin Figma → JSON tokens |
| **Chromatic Tokens** | Thiết kế và sync tokens từ Figma |
| **Theme UI / styled-system** | React tokens integration |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Token ở 1 nơi duy nhất | Hardcode trong component |
| Đặt tên theo ngữ nghĩa | Đặt tên theo giá trị |
| Foundation → Component → Theme | Token rời rạc không có hierarchy |
| Dùng công cụ sync từ design tool | Sync thủ công |

---

## 📚 Tài Liệu

- 📖 [Design Tokens Fundamentals — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- 📖 [.tokens Spec](https://github.com/design-tokens/community-group/blob/main/formats/design-tokens/README.md)
- 📖 [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)

---

## ⏭️ Bài tiếp theo → [16.2 Component Library](../16.2-component-library/README.md)
