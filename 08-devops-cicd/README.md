# 🚀 Lớp 8: DevOps & CI/CD

> **DevOps** là **văn hóa và tập hợp các thực hành** kết nối phát triển (Dev) và vận hành (Ops),
> giúp **tự động hóa, tăng tốc và đảm bảo chất lượng** toàn bộ vòng đời phần mềm.
> Không phải là tool — là tư duy: tự động những gì lặp lại, đo lường mọi thứ, feedback nhanh.

---

## 📚 Mục lục

| # | Chủ đề | Giải thích | Link |
|---|--------|-----------|------|
| 8.1 | Git Flow | Branching model với main/develop/feature/release/hotfix | [8.1-gitflow](8.1-gitflow/README.md) |
| 8.2 | GitHub Actions | CI/CD native của GitHub qua workflow YAML | [8.2-github-actions](8.2-github-actions/README.md) |
| 8.3 | Jenkins | Pipeline as Code với Jenkinsfile (Groovy) | [8.3-jenkins](8.3-jenkins/README.md) |
| 8.4 | Docker | Đóng gói ứng dụng + dependencies thành container | [8.4-docker](8.4-docker/README.md) |
| 8.5 | Kubernetes | Orchestration container, deploy/scale tự động | [8.5-kubernetes](8.5-kubernetes/README.md) |
| 8.6 | Terraform | Infrastructure as Code, quản lý hạ tầng bằng HCL | [8.6-terraform](8.6-terraform/README.md) |

---

## 📑 Mục Lục

- [Tổng quan](#tổng-quan)
- [1. CI — Continuous Integration](#1-ci--continuous-integration)
- [2. CD — Continuous Delivery / Deployment](#2-cd--continuous-delivery--deployment)
- [3. Infrastructure as Code (IaC)](#3-infrastructure-as-code-iac)
- [4. Containerization & Orchestration](#4-containerization--orchestration)
- [5. Monitoring & Observability](#5-monitoring--observability)
- [6. GitOps](#6-gitops)
- [7. Cloud Platforms](#7-cloud-platforms)
- [Tổng kết](#tổng-kết)

---

## Tổng quan

### DevOps là gì?

DevOps không phải là một **công cụ** hay **vị trí công việc** — nó là một **văn hóa làm việc** kết hợp:

- **Development** (phát triển): viết code, test, build
- **Operations** (vận hành): deploy, monitor, scale, maintain

**Tại sao cần cầu nối giữa Dev và Ops?** Потому что в традиционной модели "hand-off" (Dev写完交给Ops部署) есть фундаментальный конфликт интересов:

| Dev wants | Ops wants |
|-----------|-----------|
| Deploy frequently | Stability & predictability |
| New features shipped fast | Minimal blast radius |
| Flexibility to try things | Known-good configuration |
| Speed | Reliability |

DevOps giải quyết xung đột này bằng cách **gán Ops early trong quá trình phát triển**, và biến các thao tác vận hành thành code tự động — để frequency cao không đồng nghĩa với instability.

### Vòng đời DevOps (DevOps Lifecycle)

```
Plan → Code → Build → Test → Release → Deploy → Operate → Monitor
  ↑                                                           |
  └───────────────── Feedback Loop ───────────────────────────┘
```

Mỗi giai đoạn có thực hành riêng:

- **Plan**: backlog, issue tracking, estimation (Jira, Linear)
- **Code**: version control, code review, pair programming
- **Build**: compile, bundle, package artifact
- **Test**: unit, integration, e2e, performance
- **Release**: feature flags, staged rollout
- **Deploy**: canary, blue/green, rolling
- **Operate**: config management, secrets management
- **Monitor**: metrics, logs, traces, alerting

### Tại sao cần DevOps?

| Không có DevOps | Có DevOps | Số liệu tham khảo |
|---|---|---|
| Deploy thủ công, hay lỗi | Deploy tự động, nhất quán | Human-deploy error rate ~10-30% per deploy |
| "Ở máy tôi chạy được" | Môi trường nhất quán (Container) | "Works on my machine" = #1 developer complaint |
| Phát hiện lỗi muộn ( QA phase cuối ) | Phát hiện lỗi sớm (CI, vài phút) | DORA: CI giảm lead time tới 200x |
| Release chậm (tháng/quý) | Release nhanh (ngày/giờ) | Elite performers: deploy nhiều lần/ngày |
| Không biết hệ thống lỗi khi nào | Giám sát 24/7, cảnh báo tự động | MTTR (Mean Time to Resolve) giảm mạnh |
| Rollback thủ công, 30 phút | Rollback tự động, 1 phút | DORA: rollback time < 1 giờ = elite |

> 📌 **Đặc trưng:** DevOps đo bằng **DORA metrics** — Deployment Frequency, Lead Time for Changes, Change Failure Rate, Mean Time to Restore (MTTR).

---

## 1. CI — Continuous Integration

### Khái niệm

CI là thực hành **merge code thường xuyên** vào nhánh chính, mỗi lần merge đều **tự động build + test**.

**Mục tiêu cốt lõi:** phát hiện tích hợp sai (integration errors) ngay lập tức — trong vòng vài phút sau khi commit, không phải vài ngày sau.

**Tại sao integration error lại đáng sợ?** Vì mỗi ngày dev làm việc trên branch riêng, khi merge lại sẽ có xung đột về API contract, dependency version, hoặc behavioral change — những lỗi khó reproduce nếu không test tự động.

### Quy trình CI điển hình

```
Developer push code
        ↓
   Trigger CI Pipeline
        ↓
   ┌─────────────┐
   │  Checkout    │ ← git clone + sparse checkout (chỉ lấy cần thiết)
   │  Install     │ ← npm ci / pip install -r requirements.txt (reproducible)
   │  Lint        │ ← phát hiện style issues trước khi compile
   │  Build       │ ← compile, transpile, bundle (phát hiện syntax errors)
   │  Unit Test   │ ← test từng function/method (fast, 1-2 min)
   │  Integration │ ← test nhiều component cùng lúc (slower, 5-10 min)
   │  Security    │ ← scan dependencies (npm audit, Snyk, Trivy)
   └─────────────┘
        ↓
   ✅ Pass → Merge allowed
   ❌ Fail → Block merge, notify (Slack, email, PR comment)
```

### Các nguyên tắc CI

| Nguyên tắc | Mô tả | Tại sao quan trọng |
|---|---|---|
| **Commit thường xuyên** | Commit nhỏ, nhiều lần/ngày | Change set nhỏ = diff dễ review, conflict ít, rollback dễ |
| **Automated build** | Mỗi commit tự động trigger build | Loại bỏ "tôi build manuel rồi" — mọi người dùng cùng artifact |
| **Automated test** | Test chạy tự động, không manual | Con người sẽ bỏ qua nếu bận; machine không bao giờ quên |
| **Fast feedback** | Pipeline chạy nhanh (< 10 phút lý tưởng) | Feedback > 10 phút = developer context-switch → giảm productivity |
| **Fix broken build ngay** | Build fail = ưu tiên #1 | Broken build là "fire drill" — không có gì blocks team khác |

### Công cụ CI phổ biến

| Công cụ | Đặc điểm | Phù hợp khi |
|---|---|---|
| **GitHub Actions** | Tích hợp sẵn GitHub, YAML config | Repo trên GitHub, muốn setup nhanh, team nhỏ-vừa |
| **GitLab CI** | Tích hợp sẵn GitLab, mạnh mẽ | Đã dùng GitLab, muốn everything-in-one |
| **Jenkins** | Open-source, linh hoạt, plugin ecosystem | Enterprise, cần self-hosted, nhiều custom step |
| **CircleCI** | Cloud-native, nhanh, caching tốt | Team muốn managed service, speed là ưu tiên |
| **Travis CI** | Đơn giản, phổ biến với open-source | Open-source project, CI/yaml đơn giản |
| **Azure DevOps** | Tích hợp Azure, Boards, Pipelines | Enterprise Microsoft stack |
| **ArgoCD** (GitOps) | Cluster-level CD, declarative | K8s-native, nhiều clusters |

### Ví dụ: GitHub Actions workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'         # cache node_modules giữa các runs

      - name: Install dependencies
        run: npm ci           #.ci = deterministic, dùng lockfile

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Tối ưu CI speed:**

| Kỹ thuật | Giảm thời gian | Ghi chú |
|----------|---------------|---------|
| Parallel jobs | 2-4x | Chia lint/test/build thành job song song |
| Caching | 30-60% | Cache node_modules, pip cache, maven repo |
| Incremental builds | 50%+ | Chỉ build lại phần thay đổi (tsup, esbuild) |
| Skip on docs-only | 100% | `if: "!contains(github.event.head_commit.message, 'docs')"` |

---

## 2. CD — Continuous Delivery / Deployment

### Phân biệt Delivery vs Deployment

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| **Định nghĩa** | Code luôn sẵn sàng deploy | Code tự động deploy lên production |
| **Manual step** | Có (approve trước khi deploy) | Không (hoàn toàn tự động) |
| **Risk** | Thấp hơn (có human review) | Cần test coverage cao (>90%) |
| **Phù hợp** | Enterprise, regulated | SaaS, startup, web app |
| **Triển khai** | Click 1 nút là lên prod | Mỗi merge lên main là tự động deploy |

**Thực tế:** Đa số công ty dùng **Continuous Delivery** vì yêu cầu compliance (fintech, y tế). Startup SaaS thường dùng **Continuous Deployment**.

### Pipeline CD điển hình

```
CI Pass
  ↓
Build Artifact / Docker Image
  ↓
Push Image to Registry (ECR, GCR, Docker Hub)
  ↓
Deploy to Staging (auto)
  ↓
Run Smoke Tests / E2E Tests (auto)
  ↓
Manual Approval (Delivery) hoặc Auto (Deployment)
  ↓
Deploy to Production (rolling/canary)
  ↓
Post-deploy verification (health check, synthetic transaction)
  ↓
Monitor & Rollback if needed (automated)
```

### Deployment Strategies

| Strategy | Mô tả | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|---|
| **Rolling** | Thay thế từng instance | Zero downtime | Rollback chậm (phải reverse rolling) | Resource hạn chế, traffic trung bình |
| **Blue/Green** | 2 môi trường giống hệt, switch traffic | Rollback 1-click (đổi LB lại blue) | Tốn tài nguyên gấp đôi | Traffic cao, cần rollback tức thì |
| **Canary** | Deploy cho % nhỏ users trước | Phát hiện lỗi sớm, gradual | Phức tạp hơn (cần traffic splitting) | Muốn giảm blast radius tối đa |
| **Feature Flags** | Toggle tính năng bằng config | Linh hoạt, A/B test, rollback instant | Code complexity, flag debt | Release không liên quan version |
| **Recreate** | Tắt hết → deploy mới | Đơn giản | Có downtime | Non-production, batch jobs |
| **Shadow** | Deploy bản mới, nhận traffic thật nhưng không phản hồi | Test under real load, zero risk | Tốn tài nguyên, phức tạp | Migration quan trọng (DB schema) |

**So sánh chi phí tài nguyên:**

| Strategy | Extra infrastructure | Complexity | Rollback speed |
|---|---|---|---|
| Rolling | +1 instance ( Surge) | Thấp | Trung bình |
| Blue/Green | +1 full environment | Thấp | < 1 giây (switch LB) |
| Canary | +1 instance nhỏ | Trung bình | 1 phút |
| Feature Flags | Không thêm | Cao (code) | Instant (toggle off) |

### Rollback Strategies

```
# Cách 1: Revert commit (Git-based)
git revert HEAD
git push

# Cách 2: Deploy lại version cũ (Image tag-based)
kubectl set image deployment/web web=registry/web:v1.2.0

# Cách 3: Blue/Green switch
# Chuyển load balancer từ green (mới) về blue (cũ)

# Cách 4: Feature flag off
# Tắt flag tính năng gây lỗi — không cần redeploy
```

---

## 3. Infrastructure as Code (IaC)

### Khái niệm

IaC là thực hành **quản lý infrastructure bằng code** thay vì cấu hình thủ công qua web console.

**Tư duy cốt lõi:** infrastructure cũng là software — cần version control, code review, CI/CD, testing.

### So sánh: Manual vs IaC

| Manual | IaC | Lý do IaC thắng |
|---|---|---|
| Click trên console | Viết code, apply | **Repeatable** — recreate environment trong 5 phút |
| Không lặp lại được | Reproducible | **Disaster recovery** — rebuild từ zero |
| Khó audit | Version control | **Who/when/why** — mỗi thay đổi có commit message |
| Dễ sai sót | Consistent | **Configuration drift detection** — plan so sánh desired vs actual |
| Không review được | Code review, PR | **Peer review** — 2 mắt tốt hơn 1 |

### Các công cụ IaC

| Công cụ | Loại | Đặc điểm | Ngôn ngữ | Phù hợp |
|---|---|---|---|---|
| **Terraform** | Provisioning | Multi-cloud, declarative, HCL | HCL | AWS/Azure/GCP general |
| **Pulumi** | Provisioning | Dùng ngôn ngữ lập trình thật | TS/Python/Go | Team muốn type safety |
| **AWS CloudFormation** | Provisioning | AWS-native, JSON/YAML | YAML/JSON | AWS only, enterprise |
| **AWS CDK** | Provisioning | Define in TS/Python, generates CFN | TypeScript | AWS + coding preferences |
| **Ansible** | Configuration | Agentless, YAML playbooks | YAML | Config management, patching |
| **Chef/Puppet** | Configuration | Agent-based, mature | Ruby DSL | Large-scale enterprise |

### Ví dụ: Terraform (xem chi tiết ở 8.6)

```hcl
# Tạo một EC2 instance trên AWS
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}

resource "aws_security_group" "web_sg" {
  name = "web-security-group"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

---

## 4. Containerization & Orchestration

### Container là gì?

Container là một **đơn vị đóng gói** chứa ứng dụng + dependencies, chạy **nhất quán** trên mọi môi trường. Khác VM ở chỗ container share host OS kernel — nhẹ hơn, khởi động nhanh hơn, density cao hơn.

### So sánh: VM vs Container

| | Virtual Machine | Container |
|---|---|---|
| **Size** | GB (full OS image) | MB (app + runtime only) |
| **Startup** | Phút (boot OS) | Giây (start process) |
| **Isolation** | Full OS (hardware virtualization) | Process-level (namespaces + cgroups) |
| **Resource** | Nặng (đổ đầy RAM cho OS) | Nhẹ (chỉ dùng内存 ứng dụng) |
| **Density** | Ít per host (5-10 VMs) | Nhiều per host (50-100 containers) |
| **Boot time** | 30-120 giây | 1-5 giây |
| **Snapshot** | Toàn bộ VM state | Container image layer |
| **Use case** | Legacy apps, full OS control | Microservices, CI/CD, cloud-native |

**Cơ chế cô lập của container:** Linux namespaces (PID, network, mount, UTS, IPC, user) + cgroups (resource limiting). Không phải "virtual machine thu nhỏ" — đó là tiến trình được giới hạn tài nguyên và nhìn thấy hệ thống file riêng.

### Docker

```dockerfile
# Dockerfile cho Node.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

### Kubernetes (K8s)

Kubernetes là nền tảng **orchestration** cho container — quản lý hàng nghìn container trên hàng trăm máy chủ.

| Khái niệm | Mô tả | analogy |
|---|---|---|
| **Pod** | Đơn vị nhỏ nhất, chứa 1+ container | "Quả táo" — thứ Kubernetes lên lịch chạy |
| **Deployment** | Quản lý replicas, rolling update | "Người quản lý fleet" — đảm bảo đúng số lượng pod chạy |
| **Service** | Stable network endpoint cho Pods | "Địa chỉ cố định" — pod có IP thay đổi, service thì không |
| **ConfigMap** | Configuration data (không sensitive) | "Thư mục config" — tách config khỏi image |
| **Secret** | Sensitive data (mã hóa base64) | "Safe" — mật khẩu, token, certificate |
| **Namespace** | Isolation logic giữa các team/env | "Căn hộ" — chia cluster thành các partition |
| **Ingress** | Route traffic từ ngoài vào | "Receptionist" — chuyển HTTP request đến service đúng |
| **PV/PVC** | Persistent Volume / Claim | "Ổ cứng rời" — dữ liệu sống còn container chết |

```yaml
# k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: myapp:1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
```

---

## 5. Monitoring & Observability

### Ba trụ cột của Observability

| Trụ cột | Mô tả | Công cụ | Câu hỏi trả lời |
|---|---|---|---|
| **Metrics** | Số liệu đo lường (CPU, memory, latency) | Prometheus, Grafana, Datadog | "Hệ thống đang như thế nào?" |
| **Logs** | Bản ghi sự kiện chi tiết | ELK Stack, Loki, CloudWatch | "Điều gì đã xảy ra?" |
| **Traces** | Theo dõi request qua nhiều services | Jaeger, Zipkin, OpenTelemetry | "Request đi đâu, tốn bao lâu?" |

### Monitoring vs Observability

| Monitoring | Observability |
|---|---|
| Trả lời: "Có lỗi không?" | Trả lời: "Tại sao lỗi?" |
| Dựa trên known failure modes | Xử lý unknown unknowns |
| Dashboard cố định, predefined | Khả năng explore tự do, ad-hoc query |
| Reactive (phát hiện alert rồi xử lý) | Proactive (hiểu system behavior) |
| Ví dụ: CPU > 90% = alert | Ví dụ: trace request, find slow DB query |

> 💡 **Quy tắc:** Monitoring = trả lời câu hỏi bạn đã biết. Observability = khám phá câu hỏi bạn chưa nghĩ tới.

### Các metrics quan trọng (Four Golden Signals)

| Signal | Mô tả | Ví dụ | Threshold cảnh báo |
|---|---|---|---|
| **Latency** | Thời gian xử lý request | p50, p90, p99 response time | p99 > 500ms |
| **Traffic** | Lượng request/demand | Requests per second | RPS tăng 3x bình thường |
| **Errors** | Tỷ lệ lỗi | 5xx rate, error percentage | 5xx > 1% |
| **Saturation** | Mức độ sử dụng tài nguyên | CPU %, memory %, disk I/O | Memory > 85% |

### Alerting Best Practices

```
✅ Alert trên symptoms, không phải causes
   → "Users can't checkout" thay vì "API latency > 500ms"
✅ Giảm alert fatigue — chỉ alert khi cần action
   → Nếu alert không dẫn đến hành động → bỏ nó
✅ Có runbook cho mỗi alert
   → "Nếu thấy X, làm Y, liên hệ Z"
✅ Phân cấp severity: Critical > Warning > Info
   → Critical = page on-call ngay; Warning = Slack; Info = log
✅ Set up on-call rotation
   → Không để 1 người chịu trách nhiệm 24/7
❌ Đừng alert mọi thứ
   → 50 alerts/ngày = bạn học cách bỏ qua tất cả
```

---

## 6. GitOps

### Khái niệm

GitOps là mô hình **sử dụng Git làm single source of truth** cho cả code lẫn infrastructure.

**Nguyên lý:** trạng thái mong muốn (desired state) được khai báo trong Git. Một agent chạy trong cluster liên tục so sánh desired state (Git) với actual state (cluster), và tự động reconcile khi có drift.

### Nguyên tắc GitOps

| Nguyên tắc | Mô tả | Ví dụ thực tế |
|---|---|---|
| **Declarative** | Mô tả desired state, không phải steps | "Tôi muốn 3 replicas" thay vì "scale lên 3" |
| **Versioned** | Mọi thay đổi đều qua Git | PR + review cho mỗi thay đổi infra |
| **Automated** | Agent tự động apply changes | ArgoCD detect diff → auto-sync |
| **Self-healing** | Tự phát hiện drift và reconcile | Someone edit k8s manually → ArgoCD overwrite |

### Quy trình GitOps

```
Developer → Push to Git
                ↓
        Git Repository
      (Source of Truth)
                ↓
   GitOps Agent (ArgoCD / Flux)
                ↓
      Detect diff with cluster
                ↓
   Auto-sync / Manual approve
                ↓
     Apply to Kubernetes
                ↓
     Health check + notify
```

### Công cụ GitOps

| Công cụ | Đặc điểm | Phù hợp |
|---|---|---|
| **ArgoCD** | UI trực quan, Kubernetes-native, multi-cluster | Team muốn visual dashboard |
| **Flux** | Lightweight, CNCF project, CLI-first | Team thích minimal, Git-native |
| **Rancher Fleet** | Multi-cluster management | Quản lý nhiều cluster từ 1 nơi |

---

## 7. Cloud Platforms

### So sánh 3 "Big Cloud"

| | AWS | Azure | GCP |
|---|---|---|---|
| **Compute** | EC2, Lambda | VM, Functions | Compute Engine, Cloud Functions |
| **Container** | ECS, EKS | AKS | GKE |
| **Database** | RDS, DynamoDB | Cosmos DB, SQL | Cloud SQL, Spanner |
| **Storage** | S3 | Blob Storage | Cloud Storage |
| **CI/CD** | CodePipeline | Azure DevOps | Cloud Build |
| **Market share** | ~31% | ~25% | ~11% |
| **Phù hợp nhất** | General purpose, largest ecosystem | Enterprise Microsoft shops | Data analytics, ML, K8s-native |

### Cloud-native Services

| Category | Mô tả | Ví dụ |
|---|---|---|
| **Serverless** | Chạy code không cần quản lý server (Lambda, Cloud Functions) | AWS Lambda, GCP Cloud Functions |
| **Managed DB** | Database được cloud quản lý (RDS, Cloud SQL) | Aurora, Cloud Spanner |
| **Message Queue** | Async communication (SQS, Pub/Sub) | SNS/SQS, Pub/Sub, EventGrid |
| **CDN** | Content delivery (CloudFront, Cloud CDN) | CloudFront, Azure CDN |
| **API Gateway** | Quản lý API (API Gateway) | API Gateway, Apigee |
| **Identity** | IAM, authentication | IAM, Azure AD, Identity Platform |

---

## Tổng kết

### DevOps Maturity Model

```
Level 0: Manual Everything
  ↓
Level 1: Version Control + Basic CI
  ↓
Level 2: Automated Testing + CD to Staging
  ↓
Level 3: Full CD + IaC + Containers
  ↓
Level 4: GitOps + Observability + Self-healing
  ↓
Level 5: Platform Engineering + Developer Experience
```

**Level 0→1** cần nhất: source control + basic CI. Đây là prerequisite cho mọi thứ khác.

**Level 4→5** là xu hướng hiện tại: Platform Engineering — xây dựng Internal Developer Platform (IDP) để developer tự phục vụ (self-service) infrastructure mà không cần callOps.

### Checklist DevOps cho dự án

```
□ Source code trong Git (GitHub/GitLab/Bitbucket)
□ CI pipeline (build + test tự động, < 10 phút)
□ CD pipeline (deploy staging tự động)
□ Containerized application (Docker)
□ Infrastructure as Code (Terraform/Pulumi)
□ Monitoring & Alerting (metrics + logs)
□ Log aggregation (ELK/Loki)
□ Backup & Disaster Recovery plan
□ Security scanning trong pipeline (SAST/DAST)
□ Documentation & Runbooks
□ Rollback strategy documented
□ On-call rotation configured
```

### Liên kết với các lớp khác

| Lớp | Liên kết |
|---|---|
| **Architecture** | Microservices cần DevOps mạnh để quản lý; Monolith vẫn cần CI |
| **Design Patterns** | Circuit Breaker, Retry pattern trong deployment |
| **Principles** | Automation, Fail Fast trong pipeline |
| **Paradigms** | Declarative (IaC, K8s YAML) vs Imperative (shell scripts) |
| **Techniques** | TDD giúp CI tin cậy, Code Review trong PR |
| **DSA** | Tối ưu pipeline performance (parallel jobs, caching) |
| **Testing** | Test là backbone của CI/CD — không test = không thể CD |

> 💡 **"DevOps is not a goal, but a never-ending process of continual improvement."** — Jez Humble
>
> **Đừngaim một maturity model hoàn hảo — aim cải thiện mỗi quarter.** Mục tiêu không phải đạt Level 5, mà là không còn đứng yên.
