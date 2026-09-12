# 🚀 5.11 Deployment & Infrastructure (Triển Khai & Cơ Sở Hạ Tầng)

> **Deployment & Infrastructure** là cách đưa ứng dụng từ local lên production — Docker, Kubernetes, Serverless, Feature Flags.

---

## 📚 Mục Lục

| # | Công Nghệ | Mục Đích |
|---|-----------|----------|
| 5.11.1 | [Docker](#5111-docker) | Containerization |
| 5.11.2 | [Kubernetes](#5112-kubernetes) | Container orchestration |
| 5.11.3 | [Serverless](#5113-serverless) | Run code without managing servers |
| 5.11.4 | [Feature Flags](#5114-feature-flags) | Toggle features without redeploy |

---

## 5.11.1 Docker

**Container hóa application + dependencies.**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```bash
# Build và chạy
docker build -t myapp:v1 .
docker run -p 3000:3000 myapp:v1
```

**docker-compose.yaml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

✅ **Ưu điểm:** Reproducible, portable, isolation
❌ **Nhược điểm:** Learning curve, resource overhead

---

## 5.11.2 Kubernetes

**Orchestration containers ở scale lớn.**

```
┌─────────────────────────────────────────────────────┐
│                    Cluster                           │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Pod 1   │    │  Pod 2   │    │  Pod 3   │      │
│  │  (App)   │    │  (App)   │    │  (App)   │      │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘      │
│       │               │               │             │
│  ┌────▼───────────────▼───────────────▼─────┐      │
│  │           Service (Load Balancer)         │      │
│  └───────────────────┬───────────────────────┘      │
│                      │                              │
│              ┌───────▼───────┐                      │
│              │   Ingress     │ ← external traffic  │
│              └───────────────┘                      │
└─────────────────────────────────────────────────────┘
```

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v1
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"
---
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
  type: LoadBalancer
```

---

## 5.11.3 Serverless

**Run code không cần quản lý server.**

```typescript
// AWS Lambda handler
export const handler = async (event: any) => {
  const userId = event.pathParameters.id;
  
  const user = await db.users.findById(userId);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  };
};
```

```yaml
# serverless.yml
service: my-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  getUser:
    handler: handlers.getUser
    events:
      - http:
          path: users/{id}
          method: get
```

**Các provider:**
- AWS Lambda
- Vercel Functions
- Cloudflare Workers
- Google Cloud Functions

✅ **Ưu điểm:** Auto-scale, pay-per-use, zero ops
❌ **Nhược điểm:** Cold starts, vendor lock-in

---

## 5.11.4 Feature Flags

**Toggle features without redeploy.**

```typescript
// Feature flag service
interface FeatureFlags {
  'new-checkout': boolean;
  'dark-mode': boolean;
  'beta-features': boolean;
}

const flags: FeatureFlags = {
  'new-checkout': true,
  'dark-mode': false,
  'beta-features': process.env.BETA === 'true'
};

// Usage
if (flags['new-checkout']) {
  // New checkout flow
} else {
  // Legacy checkout flow
}

// A/B testing
const isExperimental = flags['beta-features'] && Math.random() > 0.5;
```

**Use cases:**
- Roll out features gradually (canary deployment)
- A/B testing
- Kill switch (turn off broken feature instantly)
- Targeted release (internal → beta → all)

---

## 🧭 Deployment Strategies

| Strategy | Mô Tả | Risk |
|----------|-------|------|
| **Direct** | Deploy thẳng | Cao |
| **Blue-Green** | 2 env, switch traffic | Thấp |
| **Canary** | Roll out cho 10% users trước | Thấp |
| **Feature Flags** | Toggle features | Thấp nhất |

```
Blue-Green:
  Blue (live) ──deploy──▶ Green (new)
                            │
                    switch traffic
                            ▼
  Blue (archived) ◀─Green (live)

Canary:
  100% traffic ──▶ 90% old + 10% new
                      │
                 monitor health
                      │
                  100% new ✓
```

---

## 🔗 Liên quan

- **1.2 Microservices** — Mỗi service có thể deploy riêng
- **5.6 Error Handling** — Circuit breaker trong microservices

---

## 📚 Tài liệu tham khảo

- 📖 [Docker Docs](https://docs.docker.com/)
- 📖 [Kubernetes Docs](https://kubernetes.io/docs/)
- 📖 [Serverless Framework](https://www.serverless.com/)
- 📖 [LaunchDarkly Feature Flags](https://launchdarkly.com/)

---

## ⏭️ Bài tiếp theo

→ [5.12 Functional Concepts](../5.12-functional-concepts/README.md)
