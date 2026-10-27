# ☸️ 8.5 Kubernetes — Container Orchestration

> **Kubernetes (k8s)** là nền tảng orchestration containers phổ biến nhất, tự động hóa deploy, scale và quản lý containerized applications trên cụm máy chủ.
> Ra đời 2014 bởi Google (dựa trên kinh nghiệm chạy Borg internals), giờ là CNCF project tiêu chuẩn industry.

---

## 📚 Mục lục

- [Kiến trúc Kubernetes](#kiến-trúc-kubernetes)
- [Core Concepts](#core-concepts)
- [Basic kubectl Commands](#basic-kubectl-commands)
- [Manifest Examples](#manifest-examples)
- [Deployment Strategies in K8s](#deployment-strategies-in-k8s)
- [Scaling](#scaling)
- [Best Practices](#best-practices)

---

## Kiến trúc Kubernetes

```
┌──────────────────────────────────────────────────────────────────┐
│                    KUBERNETES ARCHITECTURE                       │
│                                                                  │
│   ┌──────────────────────────────┐                              │
│   │         CONTROL PLANE        │  ← "Bộ não" của cluster      │
│   │                              │                              │
│   │  ┌──────────────┐            │                              │
│   │  │  API Server   │ ◄── kubectl ──► Developer                 │
│   │  │  (giám sát)   │            │                              │
│   │  └──────┬───────┘            │                              │
│   │         │                    │                              │
│   │  ┌──────▼───────┐            │                              │
│   │  │  Scheduler   │ ← Chọn node phù hợp cho pod mới          │
│   │  └──────┬───────┘            │                              │
│   │         │                    │                              │
│   │  ┌──────▼───────┐            │                              │
│   │  │Controller    │ ← Đảm bảo desired state = actual state   │
│   │  │  (Deployment, │            │                              │
│   │  │  ReplicaSet..)│           │                              │
│   │  └──────┬───────┘            │                              │
│   │         │                    │                              │
│   │  ┌──────▼───────┐            │                              │
│   │  │  etcd        │ ← Database lưu toàn bộ cluster state     │
│   │  │  (consistent)│            │                              │
│   │  └──────────────┘            │                              │
│   └──────────────┬───────────────┘                              │
│                  │API Server (HTTPS:6443)                        │
│   ┌──────────────▼───────────────┐                              │
│   │          WORKER NODES        │  ← "Cơ bắp" chạy workloads   │
│   │  ┌──────────┐  ┌──────────┐  │                              │
│   │  │ Node 1   │  │ Node 2   │  │ ...                           │
│   │  │ ┌──────┐ │  │ ┌──────┐ │  │                              │
│   │  │ │Pod 1 │ │  │ │Pod 3 │ │  │                              │
│   │  │ │Pod 2 │ │  │ │Pod 4 │ │  │                              │
│   │  │ └──────┘ │  │ └──────┘ │  │                              │
│   │  └──────────┘  └──────────┘  │                              │
│   └──────────────────────────────┘                              │
│                                                                  │
│  Mỗi Node chạy: kubelet (agent), kube-proxy (networking),       │
│  container runtime (containerd / CRI-O)                          │
└──────────────────────────────────────────────────────────────────┘
```

### Control Plane Components

| Component | Vai trò |
|---|---|
| **API Server** | Entry point duy nhất cho mọi tương tác (kubectl, UI, controllers) |
| **etcd** | Key-value store lưu toàn bộ cluster state — must-have consistency |
| **Scheduler** | Quyết định pod chạy trên node nào (phù resource, affinity, taints) |
| **Controller Manager** | Chạy các controller loop: deployment, replica, node, endpoint |
| **Cloud Controller** | Tích hợp với cloud provider (AWS LB, GCP routing) |

### Worker Node Components

| Component | Vai trò |
|---|---|
| **kubelet** | Agent trên mỗi node, đảm bảo containers chạy đúng như manifest |
| **kube-proxy** | Network proxy, implement Service (ClusterIP, NodePort, LoadBalancer) |
| **Container runtime** | Chạy containers: containerd, CRI-O, docker (deprecated) |

---

## Core Concepts

### Pod — Đơn vị nhỏ nhất

Pod là "quả táo" cơ bản của Kubernetes — một hoặc nhiều containers chạy cùng nhau, chia sẻ network namespace và volume.

```
┌─────────────────┐
│     Pod         │  ← 1 IP duy nhất cho cả pod
│  ┌───────────┐  │
│  │ Container │  │     ← sidecar pattern: logging, proxy, monitoring
│  │  (app)    │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │ Container │  │     ← init container: setup trước (migrate DB)
│  │  (init)   │  │
│  └───────────┘  │
│  [Shared Volume]│
└─────────────────┘
```

| Resource | Vai trò |
|----------|---------|
| **Pod** | Đơn vị cơ bản, gói 1+ container share network + storage |
| **Deployment** | Quản lý replicas & rollout (rolling update, rollback) |
| **Service** | Stable network endpoint cho Pods (vì Pod IP thay đổi) |
| **ConfigMap** | Configuration values (không sensitive) |
| **Secret** | Sensitive data (base64-encoded, NOT encrypted at rest by default) |
| **Ingress** | HTTP routing từ outside vào Services |
| **Namespace** | Partition cluster thành nhiều môi trường (dev/staging/prod) |
| **PV/PVC** | Persistent Volume / Claim — data sống còn container chết |
| **Namespace** | Isolation logic giữa các team/env |

### Service Types

| Type | Mô tả | Use case |
|------|-------|----------|
| **ClusterIP** | Internal only, IP trong cluster | Service-to-service communication |
| **NodePort** | Expose trên port mỗi node | Debugging, internal tools |
| **LoadBalancer** | Cloud provider LB | Public-facing apps |
| **ExternalName** | CNAME đến external service | Access external services (Stripe, DBaaS) |

---

## Basic kubectl Commands

```bash
# Cluster info
kubectl cluster-info                  # Xem cluster endpoint
kubectl get nodes                     # Danh sách nodes
kubectl describe node node-1          # Chi tiết node (capacity, conditions)

# Namespaces
kubectl get namespaces
kubectl config set-context --current --namespace=production

# Pods
kubectl get pods                      # Tất cả pods
kubectl get pods -o wide              # Thêm IP, node info
kubectl get pods --all-namespaces     # Pods across all namespaces
kubectl describe pod <pod-name>       # Chi tiết pod (events, container status)
kubectl logs <pod-name>               # Xem logs
kubectl logs <pod-name> -f           # Follow logs (real-time)
kubectl logs <pod-name> -c sidecar   # Logs của specific container
kubectl exec -it <pod-name> -- sh    # Shell vào pod
kubectl exec -it <pod-name> -- node -e "console.log('hi')"

# Deployments
kubectl get deployments
kubectl rollout status deployment/<name>    # Trạng thái rollout
kubectl rollout undo deployment/<name>      # Rollback về revision trước
kubectl scale deployment/<name> --replicas=5  # Scale manual

# Services
kubectl get services
kubectl get svc -o wide
kubectl port-forward svc/web-app 8080:3000   # Forward local port to service

# ConfigMaps & Secrets
kubectl get configmaps
kubectl get secrets
kubectl describe secret <name>               # Xem metadata (không hiện giá trị)
kubectl create secret generic db-creds \     # Tạo secret từ lệnh
  --from-literal=user=admin \
  --from-literal=password=secret

# Apply manifest
kubectl apply -f deployment.yaml
kubectl apply -f .                   # Tất cả files trong thư mục
kubectl delete -f deployment.yaml
kubectl get all -n production        # Xem tất cả resources trong namespace

# Debugging
kubectl top pods                     # Resource usage (requires metrics-server)
kubectl top nodes
kubectl events --field-selector reason=FailedScheduling
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
  replicas: 3                         # Số pod muốn chạy
  selector:
    matchLabels:
      app: web-app
  strategy:
    type: RollingUpdate               # Chiến lược deploy
    rollingUpdate:
      maxSurge: 1                     # Tối đa 1 podextra trong lúc update
      maxUnavailable: 0               # Không được ngừng pod nào trong lúc update
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: web
          image: myregistry/web-app:1.2.3   # Tag cụ thể — KHÔNG dùng latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          resources:
            requests:                 # Bảo đảm tài nguyên tối thiểu
              memory: "128Mi"
              cpu: "250m"
            limits:                   # Ngăn container chiếm hết tài nguyên
              memory: "512Mi"
              cpu: "1000m"
          livenessProbe:              # Kiểm tra container có "sống" không
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:             # Kiểm tra container sẵn sàng nhận traffic
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
    app: web-app          # Match với pod labels
  ports:
    - protocol: TCP
      port: 80            # Port service expose
      targetPort: 3000    # Port container nghe
  type: ClusterIP         # Internal only
  # type: LoadBalancer   # External (cloud provider LB)
  # type: NodePort       # Expose on node IP + port
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
  JWT_SECRET: "your-256-bit-secret-key-here"
  API_KEY: "sk-your-api-key"
```

> ⚠️ **Lưu ý:** Secret trong Kubernetes chỉ base64 encode — không phải encryption. Để bảo mật thật sự, dùng External Secrets Operator hoặc Sealed Secrets.

### Full stack example (Namespace + Deployment + Service + Ingress)

```yaml
# k8s-manifests/ namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
  labels:
    env: production

---
# k8s-manifests/ ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
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

## Deployment Strategies in K8s

| Strategy | Cách triển khai | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **RollingUpdate** (mặc định) | `strategy.type: RollingUpdate` | Zero downtime, tiết kiệm tài nguyên | Rollback chậm (phải reverse rolling) |
| **Recreate** | `strategy.type: Recreate` | Đơn giản, không có version mix | Có downtime |
| **Blue/Green** | 2 Deployment + Service switch | Rollback instant (đổi selector) | Tốn tài nguyên gấp đôi |
| **Canary** | Deployment 1% → 10% → 100% | Gradual rollout, phát hiện lỗi sớm | Cần tool bổ sung (Argo Rollouts) |

**RollingUpdate config:**

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1           # Tối đa 1 pod extra so với replicas
    maxUnavailable: 0     # Không được ngừng pod nào đang chạy
```

---

## Scaling

### Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # Scale up khi CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Vertical Pod Autoscaler (VPA)

Tự động điều chỉnh `requests` và `limits` của container dựa trên usage thực tế. Cần restart pod khi apply.

---

## Best Practices

```
✅ LUÔN làm:
├─ Luôn đặt resource requests & limits (ngăn noisy neighbor)
├─ Dùng liveness & readiness probes (traffic chỉ vào pod healthy)
├─ Áp dụng RollingUpdate strategy (zero downtime)
├─ Phân tách config (ConfigMap) và secrets (Secret) — không hardcode
├─ Dùng Namespace để cách ly môi trường (dev/staging/prod)
├─ Tag image với version cụ thể, KHÔNG dùng 'latest'
├─ Đặt replicas ≥ 2 cho production (high availability)
├─ Dùng PodDisruptionBudget (PDB) để bảo vệ trong maintenance
└─ Label tất cả resources cho dễ manage và policy enforcement

❌ KHÔNG bao giờ:
├─ Deploy với replicas: 1 cho production (single point of failure)
├─ Hardcode secrets trong manifest (dùng Secret + external secret manager)
├─ Bỏ qua resource limits (dễ OOM kill ảnh hưởng node)
├─ Chạy container với root user (security risk)
├─ Thiếu health checks (traffic vẫn gửi đến pod chưa ready)
├─ Để etcd chạy trên cùng node với workloads (cách ly control plane)
└─ Xóa Deployment mà không có PDB (disrupt tất cả pod cùng lúc)
```

---

## Tổng kết

| Resource | Vai trò | analogy |
|----------|---------|---------|
| **Pod** | Đơn vị cơ bản, gói container | "Container wrapper" — thứ được lên lịch chạy |
| **Deployment** | Quản lý replicas & rollout | "Quản lý fleet" — đảm bảo đúng số lượng pod |
| **Service** | Networking stable endpoint | "Địa chỉ cố định" — pod IP thay đổi, service thì không |
| **ConfigMap** | Configuration values | "Thư mục config" — tách khỏi image |
| **Secret** | Sensitive data | "Safe" — mật khẩu, token |
| **Ingress** | HTTP routing từ outside | "Receptionist" — chuyển request đến service đúng |
| **HPA** | Auto-scaling theo CPU/memory | "Nhân viên tự động" — thêm/xóa pod theo tải |

```
┌──────────────────────────────────────────────────────────────┐
│              KUBERNETES QUICK REFERENCE                      │
│                                                              │
│  apply    → kubectl apply -f file.yaml                      │
│  get      → kubectl get pods/deploy/svc -o wide             │
│  logs     → kubectl logs -f <pod>                           │
│  exec     → kubectl exec -it <pod> -- bash                  │
│  rollout  → kubectl rollout status/undo deployment/<name>   │
│  port-forward → kubectl port-forward svc/<name> 8080:80     │
│  scale    → kubectl scale deployment/<name> --replicas=5    │
│  cordon   → kubectl cordon <node> (drain before maintenance)│
│                                                              │
│  Command cheat:                                              │
│  kubectl get <resource> [-n <namespace>] [-l <label>]       │
│  kubectl describe <resource> <name>                         │
│  kubectl logs <pod> -f --tail=100                           │
│                                                              │
│  Alternatives: Docker Swarm / Nomad / EKS / GKE / AKS      │
└──────────────────────────────────────────────────────────────┘
```

> 💡 **Ghi nhớ:** Kubernetes giải quyết vấn đề **quản lý hàng nghìn container trên hàng trăm máy** — không phải vấn đề "làm thế nào để deploy 1 app". Nếu bạn chỉ có 1-2 server, Docker Compose đủ rồi.

---

## ▶️ Chạy ví dụ

Chạy demo manifest YAML + mô phỏng reconcile loop:

```bash
cd 08-devops-cicd/8.5-kubernetes
npx tsx examples/index.ts
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [Docker](../8.4-docker/README.md) | Container builds — prerequisite cho K8s |
| [Terraform](../8.6-terraform/README.md) | Provisioning K8s cluster (EKS/GKE/AKS) |
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD pipeline deploy lên K8s |
| [Jenkins](../8.3-jenkins/README.md) | Pipeline alternative với K8s agent |
