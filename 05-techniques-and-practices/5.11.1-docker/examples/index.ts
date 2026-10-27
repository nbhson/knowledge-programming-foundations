/**
 * 5.11.1 Docker — Build / Run / Commit Lifecycle Demo
 *
 * Mô phỏng vòng đời container bằng TS thuần:
 *   - Dockerfile  : định nghĩa các layer build
 *   - docker build: thực thi từng step → lưu image (các layer)
 *   - docker run  : tạo container từ image, map port + env
 *   - docker commit: snapshot container đang chạy thành image mới
 *
 * KHÔNG dùng lib ngoài — chỉ mô phỏng client Docker.
 */

// ─────────────────────────── Dockerfile ───────────────────────────

const DOCKERFILE_SAMPLE = `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
`.trim();

// ─────────────────────────── Mini Docker Engine ───────────────────────────

interface DockerImageInfo {
  tag: string;
  layers: string[];
  createdBy: string;
}

interface DockerContainerInfo {
  id: string;
  image: string;
  ports: Record<string, number>;
  env: Record<string, string>;
  status: string;
}

class MiniDocker {
  private images = new Map<string, DockerImageInfo>();
  private containers = new Map<string, DockerContainerInfo>();
  private seq = 0;

  // docker build — chạy từng dòng Dockerfile thành layer
  build(tag: string, dockerfile: string): DockerImageInfo {
    const layers = dockerfile
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    const image: DockerImageInfo = { tag, layers, createdBy: "docker build" };
    this.images.set(tag, image);
    return image;
  }

  // docker run — instantiate container từ image
  run(imageTag: string, portMap: Record<string, number>, env: Record<string, string>): DockerContainerInfo {
    const image = this.images.get(imageTag);
    if (!image) throw new Error(`Image '${imageTag}' không tồn tại — chạy docker build trước`);
    const container: DockerContainerInfo = {
      id: `ctr-${++this.seq}`,
      image: imageTag,
      ports: portMap,
      env,
      status: "running",
    };
    this.containers.set(container.id, container);
    return container;
  }

  // docker commit — lưu container thành image mới
  commit(containerId: string, newTag: string): DockerImageInfo {
    const ctr = this.containers.get(containerId);
    if (!ctr) throw new Error(`Container ${containerId} không tồn tại`);
    const base = this.images.get(ctr.image);
    const image: DockerImageInfo = {
      tag: newTag,
      layers: base ? [...base.layers, `META commit → ${newTag} (env=${JSON.stringify(ctr.env)})`] : [newTag],
      createdBy: "docker commit",
    };
    this.images.set(newTag, image);
    return image;
  }

  hasImage(tag: string): boolean {
    return this.images.has(tag);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== MiniDocker Demo ===");
  console.log("");

  console.log("1️⃣ Dockerfile (mỗi dòng = 1 layer):");
  console.log(DOCKERFILE_SAMPLE.split("\n").map((l) => `   ${l}`).join("\n"));
  console.log("");

  const docker = new MiniDocker();

  console.log("2️⃣ docker build -t myapp:v1 . — thực thi từng layer:");
  const v1 = docker.build("myapp:v1", DOCKERFILE_SAMPLE);
  console.log(`  🔨 Build '${v1.tag}' với ${v1.layers.length} layers:`);
  for (const layer of v1.layers) {
    console.log(`     · ${layer}`);
  }
  console.log("");

  console.log("3️⃣ docker run -p 3000:3000 myapp:v1 — tạo container:");
  const ctr = docker.run("myapp:v1", { "3000": 3000 }, { NODE_ENV: "production" });
  console.log(`  🚀 Container ${ctr.id} đang ${ctr.status}:`);
  console.log(`     image=${ctr.image}, port ${Object.entries(ctr.ports).map(([k, v]) => `${v}:${k}`)}, env=${JSON.stringify(ctr.env)}`);
  console.log("");

  console.log("4️⃣ Sửa bên trong container rồi docker commit → image mới:");
  const committed = docker.commit(ctr.id, "myapp:v2-with-env");
  console.log(`  💾 Commit ${ctr.id} → '${committed.tag}'`);
  console.log(`     layers = ${committed.layers.length} (kế thừa từ v1 + metadata)`);
  console.log("");

  console.log("5️⃣ Image registry sau lifecycle:");
  console.log(`  myapp:v1            → ${docker.hasImage("myapp:v1")}`);
  console.log(`  myapp:v2-with-env   → ${docker.hasImage(committed.tag)}`);
  console.log(`  Không tồn tại 'myapp:v9' → ${docker.hasImage("myapp:v9")}`);
  console.log("");

  console.log("✅ Docker: Dockerfile → build image (layer) → run container → commit thành image mới");
}

run();
export {};