# 🔄 5.4.4 CSRF Protection (Phòng Chống Cross-Site Request Forgery)

> **CSRF** là tấn công khiến victim thực hiện hành động không mong muốn khi đang đăng nhập site khác.

---

## 🎯 Vấn đề

```
❌ CSRF Attack Flow
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Victim  │      │Attacker  │      │  Bank    │
│          │      │  Site    │      │          │
│ 1. Login │      │          │      │          │
│    tại   │      │          │      │          │
│ bank.com │      │          │      │          │
│          │      │          │      │          │
│ 2. Truy  │      │          │      │          │
│    cập   │─────▶│ 3. Trang │─────▶│ 5. Form  │
│    trang │      │    chứa  │      │    tự động│
│  độc     │      │    <form> │      │    submit│
│          │      │          │      │          │
│          │      │          │◀─────│ 6. Tiền  │
│          │      │          │      │    chuyển!│
└──────────┘      └──────────┘      └──────────┘
      ▲
      └── Cookie auth gửi kèm request ❌
```

---

## 🧩 Nguyên nhân

```
CĐ CSRF:
1. Browser TỰ ĐỘNG gửi cookie với mỗi request
2. Server KHÔNG kiểm tra nguồn gốc request
3. Action nhạy cảm (transfer, delete) không có xác thực thêm
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import csurf from 'csurf';
import cookieParser from 'cookie-parser';

const csrfProtection = csurf({ cookie: true });

// ===== SERVER: Tạo CSRF token =====
app.get('/transfer', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ===== SERVER: Kiểm tra CSRF token =====
app.post('/transfer', csrfProtection, (req, res) => {
  const { to, amount } = req.body;
  // req.csrfToken() đã được xác nhận tự động
  await transferMoney(req.user.id, to, amount);
  res.json({ success: true });
});

// ===== CLIENT: Gửi CSRF token cùng request =====
async function transfer(to: string, amount: number) {
  // Lấy CSRF token trước
  const { csrfToken } = await fetch('/transfer').then(r => r.json());

  await fetch('/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken  // 🔑 Gửi token
    },
    body: JSON.stringify({ to, amount })
  });
}
```

**SameSite Cookie (hiện đại):**
```typescript
// ❌ CŨ: SameSite mặc định = lax
res.cookie('session', sessionId);

// ✅ MỚI: SameSite strict/lax
res.cookie('session', sessionId, {
  sameSite: 'strict',  // Không gửi cookie qua cross-site
  httpOnly: true,      // Không cho JS đọc
  secure: true         // Chỉ gửi qua HTTPS
});
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🛡️ Bảo vệ state-changing actions | Prevent unauthorized transfers/deletes |
| 🌐 Standard | CSRF token là RFC chuẩn |
| 💡 Easy integration | Middleware có sẵn (csurf, angular-jwt) |
| 🔒 Multiple layers | Token + SameSite + Origin check |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách xử lý |
|------------|------------|
| 🔴 Quản lý token phức tạp | Dùng middleware tự động |
| 🟡 SPA khó implement | CSRF token trong meta tag + header |
| 🟡 API mobile apps | Cookie không gửi tự động → dùng Bearer token |

---

## 🎯 Khi nào dùng CSRF protection?

| Scenario | Technique |
|----------|-----------|
| Form submission POST/PUT/DELETE | ✅ CSRF token |
| REST API (no cookie) | ✅ Bearer token + Origin check |
| Mobile app | ✅ Custom header auth |
| SPA với cookie auth | ✅ CSRF token + SameSite cookie |

---

## 🔗 Liên quan

- **5.4.1 JWT** — JWT trong header ≠ CSRF protected
- **5.4.3 XSS Prevention** — XSS có thể steal CSRF token
- **5.10 API Design** — POST/PUT/DELETE cần CSRF protection

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP CSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- 📖 [csurf NPM Package](https://www.npmjs.com/package/csurf)
- 📖 [SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.4.4-csrf-protection
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.4.5 OWASP Top 10](../5.4.5-owasp-top-10/README.md)
