# 🧩 16.2 Component Library (Thư Viện Component)

> **Component library** là tập hợp các component tái sử dụng được, đóng gói logic UI thành đơn vị độc lập, có prop types và theming.

---

## 🎯 Component Library Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  COMPONENT LIBRARY                      │
│                                                         │
│  Foundation Layer                                       │
│  ├─ Button, Input, Select (basic UI)                   │
│  └─ Link, Icon, Badge                                   │
│                                                         │
│  Compound Components                                    │
│  ├─ Form (Input + Label + Error)                       │
│  ├─ Card (Header + Body + Footer)                      │
│  └─ Modal (Overlay + Dialog + Actions)                 │
│                                                         │
│  Layout Components                                      │
│  ├─ Grid, Container, Stack                              │
│  └─ Sidebar, Header, Footer                             │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Prop Types & API Design

```typescript
// ✅ Button with clear prop types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: (e: MouseEvent) => void;
}

function Button({ variant = 'primary', size = 'md', ...rest }: ButtonProps) {
  return <button className={`btn btn--${variant} btn--${size}`} {...rest} />;
}

// ❌ Too many props without grouping
function Input({ label, error, hint, required, disabled, onChange, ... }) {}

// ✅ Group related props
interface InputFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

interface InputProps extends InputFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}
```

---

## 🎨 Theming Support

```css
/* Theme tokens */
:root {
  --color-primary: #3B82F6;
  --color-surface: #FFFFFF;
}

[data-theme="dark"] {
  --color-primary: #60A5FA;
  --color-surface: #1F2937;
}

/* Component uses tokens */
.btn--primary {
  background: var(--color-primary);
  color: var(--color-surface);
}
```

```tsx
// ThemeProvider for React
function ThemeProvider({ children, theme = 'light' }) {
  return (
    <div data-theme={theme}>
      {children}
    </div>
  );
}
```

---

## ♿ Accessibility

```tsx
// ✅ ARIA attributes
function Button({ icon, children, ...props }) {
  return (
    <button {...props}>
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ✅ Focus management
function Modal({ isOpen, onClose }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) ref.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" ref={ref} tabIndex={-1}>
      {children}
    </div>
  );
}
```

---

## 📦 Package Structure

```
my-component-lib/
├─ src/
│  ├─ components/
│  │  ├─ Button/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Button.test.tsx
│  │  │  └─ index.ts
│  │  ├─ Input/
│  │  └─ ...
│  ├─ hooks/
│  ├─ utils/
│  └─ index.ts          # barrel export
├─ package.json
├─ tsconfig.json
└─ README.md
```

```json
// package.json
{
  "name": "@my/ui-kit",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| Component làm quá nhiều việc | Mỗi component 1 job |
| Prop drilling sâu | Dùng context hoặc composition |
| Hardcode theme values | Dùng CSS variables/tokens |
| Không có test | Unit test + visual regression |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Prop types rõ ràng, có default | Props không type |
| Theming qua CSS variables | Hardcode trong component |
| ARIA attributes đầy đủ | Bỏ qua accessibility |
| Barrel export cho dễ import | Import từng file lẻ |

---

## 📚 Tài liệu

- 📖 [Component-Driven Development](https://componentdriven.org/)
- 📖 [React Aria — Accessible Components](https://react-spectrum.adobe.com/react-aria/)

---

## ⏭️ Bài tiếp theo → [16.3 Storybook](../16.3-storybook/README.md)
