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