# ☸️ 5.11.2 Kubernetes (Container Orchestration)

> **Kubernetes** điều phối nhiều container thành **cluster**: khai báo trạng thái mong muốn (desired state) bằng **manifest YAML**, controller liên tục giữ đúng trạng thái đó.

---

## 🎯 Các khái niệm

| Khái niệm | Vai trò |
|-----------|---------|
| **Pod** | Đơn vị chạy nhỏ nhất (1+ container) |
| **Deployment** | Quản lý replicas của pod |
| **Service** | Load balancer ổn định địa chỉ truy cập pod |
| **Ingress** | Cửa vào traffic từ bên ngoài |
| **Controller** | Vòng lặp giữ trạng thái hiện tại = trạng thái mong muốn |

```
Cluster
  Pod x4 (app)  ──▶  Service (LB)  ──▶  Ingress  ──▶  traffic ngoài
```

---

## 💻 Manifest (YAML)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
  selector:
    matchLabels: { app: myapp }
  template:
    metadata: { labels: { app: myapp } }
    spec:
      containers:
      - name: myapp
        image: myapp:v1
        ports: [{ containerPort: 3000 }]
```

---

## 💻 Code ví dụ — Rolling update

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class MiniK8sController {
  rollingUpdate(newImage: string, maxUnavailable: number): void {
    // thay image từng nhóm pod, giữa nhóm có readiness probe
    for (let batch = 0; batch < total; batch += maxUnavailable) {
      // old pods ngừng nhận traffic → new pods sẵn sàng rồi mới tiếp
    }
  }
}
```

**Rolling update:** `maxUnavailable=2` → đổi 2 pod/lượt, không bao giờ đánh sập toàn bộ → **zero downtime**.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚖️ **Tự scale** | Horizontal Pod Autoscaler theo CPU/mem |
| ♻️ **Tự phục hồi** | Pod chết được tạo lại |
| 🔁 **Rolling update** | Deploy không downtime |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🐘 **Nặng** | Cluster cần nhiều node để vận hành |
| 📚 **Phức tạp** | YAML, networking, RBAC, storage |
| 🎛️ **Ops burden** | Cần đội vận hành hạ tầng |

---

## ❌ BAD — thêm 1 case: Deployment không probe + resource trần

```yaml
# ❌ BAD — pod treo vẫn nhận traffic (không probe), 1 pod ngốn hết node (không limit)
apiVersion: apps/v1
kind: Deployment
metadata: { name: myapp }
spec:
  replicas: 4
  template:
    spec:
      containers:
      - name: myapp
        image: myapp:1.4.2
        ports: [{ containerPort: 3000 }]
        # không liveness/readiness → treo vẫn ăn request → 500 hàng loạt khi rolling update

# ✅ GOOD — probe + requests/limits (trích phần containers)
      # containers:
      # - name: myapp
      #   image: myapp:1.4.2
      #   readinessProbe: { httpGet: { path: /health, port: 3000 }, periodSeconds: 5 }
      #   livenessProbe: { httpGet: { path: /health, port: 3000 }, periodSeconds: 10 }
      #   resources:
      #     requests: { cpu: "100m", memory: "128Mi" }
      #     limits: { cpu: "500m", memory: "512Mi" }
```

> Không probe = K8s mù (không biết pod nào sống/chết). Không limit = 1 pod lỗi có thể đè chết cả node. Cả 2 đều bắt buộc ở prod.

---

## ⚖️ Trade-off: Kubernetes vs Docker Compose vs Serverless (5.11.3)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Chục service, cần autoscale/self-heal/rolling | ✅ Kubernetes | Sinh ra đúng cho việc này |
| 2–3 container 1 máy, team nhỏ | ⚖️ Docker Compose | 1 file YAML chạy được, không học K8s |
| Traffic thất thường, rảnh = 0 | ⚖️ Serverless | Không nuôi cluster lúc không ai dùng |
| Chưa có người vận hành | 🚫 Khoan K8s | K8s không người chăm = cluster treo lúc 2h sáng |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Thiếu readinessProbe | Rolling update đánh traffic vào pod chưa sẵn sàng → 502 | readinessProbe là bắt buộc, không phải optional |
| `image: latest` trong manifest | Không biết pod đang chạy bản nào, rollback mù | Tag version + `imagePullPolicy: IfNotPresent` |
| Config/secret trong image | Đổi config phải build lại; secret lộ | ConfigMap/Secret mount lúc deploy, theo môi trường |
| 1 namespace cho cả staging + prod | Test nhầm xóa pod prod | Namespace (hoặc cluster) riêng + RBAC + resource quota |

---

## ✅ Checklist khi review

- [ ] Có cả readinessProbe và livenessProbe?
- [ ] Có `requests` + `limits` CPU/memory?
- [ ] Image tag version cụ thể (không `latest`)?
- [ ] Config/secret qua ConfigMap/Secret (không bake vào image)?
- [ ] Namespace/RBAC tách môi trường (staging ≠ prod)?

---

## 🔗 Liên quan

- **5.11.1 Docker** — Container là đơn vị pod chạy
- **5.11.3 Serverless** — Lựa chọn không cần quản lý cluster
- **8.5 Kubernetes** — DevOps: CI/CD lên K8s

---

## 📚 Tài liệu tham khảo

- 📖 [Kubernetes Docs](https://kubernetes.io/docs/)
- 📖 [Deployment - rolling update](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.11.2-kubernetes
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11.3 Serverless](../5.11.3-serverless/README.md)