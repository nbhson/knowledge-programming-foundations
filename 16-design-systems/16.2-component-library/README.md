# 🧩 16.2 Component Library (Thư Viện Component)

> **Component library** là tập hợp các component tái sử dụng được, đóng gói logic UI thành đơn vị độc lập, có prop types rõ ràng và theming support. Không phải "tập hợp UI elements" — mà là **contract** giữa design và development.

---

## 🎯 Component Library Architecture — Atomic Design

Theo Brad Frost's Atomic Design, components được tổ chức theo 5 cấp độ:

```
┌─────────────────────────────────────────────────────────┐
│                  COMPONENT LIBRARY                      │
│                                                         │
│  ⑤ Pages (templates)                                   │
│  ├─ DashboardPage, SettingsPage, LandingPage           │
│  │  → ghép các compound components lại                  │
│  ├────────────────────────────────────────────────────  │
│  ④ Compound Components                                 │
│  ├─ Form (Input + Label + Error)                       │
│  ├─ Card (Header + Body + Footer)                      │
│  ├─ Modal (Overlay + Dialog + Actions)                 │
│  └─ Table (Header + Row + Cell + Pagination)          │
│  ├────────────────────────────────────────────────────  │
│  ③ Components (basic UI)                               │
│  ├─ Button, Input, Select, Checkbox, Radio             │
│  ├─ Link, Icon, Badge, Tooltip                         │
│  └─ Avatar, Chip, Skeleton                             │
│  ├────────────────────────────────────────────────────  │
│  ② Atoms (building blocks)                             │
│  ├─ Color, Typography, Spacing (tokens)                │
│  └─ Base HTML elements styled with tokens              │
│  └────────────────────────────────────────────────────  │
│  ① Foundations (tokens only)                           │
│  ├─ Design Tokens (color, spacing, type)               │
│  └─ CSS reset / normalize                             │
└─────────────────────────────────────────────────────────┘
```

> 💡 **Mấu chốt:** Components ở cấp cao hơn **composed** từ cấp thấp hơn, không **copied**. Button dùng token từ foundation, Card dùng Button + spacing tokens.

---

## 💻 Prop Types & API Design

API design là phần quan trọng nhất — prop interface quyết định component dễ dùng hay không.

```typescript
// ✅ Button with clear, minimal prop types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';  // limited union, not string
  size?: 'sm' | 'md' | 'lg';                    // consistent scale
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;                          // required
  onClick?: (e: MouseEvent) => void;
  className?: string;                           // override nếu cần
}

function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  children,
  onClick,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ❌ Quá nhiều props không group — khó nhớ, khó maintain
interface BadInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  name?: string;
  value?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

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
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
}
```

**Nguyên tắc API design:**
- **Default props** nên hợp lý — user không cần specify nếu muốn mặc định
- **Limited union types** thay vì arbitrary strings (`'primary' | 'secondary'` thay vì `string`)
- **Composition over configuration** — `<Card><CardHeader>...</CardHeader></Card>` thay vì `<Card header="..." body="...">`
- **Forward refs và HTML attributes** — `...rest` cho intrinsic element props

---

## 🎨 Theming Support

Theming cho phép component tự động adapt theo context (light/dark mode, brand variant).

```css
/* Theme tokens — base light mode */
:root {
  --color-primary: #3B82F6;
  --color-surface: #FFFFFF;
  --color-text: #1F2937;
  --color-border: #E5E7EB;
}

/* Dark mode override */
[data-theme="dark"] {
  --color-primary: #60A5FA;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-border: #374151;
}

/* Component uses tokens — tự động adapt */
.btn--primary {
  background: var(--color-primary);
  color: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

```tsx
// ThemeProvider — React context untuk switching themes
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

function ThemeProvider({ children, theme = 'light' }: {
  children: ReactNode;
  theme?: 'light' | 'dark';
}) {
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      theme: currentTheme,
      setTheme: setCurrentTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Multi-theme pattern:** Foundation tokens định nghĩa base values; theme tokens override chúng. Component chỉ đọc từ token, không biết theme tồn tại.

---

## ♿ Accessibility (A11y) trong Component

Component library phải accessible by default — không để consumer phải tự thêm ARIA.

```tsx
// ✅ Button với ARIA đầy đủ
function Button({ icon, children, ...props }: ButtonProps) {
  return (
    <button {...props}>
      {icon && (
        <span className="btn-icon" aria-hidden="true">{icon}</span>
      )}
      {/* Nếu chỉ có icon (không có text), cần aria-label */}
      {!children && icon && <span className="sr-only">{props['aria-label']}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

// ✅ Modal với focus trap và keyboard handling
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap — giữ Tab key inside modal
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    first?.focus();
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={containerRef}
      tabIndex={-1}
      className="modal-overlay"
    >
      <div className="modal-content">
        <h2 id="modal-title" className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
```

**ARIA checklist cho component library:**
- [ ] Mỗi interactive element có `role` appropriate
- [ ] Form inputs có `label` (visible hoặc `aria-label`)
- [ ] Dynamic content có `aria-live` region
- [ ] Icons trang trí có `aria-hidden="true"`
- [ ] State changes thông báo qua aria thuộc tính
- [ ] Focus management cho modal/dropdown

---

## 📦 Package Structure — Monorepo pattern

```
my-component-lib/
├─ src/
│  ├─ components/
│  │  ├─ Button/
│  │  │  ├─ Button.tsx           # implementation
│  │  │  ├─ Button.test.tsx      # unit tests
│  │  │  ├─ Button.stories.tsx   # Storybook stories
│  │  │  ├─ Button.types.ts      # prop interfaces
│  │  │  └─ index.ts             # barrel export
│  │  ├─ Input/
│  │  │  ├─ Input.tsx
│  │  │  └─ index.ts
│  │  └─ ...
│  ├─ tokens/
│  │  ├─ color.ts
│  │  ├─ spacing.ts
│  │  └─ index.ts
│  ├─ hooks/
│  │  ├─ useTheme.ts
│  │  └─ index.ts
│  ├─ utils/
│  │  └─ cn.ts                  # className merger utility
│  └─ index.ts                   # barrel export all
├─ package.json
├─ tsconfig.json
├─ tsconfig.lib.json            # lib-specific config (no React types)
└─ README.md
```

```json
// package.json
{
  "name": "@my/ui-kit",
  "version": "1.0.0",
  "description": "Internal component library",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./Button": "./dist/components/Button/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.lib.json",
    "test": "vitest",
    "storybook": "storybook dev -p 6006",
    "lint": "eslint src/**/*.{ts,tsx}"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

> 💡 **Exports pattern:** Dùng conditional exports (`.`, `./Button`) cho tree-shaking — consumer chỉ import cái họ cần.

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Giải thích |
|----------|-------------|-----------|
| Component làm quá nhiều việc | Mỗi component 1 job | God component = khó test, khó reuse |
| Prop drilling sâu (> 3 levels) | Dùng context hoặc composition | Deep prop drilling = fragile |
| Hardcode theme values trong component | Dùng CSS variables/tokens | Breaks theming |
| Không có test | Unit test + visual regression (Storybook) | Regression không detect được |
| Export mọi thứ từ barrel | Chỉ export public API | Internal helpers nên private |
| Implicit behavior | Explicit props + events | "Magic" behavior = khó debug |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Component library = copy-paste UI code" | Library có contract (types, tests, docs) — copy-paste không có |
| "Càng nhiều component càng tốt" | Component count cao = maintenance cost cao. Chỉ tạo khi thực sự reused |
| "Theme = dark mode toggle" | Theme là abstraction layer; dark mode là 1 theme instance |
| "Accessibility = thêm aria-label" | A11y là holistic: keyboard nav, contrast, focus management, screen reader testing |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Prop types rõ ràng, có default values | Props không type, arbitrary strings |
| Theming qua CSS variables/tokens | Hardcode trong component |
| ARIA attributes đầy đủ, focus management | Bỏ qua accessibility |
| Barrel export + conditional exports | Import từng file lẻ, không tree-shakeable |
| Tests cho mỗi component (unit + visual) | Không test = không confidence |

---

## 📚 Tài liệu

- 📖 [Component-Driven Development — Storybook](https://componentdriven.org/)
- 📖 [React Aria — Accessible Components](https://react-spectrum.adobe.com/react-aria/)
- 📖 [Atomic Design — Brad Frost](http://atomicdesign.bradfrost.com/)
- 📖 [Design Systems FAQ — Oru Gungor](https://designsystemsbook.com/)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.2-component-library
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [16.3 Storybook](../16.3-storybook/README.md)
