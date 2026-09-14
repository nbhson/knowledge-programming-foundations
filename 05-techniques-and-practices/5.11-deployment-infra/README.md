# 🚀 5.11 Deployment & Infrastructure (Triển Khai & Cơ Sở Hạ Tầng)

> **Deployment & Infrastructure** là cách đưa ứng dụng từ local lên production — Docker, Kubernetes, Serverless, Feature Flags. Đây là cầu nối giữa "code chạy được trên máy tôi" và "code chạy ổn định cho 1 triệu user".

---

## 📚 Mục Lục

| # | Công Nghệ | Mục Đích |
|---|-----------|----------|
| 5.11.1 | [Docker](#5111-docker) | Containerization |
| 5.11.2 | [Kubernetes](#5112-kubernetes) | Container orchestration |
| 5.11.3 | [Serverless](#5113-serverless) | Run code without managing servers |
| 5.11.4 | [Feature Flags](#5114-feature-flags) | Toggle features without redeploy |
| 5.11.5 | [IaC — Terraform](#5115-iac-terraform) | Define infrastructure as code |
| 5.11.6 | [CI/CD Pipelines](#5116-cicd-pipelines) | Automated build-test-deploy |

---

## 5.11.1 Docker

**Container hóa application + dependencies.** Docker encapsulates mọi thứ một app cần (code, runtime, system tools, libraries, env vars) vào một container — đảm bảo "build once, run anywhere".

### Dockerfile (best practice)

```dockerfile
# Stage 1: Build — dùng image đầy đủ với build tools
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (leverage Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production — image nhỏ gọn chỉ runtime
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built output from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check — Kubernetes/docker dùng để probe存活
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/main.js"]
```

### docker-compose.yaml (local dev)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src        # hot-reload cho dev
      - /app/node_modules     # override với production node_modules

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### Docker Best Practices

| Practice | Why | Anti-pattern |
|----------|-----|--------------|
| Multi-stage build | Giảm image size từ ~1GB → ~150MB | `COPY . .` rồi `npm run build` trong 1 stage |
| Layer caching | `npm ci` chạy trước `COPY . .` → cache giữ nguyên khi chỉ đổi code | Copy toàn bộ trước khi install deps |
| Non-root user | Prevent container escape attacks | Chạy container với `root` |
| `.dockerignore` | Không gửi node_modules/dist lên Docker daemon | Không có .dockerignore → build chậm |
| Explicit tags | `myapp:v1.2.3` thay vì `latest` | Dùng `latest` cho production → không traceable |

---

## 5.11.2 Kubernetes

**Orchestration containers ở scale lớn.** Kubernetes (K8s) quản lý hàng trăm–nghìn containers tự động: scheduling, scaling, self-healing, rolling updates.

### Kiến trúc Cluster

```
┌─────────────────────────────────────────────────────────────┐
│                       KUBERNETES CLUSTER                    │
│                                                             │
│  ┌────────────────────── Master Node (Control Plane) ─────┐ │
│  │  apiserver  etcd  scheduler  controller-manager        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Worker 1 │    │ Worker 2 │    │ Worker 3 │              │
│  │  ┌────┐  │    │  ┌────┐  │    │  ┌────┐  │              │
│  │  │Pod │  │    │  │Pod │  │    │  │Pod │  │              │
│  │  │Pod │  │    │  │Pod │  │    │  │Pod │  │              │
│  │  └────┘  │    │  └────┘  │    │  └────┘  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Kubernetes YAML Definitions

```yaml
# Deployment — defines desired state: image, replicas, health
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate          # Rolling update — zero downtime
    rollingUpdate:
      maxSurge: 1                # Tối đa 1 pod extra trong lúc update
      maxUnavailable: 0          # Không được có pod unavailable
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v2.3.1
        ports:
        - containerPort: 3000
        resources:
          requests:              # QoS class: Guaranteed nếu requests == limits
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:           # Restart nếu app sập (health)
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:          # Không gửi traffic nếu chưa ready
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        envFrom:
          - configMapRef:
              name: myapp-config
          - secretRef:
              name: myapp-secrets

---
# Service — expose Deployment internally/externally
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP              # Internal only; ExternalTrafficPolicy: Local cho LoadBalancer

---
# ConfigMap — non-sensitive config
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v2"

---
# Secret — sensitive data (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@postgres-svc:5432/mydb"
  JWT_SECRET: "change-me-in-production"

---
# HorizontalPodAutoscaler — auto scale based on CPU/memory
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70   # Scale up khi CPU avg > 70%
```

### Key Kubernetes Objects

| Object | Purpose | Example |
|--------|---------|---------|
| **Pod** | Smallest deployable unit (1+ containers) | `myapp-7d9f8c6b-x2k9z` |
| **Deployment** | Manages Pod replicas + rolling updates | 3 replicas of `myapp:v2` |
| **Service** | Stable network endpoint for Pods | `myapp-service:80 → pods:3000` |
| **ConfigMap** | Non-sensitive env vars | `NODE_ENV=production` |
| **Secret** | Encoded sensitive data | DB passwords, API keys |
| **Ingress** | HTTP routing + TLS termination | `api.example.com → myapp-service` |
| **HPA** | Auto scale pods based on metrics | 2–20 replicas theo CPU |
| **PersistentVolume** | Storage beyond pod lifecycle | `pgdata: 50Gi` |

> 💡 **Pod lifespan:** Pod là ephemeral — nếu bị kill, K8s tạo pod mới với IP mới. Không bao giờ phụ thuộc vào IP hay tên pod. Dùng **Service** để có endpoint ổn định.

---

## 5.11.3 Serverless

**Run code không cần quản lý servers.** Serverless (FaaS — Function as a Service) executes code in response to events, auto-scales to zero, và charge per millisecond. AWS Lambda, Vercel Functions, Cloudflare Workers là phổ biến.

### AWS Lambda Handler (Node.js)

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing id parameter' }),
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
      body: JSON.stringify(user),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### Serverless Framework Config

```yaml
service: my-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  memorySize: 512        # MB — càng ít càng省钱 nhưng slow
  timeout: 10            # seconds — Lambda max 15 min
  environment:
    NODE_ENV: production
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:Query
          Resource: "arn:aws:dynamodb:us-east-1:*:table/MyTable"

functions:
  getUser:
    handler: handlers.getUser.handler
    events:
      - http:
          path: users/{id}
          method: get
          cors: true
    environment:
      TABLE_NAME: MyTable

  listUsers:
    handler: handlers.listUsers.handler
    events:
      - http:
          path: users
          method: get
          cors: true
    memorySize: 256        # Read-heavy → ít memory hơn

  createUser:
    handler: handlers.createUser.handler
    events:
      - http:
          path: users
          method: post
          cors: true
          request:
            schemas:
              application/json: ${file(schemas/create-user.json)}
```

### Serverless vs Containers: Decision

| | Serverless (Lambda) | Containers (ECS/EKS) |
|---|---|---|
| **Cold start** | 100–3000ms (first request) | 0ms (container đã warm) |
| **Scale to zero** | ✅ Tự động | ❌ Ít nhất 1 instance luôn chạy |
| **Max runtime** | 15 phút (Lambda) | Không giới hạn |
| **Cost model** | Pay per ms + invocations | Pay per hour per instance |
| **Best for** | Event-driven, sporadic traffic | Long-running, consistent traffic |
| **Ops overhead** | Thấp (managed) | Cao (self-managed or EKS) |

> ⚠️ **Misconception:** "Serverless永远比container便宜." Không đúng. Với traffic liên tục cao (e.g., 1000 req/s suốt ngày), serverless có thể đắt hơn 5–10x so với 2–3 containers chạy liên tục vì bạn pay per invocation.

---

## 5.11.4 Feature Flags

**Toggle features without redeploy.** Feature flags (feature toggles) cho phép bật/tắt tính năng runtime mà không cần release mới — then chốt cho CI/CD hiện đại.

### Basic Implementation

```typescript
// features.ts — centralized flag store
export interface FeatureFlags {
  'new-checkout-flow': boolean;
  'dark-mode': boolean;
  'beta-features': boolean;
  'experimental-search': boolean;
}

// Load from environment or remote config service (LaunchDarkly, Split, etc.)
const flags: FeatureFlags = {
  'new-checkout-flow': process.env.FEATURE_NEW_CHECKOUT === 'true',
  'dark-mode': false,  // default off
  'beta-features': process.env.BETA === 'true',
  'experimental-search': false,
};

// Per-user targeting (ví dụ: chỉ internal team thấy beta)
export function getFlagsForUser(userId: string): FeatureFlags {
  const baseFlags = { ...flags };

  // Internal employees always see beta features
  if (userId.startsWith('int-')) {
    baseFlags['beta-features'] = true;
    baseFlags['experimental-search'] = true;
  }

  return baseFlags;
}
```

```typescript
// Usage trong application
import { getFlagsForUser } from './features';

app.get('/checkout', (req, res) => {
  const flags = getFlagsForUser(req.userId);

  if (flags['new-checkout-flow']) {
    // New checkout flow
    res.render('checkout-v2', { user: req.user });
  } else {
    // Legacy checkout
    res.render('checkout-legacy', { user: req.user });
  }
});
```

### Advanced: A/B Testing với Feature Flags

```typescript
import { randomUUID } from 'crypto';

function getExperimentVariant(userId: string, flagKey: string): 'control' | 'treatment' {
  const hash = crypto.createHash('md5').update(`${userId}-${flagKey}`).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < 50 ? 'control' : 'treatment';  // 50/50 split
}

// Usage
const variant = getExperimentVariant(userId, 'new-checkout-flow');
if (variant === 'treatment') {
  // A: new checkout flow
} else {
  // B: legacy checkout flow
}
```

### 4 Use Cases chính

| Use Case | Mô tả | Ví dụ thực tế |
|----------|-------|---------------|
| **Canary release** | Rollout 5% → 25% → 50% → 100% | Facebook rollout dark mode dần dần |
| **A/B testing** | So sánh 2 phiên bản | Amazon: đổi màu nút "Buy Now" → tăng conversion 0.5% |
| **Kill switch** | Tắt tính năng lỗi ngay lập tức | Twitter rollback broken feature trong 30 giây |
| **Targeted release** | Internal → beta testers → all users | Slack preview feature chỉ cho paying customers |

---

## 5.11.5 IaC — Terraform

**Define infrastructure as code.** Terraform (HashiCorp) cho phép mô tả infrastructure (VPC, EC2, RDS, DNS...) bằng declarative config — reproducible, version-controlled, reversible.

```hcl
# main.tf — AWS infrastructure example
provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "myapp-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = { Name = "myapp-public-subnet" }
}

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.micro"
  db_name              = "myapp"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.db.id]
}

variable "aws_region"    { default = "us-east-1" }
variable "environment"   { default = "staging" }
variable "db_username"   { default = "admin" }
variable "db_password"   { sensitive = true }
```

---

## 5.11.6 CI/CD Pipelines

**Automated build-test-deploy.** CI (Continuous Integration) tự động build + test mỗi commit; CD (Continuous Deployment/Delivery) tự động deploy lên staging/production.

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp:${{ github.sha }} .
      - run: docker push myapp:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}

  deploy-prod:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
```

---

## 🧭 Deployment Strategies

| Strategy | Mô Tả | Risk | Time | Cost | Khi nào dùng |
|----------|-------|------|------|------|--------------|
| **Direct** | Deploy thẳng lên production | **Cao** — nếu lỗi, revert chậm | Nhanh nhất | Thấp nhất | Internal tool, dev env |
| **Blue-Green** | 2 env giống hệt, switch traffic instant | Thấp — revert = switch lại blue | Trung bình | Cao (2x infra) | High-traffic, critical systems |
| **Canary** | Rollout 10% → 50% → 100% + monitor | Thấp — phát hiện lỗi sớm | Chậm hơn | Trung bình | Production-facing, muốn safe rollout |
| **Feature Flags** | Deploy code mới nhưng toggle off | Thấp nhất — kill switch tức thì | Nhanh | Thấp (chỉ code mới) | A/B test, gradual rollout, kill switch |

### Blue-Green Diagram

```
Production live:    Blue (v1) ──┐
                           │ switch traffic (routing table change)
New deployed:       Green (v2) ─┘
                           │
                      Green live (v2)
                      Blue archived (keep warm for rollback)

Rollback: switch traffic back to Blue trong 10 giây
```

### Canary Diagram

```
Phase 1:  90% old + 10% new  → monitor errors/metrics
Phase 2:  50% old + 50% new  → nếu healthy tiếp tục
Phase 3:  0% old + 100% new  → rollback nếu phát hiện issue
```

---

## 🎯 Khi nào dùng công nghệ nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| App local/dev đơn giản | **Docker + docker-compose** | Reproducible environment, không cần K8s overhead |
| Production scale vừa (1–10 instance) | **Docker + ECS/Fargate** | Managed, auto-scale, cost-effective |
| Production scale lớn (> 10 service, complex deps) | **Kubernetes (EKS/GKE)** | Self-healing, auto-scaling, service mesh, multi-cloud |
| Sporadic/event-driven workloads (webhooks, scheduled jobs) | **Serverless** | Scale to zero, pay-per-use, zero ops |
| Consistent high traffic (API gateway, real-time) | **Containers** | Cold start là deal-breaker cho low-latency |
| A/B testing + gradual rollout | **Feature Flags + Canary** | Rollback instant, không cần redeploy |
| Infrastructure cần reproducible qua envs | **Terraform** | Dev/staging/prod consistent, version control infra |

---

## 🔗 Liên quan

- **1.2 Microservices** — Mỗi service có thể deploy riêng, cần orchestration
- **5.6 Error Handling** — Circuit breaker, retry trong distributed systems
- **5.8 Observability** — Metrics, tracing, logging cho deployment monitoring

---

## 📚 Tài liệu tham khảo

- 📖 [Docker Docs](https://docs.docker.com/)
- 📖 [Kubernetes Docs](https://kubernetes.io/docs/)
- 📖 [Serverless Framework](https://www.serverless.com/)
- 📖 [Terraform Docs](https://developer.hashicorp.com/terraform/docs)
- 📖 [LaunchDarkly Feature Flags](https://launchdarkly.com/)
- 📖 [GitOps với ArgoCD](https://argoproj.github.io/argo-cd/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.11-deployment-infra
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12 Functional Concepts](../5.12-functional-concepts/README.md)
