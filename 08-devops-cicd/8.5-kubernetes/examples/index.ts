/**
 * 8.5 Kubernetes — Manifest YAML (Deployment/Service/Pod) + mô phỏng Reconcile Loop
 *
 * Minh họa:
 * - Deployment / Service / Pod manifest dạng string.
 * - Controller giả lập "reconcile": đệ quy so sánh trạng thái thực tế với
 *   trạng thái mong muốn (desired replicas) cho tới khi khớp.
 */

// ──────────────────── Manifest YAML dạng string ────────────────────
const K8sDeploymentYaml = `
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
          image: myregistry/web-app:1.2.3
          ports:
            - containerPort: 3000
`;

const K8sServiceYaml = `
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
`;

const K8sPodYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: web-app-7f9c6d8a4-m2k3p
  labels:
    app: web
spec:
  containers:
    - name: web
      image: myregistry/web-app:1.2.3
      ports:
        - containerPort: 3000
`;

// ──────────────────── Mô hình mô phỏng ────────────────────
interface K8sPodState {
  name: string;
  ready: boolean;
}

class K8sDeploymentSimulator {
  private desired: number;
  private pods: K8sPodState[];
  private tick = 0;

  constructor(desired: number, initialPods: K8sPodState[]) {
    this.desired = desired;
    this.pods = initialPods;
  }

  // Một vòng reconcile: đếm pod ready, tạo pod thiếu, đánh dấu pod chưa ready
  private reconcile(): { ready: number; created: number; becameReady: number } {
    let ready = 0;
    let becameReady = 0;

    this.pods.forEach((p) => {
      // Kubelet "khởi động dần" pod — sau 1 vòng reconcile pod sẽ Ready
      if (!p.ready) {
        p.ready = true;
        becameReady++;
      }
      if (p.ready) ready++;
    });

    let created = 0;
    while (this.pods.length < this.desired) {
      this.pods.push({ name: `web-app-${this.tick}-${this.pods.length + 1}`, ready: false });
      created++;
    }
    return { ready, created, becameReady };
  }

  async run(): Promise<void> {
    console.log("\n🔄 MÔ PHỎNG RECONCILE LOOP (giả lập controller):");
    console.log(`   Desired replicas = ${this.desired}\n`);

    while (true) {
      this.tick++;
      const { ready, created, becameReady } = this.reconcile();
      if (created > 0) console.log(`   ⏳ tick ${this.tick}: tạo thêm ${created} pod (desired=3)`);
      if (becameReady > 0) console.log(`   ⚙️  tick ${this.tick}: ${becameReady} pod chuyển sang Ready`);
      console.log(
        `   📊 tick ${this.tick}: ready=${ready}/${this.desired}  pods(${this.pods
          .map((p) => (p.ready ? "✅" : "⏳"))
          .join("")})`,
      );
      if (ready >= this.desired) {
        console.log(`   🎉 Trạng thái hội tụ sau ${this.tick} vòng reconcile: 3/3 Ready — DESIRED == ACTUAL`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Kubernetes Demo ===");
console.log("Manifest YAML (Deployment/Service/Pod) + reconcile loop.\n");

console.log("📄 DEPLOYMENT (string, không thực thi):");
console.log("```yaml" + K8sDeploymentYaml + "```");
console.log("📄 SERVICE (string, không thực thi):");
console.log("```yaml" + K8sServiceYaml + "```");
console.log("📄 POD (string, không thực thi):");
console.log("```yaml" + K8sPodYaml + "```");

// Khởi đầu: chỉ có 1 pod sẵn sàng, 1 pod chưa sẵn sàng — controller phải bù đủ 3
const initialPods: K8sPodState[] = [
  { name: "web-app-abc-123", ready: true },
  { name: "web-app-abc-456", ready: false },
];

const sim = new K8sDeploymentSimulator(3, initialPods);
sim.run().then(() => {
  console.log("\n✅ Kubernetes: controller liên tục reconcile để đạt trạng thái mong muốn (desired state)");
});

export {};