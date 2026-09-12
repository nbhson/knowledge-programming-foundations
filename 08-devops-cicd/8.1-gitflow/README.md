# 🌿 8.1 Git Flow (Luồng Phát Triển nhánh)

> **Git Flow** là một **branching model** (mô hình phân nhánh) được tạo ra bởi Vincent Driessen,
> giúp quản lý release phức tạp với nhiều nhánh song song — phù hợp cho dự án có versioning rõ ràng.

---

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Các nhánh chính](#các-nhánh-chính)
- [Branch strategy diagram](#branch-strategy-diagram)
- [Hoạt động chi tiết](#hoạt-động-chi-tiết)
- [Git Flow vs GitHub Flow](#git-flow-vs-github-flow)
- [Ví dụ CLI thực tế](#ví-dụ-cli-thực-tế)
- [Best Practices](#best-practices)

---

## Tổng quan

### Git Flow là gì?

Git Flow định nghĩa **5 nhánh cố định** + **3 loại nhánh hỗ trợ**, mỗi nhánh có vai trò riêng:

```
┌──────────────────────────────────────────────────────────────────┐
│                        GIT FLOW MODEL                            │
│                                                                  │
│   main ──────────────────────────────── production               │
│   develop ──────────────────────────── integration layer       │
│   feature/* ──────────────────────▶ phát triển tính năng        │
│   release/* ──────────────────▶ chuẩn bị release                │
│   hotfix/* ──────────────────▶ sửa lỗi khẩn cấp production      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Các nhánh chính

| Nhánh | Kiểu | Mục đích | Merge vào |
|-------|------|----------|-----------|
| `main` | **Permanent** | Production-ready code | — |
| `develop` | **Permanent** | Integration branch cho features | — |
| `feature/*` | **Temporary** | Phát triển tính năng mới | `develop` |
| `release/*` | **Temporary** | Chuẩn bị release version | `main` + `develop` |
| `hotfix/*` | **Temporary** | Sửa lỗi gấp trên production | `main` + `develop` |

```
┌──────────────┬──────────────────────────┬──────────────────┬─────────────┐
│    Nhánh     │       Vai trò            │    Vòng đời      │  Ai tạo?    │
├──────────────┼──────────────────────────┼──────────────────┼─────────────┤
│ main         │ Code production          │ Vĩnh viễn        │ CI/CD auto  │
│ develop      │ Integration latest       │ Vĩnh viễn        │ Dev lead    │
│ feature/*    │ Tính năng mới            │ Tạm (1-7 ngày)   │ Developer   │
│ release/*    │ Sẵn sàng release         │ Tạm (vài giờ)    │ Dev lead    │
│ hotfix/*     │ Sửa lỗi production       │ Tạm (< 1 giờ)    │ Bất kỳ ai   │
└──────────────┴──────────────────────────┴──────────────────┴─────────────┘
```

---

## Branch Strategy Diagram

```
                    ┌──────────┐
                    │  main    │  ← tags: v1.0.0, v1.1.0
                    └────┬─────┘
                         │ merge (release/hotfix)
                    ┌────▼─────┐
                    │develop   │  ← tích hợp tất cả feature
                    └────┬─────┘
              ┌──────────┼──────────┐
         feature/a      │      feature/b
              │          │          │
         feature/pay    │   feature/auth
              │          │          │
              └────┬─────┘          │
                   │ merge           │
              ┌────▼─────┐           │
              │ release/ │◄───────────┘
              │  1.1.0   │  final review
              └────┬─────┘
                   │
              ┌────▼────┐
              │  main   │  tagged v1.1.0
              │         │
              └────┬────┘
                   │ bug found
              ┌────▼─────┐
              │ hotfix/  │
              │  1.0.1   │
              └────┬─────┘
                   │
              ┌────▼────┐
              │  main   │  tagged v1.0.1
              └────┬────┘
                   │ merge back
              ┌────▼─────┐
              │ develop  │  ← includes hotfix
              └──────────┘
```

---

## Hoạt động chi tiết

### 1. Khởi tạo repository với Git Flow

```bash
# Cài đặt git-flow (nếu chưa có)
brew install git-flow        # macOS
# hoặc
sudo apt install git-flow    # Linux

# Khởi tạo Git Flow
git flow init
# → Hỏi: main branch? [main] Enter
# → Hỏi: develop branch? [develop] Enter
# → Hỏi: feature prefix? [feature/] Enter
# → Hỏi: release prefix? [release/] Enter
# → Hỏi: hotfix prefix? [hotfix/] Enter
# → Hỏi: support prefix? Không dùng, bỏ qua
# → Hỏi: version tag prefix? [v] Enter
```

### 2. Phát triển Feature

```bash
# BẮT ĐẦU feature mới
git flow feature start payment-gateway

# ← Tự động tạo nhánh: feature/payment-gateway dựa trên develop
# Làm việc... commit bình thường

# KẾT THÚC feature (merge vào develop)
git flow feature finish payment-gateway
# ← Merge feature/payment-gateway → develop
# ← Xóa nhánh feature/payment-gateway

# Hoặc bắt đầu từ một commit cụ thể
git flow feature start auth-login abc1234
```

### 3. Chuẩn bị Release

```bash
# BẮT ĐẦU release
git flow release start 1.1.0

# ← Tự động tạo: release/1.1.0 dựa trên develop
# Fix bug nhỏ, update docs, bump version

# KẾT THÚC release
git flow release finish '1.1.0'
# ← Merge release/1.1.0 → main (với tag v1.1.0)
# ← Merge release/1.1.0 → develop
# ← Xóa nhánh release/1.1.0
```

### 4. Sửa Hotfix

```bash
# BẮT ĐẦU hotfix
git flow hotfix start login-bug

# ← Tự động tạo: hotfix/login-bug dựa trên main
# Sửa bug, test kỹ

# KẾT THÚC hotfix
git flow hotfix finish '1.0.1'
# ← Merge hotfix/login-bug → main (với tag v1.0.1)
# ← Merge hotfix/login-bug → develop
# ← Xóa nhánh hotfix/login-bug
```

### 5. Commands phổ biến khác

```bash
# Xem danh sách tất cả branches
git flow list

# Xem trạng thái hiện tại
git flow status

# Pull feature của teammate về
git flow feature pull origin feature/payment-gateway

# Diff feature với develop
git flow feature diff payment-gateway
```

---

## Git Flow vs GitHub Flow

### So sánh chi tiết

| Tiêu chí | Git Flow | GitHub Flow |
|----------|----------|-------------|
| **Nhánh cố định** | `main` + `develop` | Chỉ `main` |
| **Phức tạp** | Cao — nhiều quy tắc | Thấp — đơn giản |
| **Release** | Có version tag rõ ràng | Continuous deploy |
| **Hotfix** | Nhánh riêng `hotfix/*` | Branch từ `main` |
| **Phù hợp** | Dự án có versioning (npm package, app) | Web app, SaaS deploy liên tục |
| **Team size** | Team lớn, nhiều người | Team nhỏ đến vừa |
| **Curated releases** | Có (release branch) | Không (direct to main) |
| **Rollback** | Dễ (tag version cũ) | Khó hơn (cần revert commit) |

### Khi nào chọn cái nào?

```
Bạn đang cần quyết định?
│
├─ Dự án có versioning rõ ràng? (v1.0, v2.0...)
│   ├─ Có → Git Flow ✅
│   └─ Không → ...
│
├─ Deploy nhiều lần/ngày lên production?
│   ├─ Có → GitHub Flow ✅
│   └─ Không (tháng/lần) → Git Flow ✅
│
├─ Cần stabilty branch trong khi feature đang develop?
│   ├─ Có → Git Flow ✅
│   └─ Không → GitHub Flow ✅
│
└─ Team nhỏ (< 5 người), web app đơn giản?
    ├─ Có → GitHub Flow ✅
    └─ Không → Git Flow ✅
```

---

## Ví dụ CLI thực tế

### Scenario 1: Phát triển 2 features song song

```bash
# Tạo feature 1
git flow feature start user-profile
# vi xử lý code...
git commit -m "feat: add profile page"

git flow feature finish user-profile

# Tạo feature 2
git flow feature start dark-mode
# vi xử lý code...
git commit -m "feat: add dark mode toggle"

git flow feature finish dark-mode

# Kiểm tra develop đã tích hợp đủ
git log develop --oneline -10
```

### Scenario 2: Release + Hotfix chồng chéo

```bash
# Đang chuẩn bị release 1.1.0
git flow release start 1.1.0

# Giữa chừng phát hiện bug nghiêm trọng trên production!
# Tạo hotfix song song từ main (KHÔNG phải develop!)
git flow hotfix start critical-security-patch
git commit -m "fix: patch security vulnerability"
git flow hotfix finish '1.0.2'

# Quay lại tiếp tục release
git flow release finish '1.1.0'
```

### Scenario 3: TypeScript project setup

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
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # cần cho git describe

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm test -- --coverage

      - name: Tag release
        if: startsWith(github.ref, 'refs/tags/')
        run: echo "Released ${GITHUB_REF_NAME}"
```

---

## Best Practices

```
✅ LUÔN làm:
├─ Đặt tên feature branch rõ nghĩa: feature/user-auth, feature/search-api
├─ Commit message theo convention: feat:, fix:, chore:, docs:
├─ Hotfix LUÔN bắt đầu từ main, KHÔNG phải develop
├─ Release branch chỉ dùng để polish, KHÔNG thêm tính năng mới
└─ Sau khi finish release/hotfix, đồng bộ lại local với remote

❌ KHÔNG bao giờ:
├─ Commit trực tiếp lên main (trừ khi emergency)
├─ Xóa nhánh develop
├─ Merge feature trực tiếp vào main
├─ Giữ release/feature branch quá lâu (> 1 tuần)
└─ Bỏ qua việc rebase khi branch lạc hậu
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **main** | Production-ready, tagged releases |
| **develop** | Integration branch cho tất cả features |
| **feature/** | Ngăn cách work, merge vào develop |
| **release/** | Stabilize trước khi push main |
| **hotfix/** | Emergency fix từ main, merge cả 2 |

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
│  Alternatives: GitHub Flow (simple) / Trunk-Based (fast)    │
└──────────────────────────────────────────────────────────────┘
```

> **"Perfect is the enemy of done."** — Voltaire
>
> Git Flow giúp bạn release có kiểm soát — đừng để nó trở thành rào cản.

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD tự động trigger |
| [Jenkins](../8.3-jenkins/README.md) | Pipeline tool alternative |
| [Docker](../8.4-docker/README.md) | Đóng gói release artifact |
