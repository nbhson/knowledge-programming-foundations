# 🐳 8.4 Docker — Containerization

> **Docker** là nền tảng containerization phổ biến nhất, đóng gói ứng dụng và dependencies vào một container thống nhất — chạy giống hệt nhau trên mọi môi trường.

---

## 📚 Mục lục

- [Dockerfile Best Practices](#dockerfile-best-practices)
- [Multi-stage Builds](#multi-stage-builds)
- [Docker Compose for Local Dev](#docker-compose-for-local-dev)
- [Image Optimization Tips](#image-optimization-tips)
- [Best Practices](#best-practices)

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

| Pattern | ❌ Tránh | ✅ Tốt hơn |
|---------|----------|-----------|
| Base image | `FROM ubuntu` | `FROM node:20-alpine` (nhỏ hơn) |
| RUN layers | Nhiều `RUN` riêng lẻ | Gộp bằng `&& \` |
| COPY | `COPY . .` trước `npm ci` | COPY `package*.json` trước để cache layer |
| Secrets | Hardcode trong Dockerfile | Build args hoặc runtime env |
| User | Chạy với root | Tạo user không root |

### Dockerfile hoàn chỉnh

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Cache layer — copy package files trước
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Security: chạy với user không root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

---

## Multi-stage Builds

### Giảm kích thước image từ 900MB → 150MB

```dockerfile
# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime (nhỏ gọn)
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/config ./config

EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
```

### Multi-stage với Docker + Nginx

```dockerfile
# Stage 1: Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:20 AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

# Stage 3: Production
FROM nginx:alpine AS production
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY backend/dist /app/dist
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Docker Compose for Local Dev

### docker-compose.yml hoàn chỉnh

```yaml
# docker-compose.yml
version: '3.8'

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
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./src:/app/src        # Live reload
      - /app/node_modules     # Override node_modules
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
      - postgres-data:/var/lib/postgresql/data
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
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### Các lệnh thường dùng

```bash
# Khởi động toàn bộ stack
docker compose up -d

# Xem logs
docker compose logs -f api

# Stop & start
docker compose down
docker compose up -d

# Rebuild sau khi thay đổi Dockerfile
docker compose up -d --build

# Vào container để debug
docker compose exec api sh
docker compose exec db psql -U user -d mydb

# Xem dung lượng volumes
docker compose ps
```

---

## Image Optimization Tips

### So sánh kích thước base images

| Image | Kích thước | Phù hợp cho |
|-------|-----------|-------------|
| `ubuntu:22.04` | ~77 MB | General purpose |
| `debian:slim` | ~45 MB | Balanced |
| `alpine` | ~5 MB | Tối ưu dung lượng |
| `scratch` | 0 MB | Custom runtime |

### Commands tối ưu

```dockerfile
# 1. Dùng multi-stage build (đã hướng dẫn ở trên)

# 2. Gộp nhiều RUN thành một layer
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 3. Xóa files không cần sau khi cài
RUN npm ci && npm cache clean --force

# 4. Sử dụng .dockerignore
# node_modules
# .git
# *.md
# dist
```

### .dockerignore

```
# Bỏ qua những thư mục không cần thiết
node_modules
.git
.gitignore
*.md
.env
coverage
dist
.DS_Store
.docker-compose*.yml
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
└─ Tag image với version thay vì dùng 'latest'

❌ KHÔNG bao giờ:
├─ Chạy service với root trong container
├─ Hardcode secrets trong Dockerfile
├─ COPY . . trước khi copy package*.json (mất cache layer)
├─ Dùng image 'latest' cho production
└─ Tạo quá nhiều layer không cần thiết
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **Image** | Templateread-only dùng để tạo container |
| **Container** | Instance chạy của image |
| **Dockerfile** | Script định nghĩa cách build image |
| **Multi-stage** | Nhiều stage trong 1 Dockerfile, chỉ giữ stage cuối |
| **Compose** | Định nghĩa multi-container app bằng YAML |
| **Volume** | Persistent data ngoài container lifecycle |

```
┌──────────────────────────────────────────────────────────────┐
│                  DOCKER QUICK REFERENCE                      │
│                                                              │
│  build  → docker build -t myapp:1.0 .                       │
│  run    → docker run -d -p 3000:3000 myapp:1.0              │
│  compose→ docker compose up -d                              │
│  logs   → docker compose logs -f api                        │
│  exec   → docker compose exec api sh                        │
│  prune  → docker system prune -a                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD trigger builds |
| [Kubernetes](../8.5-kubernetes/README.md) | Orchestration containers |
| [Terraform](../8.6-terraform/README.md) | Infrastructure as Code |
