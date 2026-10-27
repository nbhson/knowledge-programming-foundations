# 🌳 15.8 Trunk-Based Development (Phát Triển Trên Trunk)

> **Trunk-Based** gom mọi developer về **1 nhánh chính (trunk/main)** — commit trực tiếp hoặc qua branch **sống < 24h**. Tính năng dở dang được che bằng **feature flag**, CI/CD chạy mỗi commit. Ngược lại với GitFlow nhiều nhánh sống hàng tuần.

---

## 🎯 So với GitFlow

```
GitFlow (nhiều nhánh, sống lâu):
main     ──●──────────────────●──────────── (production)
             \                /
develop  ────●──●──●──●──●──● ──────────── (integration)
                \     /
feature  ───────●──●── ────────────────── (sống DAYS–WEEKS ⚠️)

Trunk-Based (1 trunk, branch phù du):
main/trunk  ──●──●──●──●──●──●── (luôn releasable, commit trực tiếp)
                     \  /
short-lived  ────────●── ──────── (< 24h, merge ngay)
```

| Tiêu chí | GitFlow | Trunk-Based |
|----------|---------|-------------|
| Số nhánh sống | Nhiều (`main/develop/feature/release/hotfix`) | 1 trunk (+ branch < 24h) |
| Merge conflict | Lớn, dồn cuối kỳ | Nhỏ, liên tục |
| Release | Batch theo version | Continuous, mỗi commit có thể release |
| Tính năng dở | Nằm trên branch chưa merge | Nằm trên trunk nhưng **tắt bằng flag** |
| Yêu cầu | Release manager, quy trình nặng | CI/CD mature, test coverage cao, feature flags |
| Phù hợp | Release theo version (v1.0, v2.0) | Team 10+, deploy nhiều lần/ngày |

---

## 🚩 Feature Flags — Mảnh ghép bắt buộc

Vì code dở vẫn nằm trên trunk, flag là "công tắc" che nó khỏi user:

```typescript
// Tính năng mới merge vào trunk NHƯNG tắt mặc định
if (flags.isEnabled("new-checkout", user.id)) {
  renderNewCheckout();   // chỉ beta user thấy
} else {
  renderOldCheckout();   // còn lại thấy bản cũ ổn định
}
```

| Chiến lược | Dùng khi |
|------------|----------|
| **Canary %** | Mở 10% → theo dõi lỗi → 50% → 100% |
| **Allowlist** | Chỉ internal/beta user thấy trước |
| **Kill switch** | Lỗi production → tắt flag trong giây, không cần revert deploy |

> 📌 Chi tiết cài đặt flag xem **5.11.4 Feature Flags**.

---

## 💻 Mô phỏng: trunk vs feature branch dài

[`examples/index.ts`](examples/index.ts) mô phỏng 2 team cùng làm 5 ngày:

```typescript
class TrunkSim {
  // Quy tắc trunk: branch sống quá 24h (= 1 "ngày" mô phỏng) là VI PHẠM
  openBranch(name: string, day: number): void { /* ghi nhận ngày mở */ }
  mergeBranch(name: string, day: number): { ok: boolean; livedDays: number } {
    const lived = day - openedDay;
    return { ok: lived <= 1, livedDays: lived }; // > 1 ngày → conflict risk cao
  }
  commitDirect(day: number, flagGated: boolean): void { /* commit thẳng trunk */ }
}
```

**Kịch bản demo:**

| Team | Cách làm | Kết quả mô phỏng |
|------|----------|------------------|
| **Trunk** | 5 commit nhỏ/ngày vào trunk, tính năng dở che bằng flag | 5/5 merge êm, trunk luôn xanh, release bất kỳ lúc nào |
| **GitFlow dài** | 1 branch sống 5 ngày mới merge | Merge ngày 5 → **conflict** (trunk đã đi xa), phải resolve tay, release nghẽn |

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚡ **Merge nhỏ, liên tục** | Conflict bé, resolve trong phút thay vì ngày |
| 🚀 **Release bất kỳ lúc nào** | Trunk luôn xanh → deploy mỗi commit |
| 👥 **Ít silo** | Không ai "ôm" branch cả tuần, code review sớm |
| 🧹 **Ít branch rác** | Không còn 50 branch `feature/*` quên xóa |

## ⚠️ Nhược điểm & điều kiện

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🧪 **Đòi test tự động mạnh** | Trunk hỏng là cả team nghẽn → CI chạy mỗi commit, coverage gate |
| 🚩 **Flag thành nợ** | Flag quên xóa chất đống → quy ước xóa flag khi rollout 100% |
| 👶 **Khó với team mới** | Cần kỷ luật commit nhỏ + review nhanh (< 4h) |
| 🔀 **Không hợp release version** | Sản phẩm đóng gói theo bản (mobile app review) hợp GitFlow hơn |

---

## 🔗 Liên quan

- **5.11.4 Feature Flags** — Cài đặt flag che tính năng dở trên trunk
- **15.2 Git Branching** — So sánh các branching strategy
- **15.7 Conventional Commits** — Release tự động từ trunk mỗi commit
- **8 DevOps CI/CD** — Pipeline chạy mỗi commit lên trunk

---

## 📚 Tài liệu tham khảo

- 📖 [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/)
- 📖 [Martin Fowler — FeatureBranch](https://martinfowler.com/bliki/FeatureBranch.html)
- 📖 [Google SRE — Release Engineering](https://sre.google/workbook/release-engineering/)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.8-trunk-based
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.9 Monorepo](../15.9-monorepo/README.md)
