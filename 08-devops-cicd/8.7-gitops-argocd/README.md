# 🔄 8.7 GitOps với ArgoCD (Desired vs Actual State)

> **GitOps** lấy Git làm nguồn sự thật duy nhất: desired state khai báo trong Git, agent (ArgoCD) liên tục so sánh với actual state trên cluster và tự động reconcile khi lệch.

---

## 🎯 Vấn đề

Deploy kiểu `kubectl apply` tay từ laptop ai đó: không ai biết cluster đang chạy version nào, ai đổi, rollback bằng cách nào:

```
dev A: kubectl set image web=v2   (không lưu đâu cả!)
dev B: kubectl scale deploy 5     (ghi đè lẫn nhau, không audit)
→ drift: Git nói v1 × 3 replicas, cluster thực tế v2 × 5 💥
```

GitOps giải quyết: mọi thay đổi qua PR vào Git, ArgoCD tự sync.

---

## 💻 Code ví dụ

Mô phỏng reconciler: so desired (Git) vs actual (cluster), sinh plan và sync.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface Workload { image: string; replicas: number }

function diff(desired: Workload, actual: Workload): string[] {
  const d: string[] = [];
  if (desired.image !== actual.image)
    d.push(`image: ${actual.image} → ${desired.image}`);
  if (desired.replicas !== actual.replicas)
    d.push(`replicas: ${actual.replicas} → ${desired.replicas}`);
  return d; // [] = InSync
}

// Reconciler: phát hiện drift (ai đó sửa tay trên cluster) → tự sync về Git
function reconcile(desired: Workload, actual: Workload): Workload {
  const changes = diff(desired, actual);
  if (changes.length === 0) return actual; // InSync, không làm gì
  return { ...desired }; // OutOfSync → apply desired
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Audit đầy đủ | Mọi thay đổi infra là Git commit: ai, khi nào, vì sao |
| Self-healing | Ai sửa tay trên cluster → ArgoCD tự ghi đè về desired state |
| Rollback 1 lệnh | `git revert` + push → ArgoCD tự sync về version cũ |

---

## ⚠️ Lưu Ý

- Secrets không commit plaintext vào Git: dùng Sealed Secrets / External Secrets (Vault, KMS).
- Auto-sync mù quáng có thể sync cả config lỗi: kết hợp sync-wave + health check, production nên `manual approve` cho bước nhảy version lớn.
- ArgoCD chỉ quản lý Kubernetes manifests: app code CI (build image) vẫn cần pipeline riêng.

---

## 🎯 Khi nào dùng

- Deploy lên Kubernetes, nhiều môi trường (dev/staging/prod), nhiều người cùng deploy.
- Muốn drift detection + audit + rollback nhanh.
- Không dùng khi: deploy 1 server đơn (Docker Compose đủ), hoặc team chưa dùng K8s.

---

## 🔗 Liên quan

- **8.5 Kubernetes** — ArgoCD sync manifests lên K8s cluster.
- **8.6 Terraform** — IaC cho hạ tầng (VPC, cluster); GitOps cho workloads trên cluster.
- **8.8 Blue-Green/Canary** — chiến lược rollout mà Argo Rollouts điều phối.

---

## 📚 Tài liệu

- ArgoCD Docs — https://argo-cd.readthedocs.io/
- OpenGitOps Principles — https://opengitops.dev/
- *GitOps and Kubernetes* — Manning

---

## ▶️ Chạy ví dụ

```bash
cd 08-devops-cicd/8.7-gitops-argocd
npx ts-node examples/index.ts
```

Demo: InSync → dev đổi Git (auto-sync) → ai đó sửa tay (drift) → reconciler tự phục hồi → rollback bằng revert.

---

## ⏭️ Bài tiếp theo

→ [8.8 Blue-Green & Canary](../8.8-blue-green-canary/README.md)
