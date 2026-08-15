# 🚀 Lớp 8: DevOps & CI/CD

> **DevOps** là **văn hóa và tập hợp các thực hành** kết nối phát triển (Dev) và vận hành (Ops),
> giúp **tự động hóa, tăng tốc và đảm bảo chất lượng** toàn bộ vòng đời phần mềm.

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

### Vòng đời DevOps (DevOps Lifecycle)

```
Plan → Code → Build → Test → Release → Deploy → Operate → Monitor
  ↑                                                           |
  └───────────────── Feedback Loop ───────────────────────────┘
```

### Tại sao cần DevOps?

| Không có DevOps | Có DevOps |
|---|---|
| Deploy thủ công, hay lỗi | Deploy tự động, nhất quán |
| "Ở máy tôi chạy được" | Môi trường nhất quán (Container) |
| Phát hiện lỗi muộn | Phát hiện lỗi sớm (CI) |
| Release chậm (tháng/quý) | Release nhanh (ngày/giờ) |
| Không biết hệ thống lỗi khi nào | Giám sát 24/7, cảnh báo tự động |

---

## 1. CI — Continuous Integration

### Khái niệm

CI là thực hành **merge code thường xuyên** vào nhánh chính, mỗi lần merge đều **tự động build + test**.

### Quy trình CI điển hình

```
Developer push code
       ↓
  Trigger CI Pipeline
       ↓
  ┌─────────────┐
  │  Checkout    │
  │  Install     │
  │  Lint        │
  │  Build       │
  │  Unit Test   │
  │  Integration │
  └─────────────┘
       ↓
  ✅ Pass → Merge allowed
  ❌ Fail → Block merge, notify
```

### Các nguyên tắc CI

| Nguyên tắc | Mô tả |
|---|---|
| **Commit thường xuyên** | Commit nhỏ, nhiều lần/ngày |
| **Automated build** | Mỗi commit tự động trigger build |
| **Automated test** | Test chạy tự động, không manual |
| **Fast feedback** | Pipeline chạy nhanh (< 10 phút lý tưởng) |
| **Fix broken build ngay** | Build fail = ưu tiên #1 |

### Công cụ CI phổ biến

| Công cụ | Đặc điểm |
|---|---|
| **GitHub Actions** | Tích hợp sẵn GitHub, YAML config |
| **GitLab CI** | Tích hợp sẵn GitLab, mạnh mẽ |
| **Jenkins** | Open-source, linh hoạt, plugin ecosystem |
| **CircleCI** | Cloud-native, nhanh |
| **Travis CI** | Đơn giản, phổ biến với open-source |

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
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Test
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 2. CD — Continuous Delivery / Deployment

### Phân biệt Delivery vs Deployment

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| **Định nghĩa** | Code luôn sẵn sàng deploy | Code tự động deploy lên production |
| **Manual step** | Có (approve trước khi deploy) | Không (hoàn toàn tự động) |
| **Risk** | Thấp hơn (có human review) | Cần test coverage cao |
| **Phù hợp** | Enterprise, regulated | SaaS, startup, web app |

### Pipeline CD điển hình

```
CI Pass
  ↓
Build Artifact / Docker Image
  ↓
Deploy to Staging
  ↓
Run Smoke Tests / E2E Tests
  ↓
Manual Approval (Delivery) hoặc Auto (Deployment)
  ↓
Deploy to Production
  ↓
Post-deploy verification
  ↓
Monitor & Rollback if needed
```

### Deployment Strategies

| Strategy | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Rolling** | Thay thế từng instance | Zero downtime | Rollback chậm |
| **Blue/Green** | 2 môi trường, switch traffic | Rollback nhanh | Tốn tài nguyên gấp đôi |
| **Canary** | Deploy cho % nhỏ users trước | Phát hiện lỗi sớm | Phức tạp hơn |
| **Feature Flags** | Toggle tính năng bằng config | Linh hoạt, A/B test | Code complexity |
| **Recreate** | Tắt hết → deploy mới | Đơn giản | Có downtime |

---

## 3. Infrastructure as Code (IaC)

### Khái niệm

IaC là thực hành **quản lý infrastructure bằng code** thay vì cấu hình thủ công.

### So sánh: Manual vs IaC

| Manual | IaC |
|---|---|
| Click trên console | Viết code, apply |
| Không lặp lại được | Reproducible |
| Khó audit | Version control |
| Dễ sai sót | Consistent |
| Không review được | Code review, PR |

### Các công cụ IaC

| Công cụ | Loại | Đặc điểm |
|---|---|---|
| **Terraform** | Provisioning | Multi-cloud, declarative, HCL |
| **Pulumi** | Provisioning | Dùng ngôn ngữ lập trình thật |
| **AWS CloudFormation** | Provisioning | AWS-native, JSON/YAML |
| **Ansible** | Configuration | Agentless, YAML playbooks |
| **Chef/Puppet** | Configuration | Agent-based, mature |

### Ví dụ: Terraform

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

Container là một **đơn vị đóng gói** chứa ứng dụng + dependencies, chạy **nhất quán** trên mọi môi trường.

### So sánh: VM vs Container

| | Virtual Machine | Container |
|---|---|---|
| **Size** | GB | MB |
| **Startup** | Phút | Giây |
| **Isolation** | Full OS | Process-level |
| **Resource** | Nặng | Nhẹ |
| **Density** | Ít per host | Nhiều per host |

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

Kubernetes là nền tảng **orchestration** cho container:

| Khái niệm | Mô tả |
|---|---|
| **Pod** | Đơn vị nhỏ nhất, chứa 1+ container |
| **Service** | Expose Pod ra network |
| **Deployment** | Quản lý replicas, rolling update |
| **ConfigMap/Secret** | Quản lý config và secrets |
| **Ingress** | Route traffic từ ngoài vào |
| **Namespace** | Isolation logic giữa các team/env |

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

| Trụ cột | Mô tả | Công cụ |
|---|---|---|
| **Metrics** | Số liệu đo lường (CPU, memory, latency) | Prometheus, Grafana, Datadog |
| **Logs** | Bản ghi sự kiện chi tiết | ELK Stack, Loki, CloudWatch |
| **Traces** | Theo dõi request qua nhiều services | Jaeger, Zipkin, OpenTelemetry |

### Monitoring vs Observability

| Monitoring | Observability |
|---|---|
| Trả lời: "Có lỗi không?" | Trả lời: "Tại sao lỗi?" |
| Dựa trên known failure | Xử lý unknown failure |
| Dashboard cố định | Khả năng explore tự do |
| Reactive | Proactive |

### Các metrics quan trọng (Four Golden Signals)

| Signal | Mô tả | Ví dụ |
|---|---|---|
| **Latency** | Thời gian xử lý request | p50, p90, p99 response time |
| **Traffic** | Lượng request/demand | Requests per second |
| **Errors** | Tỷ lệ lỗi | 5xx rate, error percentage |
| **Saturation** | Mức độ sử dụng tài nguyên | CPU %, memory %, disk I/O |

### Alerting Best Practices

```
✅ Alert trên symptoms, không phải causes
✅ Giảm alert fatigue — chỉ alert khi cần action
✅ Có runbook cho mỗi alert
✅ Phân cấp severity: Critical > Warning > Info
✅ Set up on-call rotation
```

---

## 6. GitOps

### Khái niệm

GitOps là mô hình **sử dụng Git làm single source of truth** cho cả code lẫn infrastructure.

### Nguyên tắc GitOps

| Nguyên tắc | Mô tả |
|---|---|
| **Declarative** | Mô tả desired state, không phải steps |
| **Versioned** | Mọi thay đổi đều qua Git |
| **Automated** | Agent tự động apply changes |
| **Self-healing** | Tự phát hiện drift và reconcile |

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
```

### Công cụ GitOps

| Công cụ | Đặc điểm |
|---|---|
| **ArgoCD** | UI trực quan, Kubernetes-native |
| **Flux** | Lightweight, CNCF project |
| **Rancher Fleet** | Multi-cluster management |

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

### Cloud-native Services

| Category | Mô tả |
|---|---|
| **Serverless** | Chạy code không cần quản lý server (Lambda, Cloud Functions) |
| **Managed DB** | Database được cloud quản lý (RDS, Cloud SQL) |
| **Message Queue** | Async communication (SQS, Pub/Sub) |
| **CDN** | Content delivery (CloudFront, Cloud CDN) |
| **API Gateway** | Quản lý API (API Gateway) |

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

### Checklist DevOps cho dự án

```
□ Source code trong Git
□ CI pipeline (build + test tự động)
□ CD pipeline (deploy tự động)
□ Containerized application (Docker)
□ Infrastructure as Code
□ Monitoring & Alerting
□ Log aggregation
□ Backup & Disaster Recovery plan
□ Security scanning trong pipeline
□ Documentation & Runbooks
```

### Liên kết với các lớp khác

| Lớp | Liên kết |
|---|---|
| **Architecture** | Microservices cần DevOps mạnh để quản lý |
| **Design Patterns** | Circuit Breaker, Retry pattern trong deployment |
| **Principles** | Automation, Fail Fast trong pipeline |
| **Paradigms** | Declarative (IaC, K8s YAML) |
| **Techniques** | TDD giúp CI tin cậy, Code Review trong PR |
| **DSA** | Tối ưu pipeline performance |
| **Testing** | Test là backbone của CI/CD |

> 💡 **"DevOps is not a goal, but a never-ending process of continual improvement."** — Jez Humble