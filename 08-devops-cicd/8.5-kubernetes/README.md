# ☸️ 8.5 Kubernetes — Container Orchestration

> **Kubernetes (k8s)** là nền tảng orchestration containers phổ biến nhất, tự động hóa deploy, scale và quản lý containerized applications trên cụm máy chủ.

---

## 📚 Mục lục

- [Core Concepts](#core-concepts)
- [Basic kubectl Commands](#basic-kubectl-commands)
- [Manifest Examples](#manifest-examples)
- [Best Practices](#best-practices)

---

## Core Concepts

```
┌──────────────────────────────────────────────────────────────────┐
│                    KUBERNETES ARCHITECTURE                       │
│                                                                  │
│   ┌──────────────────────────────┐                              │
│   │         CONTROL PLANET       │                              │
│   │  ┌────────┐  ┌──────────┐    │                              │
│   │  │ API    │  │ Scheduler│    │                              │
│   │  │ Server │  │  Controller│   │                              │
│   │  └───┬────┘  └────┬─────┘    │                              │
│   │      │            │          │                              │
│   │  ┌───▼────────────▼─────┐    │                              │
│   │  │     etcd (State)     │    │                              │
│   │  └──────────────────────┘    │                              │
│   └──────────────┬───────────────┘                              │
│                  │kubectl/API                                    │
│   ┌──────────────▼───────────────┐                              │
│   │          WORKER NODES        │                              │
│   │  ┌──────────┐  ┌──────────┐  │                              │
│   │  │ Pod 1    │  │ Pod 2    │  │ ...                           │
│   │  │(container│  │(container│  │                              │
│   │  │  runtime)│  │  runtime)│  │                              │
│   │  └──────────┘  └──────────┘  │                              │
│   └──────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

| Resource | Mô tả |
|----------|-------|
| **Pod** | Đơn vị nhỏ nhất, chứa 1+ container |
| **Deployment** | Quản lý ReplicaSets, rollout updates |
| **Service** | Stable network endpoint cho Pods |
| **ConfigMap** | Configuration data (không sensitive) |
| **Secret** | Sensitive data (mã hóa base64) |
| **Namespace** | Partition cluster thành nhiều môi trường |

---

## Basic kubectl Commands

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Namespaces
kubectl get namespaces
kubectl config set-context --current --namespace=production

# Pods
kubectl get pods
kubectl get pods -o wide
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs <pod-name> -f           # Follow logs
kubectl exec -it <pod-name> -- sh   # Shell vào pod

# Deployments
kubectl get deployments
kubectl rollout status deployment/<name>
kubectl rollout undo deployment/<name>

# Services
kubectl get services
kubectl get svc -o wide

# ConfigMaps & Secrets
kubectl get configmaps
kubectl get secrets
kubectl describe secret <name>

# Apply manifest
kubectl apply -f deployment.yaml
kubectl apply -f .                   # Tất cả files trong thư mục
kubectl delete -f deployment.yaml
```

---

## Manifest Examples

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    env: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web
          image: myregistry/web-app:1.2.3
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP         # Internal only
  # type: LoadBalancer   # External cloud provider
  # type: NodePort       # Expose on node IP
```

### ConfigMap & Secret

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  API_URL: "https://api.example.com"
  LOG_LEVEL: "info"

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@db:5432/mydb"
  JWT_SECRET: "super-secret-key"
  API_KEY: "sk-abc123"
```

### Full stack example

```yaml
# k8s-manifests/ namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
  labels:
    env: production

---
# k8s-manifests/ deployment.yaml (như trên)

---
# k8s-manifests/ service.yaml (như trên)

---
# k8s-manifests/ ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-app-service
                port:
                  number: 80
```

---

## Best Practices

```
✅ LUÔN làm:
├─ Luôn đặt resource requests & limits
├─ Dùng liveness & readiness probes
├─ Áp dụng RollingUpdate strategy
├─ Phân tách config (ConfigMap) và secrets (Secret)
├─ Dùng Namespace để cách ly môi trường
└─ Tag image với version cụ thể, KHÔNG dùng 'latest'

❌ KHÔNG bao giờ:
├─ Deploy với replicas: 1 cho production
├─ Hardcode secrets trong manifest
├─ Bỏ qua resource limits (dễ OOM kill)
├─ Chạy container với root user
└─ Thiếu health checks
```

---

## Tổng kết

| Resource | Vai trò |
|----------|---------|
| **Pod** | Đơn vị cơ bản, gói container |
| **Deployment** | Quản lý replicas & rollout |
| **Service** | Networking stable endpoint |
| **ConfigMap** | Configuration values |
| **Secret** | Sensitive data |
| **Ingress** | HTTP routing từ outside |

```
┌──────────────────────────────────────────────────────────────┐
│              KUBERNETES QUICK REFERENCE                      │
│                                                              │
│  apply    → kubectl apply -f file.yaml                      │
│  get      → kubectl get pods/deploy/svc                     │
│  logs     → kubectl logs -f <pod>                           │
│  exec     → kubectl exec -it <pod> -- bash                  │
│  rollout  → kubectl rollout status/undo deployment/<name>   │
│  port-forward → kubectl port-forward svc/<name> 8080:80     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [Docker](../8.4-docker/README.md) | Container builds |
| [Terraform](../8.6-terraform/README.md) | Infrastructure provisioning |
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD to k8s |
