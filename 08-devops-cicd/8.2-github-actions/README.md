# ⚙️ 8.2 GitHub Actions (Tự Động Hóa CI/CD)

> **GitHub Actions** là nền tảng **CI/CD native** của GitHub — cho phép bạn tự động hóa toàn bộ workflow từ commit đến deploy chỉ bằng YAML configuration.
> Không cần cài server riêng — chạy trên GitHub-hosted runner hoặc self-hosted runner của bạn.

---

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Workflow YAML Structure](#workflow-yaml-structure)
- [CI Pipeline](#ci-pipeline)
- [CD Pipeline](#cd-pipeline)
- [Secrets Management](#secrets-management)
- [Matrix Builds](#matrix-builds)
- [Caching Strategies](#caching-strategies)
- [Best Practices](#best-practices)

---

## Tổng quan

### GitHub Actions là gì?

GitHub Actions biến repository thành một **platform chạy workflow** — mỗi khi event xảy ra (push, PR, schedule...), GitHub chạy các job được định nghĩa trong `.github/workflows/`.

**Kiến trúc:**

```
┌──────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS ARCHITECTURE                  │
│                                                                  │
│   📝 Code Pushed                         🔧 Runner               │
│        ↓                                   ↓                      │
│   🔄 Workflow Trigger  ──────────▶  🏃 GitHub-hosted / Self-hosted│
│        ↓                              ↓                           │
│   📋 Job (runs-on)             📦 Steps (actions)               │
│        │                              │                           │
│        └────────▶──── [ Step 1: Checkout ]                       │
│                  ───▶ [ Step 2: Install ]                        │
│                  ───▶ [ Step 3: Test ]                           │
│                  ───▶ [ Step 4: Deploy ]                         │
│                                                                  │
│   Runner environments:                                           │
│   ├── ubuntu-latest    (2-core, 7GB RAM)                        │
│   ├── windows-latest   (2-core, 7GB RAM)                        │
│   ├── macos-latest     (2-core, 14GB RAM)                       │
│   └── self-hosted      (tùy cấu hình bạn)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

| Thành phần | Mô tả | Ví dụ |
|---|---|---|
| **Workflow** | File YAML định nghĩa toàn bộ pipeline | `.github/workflows/ci.yml` |
| **Event** | Sự kiện trigger workflow | `push`, `pull_request`, `schedule` |
| **Job** | Tập hợp các steps chạy cùng runner | `lint`, `test`, `deploy` |
| **Step** | Một lệnh/action đơn lẻ trong job | `run: npm test` |
| **Action** | Đơn vị tái sử dụng (community hoặc custom) | `actions/checkout@v4` |
| **Runner** | Máy ảo thực thi workflow | `ubuntu-latest`, `self-hosted` |
| **Artifact** | File output lưu giữa jobs/workflows | Build output, test report |

### Events phổ biến

| Event | Mô tả | Trigger |
|---|---|---|
| `push` | Khi có commit được push | Branch/tag |
| `pull_request` | PR được mở/sửa/merge | Branch |
| `workflow_dispatch` | Manual trigger từ UI | Click button |
| `schedule` | Chạy theo cron | Time-based |
| `release` | Release mới được tạo | Tag event |
| `workflow_run` | Chạy khi workflow khác hoàn thành | Workflow dependency |
| `repository_dispatch` | Webhook từ external system | HTTP POST |
| `merge_group` | Khi PR vào merge queue | PR merge check |

### Cấu trúc workflow cơ bản

```yaml
name: My Workflow          # Tên hiển thị trên Actions tab

on:                        # Event trigger (bắt buộc)
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:                      # Danh sách jobs (bắt buộc)
  hello:
    runs-on: ubuntu-latest # Runner (bắt buộc)
    steps:                 # Danh sách steps (bắt buộc)
      - name: Greet
        run: echo "Hello World"
```

---

## Workflow YAML Structure

```yaml
# .github/workflows/main.yml
name: Main Pipeline          # Tên workflow hiển thị trên Actions tab

on:                          # Trigger events
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:          # Cho phép chạy thủ công từ UI

concurrency:                  # Tránh chạy parallel cùng job (tiết kiệm minutes)
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true    # Hủy job cũ khi có run mới

env:                          # Environment variables toàn workflow
  NODE_ENV: production
  CACHE_VERSION: v1

jobs:
  lint:                      # Job 1: Linting
    name: Lint Check
    runs-on: ubuntu-latest   # Machine ảo chạy job
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm          # Auto-cache node_modules
      - run: npm ci
      - run: npm run lint

  test:                      # Job 2: Testing
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint              # Chạy sau lint job (dependency)
    services:                 # Service containers (PostgreSQL, Redis...)
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  build:                     # Job 3: Build & Deploy
    name: Build & Deploy
    runs-on: ubuntu-latest
    needs: [lint, test]      # Chạy sau cả lint + test
    if: github.ref == 'refs/heads/main'  # Chỉ chạy trên main
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: echo "Build success! SHA: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
```

### Cấu trúc bắt buộc vs tùy chọn

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `name` | ❌ | Default = filename (không có đuôi .yml) |
| `on` | ✅ | Ít nhất 1 event trigger |
| `jobs` | ✅ | Ít nhất 1 job |
| `runs-on` | ✅ | Runner image |
| `steps` | ✅ | Ít nhất 1 step |
| `uses` / `run` | ✅ | Hoặc một trong hai (step phải làm gì đó) |
| `if` | ❌ | Điều kiện chạy step/job |
| `env` | ❌ | Environment variables |
| `needs` | ❌ | Job dependencies |
| `concurrency` | ❌ | Tránh duplicate runs |

### Expression syntax

```yaml
# Tiếp cận các contextual variables
${{ github.sha }}          # Commit SHA
${{ github.ref }}          # Branch/tag reference
${{ github.event_name }}   # 'push', 'pull_request', etc.
${{ github.actor }}        # Username of person triggering
${{ github.workflow }}     # Workflow name
${{ runner.os }}           # 'Linux', 'Windows', 'macOS'
${{ secrets.MY_SECRET }}   # Secret value
${{ vars.MY_VAR }}         # Org/Repo variable
${{ matrix.node }}         # Matrix value
${{ steps.step_id.outputs.name }}  # Step output
```

---

## CI Pipeline

### Pipeline CI đầy đủ: Test + Build + Lint

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

jobs:
  ci:
    name: Continuous Integration
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: ['18', '20', '22']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: package-lock.json

      - name: Install dependencies
        run: npm ci           # ci = từ lockfile, reproducer 100%

      - name: Lint code
        run: npm run lint
        continue-on-error: false

      - name: Type check
        run: npx tsc --noEmit

      - name: Run unit tests
        run: npm test -- --coverage
        env:
          CI: true

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

      - name: Build project
        run: npm run build
        if: success()
```

### Pipeline CI với nhiều bước kiểm tra

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI PIPELINE FLOW                             │
│                                                                 │
│  PR opened / Push to branch                                     │
│        ↓                                                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  1. Checkout  │ →  │  2. Install   │ →  │  3. Lint     │       │
│  │  (~5s)        │    │  (~30s cache) │    │  (~15s)     │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                 │                │
│                                    ┌────────────▼───────┐        │
│                                    │  4. Type Check     │        │
│                                    │  (~20s)           │        │
│                                    └────────────┬───────┘        │
│                                                 │                │
│                                    ┌────────────▼───────┐        │
│                                    │  5. Unit Tests    │        │
│                                    │  (~2min)          │        │
│                                    └────────────┬───────┘        │
│                                                 │                │
│                                    ┌────────────▼───────┐        │
│                                    │  6. Build         │        │
│                                    │  (~1min)          │        │
│                                    └────────────┬───────┘        │
│                                                 │                │
│                                    ┌────────────▼───────┐        │
│                                    │  7. Upload        │        │
│                                    │  artifact         │        │
│                                    └────────────┬───────┘        │
│                                                 │                │
│                                    ┌────────────▼───────┐        │
│                                    │  ✅ Pass / ❌ Fail  │        │
│                                    └────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Bước | Thời gian ước tính | Mục đích | Tips |
|---|---|---|---|
| Checkout | < 10s | Lấy source code về runner | Dùng `actions/checkout@v4` |
| Install | 30-60s | Cài đặt dependencies (có cache) | Dùng `cache: npm` trong setup-node |
| Lint | 10-30s | Phát hiện code smell sớm | Chạy song song với type check |
| Type check | 15-45s | Kiểm tra TypeScript types | `tsc --noEmit` — không generate file |
| Unit tests | 1-3 phút | Đảm bảo logic đúng | Parallelize test suites |
| Build | 1-2 phút | Tạo artifact production | Multi-stage build để cache layer |
| Upload | 10-30s | Lưu artifact cho CD pipeline | `actions/upload-artifact@v4` |

---

## CD Pipeline

### Deploy lên Staging và Production

```yaml
# .github/workflows/cd.yml
name: CD Pipeline

on:
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]
    branches: [main]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          run-id: ${{ github.event.workflow_run.id }}

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          aws ecs update-service \
            --cluster staging \
            --service web-app \
            --force-new-deployment
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

      - name: Health check
        run: |
          for i in {1..10}; do
            if curl -sf https://staging.example.com/health > /dev/null; then
              echo "✅ Staging is healthy"
              exit 0
            fi
            sleep 5
          done
          echo "❌ Health check failed"
          exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'

    # Human approval gate — yêu cầu click approve trong GitHub UI
    environment:
      name: production
      url: https://app.example.com

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          run-id: ${{ github.event.workflow_run.id }}

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          kubectl set image deployment/web-app \
            web-app=registry.example.com/web-app:${{ github.sha }}
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG }}

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/web-app --timeout=120s
          echo "✅ Production deployment verified"

      - name: Notify Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"Deployment ${{ job.status }}: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"}'
```

### Quy tắc trigger giữa CI và CD

| Quy tắc | CI | CD |
|---|---|---|
| **Environment** | Staging / Test | Production |
| **Manual approval** | Không | Có (GitHub Environment) |
| **Rollback** | Không cần | Có (khôi phục version trước) |
| **Notification** | Slack/Email khi fail | Slack khi deploy thành công |
| **Security** | Không có secrets nhạy cảm | Secrets được protect (environment level) |
| **Trigger** | Mọi push/PR | Chỉ sau CI pass + environment gate |

```
┌────────────────────────────────────────────────────────────────┐
│                 CD DEPLOYMENT FLOW                             │
│                                                                │
│   CI Pipeline ✅ Success                                       │
│         ↓                                                      │
│   ┌─────────────────────┐                                      │
│   │  Deploy to Staging   │                                     │
│   │  (auto, no approval) │                                     │
│   └──────────┬──────────┘                                      │
│              ↓                                                 │
│   ┌─────────────────────┐                                      │
│   │  Smoke / E2E Tests  │                                     │
│   │  (staging env)      │                                     │
│   └──────────┬──────────┘                                      │
│              ↓                                                 │
│   ⏸️  MANUAL APPROVAL required                                 │
│      (click "Review deployments" → "Approve")                  │
│              ↓                                                 │
│   ┌─────────────────────┐                                      │
│   │  Deploy to Prod     │                                     │
│   │  (rolling update)   │                                     │
│   └──────────┬──────────┘                                      │
│              ↓                                                 │
│   ┌─────────────────────┐                                      │
│   │  Post-deploy Verify │                                     │
│   │  (health check)     │                                     │
│   └──────────┬──────────┘                                      │
│              ↓                                                 │
│   🎉 Deployed Successfully                                     │
│              ↓                                                 │
│   💬 Slack notification → #deployments                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Secrets Management

### 3 mức lưu trữ secrets

| Cấp độ | Nơi đặt | Phạm vi | Use case |
|---|---|---|---|
| **Repository** | Settings → Secrets → Actions | Repo đó | API keys, DB passwords cho repo cụ thể |
| **Environment** | Settings → Environments | Env cụ thể | Production secrets (có approval gate) |
| **Organization** | Settings → Secrets → Actions | Tất cả repos org | Shared infrastructure creds |

### Best practices

```
✅ LUÔN làm:
├─ Dùng environment protection rules cho production
│    (required reviewers, wait timer, branch restriction)
├─ Rotate secrets định kỳ (tối thiểu 90 ngày)
├─ Dùng OIDC token thay vì long-lived credentials
│    (tránh lưu AWS access key trong GitHub)
├─ Giới hạn scope của access tokens (read-only khi có thể)
├─ Audit secrets qua GitHub audit log
└─ Dùng `secrets.GITHUB_TOKEN` cho GitHub API calls (tự động)

❌ KHÔNG bao giờ:
├─ Hardcode secret trong YAML workflow
├─ Log secret ra console (dù vô tình)
│    (GitHub tự động redact known patterns, nhưng không phải lúc nào cũng vậy)
├─ Chia sẻ secret qua PR description
└─ Dùng repo-level secret cho production (dùng environment-level)
```

### OIDC — Thay thế credentials tĩnh

```yaml
# Dùng OIDC để deploy AWS mà không cần store access key
# Benefit: mỗi lần deploy tạo temporary credential, tự expire sau 1 giờ
permissions:
  id-token: write      # Required for OIDC
  contents: read

jobs:
  deploy:
    steps:
      - name: Configure AWS via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012/role/github-actions
          aws-region: us-east-1
          # KHÔNG cần AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY!
          # Credential tự động rotate mỗi lần run
```

### GitHub Environment Protection Rules

```
Environment: production
├── Required reviewers: 1 người approver (có thể set nhiều người)
├── Wait timer: 5 phút sau approval (chặn accidental deploy)
├── Branch restriction: only main (hoặc các branches cụ thể)
├── Deployment branches: main only
└── Secret mask: mọi giá trị được redact trong log
```

---

## Matrix Builds

### Matrix builds — Test nhiều cấu hình cùng lúc

```yaml
# .github/workflows/matrix.yml
name: Matrix Tests

on: [push, pull_request]

jobs:
  test:
    name: Test (Node ${{ matrix.node }}, OS ${{ matrix.os }})
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: ['18', '20', '22']
        # Exclude known incompatible combinations
        exclude:
          - os: windows-latest
            node-version: '18'

      # Continue other jobs even if one fails (false = stop all on first failure)
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test

  # Kết quả hiển thị trong Actions tab:
  #
  # test (18, ubuntu)   ✅
  # test (18, macos)    ❌
  # test (18, windows)  ⏭️  (excluded)
  # test (20, ubuntu)   ✅
  # test (20, macos)    ✅
  # test (20, windows)  ✅
  # test (22, ubuntu)   ✅
  # test (22, macos)    ✅
  # test (22, windows)  ✅
```

### So sánh: Matrix vs Multiple Jobs riêng lẻ

| Matrix | Multiple Jobs riêng lẻ |
|---|---|
| DRY — 1 job definition | Redundant code lặp lại |
| Cùng runner config | Khác nhau tùy job |
| Fail-fast có thể bật/tắt | Độc lập hoàn toàn |
| ~9 configurations trong 1 job | ~9 jobs riêng biệt |
| Hiển thị dạng matrix grid | Hiển thị dạng list |
| Chia sẻ steps code | Mỗi job phải copy steps |

### Matrix với include/except

```yaml
strategy:
  matrix:
    target: [test, lint, build]
    os: [ubuntu-latest]
    include:
      # Thêm config đặc biệt cho build job
      - target: build
        node-version: '20'
        cache: npm
      # Thêm config đặc biệt cho test job
      - target: test
        node-version: '20'
        coverage: true
    exclude:
      # Bỏ qua lint trên windows vì khác behavior
      - target: lint
        os: windows-latest
```

---

## Caching Strategies

| Cache target | Cách implement | Giảm thời gian |
|-------------|---------------|---------------|
| **npm** | `actions/setup-node@v4` với `cache: 'npm'` | 30-60% (cached node_modules) |
| **pip** | `actions/setup-python@v5` với `cache: 'pip'` | 30-50% |
| **maven** | `actions/cache@v4` với path `~/.m2` | 40-60% |
| **docker layer** | `docker/build-push-action` với `cache-from: type=gha` | 50-80% cho build |
| **custom** | `actions/cache@v4` cho bất kỳ path nào | Tùy case |

```yaml
# Custom cache example
- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

---

## Best Practices

### Pipeline design patterns

```
┌─────────────────────────────────────────────────────────────────┐
│              RECOMMENDED WORKFLOW STRUCTURE                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  CI Pipeline │  │  CD Pipeline │  │  Nightly    │             │
│  │  (fast)      │  │  (gated)     │  │  Security   │             │
│  │              │  │              │  │  Scan       │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                 │                    │
│    Commit/PR         Staging auto        Cron (0:00)           │
│         │                │                 │                    │
│    2-5 min        Manual approve      Weekly report            │
│         │                │                                    │
│         └─────▶─▶─▶─▶─  Production deploy                      │
│                        (after approval)                        │
│                                                                 │
│  Parallel CI jobs:                                              │
│  lint ◄─┐                                                     │
│  test ◄─┼─ all must pass before build                         │
│  security ◄─┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist best practices

```
✅ LUÔN làm:
├─ Giữ CI pipeline < 10 phút (fast feedback = developer flow)
├─ Dùng caching cho dependencies (npm/pip/maven/docker layer)
├─ Dùng `needs` để thiết lập dependency giữa jobs (song song đúng cách)
├─ Đặt `if: github.ref == 'refs/heads/main'` cho production jobs
├─ Dùng environment protection cho production deployment
├─ Thêm `continue-on-error: false` mặc định cho critical steps
├─ Dùng `concurrency` để tránh duplicate runs (tiết kiệm minutes)
├─ Log summary ra `$GITHUB_STEP_SUMMARY` cho PR overview
├─ Dùng `with:` thay vì `env:` khi có thể (sạch hơn)
└─ Thêm timeout-minutes cho long-running jobs (tránh stuck)

❌ KHÔNG bao giờ:
├─ Hardcode secrets trong YAML (dùng ${{ secrets.X }})
├─ Để workflow chạy vô hạn (set timeout-minutes)
├─ Bỏ qua việc test trên nhiều OS (nếu cần cross-platform)
├─ Dùng `sudo` khi không cần thiết (runner đã có quyền root)
├─ Bỏ qua fail-fast khi matrix build không cần parallelism
├─ Checkout full repo history khi không cần (dùng `fetch-depth: 1`)
└─ Deploy production từ fork repo (security risk)
```

### Timeout và resource limits

```yaml
jobs:
  long-running:
    runs-on: ubuntu-latest
    timeout-minutes: 30   # Tự động hủy sau 30 phút
    steps:
      - run: echo "Running..."
```

### Concurrency control

```yaml
# Tránh chạy 2 workflow cùng lúc cho 1 branch (tiết kiệm minutes)
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Hủy run cũ khi có run mới
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **Workflow** | File YAML trong `.github/workflows/`, định nghĩa pipeline |
| **Job** | Đơn vị thực thi song song, chạy trên một runner |
| **Step** | Lệnh/action đơn lẻ trong job |
| **CI Pipeline** | Checkout → Install → Lint → Test → Build |
| **CD Pipeline** | Deploy staging → Approve → Deploy prod → Verify |
| **Secrets** | Repository / Environment / Organization level |
| **Matrix** | Test nhiều cấu hình (OS × Node version) cùng lúc |
| **Artifact** | File output lưu giữa jobs (build result, test report) |
| **OIDC** | Thay thế hardcoded credentials bằng short-lived tokens |

```
┌──────────────────────────────────────────────────────────────┐
│                  GITHUB ACTIONS QUICK REFERENCE              │
│                                                              │
│  Trigger    → on: push / pull_request / workflow_dispatch   │
│  Runner     → runs-on: ubuntu-latest / self-hosted          │
│  Action     → uses: actions/checkout@v4                     │
│  Env        → env: KEY: value / ${{ secrets.X }}            │
│  Expression → ${{ github.ref }} / matrix.node               │
│  Condition  → if: success() / always() / github.ref == ...  │
│  Cache      → cache: 'npm' (setup-node)                     │
│  Matrix     → strategy.matrix.os: [a, b]                    │
│  Artifact   → uses: actions/upload-artifact@v4              │
│  Concurrency→ concurrency: { group, cancel-in-progress }    │
│  Needs      → needs: [lint, test] (job dependency)          │
│                                                              │
│  Alternatives: GitLab CI / Jenkins / CircleCI               │
└──────────────────────────────────────────────────────────────┘
```

> **"Automate the boring stuff, so you can focus on what matters."**

---

## ▶️ Chạy ví dụ

Chạy demo workflow YAML + mô phỏng pipeline:

```bash
cd 08-devops-cicd/8.2-github-actions
npx ts-node examples/index.ts
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [Git Flow](../8.1-gitflow/README.md) | Branch strategy để trigger workflow |
| [Jenkins](../8.3-jenkins/README.md) | Pipeline tool alternative |
| [Docker](../8.4-docker/README.md) | Đóng gói artifact cho deploy |
| [Kubernetes](../8.5-kubernetes/README.md) | Deploy target cho CD pipeline |
| [Terraform](../8.6-terraform/README.md) | Infrastructure deploy qua Actions |
