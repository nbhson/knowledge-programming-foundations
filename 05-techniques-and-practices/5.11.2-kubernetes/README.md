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