# 🚩 5.11.4 Feature Flags (Cờ Tính Năng)

> **Feature flag** bật/tắt tính năng **không cần redeploy** — kiểm soát rủi ro bằng **canary**, **targeted release** và **kill switch** ngay trên production.

---

## 🎯 Các kiểu triển khai

| Chiến lược | Mô tả |
|------------|-------|
| **Toggle matrix** | Trạng thái flag theo env (`dev/staging/prod`) |
| **Canary** | Bật cho X% user, tăng dần 10% → 100% |
| **Targeted release** | Chỉ user trong allowlist (internal/beta) |
| **Kill switch** | Tắt tức thì tính năng lỗi |

```
isEnabled(flag, userId, env):
  rollout % = 0   → OFF hết (trừ allowlist)
  rollout % = 100 → ON hết
  0 < % < 100     → hash(userId) < pct ? ON : OFF
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class FeatureFlagService {
  private bucketOf(userId: string): number {
    // deterministic hash → 0..99, không cần Math.random
    let hash = 0;
    for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) % 100;
    return hash;
  }

  isEnabled(flagName: string, userId: string, env: FlagEnv): boolean {
    const pct = this.find(flagName).rollout[env];
    if (pct >= 100) return true;
    if (pct <= 0) return this.allowlistOf(flagName).includes(userId);
    return this.bucketOf(userId) < pct || this.allowlistOf(flagName).includes(userId);
  }
}
```

---

## ✅ Best practices

| Thực hành | Lý do |
|-----------|-------|
| 🧠 **Rollout dần** | Tăng % sau khi theo dõi error/health |
| 🔴 **Kill switch sẵn sàng** | Tắt gấp khi tính năng lỗi |
| 🗑️ **Xóa khi ổn định** | Flag sống lâu tạo nợ kỹ thuật |
| 🎯 **Targeted trước** | Internal → beta → 10% → 100% |

**Use cases:** gradual rollout, A/B testing, kill switch, release cho nhóm nội bộ.

---

## 🔗 Liên quan

- **5.11 Deployment Strategies** — Canary/blue-green phối hợp flag
- **5.4 Security Techniques** — Bật/tắt tính năng an toàn khi nhạy cảm

---

## 📚 Tài liệu tham khảo

- 📖 [LaunchDarkly Feature Flags](https://launchdarkly.com/)
- 📖 [Martin Fowler — FeatureToggle](https://martinfowler.com/articles/feature-toggles.html)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.11.4-feature-flags
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12 Functional Concepts](../5.12-functional-concepts/README.md)