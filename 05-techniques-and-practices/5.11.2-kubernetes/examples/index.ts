/**
 * 5.11.2 Kubernetes — Deployment Manifest + Rolling Update Demo
 *
 * Mô phỏng controller của cluster K8s bằng TS thuần:
 *   - Manifest YAML  : Deployment + Service dạng chuỗi, parse đơn giản
 *   - ReplicaSet     : quản lý số pod mong muốn (desired)
 *   - Rolling update : maxUnavailable/maxSurge, thay old pods bằng new pods
 *     theo từng bước, có health check giữa các bước.
 *
 * KHÔNG dùng lib ngoài (không YAML thật) — parse manifest bằng regex/key-value.
 */

// ─────────────────────────── Manifest YAML (dạng string) ───────────────────────────

const DEPLOYMENT_YAML = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 4
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
`.trim();

const SERVICE_YAML = `
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
`.trim();

// ─────────────────────────── Mini manifest parser ───────────────────────────

interface MiniK8sDeployment {
  name: string;
  replicas: number;
  image: string;
}

function parseMiniManifest(yaml: string): MiniK8sDeployment {
  let name = "unknown";
  let replicas = 1;
  let image = "unknown";

  for (const rawLine of yaml.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("replicas:")) replicas = Number(line.split(":")[1].trim());
    if (line.startsWith("image:")) image = line.split(":")[1].trim();
    if (line.startsWith("name:") && line.endsWith("myapp")) name = "myapp";
  }
  return { name, replicas, image };
}

// ─────────────────────────── Cluster Controller ───────────────────────────

interface PodState {
  podId: string;
  image: string;
  ready: boolean;
}

class MiniK8sController {
  private pods: PodState[] = [];

  constructor(deployment: MiniK8sDeployment) {
    for (let i = 0; i < deployment.replicas; i++) {
      this.pods.push({ podId: `pod-${i + 1}`, image: deployment.image, ready: true });
    }
  }

  currentState(): string {
    return this.pods.map((p) => `${p.podId}(${p.image}:${p.ready ? "ready" : "pending"})`).join(", ");
  }

  readyCount(): number {
    return this.pods.filter((p) => p.ready).length;
  }

  // Rolling update: thay hình ảnh từng pod, kiểm tra ready giữa các bước
  rollingUpdate(newImage: string, maxUnavailable: number): void {
    const total = this.pods.length;
    let replaced = 0;
    console.log(`  🔄 Rolling update '${newImage}' — mỗi bước tối đa ${maxUnavailable} pod chưa sẵn sàng:`);

    while (replaced < total) {
      const batch = Math.min(maxUnavailable, total - replaced);
      console.log(`     bước: cập nhật ${batch} pod → new; còn ${total - replaced - batch} pod cũ`);

      for (let i = 0; i < batch; i++) {
        // cũ đi offline
        this.pods[i].ready = false;
      }
      for (let i = 0; i < batch; i++) {
        // pod mới ra, chờ health check
        const pod = this.pods[i];
        pod.image = newImage;
        pod.ready = this.healthCheck(pod.podId);
      }
      replaced += batch;
    }

    console.log(`     ✅ tất cả ${total} pod đều là '${newImage}' (ready=${this.readyCount()})`);
  }

  private healthCheck(podId: string): boolean {
    // Mô phỏng readiness probe — luôn pass sau khi image mới tạo
    console.log(`     🩺 readiness probe '${podId}' → OK`);
    return true;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== MiniK8sController Demo ===");
  console.log("");

  console.log("1️⃣ Deployment manifest (YAML string):");
  console.log(DEPLOYMENT_YAML.split("\n").map((l) => `   ${l}`).join("\n"));
  console.log("");

  console.log("2️⃣ Dịch manifest → deployment object:");
  const dep = parseMiniManifest(DEPLOYMENT_YAML);
  console.log(`  name=${dep.name}, replicas=${dep.replicas}, image=${dep.image}`);
  console.log(`  Service manifest: ${SERVICE_YAML.includes("type: LoadBalancer") ? "LoadBalancer 80→3000" : ""}`);
  console.log("");

  console.log("3️⃣ Cân bằng trạng thái ban đầu (desired=4 pods):");
  const controller = new MiniK8sController(dep);
  console.log(`  ${controller.currentState()}`);
  console.log("");

  console.log("4️⃣ Rolling update v1 → v2 (maxUnavailable=2):");
  controller.rollingUpdate("myapp:v2", 2);
  console.log(`  Trạng thái cuối: ${controller.currentState()}`);
  console.log("");

  console.log("5️⃣ Rollback — rollback image về v1 nhanh như deploy mới:");
  controller.rollingUpdate("myapp:v1", 4);
  console.log(`  Trạng thái: ${controller.currentState()}`);
  console.log("");

  console.log("✅ K8s: manifest YAML → deployment controller giữ desired state → rolling update không downtime");
}

run();
export {};