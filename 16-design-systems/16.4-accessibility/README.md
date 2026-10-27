# ♿ 16.4 Accessibility (Tiếp Cận)

> **Accessibility (a11y)** đảm bảo mọi người — kể cả người khuyết tật (kinh thị, khiếm thính, vận động, nhận thức) — đều có thể sử dụng sản phẩm số của bạn. A11y không phải "feature extra" — đó là **basic requirement** của product quality.

---

## 🎯 WCAG Guidelines (Web Content Accessibility Guidelines)

WCAG là standard quốc tế (W3C) định nghĩa 4 nguyên tắc cốt lõi:

```
┌─────────────────────────────────────────────────────────────┐
│                 WCAG 4 PRINCIPLES                           │
│                                                             │
│  P — Perceptible (Có thể cảm nhận được)                         │
│  │  → Có alt text cho ảnh, captions cho video               │
│  │  → Color không phải cách duy nhất truyền info            │
│  │  → Content có thể trình bày lại theo cách khác           │
│  ├───────────────────────────────────────────────────────  │
│  O — Operable (Có thể vận hành)                            │
│  │  → Keyboard accessible (tab, enter, escape)              │
│  │  → Đủ thời gian đọc (không auto-play quá nhanh)         │
│  │  → Không có content seizure-inducing (flash > 3/sec)   │
│  ├───────────────────────────────────────────────────────  │
│  U — Understandable (Có thể hiểu)                          │
│  │  → Text readable và predictable                        │
│  │  → Navigation consistent across pages                   │
│  │  → Input help clearly identified                       │
│  ├───────────────────────────────────────────────────────  │
│  R — Robust (Bền vững)                                     │
│     → Compatible với assistive technology (screen readers) │
│     → Valid HTML, proper ARIA usage                        │
│     → Future-proof với browser upgrades                    │
└─────────────────────────────────────────────────────────────┘
```

**WCAG Levels:**
| Level | Mục tiêu | Legal implication |
|-------|----------|-------------------|
| **A** | Minimum accessibility | Bắt buộc tối thiểu |
| **AA** | Standard compliance | Tiêu chuẩn pháp lý (ADA, Section 508) |
| **AAA** | Enhanced accessibility | Target cao nhất, không phải lúc nào cũng achievable |

> 💡 **Thực tế industry:** Target **AA compliance** là standard cho enterprise products. AAA thường không achievable cho toàn bộ product.

---

## 🏷️ ARIA Attributes — Sử dụng đúng cách

ARIA (Accessible Rich Internet Applications) bổ sung semantic cho HTML khi native element không đủ.

```tsx
// ✅ Proper ARIA usage — label cho search input
function SearchInput() {
  return (
    <div className="search">
      {/* Visible label — best for forms */}
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <input
        id="search-input"
        type="search"
        aria-label="Search products"        /* fallback cho screen reader */
        aria-describedby="search-help"     /* link to helper text */
        placeholder="Enter product name"
      />
      <span id="search-help">Nhập tên sản phẩm để tìm</span>
    </div>
  );
}

// ✅ Live region cho dynamic content — screen reader announces changes
function Notification({ message }: { message: string }) {
  return (
    <div
      role="alert"                      /* polite = announce when idle */
      aria-live="polite"                /* assertive = interrupt current speech */
      className="notification"
    >
      {message}
    </div>
  );
}

// ❌ overuse aria-hidden (ẩn thật sự với screen reader)
// ✅ Chỉ dùng khi đúng nghĩa — icon trang trí
<img src="decoration.svg" aria-hidden="true" alt="" />

// ❌ Sai: aria-hidden trên interactive element
<div aria-hidden="true">  {/* user can't tab to this — broken! */}
  <button>Click me</button>
</div>

// ✅ Đúng: label visible hoặc aria-label
<button aria-label="Close dialog">✕</button>
```

**ARIA rules summary:**
1. **First rule of ARIA:** Don't use ARIA if native HTML element does the job
2. **No empty ARIA:** `aria-label=""` hoặc `role=""` vô nghĩa
3. **All ARIA IDs must be unique:** `aria-describedby="id1"` → id1 phải unique trong DOM
4. **ARIA status là dynamic:** `aria-live` regions phải update khi state change

---

## ⌨️ Keyboard Navigation

Keyboard là input method quan trọng thứ 2 sau mouse — ~15% users rely on keyboard exclusively.

```tsx
// ✅ Focus trap trong modal — Tab không thoát modal
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;

    // Get all focusable elements
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        // Shift+Tab on first element → wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab on last element → wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', handler);
    first?.focus();   // Move focus into modal on open
    return () => el?.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Escape key closes modal
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
      tabIndex={-1}          /* focusable programmatically */
      className="modal-overlay"
    >
      <div className="modal-content">
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

**Focus management checklist:**
- [ ] Focus visible trên interactive elements (`:focus-visible` style)
- [ ] Modal trap focus inside (không cho Tab thoát)
- [ ] Return focus to trigger element khi close modal
- [ ] Skip links cho main content (`<a href="#main" className="skip-link">`)
- [ ] Logical tab order (DOM order ≠ visual order khi dùng flex/grid)

---

## 🎨 Color Contrast

Contrast ratio đảm bảo text readable cho người low-vision. Đo bằng tỷ lệ luminance giữa foreground và background.

```
┌──────────────────────────────────────────────────────────┐
│              MINIMUM CONTRAST RATIOS (WCAG 2.2)          │
│                                                          │
│  AA Normal text (< 18px hoặc < 14px bold)  → 4.5:1     │
│  AA Large text (≥ 18px Regular, ≥ 14px Bold) → 3:1      │
│  AAA Normal text                           → 7:1        │
│  AAA Large text                            → 4.5:1      │
└──────────────────────────────────────────────────────────┘
```

```css
/* ✅ Good contrast ratios */
.text-primary   { color: #1F2937; background: #FFFFFF; }  /* 14.5:1 — AAA */
.text-secondary { color: #4B5563; background: #FFFFFF; }  /*  7.5:1 — AAA */
.link-primary   { color: #2563EB; background: #FFFFFF; }  /*  4.6:1 — AA  */

/* ❌ Bad contrast — FAIL AA */
.text-muted     { color: #9CA3AF; background: #FFFFFF; }  /*  2.5:1 — FAIL */
.light-gray     { color: #E5E7EB; background: #FFFFFF; }  /*  1.5:1 — FAIL */
```

**Công cụ check contrast:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrast-checker/)
- Chrome DevTools → Accessibility → Contrast
- VS Code plugin: "Accessibility Color Highlighter"

```tsx
// React hook: contrast checker (for runtime validation)
function useContrast(fg: string, bg: string): { ratio: number; passesAA: boolean } {
  const fgRGB = hexToRGB(fg);
  const bgRGB = hexToRGB(bg);
  const ratio = calculateContrastRatio(fgRGB, bgRGB);
  return {
    ratio,
    passesAA: ratio >= 4.5,
  };
}
```

---

## 📋 A11y Testing Checklist

### Automated (cure phần lớn)
```bash
# axe-core — lint A11y violations
npm install @axe-core/react --save-dev

# Trong test hoặc dev mode
import axe from 'axe-core';

describe('Accessibility', () => {
  it('should not have accessibility violations', () => {
    render(<MyComponent />);
    const results = axe.run(document.body);
    expect(results.violations).toEqual([]);
  });
});
```

### Manual (bắt buộc)
- [ ] **Keyboard test:** Tab qua hết interactive elements — focus visible? Logical order?
- [ ] **Screen reader test:** Dùng NVDA (Windows) hoặc VoiceOver (macOS) — content readable?
- [ ] **Zoom test:** Zoom 200% — content still usable? No horizontal scroll?
- [ ] **Color test:** Toggle màu (grayscale) — info vẫn truyền đạt?
- [ ] **Reduced motion test:** `prefers-reduced-motion` — animation disabled?

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Semantic HTML (button, nav, main, article) | Dùng div cho mọi thứ (loss of semantics) |
| ARIA khi cần thiết (bổ sung native HTML limitations) | Bỏ qua hoặc lạm dụng aria (redundant/misleading) |
| Keyboard navigation test | Chỉ test mouse |
| Contrast ratio ≥ 4.5:1 (AA) | Màu nhạt không đọc được |
| Focus visible style (`:focus-visible`) | Default browser outline bị CSS override |
| Alt text descriptive (không "image of...") | Empty alt cho informative images |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "A11y chỉ cần cho người khuyết tật" | A11y giúp everyone: mobile user, slow connection, aging population |
| "Accessibilitytesting = automated scan" | Automation chỉ detect ~30% issues; manual keyboard + screen reader test bắt buộc |
| "ARIA là giải pháp cho mọi vấn đề" | Native HTML semantic luôn prefer hơn ARIA |
| "A11y làm chậm development" | Early a11y = cheaper; retrofit a11y = expensive rewrite |

---

## 📚 Tài liệu

- 📖 [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- 📖 [MDN — Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- 📖 [axe Accessibility Testing](https://www.deque.com/axe/)
- 📖 [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- 📖 [Accessibe Accessibility Guide](https://accessibe.com/blog/post/aria-accessible-rich-internet-applications)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.4-accessibility
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [16.5 Design Tokens](../16.5-design-tokens/README.md)
