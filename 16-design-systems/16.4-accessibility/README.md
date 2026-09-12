# ♿ 16.4 Accessibility (Tiếp Cận)

> **Accessibility (a11y)** đảm bảo mọi người — kể cả người khuyết tật — đều có thể sử dụng sản phẩm số của bạn.

---

## 🎯 WCAG Guidelines (Web Content Accessibility Guidelines)

```
┌─────────────────────────────────────────────────────────────┐
│                 WCAG 4 PRINCIPLES                           │
│                                                             │
│  P — Perceptible (Có thể感知 được)                         │
│  │  → Có alt text cho ảnh, captions cho video              │
│                                                             │
│  O — Operable (Có thể vận hành)                            │
│  │  → Keyboard accessible, đủ thời gian đọc                 │
│                                                             │
│  U — Understandable (Có thể hiểu)                          │
│  │  → Navigation consistent, input help rõ ràng             │
│                                                             │
│  R — Robust (Bền vững)                                     │
│     → Compatible với assistive technology                   │
└─────────────────────────────────────────────────────────────┘
```

### ARIA Attributes

```tsx
// ✅ Proper ARIA usage
function SearchInput() {
  return (
    <div className="search">
      <label htmlFor="search-input" className="sr-only">
        Search
      </label>
      <input
        id="search-input"
        type="search"
        aria-label="Search products"
        aria-describedby="search-help"
      />
      <span id="search-help">Nhập tên sản phẩm để tìm</span>
    </div>
  );
}

// ✅ Live region cho dynamic content
function Notification({ message }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="notification"
    >
      {message}
    </div>
  );
}

// ❌ overuse aria-hidden (ẩn thật sự)
// ✅ Chỉ dùng khi đúng nghĩa — icon trang trí
<img src="decoration.svg" aria-hidden="true" />
```

---

## ⌨️ Keyboard Navigation

```tsx
// ✅ Focus trap trong modal
function Modal({ isOpen, onClose }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    const focusable = el?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0] as HTMLElement;
    const last = focusable?.[focusable.length - 1] as HTMLElement;

    const handler = (e: KeyboardEvent) => {
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

    el?.addEventListener('keydown', handler);
    first?.focus();
    return () => el?.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen) return null;
  return <div ref={containerRef} role="dialog" aria-modal="true">{children}</div>;
}
```

---

## 🎨 Color Contrast

```
┌──────────────────────────────────────────────────────────┐
│              MINIMUM CONTRAST RATIOS                     │
│                                                          │
│  AA Normal text (< 18px)     → 4.5:1                    │
│  AA Large text (≥ 18px)      → 3:1                      │
│  AAA Normal text             → 7:1                      │
│  AAA Large text              → 4.5:1                    │
└──────────────────────────────────────────────────────────┘
```

```css
/* ✅ Good contrast */
.text-primary   { color: #1F2937; background: #FFFFFF; }  /* 14.5:1 */
.text-secondary { color: #4B5563; background: #FFFFFF; }  /* 7.5:1  */

/* ❌ Bad contrast */
.text-muted     { color: #9CA3AF; background: #FFFFFF; }  /* 2.5:1 — FAIL */
```

```tsx
// React Color Contrast checker
function useContrast(fg: string, bg: string): boolean {
  const ratio = contrastRatio(fg, bg);
  return ratio >= 4.5;
}
```

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Semantic HTML (button, nav, main) | Dùng div cho mọi thứ |
| ARIA khi cần thiết | Bỏ qua hoặc滥用 aria |
| Keyboard navigation test | Chỉ test mouse |
| Contrast ratio ≥ 4.5:1 | Màu nhạt không đọc được |

---

## 📚 Tài liệu

- 📖 [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- 📖 [MDN — Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## ⏭️ Bài tiếp theo → [16.5 Design Tokens](../16.5-design-tokens/README.md)
