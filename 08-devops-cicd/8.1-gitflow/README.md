# 🌿 8.1 Git Flow (Luồng Phát Triển nhánh)

> **Git Flow** là một **branching model** (mô hình phân nhánh) được tạo ra bởi Vincent Driessen,
> giúp quản lý release phức tạp với nhiều nhánh song song — phù hợp cho dự án có versioning rõ ràng.

---

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Các nhánh chính](#các-nhánh-chính)
- [Branch strategy diagram](#branch-strategy-diagram)
- [Hoạt động chi tiết](#hoạt-động-chi-tiết)
- [Git Flow vs GitHub Flow vs Trunk-Based](#git-flow-vs-github-flow-vs-trunk-based)
- [Ví dụ CLI thực tế](#ví-dụ-cli-thực-tế)
- [Best Practices](#best-practices)
- [Khi nào KHÔNG dùng Git Flow](#khi-nào-không-dùng-git-flow)

---

## Tổng quan

### Git Flow là gì?

Git Flow định nghĩa **5 nhánh cố định** + **3 loại nhánh hỗ trợ**, mỗi nhánh có vai trò riêng. Được thiết kế cho mô hình release có phiên bản (semantic versioning: v1.0.0, v1.1.0...).

**Lịch sử & bối cảnh:** Vincent Driessen tạo Git Flow năm 2010, thời điểm các công ty phần mềm truyền thống (Adobe, Oracle) cần quản lý nhiều release song song. Trước đó, developer thường push thẳng lên `master` — rủi ro cao khi có nhiều người cùng commit.

```
┌──────────────────────────────────────────────────────────────────┐
│                        GIT FLOW MODEL                            │
│                                                                  │
│   main ──────────────────────────────── production               │
│   │   (tagged releases: v1.0.0, v1.1.0)                         │
│   │                                                             │
│   develop ──────────────────────────── integration layer        │
│   │   (chứa tất cả feature đã merge, sẵn sàng release tiếp)     │
│   │                                                             │
│   feature/* ──────────────────▶ phát triển tính năng            │
│   │   (nhánh tạm, branch từ develop, merge lại develop)         │
│   │                                                             │
│   release/* ──────────────────▶ chuẩn bị release                │
│   │   (nhánh tạm, branch từ develop, polish → merge main)       │
│   │                                                             │
│   hotfix/* ──────────────────▶ sửa lỗi khẩn cấp production      │
│       (nhánh tạm, branch từ MAIN — không phải develop!)         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Tư duy cốt lõi của Git Flow:** sản xuất phần mềm là **dòng chảy liên tục** nhưng release là **sự kiện rời rạc**. Bạn luôn phát triển tính năng mới (develop branch), nhưng chỉ publish khi ổn định (main branch).

### Tại sao cần branching model?

| Vấn đề nếu không có branching | Giải pháp của Git Flow |
|------------------------------|------------------------|
| 2 developer commit cùng file → conflict khóresolve | Mỗi người 1 feature branch, merge có kiểm tra |
| Bug phát hiện trong lúc đang develop tính năng mới | Hotfix branch từ main, không dính code develop |
| Release v1.0 chưa xong đã phải fix bug v0.9 | Release branch cách ly polish work |
| Ai commit file gì, khi nào? | History rõ ràng theo branch |

---

## Các nhánh chính

| Nhánh | Kiểu | Mục đích | Merge vào | Ai tạo? | Thời gian sống |
|-------|------|----------|-----------|---------|----------------|
| `main` | **Permanent** | Production-ready code, tagged releases | — | CI/CD auto | Vĩnh viễn |
| `develop` | **Permanent** | Integration branch cho features sắp release | — | Dev lead (khi khởi tạo repo) | Vĩnh viễn |
| `feature/*` | **Temporary** | Phát triển tính năng mới | `develop` | Developer | 1–14 ngày |
| `release/*` | **Temporary** | Chuẩn bị release version (polish, bugfix nhỏ) | `main` + `develop` | Dev lead | Vài giờ – vài ngày |
| `hotfix/*` | **Temporary** | Sửa lỗi nghiêm trọng trên production | `main` + `develop` | Bất kỳ ai | Vài phút – vài giờ |

```
┌──────────────┬──────────────────────────┬──────────────────┬─────────────┬──────────────┐
│    Nhánh     │       Vai trò            │    Vòng đời      │  Ai tạo?    │ Merge target │
├──────────────┼──────────────────────────┼──────────────────┼─────────────┼──────────────┤
│ main         │ Code production          │ Vĩnh viễn        │ CI/CD auto  │ —            │
│ develop      │ Integration latest       │ Vĩnh viễn        │ Dev lead    │ —            │
│ feature/*    │ Tính năng mới            │ Tạm (1-14 ngày)  │ Developer   │ develop      │
│ release/*    │ Sẵn sàng release         │ Tạm (vài giờ)    │ Dev lead    │ main+develop │
│ hotfix/*     │ Sửa lỗi production       │ Tạm (< 1 giờ)    │ Bất kỳ ai   │ main+develop │
└──────────────┴──────────────────────────┴──────────────────┴─────────────┴──────────────┘
```

> ⚠️ **Quan trọng:** Hotfix bắt đầu từ `main` (không phải `develop`) vì bug nằm trên production code, không phải development code. Sau đó merge hotfix vào cả `main` (để production nhận fix) VÀ `develop` (để development cũng có fix).

---

## Branch Strategy Diagram

```
                     ┌──────────┐
                     │  main    │  ← tags: v1.0.0, v1.1.0, v1.1.1
                     │ (prod)   │
                     └────┬─────┘
                          │ merge (release/hotfix) với tag version
                     ┌────▼─────┐
                     │develop   │  ← tích hợp tất cả feature đang active
                     └────┬─────┘
               ┌──────────┼──────────┐
          feature/a      │      feature/b
          (auth)         │      (payment)
               │          │          │
          feature/pay    │   feature/profile
               │          │          │
               └────┬─────┘          │
                    │ merge           │
               ┌────▼─────┐           │
               │ release/ │◄───────────┘
               │  1.1.0   │  final QA, polish
               └────┬─────┘
                    │
               ┌────▼────┐
               │  main   │  tagged v1.1.0 (production)
               │         │
               └────┬────┘
                    │ bug critical found in production!
               ┌────▼─────┐
               │ hotfix/  │  branch FROM main (NOT develop!)
               │  1.0.1   │
               └────┬─────┘
                    │ merge back
               ┌────▼────┐
               │  main   │  tagged v1.0.1 (hotfix release)
               └────┬────┘
                    │ merge to develop
               ┌────▼─────┐
               │ develop  │  ← includes hotfix + all features
               └──────────┘
```

**Luồng merge phải nhớ:**
- `feature/*` → `develop`
- `release/*` → `main` + `develop`
- `hotfix/*` → `main` + `develop`

---

## Hoạt động chi tiết

### 1. Khởi tạo repository với Git Flow

```bash
# Cài đặt git-flow (nếu chưa có)
brew install git-flow        # macOS
# hoặc
sudo apt install git-flow    # Ubuntu/Debian
# hoặc
conda install -c conda-forge git-flow  # conda

# Khởi tạo Git Flow
git flow init
# → Hỏi: main branch? [main] Enter
# → Hỏi: develop branch? [develop] Enter
# → Hỏi: feature prefix? [feature/] Enter
# → Hỏi: release prefix? [release/] Enter
# → Hỏi: hotfix prefix? [hotfix/] Enter
# → Hỏi: support prefix? Không dùng, bỏ qua (Enter)
# → Hỏi: version tag prefix? [v] Enter
```

Sau khi init, repo sẽ có sẵn 2 nhánh: `main` và `develop`. Bạn nên push cả 2 lên remote.

### 2. Phát triển Feature

```bash
# BẮT ĐẦU feature mới (tự động branch từ develop)
git flow feature start payment-gateway
# → Tạo nhánh: feature/payment-gateway dựa trên develop
# → Tự động checkout sang nhánh đó

# Làm việc... commit bình thường
git add .
git commit -m "feat: integrate Stripe payment gateway"
git commit -m "feat: add payment validation"

# KẾT THÚC feature (merge vào develop, xóa nhánh)
git flow feature finish payment-gateway
# → Merge feature/payment-gateway → develop (fast-forward hoặc merge commit)
# → Xóa nhánh feature/payment-gateway
# → Checkout về develop

# Hoặc bắt đầu từ một commit cụ thể (advanced)
git flow feature start auth-login abc1234
```

### 3. Chuẩn bị Release

```bash
# BẮT ĐẦU release (branch từ develop, đánh dấu chuẩn bị publish)
git flow release start 1.1.0
# → Tạo: release/1.1.0 dựa trên develop
# → Bạn có thể fix bug nhỏ, update docs, bump version ở đây

# KẾT THÚC release
git flow release finish '1.1.0'
# → Merge release/1.1.0 → main (với tag v1.1.0)
# → Merge release/1.1.0 → develop
# → Xóa nhánh release/1.1.0
# → Checkout về main
```

> 💡 **Lưu ý:** Release branch là nơi "cherry-pick" các tính năng đủ ready. Không thêm tính năng mới lớn ở đây — nếu cần, tạo feature branch riêng rồi merge vào develop trước.

### 4. Sửa Hotfix

```bash
# BẮT ĐẦU hotfix (branch từ MAIN — không phải develop!)
git flow hotfix start login-bug
# → Tạo: hotfix/login-bug dựa trên main (current production code)
# → Sửa bug, test kỹ

# KẾT THÚC hotfix
git flow hotfix finish '1.0.1'
# → Merge hotfix/login-bug → main (với tag v1.0.1)
# → Merge hotfix/login-bug → develop
# → Xóa nhánh hotfix/login-bug
# → Checkout về main
```

> ⚠️ **Common mistake:** Hotfix phải branch từ `main`, không phải `develop`. Nếu branch từ `develop`, bạn sẽ fix bug trong code chưa release — production vẫn bị lỗi.

### 5. Commands phổ biến khác

```bash
# Xem danh sách tất cả branches
git branch -a

# Xem thông tin git-flow hiện tại
git flow status

# Pull feature của teammate về
git fetch origin
git flow feature pull origin feature/payment-gateway

# Diff feature với develop
git flow feature diff payment-gateway

# Xem log của develop branch
git log develop --oneline -20

# Force delete branch nếu finish thất bại
git branch -D feature/broken-feature
```

---

## Git Flow vs GitHub Flow vs Trunk-Based

### So sánh chi tiết

| Tiêu chí | Git Flow | GitHub Flow | Trunk-Based Development |
|----------|----------|-------------|------------------------|
| **Nhánh cố định** | `main` + `develop` | Chỉ `main` | Chỉ `main` (trunk) |
| **Phức tạp** | Cao — nhiều quy tắc | Thấp — đơn giản | Thấp – trung bình |
| **Release** | Có version tag rõ ràng | Continuous deploy | Continuous deploy |
| **Hotfix** | Nhánh riêng `hotfix/*` | Branch từ `main` | Branch từ `main` + feature flag |
| **Feature work** | Feature branch 1-14 ngày | Direct commit to main | Short-lived branch (< 1 ngày) |
| **Phù hợp** | Dự án có versioning (npm package, desktop app) | Web app, SaaS deploy liên tục | Team lớn, CI/CD mature |
| **Team size** | Team vừa-lớn, nhiều người | Team nhỏ đến vừa | Tất cả size, cần Discipline |
| **Curated releases** | Có (release branch) | Không (direct to main) | Có (feature flags) |
| **Rollback** | Dễ (tag version cũ) | Khó hơn (cần revert commit) | Khó (feature flag off) |
| **Code review** | Trước merge vào develop | Trước merge vào main | Trước merge vào trunk |

### Khi nào chọn cái nào?

```
Bạn đang cần quyết định?
│
├─ Dự án có versioning rõ ràng? (v1.0, v2.0, semver...)
│   ├─ Có → Git Flow ✅
│   └─ Không → ...
│
├─ Deploy nhiều lần/ngày lên production?
│   ├─ Có → GitHub Flow hoặc Trunk-Based ✅
│   └─ Không (tháng/lần) → Git Flow ✅
│
├─ Cần stability branch trong khi feature đang develop?
│   ├─ Có → Git Flow ✅ (develop luôn stable)
│   └─ Không → GitHub Flow ✅
│
├─ Team nhỏ (< 10 người), web app đơn giản?
│   ├─ Có → GitHub Flow ✅
│   └─ Không → ...
│
└─ Team có CI/CD mature, test coverage cao?
    ├─ Có → Trunk-Based ✅ (fastest feedback)
    └─ Chưa → Git Flow hoặc GitHub Flow
```

**Lập luận chọn Git Flow:**
- ✅ Dự án phải tuân thủ semver (npm package, SDK, library)
- ✅ Cần simultaneous maintenance nhiều版本 (v1.x, v2.x)
- ✅ Release cycle dài (tháng/quý), cần thời gian polish
- ✅ Production cần được bảo vệ — không cho phép commit trực tiếp

**Lập luận KHÔNG chọn Git Flow:**
- ❌ Deploy nhiều lần/ngày → Git Flow quá nặng, chậm
- ❌ Team < 5 người, web app → GitHub Flow đủ
- ❌ Không có versioning rõ ràng → release branch vô nghĩa

---

## Ví dụ CLI thực tế

### Scenario 1: Phát triển 2 features song song

```bash
# Tạo feature 1
git flow feature start user-profile
# vi xử lý code...
git commit -m "feat: add profile page with avatar upload"
git commit -m "feat: add profile bio field"
git flow feature finish user-profile
# → Merge vào develop, xóa branch

# Tạo feature 2
git flow feature start dark-mode
# vi xử lý code...
git commit -m "feat: add dark mode toggle with localStorage persist"
git flow feature finish dark-mode
# → Merge vào develop, xóa branch

# Kiểm tra develop đã tích hợp đủ
git log develop --oneline -10

# Xem trạng thái hiện tại
git flow status
```

### Scenario 2: Release + Hotfix chồng chéo

```bash
# Đang chuẩn bị release 1.1.0
git flow release start 1.1.0

# Giữa chừng phát hiện bug nghiêm trọng trên production!
# Tạo hotfix song song từ main (KHÔNG phải develop!)
git flow hotfix start critical-security-patch
git commit -m "fix: patch SQL injection in login endpoint"
git flow hotfix finish '1.0.2'
# → Merge vào main (tag v1.0.2) VÀ develop

# Quay lại tiếp tục release
git flow release finish '1.1.0'
# → Merge vào main (tag v1.1.0) VÀ develop
```

### Scenario 3: TypeScript project setup với CI

```typescript
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "release": "npm version patch && git push && git push --tags",
    "hotfix": "npm version patch --preid=hotfix && git push && git push --tags"
  }
}

// .github/workflows/gitflow.yml
name: Git Flow CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # cần cho git describe, semantic-release

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm test -- --coverage

      - name: Semantic Release (auto tag)
        if: github.ref == 'refs/heads/main'
        run: npx semantic-release
```

---

## Best Practices

```
✅ LUÔN làm:
├─ Đặt tên feature branch rõ nghĩa: feature/user-auth, feature/search-api
├─ Commit message theo convention: feat:, fix:, chore:, docs: (Conventional Commits)
├─ Hotfix LUÔN bắt đầu từ main, KHÔNG phải develop
├─ Release branch chỉ dùng để polish, KHÔNG thêm tính năng mới lớn
├─ Sau khi finish release/hotfix, đồng bộ lại local: git pull origin main develop
├─ Xóa branch sau khi merge để tránh clutter
└─ Dùng git flow status để luôn biết mình đang ở đâu

❌ KHÔNG bao giờ:
├─ Commit trực tiếp lên main (trừ khi emergency hotfix và đã có backup)
├─ Xóa nhánh develop (nó là vĩnh viễn!)
├─ Merge feature trực tiếp vào main (bỏ qua develop = mất integration testing)
├─ Giữ release/feature branch quá lâu (> 1 tuần = context switch cost)
├─ Bỏ qua việc rebase khi branch lạc hậu so với develop
└─ Tạo hotfix từ develop thay vì main
```

### Commit message conventions

```
feat: add user authentication module          → tính năng mới
fix: resolve null pointer in payment handler  → sửa bug
docs: update API reference                    → tài liệu
chore: upgrade typescript to 5.0              → maintenance
refactor: simplify order validation logic     → code cleanup
test: add unit tests for checkout flow        → test
```

---

## Khi nào KHÔNG dùng Git Flow

| Tình huống | Thay thế bằng | Lý do |
|-----------|---------------|-------|
| Web app deploy nhiều lần/ngày | GitHub Flow hoặc Trunk-Based | Git Flow release branch quá nặng cho daily deploy |
| Team < 5 người, project nhỏ | GitHub Flow (chỉ main branch) | Không cần complexity của develop branch |
| Open-source library, semantic versioning | Git Flow ✅ | Đây là use case lý tưởng của Git Flow |
| Enterprise fintech, compliance | Git Flow + manual approval gates | Cần audit trail cho từng release |
| Mobile app (iOS/Android store review) | Git Flow ✅ | Release cycle tự nhiên dài (tuần/tháng), cần polish phase |

> 💡 **Misconception:** "Git Flow过时了" — Không đúng. Git Flow vẫn là lựa chọn tốt cho dự án có **release cadence chậm** và **semantic versioning**. Nó chỉ "overkill" khi bạn deploy nhiều lần mỗi ngày.

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **main** | Production-ready, tagged releases (v1.0.0, v1.1.0...) |
| **develop** | Integration branch cho tất cả features đang active |
| **feature/** | Ngăn cách work, merge vào develop |
| **release/** | Stabilize trước khi push lên main (tag version) |
| **hotfix/** | Emergency fix từ main, merge cả main + develop |

```
┌──────────────────────────────────────────────────────────────┐
│                    GIT FLOW QUICK REFERENCE                  │
│                                                              │
│  feature      → git flow feature start <name>               │
│  release      → git flow release start <version>            │
│  hotfix       → git flow hotfix start <description>         │
│  finish       → git flow <type> finish <name>               │
│  list         → git flow list                               │
│  status       → git flow status                             │
│                                                              │
│  Merge rules:                                                │
│  feature/*   → develop                                       │
│  release/*   → main + develop                                │
│  hotfix/*    → main + develop (branch from main!)            │
│                                                              │
│  Alternatives: GitHub Flow (simple) / Trunk-Based (fast)    │
└──────────────────────────────────────────────────────────────┘
```

> **"Perfect is the enemy of done."** — Voltaire
>
> Git Flow giúp bạn release có kiểm soát — đừng để nó trở thành rào cản. Nếu bạn deploy nhiều lần mỗi ngày, hãy cân nhắc GitHub Flow hoặc Trunk-Based.

---

## ▶️ Chạy ví dụ

Chạy demo in sơ đồ Git Flow + script lệnh git (chỉ minh họa, không thực thi):

```bash
cd 08-devops-cicd/8.1-gitflow
npx ts-node examples/index.ts
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD tự động trigger khi merge vào main |
| [Jenkins](../8.3-jenkins/README.md) | Pipeline tool alternative cho enterprise |
| [Docker](../8.4-docker/README.md) | Đóng gói release artifact |
| [Kubernetes](../8.5-kubernetes/README.md) | Deploy release lên cluster |
