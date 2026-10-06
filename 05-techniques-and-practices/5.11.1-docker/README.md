# 🐳 5.11.1 Docker (Containerization)

> **Docker** đóng gói ứng dụng + dependencies vào **image** nhẹ (các layer), chạy thành **container** cô lập — build 1 lần, chạy được ở mọi nơi.

---

## 🎯 Vòng đời

```
Dockerfile ──docker build──▶ Image ──docker run──▶ Container
                                        │
                                  sửa đổi bên trong
                                        │
                                        ▼
                              ──docker commit──▶ Image mới
```

| Lệnh | Ý nghĩa |
|------|---------|
| `docker build -t myapp:v1 .` | Build image từ Dockerfile |
| `docker run -p 3000:3000 myapp:v1` | Tạo & chạy container từ image |
| `docker commit <ctr> new:v2` | Lưu container thành image mới |
| `docker push` | Đẩy image lên registry |

---

## 💻 Dockerfile

```dockerfile
FROM node:18-alpine      # base image
WORKDIR /app
COPY package*.json ./
RUN npm ci                # mỗi RUN/COPY = 1 layer
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class MiniDocker {
  build(tag: string, dockerfile: string): DockerImageInfo {
    const layers = dockerfile.split("\n").map((l) => l.trim()).filter(Boolean);
    const image: DockerImageInfo = { tag, layers, createdBy: "docker build" };
    this.images.set(tag, image);
    return image;
  }

  run(imageTag: string, portMap: Record<string, number>, env: Record<string, string>): DockerContainerInfo {
    const image = this.images.get(imageTag);
    if (!image) throw new Error(`Image '${imageTag}' chưa build`);
    // tạo container ...
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ♻️ **Reproducible** | Cùng image → cùng môi trường mọi nơi |
| 📦 **Portable** | Chạy local / CI / cloud giống nhau |
| 🔒 **Isolation** | Container cô lập resource & process |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📚 **Học curve** | Dockerfile, network, volumes |
| 🐘 **Overhead** | Nhẹ hơn VM nhưng vẫn tốn resource |
| 🔐 **Security** | Image cần quét lỗ hổng (scan) |

---

## ❌ BAD — thêm 1 case: tag `latest` + chạy root + copy cả thế giới

```dockerfile
# ❌ BAD — build không lặp lại được, chạy root, image phình
FROM node:18
COPY . ./
RUN npm install
CMD ["node", "dist/main.js"]
# tag latest: hôm nay latest=v1, mai latest=v2 — rollback không biết về đâu
# root mặc định: container bị chiếm = root host bị đe dọa
# COPY . .: lôi cả node_modules/.git vào image

# ✅ GOOD — version pin, user non-root, .dockerignore, layer cache
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
# build: docker build -t myapp:1.4.2 (không bao giờ deploy "latest" lên prod)
```

> 3 luật Dockerfile production: **tag version cụ thể**, **không chạy root**, **COPY ít nhất có thể** (kèm `.dockerignore`).

---

## ⚖️ Trade-off: Docker vs chạy thẳng vs VM

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| "Máy tôi chạy được, server thì không" | ✅ Docker | Image = môi trường đóng gói, hết lệch |
| Cần cô lập mạnh (multi-tenant, untrusted code) | ⚖️ VM/gVisor | Container chung kernel — cô lập yếu hơn VM |
| Script nhỏ, 1 server, team 1 người | ⚖️ Chạy thẳng + pm2/systemd | Docker thêm lớp học + vận hành chưa xứng |
| Nhiều service cùng máy, port/dependency đụng nhau | ✅ Docker + compose | Mỗi container 1 thế giới riêng |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Deploy tag `latest` | Không biết đang chạy bản nào, rollback mù | Tag `git-sha`/semver, `latest` chỉ cho dev |
| Layer cache vỡ (COPY code trước RUN install) | Mỗi sửa 1 dòng là npm install lại từ đầu | COPY `package*.json` + install trước, COPY code sau |
| Secrets trong ENV/image (`ENV API_KEY=...`) | Ai pull image cũng đọc được secret | Secret qua runtime (vault/mounted secret), không bake vào image |
| Không healthcheck | Container treo vẫn nhận traffic | `HEALTHCHECK` + orchestrator (5.11.2) loại pod hỏng |

---

## ✅ Checklist khi review

- [ ] Tag version cụ thể (không `latest` lên prod)?
- [ ] Chạy user non-root (`USER node`)?
- [ ] `.dockerignore` loại `node_modules/.git/.env`?
- [ ] Thứ tự layer tối ưu cache (deps trước, code sau)?
- [ ] Không có secret bake trong image/ENV?
- [ ] Image đã scan lỗ hổng trước khi push?

---

## 🔗 Liên quan

- **5.11.2 Kubernetes** — Orchestrate nhiều container
- **5.11.3 Serverless** — Không cần quản lý container
- **8.4 Docker** — DevOps: Docker trong CI/CD

---

## 📚 Tài liệu tham khảo

- 📖 [Docker Docs](https://docs.docker.com/)
- 📖 [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.11.1-docker
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.11.2 Kubernetes](../5.11.2-kubernetes/README.md)