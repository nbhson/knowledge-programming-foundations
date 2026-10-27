# 🌪️ 7.11 Chaos Testing (Kiểm Thử Hỗn Loạn)

> **Chaos testing** chủ động bơm lỗi vào hệ thống (kill pod, trễ mạng, lỗi 5xx) để kiểm chứng resilience — thay vì đợi production "dạy" bạn bài học đắt giá.

---

## 🎯 Vấn đề

Hệ thống chạy ổn khi mọi thứ tốt. Nhưng production không bao giờ hoàn hảo: pod bị kill, DB chậm 5s, dependency trả 500:

```
checkout() → payment API timeout 10s → thread pool cạn → cả site sập 💥
```

Nếu chưa từng test, bạn không biết timeout/retry/circuit-breaker có hoạt động thật không.

---

## 💻 Code ví dụ

Mô phỏng fault injection: latency injection + error injection quanh service call, đo success rate và phát hiện thiếu timeout.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface FaultConfig { latencyMs: number; errorRate: number }

// Wrapper bơm lỗi: delay ngẫu nhiên + ném lỗi theo tỉ lệ
async function withFault<T>(fn: () => Promise<T>, fault: FaultConfig): Promise<T> {
  if (fault.latencyMs > 0) await sleep(random(0, fault.latencyMs));
  if (Math.random() < fault.errorRate) throw new Error("injected 500");
  return fn();
}

// Thí nghiệm: checkout không timeout vs có timeout 200ms
async function experiment(name: string, timeoutMs: number | null): Promise<void> {
  let ok = 0, fail = 0;
  for (let i = 0; i < 20; i++) {
    try { await callWithTimeout(() => withFault(payment, FAULT), timeoutMs); ok++; }
    catch { fail++; }
  }
  console.log(`${name}: ok=${ok} fail=${fail}`);
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Biết giới hạn chịu đựng | "Kill 1 pod thì sao? DB chậm 2s thì sao?" — trả lời bằng số liệu, không đoán |
| Verify resilience patterns | Timeout/retry/circuit-breaker/fallback chỉ có giá trị khi đã test dưới lỗi thật |
| Giảm MTTR | Team đã diễn tập sự cố → khi lỗi thật xảy ra, runbook sẵn sàng |

---

## ⚠️ Lưu Ý

- Bắt đầu ở **staging**, blast radius nhỏ: 1 pod, 1 AZ, giờ thấp điểm — rồi mới mở rộng.
- Luôn có **nút dừng khẩn cấp** (abort switch) + giả thiết kiểm chứng được ("p99 < 500ms khi kill 1 pod").
- Không chạy chaos trên production khi chưa có monitoring/alerting — bạn sẽ không biết mình đã phá gì.
- GameDay (diễn tập có người) trước, tự động (Chaos Monkey) sau.

---

## 🎯 Khi nào dùng

- Hệ thống phân tán có retry/fallback/circuit-breaker cần kiểm chứng.
- Trước launch, sau mỗi thay đổi kiến trúc lớn (thêm dependency, đổi LB).
- Không dùng khi: monolith đơn giản chưa có monitoring, hoặc team chưa có runbook (sẽ chỉ gây hoảng loạn).

---

## 🚀 Đi Sâu Thêm

**Game day process — diễn tập có cấu trúc, không phải thử nghiệm tự do:**

1. **Chuẩn bị:** định nghĩa experiment + steady-state hypothesis (VD: "checkout success rate > 95% ngay cả khi 1 AZ down"), nút abort, team notified, runbook sẵn sàng.
2. **Thực hiện:** bơm fault từ từ (kill 1 pod → kill 2 pod → network partition); theo dõi metrics real-time.
3. **Kết thúc:** verify hồi phục tự nhiên hoặc chạy runbook; ghi lại lessons learned → cải thiện system.
4. **Tự động hóa dần:** game day thành công → chuyển thành chaos test chạy trong CI (nightly, sau deploy lớn).

**Steady-state hypothesis — "hệ thống đang ổn" được định nghĩa trước:**
- Không phải "tôi thấy ổn" mà là metric query: `success_rate > 0.99 AND p99_latency < 500ms` chạy mỗi 60s.
- Experiment chỉ bắt đầu khi steady → tránh nhầm lẫn "lỗi experiment" với "lỗi sẵn có".
- Kết thúc experiment → verify steady lại trước khi dừng (hệ thống hồi phục được không?).

**Litmus vs Gremlin vs Chaos Mesh:**

| Nền tảng | Mô hình | Phạm vi |
|---|---|---|
| **LitmusChaos** | Open-source, CNCF, Operator trên K8s, HCE (Hub of Chaos Experiments) | Cloud-native, multi-cloud |
| **Gremlin** | SaaS có giao diện, attack library, API | Production enterprise, safety guard |
| **Chaos Mesh** | CNCF, CRD-based, TimeChaos/PodChaos/NetworkChaos... | K8s-only, developer-friendly |

**Blast radius — luôn giới hạn trước:**
- Quy tắc 1-1-1: 1% traffic / 1 node / giờ thấp điểm → test staging trước production.
- Experiment scope: annotation `litmus chaos.io/experiment-run` → chỉ experiment pod này, không ảnh hưởng pod khác trên node.
- Nút dừng khẩn: 1 curl command hoặc 1 click → restore tất cả fault đang chạy.

---

## 🔗 Liên quan

- **8.5 Kubernetes** — chaos trên K8s: kill pod, network partition (LitmusChaos, Chaos Mesh).
- **8.9 Observability** — không có metrics/traces thì chaos mù (không đo được tác động).
- **7.6 Performance Testing** — chaos + load test = kiểm chứng dưới tải và lỗi đồng thời.

---

## 📚 Tài liệu

- *Chaos Engineering* — Casey Rosenthal & Nora Jones (O'Reilly)
- Principles of Chaos Engineering — https://principlesofchaos.org/
- LitmusChaos — https://litmuschaos.io/ · Chaos Mesh — https://chaos-mesh.org/

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.11-chaos-testing
npx ts-node examples/index.ts
```

Demo: baseline ổn định → bơm latency+error (không timeout: treo hàng loạt) → thêm timeout+fallback (hồi phục) → tổng kết resilience.

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm Testing — tiếp tục DevOps:

→ [8.1 Git Flow](../../08-devops-cicd/8.1-gitflow/README.md)
