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
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

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

## 🚀 Đi Sâu Thêm

**ArgoCD 3.x là bản hiện hành (2026):** dòng 3.x (3.0 ra mắt giữa 2025) là mặc định của cài đặt mới — API `ApplicationSet` v1alpha1, hỗ trợ OCI artifacts làm nguồn manifest (không chỉ Git), siết bảo mật mặc định (bỏ self-signed cert kiểu cũ, RBAC chi tiết hơn cho multi-tenant).

**ArgoCD vs Flux 2.x — chọn GitOps engine nào:**

| Tiêu chí | ArgoCD 3.x | Flux 2.x |
|---|---|---|
| Giao diện | Web UI đẹp + CLI, onboarding nhanh | Thuần CLI (flux CLI), dashboard riêng lẻ |
| Mô hình | CRD `Application`/`ApplicationSet` | GitOps Toolkit (Kustomize/Helm controllers) |
| Multitenancy | AppProject + RBAC mạnh | Namespace-per-team, kiểm soát qua Git |
| Secrets | Sealed Secrets, External Secrets | SOPS + KMS, Vault integration |
| Phù hợp | Team muốn UI + quản lý app tập trung | Team "GitOps thuần", infra-as-code tối giản |

**App-of-apps pattern:** 1 Application "gốc" trỏ tới thư mục chứa các manifest Application con → onboard app mới chỉ là 1 PR thêm file YAML; chuẩn hóa template, không ai tạo app bằng UI tay nữa.

**Sync waves & hooks:**
- Wave: annotation `argocd.argoproj.io/sync-wave: "0"` — DB (0) → backend (1) → frontend (2); wave sau chỉ sync khi wave trước đã Healthy.
- Hook: `PreSync` (chạy DB migration trước), `PostSync` (smoke test sau khi sync xong), `SyncFail` (hook dọn dẹp khi sync lỗi).

**Drift detection:** ArgoCD poll Git + cluster theo chu kỳ (mặc định ~3 phút) hoặc nhận webhook đẩy nhanh. `automated.selfHeal: true` ghi đè mọi thay đổi tay trên cluster; chỗ cần hotfix tạm thời thì cấu hình `ignoreDifferences` tường minh thay vì tắt self-heal cả app.

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
npx tsx examples/index.ts
```

Demo: InSync → dev đổi Git (auto-sync) → ai đó sửa tay (drift) → reconciler tự phục hồi → rollback bằng revert.

---

## ⏭️ Bài tiếp theo

→ [8.8 Blue-Green & Canary](../8.8-blue-green-canary/README.md)
