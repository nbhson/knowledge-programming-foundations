# 🐳 8.4 Docker — Containerization

> **Docker** là nền tảng containerization phổ biến nhất, đóng gói ứng dụng và dependencies vào một container thống nhất — chạy giống hệt nhau trên mọi môi trường.
> Container = tiến trình được cô lập với namespaces + cgroups, nhẹ hơn VM rất nhiều.

---

## 📚 Mục lục

- [Tổng quan Docker](#tổng-quan-docker)
- [Dockerfile Best Practices](#dockerfile-best-practices)
- [Multi-stage Builds](#multi-stage-builds)
- [Docker Compose for Local Dev](#docker-compose-for-local-dev)
- [Image Optimization Tips](#image-optimization-tips)
- [Docker Networking](#docker-networking)
- [Docker Security](#docker-security)
- [Best Practices](#best-practices)

---

## Tổng quan Docker

### Container là gì?

Container là một **đơn vị đóng gói** chứa ứng dụng + dependencies, chạy **nhất quán** trên mọi môi trường.

**Cơ chế kỹ thuật:** Linux namespaces (cách ly PID, network, filesystem, UTS, IPC, user) + cgroups (giới hạn tài nguyên) + unified image layer system.

### So sánh: VM vs Container

| | Virtual Machine | Container |
|---|---|---|
| **Size** | GB (full OS image) | MB (app + runtime only) |
| **Startup** | Phút (boot OS) | Giây (start process) |
| **Isolation** | Full OS (hardware virtualization) | Process-level (namespaces + cgroups) |
| **Resource** | Nặng (đổ đầy RAM cho OS) | Nhẹ (chỉ dùng RAM ứng dụng) |
| **Density** | Ít per host (5-10 VMs) | Nhiều per host (50-100 containers) |
| **Boot time** | 30-120 giây | 1-5 giây |
| **Snapshot** | Toàn bộ VM state | Container image layer |
| **Use case** | Legacy apps, full OS control | Microservices, CI/CD, cloud-native |

### Các thành phần Docker

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Image (read-only template)                                 │
│    ↓ docker run                                              │
│  Container (running instance)                               │
│    ├─ Process (your app)                                    │
│    ├─ Rootfs (filesystem layer)                             │
│    ├─ Network namespace                                     │
│    └─ Resource limits (cgroups)                             │
│                                                             │
│  Dockerfile → builds Image                                  │
│  Docker Hub / ECR / GCR → stores Images                    │
│  docker-compose → defines multi-container apps              │
│  docker volumes → persistent data                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Thành phần | Mô tả | Ví dụ |
|---|---|---|
| **Image** | Read-only template, nhiều layers | `node:20-alpine`, `nginx:latest` |
| **Container** | Instance chạy của image | `docker run -d -p 3000:3000 myapp` |
| **Dockerfile** | Script định nghĩa cách build image | File `Dockerfile` trong project |
| **Volume** | Persistent data ngoài container lifecycle | `postgres-data:/var/lib/postgresql/data` |
| **Network** | Kết nối giữa các container | `bridge`, `host`, `overlay` |
| **Registry** | Nơi lưu và chia sẻ images | Docker Hub, ECR, GCR, ACR |

---

## Dockerfile Best Practices

### Cấu trúc Dockerfile cơ bản

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Best Practices checklist

| Pattern | ❌ Tránh | ✅ Tốt hơn | Lý do |
|---------|----------|-----------|-------|
| Base image | `FROM ubuntu` | `FROM node:20-alpine` | Alpine ~5MB vs Ubuntu ~77MB — giảm attack surface |
| RUN layers | Nhiều `RUN` riêng lẻ | Gộp bằng `&& \` | Mỗi RUN = 1 layer mới, càng nhiều layer càng chậm build |
| COPY order | `COPY . .` trước `npm ci` | COPY `package*.json` trước | Cache layer: nếu chỉ code đổi, không rebuild node_modules |
| Secrets | Hardcode trong Dockerfile | Build args hoặc runtime env | Dockerfile có thể commit vào git — không được leak secret |
| User | Chạy với root | Tạo user không root | Container chạy root = risk nếu bị breakout |
| Tag | `latest` | Specific version | `latest` thay đổi không báo trước — gây unpredictable behavior |

### Dockerfile hoàn chỉnh (production-grade)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Layer 1: Copy package files trước để tận dụng Docker cache
# Nếu chỉ đổi source code, Docker sẽ dùng cached node_modules
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Layer 2: Copy source code
COPY tsconfig.json ./
COPY src ./src

# Layer 3: Build TypeScript
RUN npm run build

# Security: tạo user không root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Healthcheck: Kubernetes và Docker dùng để kiểm tra container sống
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Giải thích từng bước:**
1. `FROM node:20-alpine` — base image nhỏ, secure, chính thức từ Node.js
2. `WORKDIR /app` — tạo working directory, tránh path issues
3. `COPY package*.json ./` — copy dependency manifests trước (cache optimization)
4. `npm ci` — cài từ lockfile, 100% reproducible (khác `npm install`)
5. `COPY src ./src` — copy source sau (thường xuyên thay đổi, layer này ít cache hit)
6. `npm run build` — build ra `dist/`
7. `addgroup/adduser` — tạo user không quyền root
8. `USER appuser` — chuyển sang user không root
9. `HEALTHCHECK` — giúp orchestrator (K8s, Docker Swarm) biết container có healthy không
10. `CMD` — lệnh mặc định khi chạy container

---

## Multi-stage Builds

### Giảm kích thước image từ 900MB → 150MB

```dockerfile
# Stage 1: Build — cần đầy đủ toolchain (dev dependencies)
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                      # cài cả dev + prod dependencies
COPY . .
RUN npm run build               # build ra dist/

# Stage 2: Runtime — chỉ cần production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production    # chỉ cài production deps (nhỏ hơn nhiều)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/config ./config

EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

**Kết quả:**
- Image builder: ~900MB (có TypeScript compiler, dev tools)
- Image runtime: ~150MB (chỉ Node.js runtime + app code)
- Giảm **~83%** kích thước → faster pull, faster deploy, cheaper storage

### Multi-stage với Docker + Nginx (Frontend + Backend)

```dockerfile
# Stage 1: Build frontend (React/Vue/Next.js)
FROM node:20 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build               # out: frontend/out/

# Stage 2: Build backend (Node.js API)
FROM node:20 AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build               # out: backend/dist/

# Stage 3: Production (Nginx serves frontend, proxies API)
FROM nginx:alpine AS production
# Copy frontend static files
COPY --from=frontend-builder /app/out /usr/share/nginx/html
# Copy backend compiled code (nginx sẽ reverse proxy đến backend)
COPY --from=backend-builder /app/dist /app/dist
# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Docker Compose for Local Dev

### docker-compose.yml hoàn chỉnh

```yaml
# docker-compose.yml — Compose v2 (trường `version` đã obsolete, bỏ đi)
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy    # Chỉ start api sau khi db ready
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src         # Live reload: sửa code → container tự cập nhật
      - /app/node_modules      # Override node_modules (dùng volume ẩn)
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data   # Persistent data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - db
    networks:
      - app-network

volumes:
  postgres-data:          # Dữ liệu PostgreSQL tồn tại qua container restart
  redis-data:             # Dữ liệu Redis persist

networks:
  app-network:
    driver: bridge         # Các service trong network này nói chuyện được với nhau
```

### Các lệnh thường dùng

```bash
# Khởi động toàn bộ stack
docker compose up -d              # detached mode

# Xem logs (theo dõi real-time)
docker compose logs -f api        # logs của service api
docker compose logs -f --tail=50  # chỉ xem 50 dòng cuối

# Stop & start
docker compose down               # dừng + xóa containers
docker compose up -d              # khởi động lại

# Rebuild sau khi thay đổi Dockerfile
docker compose up -d --build      # rebuild tất cả

# Vào container để debug
docker compose exec api sh        # shell vào api container
docker compose exec db psql -U user -d mydb   # vào PostgreSQL

# Xem trạng thái các service
docker compose ps
docker compose top api            # xem process trong container

# Xem dung lượng volumes
docker volume ls
docker volume inspect mydb_postgres-data

# Xóa toàn bộ (cả volumes — mất dữ liệu!)
docker compose down -v
```

---

## Image Optimization Tips

### So sánh kích thước base images

| Image | Kích thước | Phù hợp cho | Ghi chú |
|-------|-----------|-------------|---------|
| `ubuntu:22.04` | ~77 MB | General purpose | Đầy đủ tools, dễ debug |
| `debian:bookworm-slim` | ~45 MB | Balanced | Tối ưu hơn Ubuntu |
| `alpine` | ~5 MB | Tối ưu dung lượng | Dùng musl libc, không glibc — một số packages có thể không tương thích |
| `scratch` | 0 MB | Custom runtime | Go binaries, statically linked |
| `node:20-alpine` | ~130 MB | Node.js apps | Alpine + Node.js chính thức |
| `node:20-slim` | ~200 MB | Node.js + debug | Debian-based, có strace/gdb |

### Commands tối ưu

```dockerfile
# 1. Dùng multi-stage build (đã hướng dẫn ở trên)

# 2. Gộp nhiều RUN thành một layer — giảm số layers
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*    # Xóa apt cache sau khi cài

# 3. Xóa files không cần sau khi cài
RUN npm ci && npm cache clean --force

# 4. Sử dụng .dockerignore (quan trọng!)
# Xem file .dockerignore bên dưới
```

### .dockerignore

```
# Bỏ qua những thư mục không cần thiết cho Docker context
node_modules
.git
.gitignore
*.md
.env
.env.local
coverage
dist
build
.next
.DS_Store
.docker-compose*.yml
.dockerignore
.gitlab-ci.yml
.github
.editorconfig
.prettierrc
```

> 💡 **Giải thích:** Docker gửi **whole context directory** lên daemon khi build. Nếu không có `.dockerignore`, thư mục `node_modules/` (hàng GB) sẽ bị gửi đi — build chậm gấp 10 lần.

---

## Docker Networking

```
┌─────────────────────────────────────────────────────────────┐
│                   DOCKER NETWORKING                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  bridge (default)    → Container trên cùng host giao tiếp   │
│  host              → Container dùng network của host        │
│  none              → Không có network                       │
│  overlay           → Container khác host giao tiếp (Swarm)  │
│  macvlan           → Container có IP riêng trên LAN         │
│                                                             │
│  Service-to-service (trong compose):                        │
│  ┌─────────┐    DNS      ┌─────────┐                       │
│  │  api    │ ──────────▶ │   db    │  ← dùng "db" làm hostname │
│  │ :3000   │             │ :5432   │                       │
│  └─────────┘             └─────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Docker Security

```
┌─────────────────────────────────────────────────────────────┐
│                 DOCKER SECURITY CHECKLIST                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  □ Chạy với non-root user (USER directive)                 │
│  □ Dùng specific tag thay vì 'latest'                      │
│  □ Scan image với trivy/snyk trước khi deploy              │
│  □ Không hardcode secrets trong Dockerfile                 │
│  □ Dùng .dockerignore để tránh leak sensitive files        │
│  □ Set resource limits (--memory, --cpus)                  │
│  □ Đọc-only filesystem: --read-only + tmpfs                │
│  □ Không dùng --privileged flag                            │
│  □ Use multi-stage build để giảm attack surface            │
│  □ Keep base images updated (npm audit, Trivy)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

```
✅ LUÔN làm:
├─ Dùng Alpine hoặc Slim variants cho base image
├─ Áp dụng multi-stage builds cho production
├─ Thêm HEALTHCHECK cho services quan trọng
├─ Không chạy với root user
├─ Dùng .dockerignore để giảm context
├─ Tag image với version thay vì dùng 'latest'
├─ Dùng `npm ci` thay vì `npm install` (reproducible)
├─ Đặt resource limits khi chạy: docker run --memory=512m --cpus=1
└─ Scan image với `trivy image myapp:latest` trước khi deploy

❌ KHÔNG bao giờ:
├─ Chạy service với root trong container
├─ Hardcode secrets trong Dockerfile (dùng runtime env hoặc Docker secrets)
├─ COPY . . trước khi copy package*.json (mất cache layer)
├─ Dùng image 'latest' cho production
├─ Tạo quá nhiều layer không cần thiết
├─ Dùng --privileged flag
└─ Build image trên máy có node_modules/ lớn mà không có .dockerignore
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **Image** | Template read-only, nhiều lớp (layers), dùng để tạo container |
| **Container** | Instance đang chạy của image — có writable layer riêng |
| **Dockerfile** | Script định nghĩa cách build image (FROM, RUN, COPY, CMD...) |
| **Multi-stage** | Nhiều stage trong 1 Dockerfile, chỉ giữ stage cuối → image nhỏ |
| **Compose** | Định nghĩa multi-container app bằng YAML, chạy 1 lệnh |
| **Volume** | Persistent data ngoài container lifecycle (không mất khi rebuild) |
| **Network** | Cách ly/kết nối giữa các container |
| **Registry** | Nơi lưu trữ và chia sẻ images (Docker Hub, ECR, GCR) |

```
┌──────────────────────────────────────────────────────────────┐
│                  DOCKER QUICK REFERENCE                      │
│                                                              │
│  build    → docker build -t myapp:1.0 .                     │
│  run      → docker run -d -p 3000:3000 myapp:1.0            │
│  compose  → docker compose up -d                            │
│  logs     → docker compose logs -f api                      │
│  exec     → docker compose exec api sh                      │
│  prune    → docker system prune -a                          │
│  ps       → docker ps (running) / docker ps -a (all)        │
│  images   → docker images                                   │
│  rmi      → docker rmi myapp:1.0                            │
│  inspect  → docker inspect myapp:1.0                        │
│  scan     → trivy image myapp:1.0                           │
│                                                              │
│  Key concepts: Image → Container → Volume → Network         │
└──────────────────────────────────────────────────────────────┘
```

---

## ▶️ Chạy ví dụ

Chạy demo Dockerfile/Compose + mô phỏng vòng đời build/deploy:

```bash
cd 08-devops-cicd/8.4-docker
npx tsx examples/index.ts
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD trigger builds |
| [Kubernetes](../8.5-kubernetes/README.md) | Orchestration containers |
| [Terraform](../8.6-terraform/README.md) | Infrastructure as Code |
| [Jenkins](../8.3-jenkins/README.md) | Build containers trong pipeline |
