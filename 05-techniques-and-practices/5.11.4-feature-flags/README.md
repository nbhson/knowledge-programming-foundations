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

## ❌ BAD — thêm 1 case: flag ma — rollout 100% từ 6 tháng trước mà code vẫn rẽ nhánh

```typescript
// ❌ BAD — flag đã hoàn thành sứ mệnh nhưng code chết vẫn nằm đó
function checkout(user: User): Cart {
  if (flags.isEnabled("new-checkout", user.id)) { // rollout 100% từ tháng 3, ai cũng true
    return newCheckout(user);
  }
  return oldCheckout(user); // 💥 code chết: không bao giờ chạy, nhưng vẫn phải maintain + test
}

// ✅ GOOD — dọn flag khi rollout ổn định: xóa nhánh cũ + xóa flag
function checkout(user: User): Cart {
  return newCheckout(user); // 1 đường duy nhất, flag "new-checkout" đã nghỉ hưu
}
```

> Mỗi flag phải có **ngày khai tử** (khi rollout 100% + ổn định N ngày). Flag không deadline = nợ kỹ thuật có lãi kép: mỗi flag cũ nhân đôi số đường đi cần test.

---

## ⚖️ Trade-off: flag vs branch dài vs config deploy

| Lựa chọn | Khi nào hơn flag | Khi nào thua |
|----------|-----------------|--------------|
| **Branch dài (GitFlow)** | Release theo version, không có infra flag | Merge đau, tính năng dở nằm xa trunk (xem 15.8) |
| **Config/deploy lại** | Đổi ít, chịu được downtime deploy | Rollback chậm (phút/giờ); flag tắt trong giây |
| **Flag + canary dần** | Release liên tục, cần kill switch | Thêm code rẽ nhánh + nợ dọn flag |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Flag sống vĩnh viễn | Ma trận `if flagA && !flagB` — không ai dám xóa | Quy ước: flag có owner + expiry; job quét flag quá hạn |
| Đánh giá flag không ổn định (random mỗi lần gọi) | Cùng user lúc thấy mới lúc thấy cũ trong 1 session | Hash ổn định theo userId (bucket), không `Math.random()` |
| Flag phụ thuộc lẫn nhau | Bật A phải nhớ bật B — quên là vỡ | Flag độc lập; phụ thuộc thật thì gộp thành 1 flag |
| Kill switch không ai biết/không test | Lúc cháy không dám bấm (sợ bấm sai còn tệ hơn) | Drill định kỳ: tài liệu + diễn tập tắt/bật ở staging |

---

## ✅ Checklist khi review

- [ ] Flag mới có owner + ngày expiry (khi nào dọn)?
- [ ] Đánh giá flag ổn định theo user (không random mỗi gọi)?
- [ ] Có kill switch + tài liệu ai được bấm, bấm ở đâu?
- [ ] Flag cũ rollout 100% đã được dọn (xóa nhánh chết)?
- [ ] Test cover cả 2 trạng thái ON/OFF của flag?

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