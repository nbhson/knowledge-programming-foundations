/**
 * 8.4 Docker — Dockerfile / Compose + mô phỏng vòng đời build & deploy
 *
 * Minh họa:
 * - Dockerfile multi-stage (build → runtime) dạng string.
 * - docker-compose.yml dạng string.
 * - Mô phỏng lifecycle: build image → tạo container → healthcheck → deploy.
 *   (Chỉ in ra output, KHÔNG chạy docker thật)
 */

// ──────────────────── Dockerfile + Compose dạng string ────────────────────
const DockerLifecycleDockerfile = `
# Dockerfile — multi-stage build
# Stage 1: builder — cài dependency + build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runtime — chỉ giữ bản build, image nhỏ gọn
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
`;

const DockerLifecycleCompose = `
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
`;

// ──────────────────── Mô hình vòng đời ────────────────────
interface DockerLifecyclePhase {
  phase: string;
  detail: string;
  isError?: boolean;
}

const DockerLifecyclePhases: DockerLifecyclePhase[] = [
  { phase: "BUILD", detail: "docker build -t myapp:1.0.0 . (2 stages: builder → runtime)" },
  { phase: "TAG", detail: "Gắn tag myapp:1.0.0 và đẩy lên registry" },
  { phase: "RUN", detail: "docker run -d -p 3000:3000 --name myapp myapp:1.0.0" },
  { phase: "HEALTHCHECK", detail: "GET /health → trả 200, container healthy" },
  { phase: "DEPLOY", detail: "dừng container cũ, khởi chạy container mới (zero-downtime)" },
  { phase: "CLEANUP", detail: "xoá container/image cũ, giữ ổn định dung lượng" },
];

// ──────────────────── Mô phỏng vòng đời ────────────────────
async function dockerSimulateLifecycle(): Promise<void> {
  console.log("\n🐳 MÔ PHỎNG VÒNG ĐỜI (không chạy docker thật):\n");
  for (const phase of DockerLifecyclePhases) {
    await new Promise((resolve) => setTimeout(resolve, 20));
    console.log(`  ${phase.isError ? "⚠️" : "🟢"} [${phase.phase.padEnd(11)}] ${phase.detail}`);
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Docker Demo ===");
console.log("Dockerfile & Compose (string) + vòng đời container.\n");

console.log("📄 DOCKERFILE (string, không thực thi):");
console.log("```dockerfile" + DockerLifecycleDockerfile + "```");
console.log("\n📄 DOCKER-COMPOSE (string, không thực thi):");
console.log("```yaml" + DockerLifecycleCompose + "```");

dockerSimulateLifecycle().then(() => {
  console.log("\n✅ Docker: 1 image build 1 lần, chạy nhất quán trên mọi môi trường");
});

export {};