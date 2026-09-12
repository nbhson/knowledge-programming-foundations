# 🔄 8.3 Jenkins (Pipeline as Code)

> **Jenkins** là nền tảng **CI/CD open-source** mạnh mẽ — định nghĩa toàn bộ workflow dưới dạng **Pipeline as Code** qua `Jenkinsfile` (Groovy), hỗ trợ **Declarative** & **Scripted** pipeline.

---

## 📚 Mục lục

- [Tổng quan](#tổng-quan)
- [Jenkinsfile Declarative Pipeline](#jenkinsfile-declarative-pipeline)
- [Agents và Stages](#agents-và-stages)
- [Post Actions](#post-actions)
- [Pipeline as Code thực tế](#pipeline-as-code-thực-tế)
- [Jenkins vs GitHub Actions](#jenkins-vs-github-actions)
- [Best Practices](#best-practices)

---

## Tổng quan

```
┌──────────────────────────────────────────────────────────────────┐
│                      JENKINS ARCHITECTURE                        │
│                                                                  │
│   👤 Developer                         🔧 Jenkins Controller      │
│        ↓                                   ↓                      │
│   💾 Git Push            ──────────▶  ┌──────────────────┐      │
│        ↓                          │    │ - Quản lý jobs    │      │
│   📦 Source Code                  │    │ - Schedule builds │      │
│        ↓                          │    │ - Lưu history     │      │
│   🔄 Pipeline Execute             └────┼──────────────────┘      │
│        │                              ↓                          │
│   ┌────┴──────────────────────────────────────┐                │
│   │  Agent / Node (nhiều máy song song)       │                │
│   │  Build → Test → Lint → Security → Deploy  │                │
│   └───────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

| Thành phần | Mô tả |
|---|---|
| **Master/Controller** | Máy chủ chính điều phối, lưu config, scheduling |
| **Agent/Node** | Máy thực thi pipeline (có thể nhiều máy) |
| **Pipeline** | Tập hợp các stages thực thi tuần tự hoặc song song |
| **Plugin** | Mở rộng functionality (Git, Docker, Slack...) |

---

## Jenkinsfile Declarative Pipeline

### Cấu trúc cơ bản

```groovy
// Jenkinsfile — Declarative Pipeline (bắt buộc có pipeline section)
pipeline {
    agent any

    environment {          // Environment variables toàn pipeline
        APP_ENV   = 'staging'
        DOCKER_IMG = 'myapp:latest'
        CACHE_KEY = 'v1'
    }

    parameters {            // Manual trigger với inputs
        choice(name: 'ENV', choices: ['staging', 'production'], description: 'Deploy target')
        string(name: 'TAG', value: 'latest', description: 'Docker image tag')
    }

    triggers {              // Auto-trigger theo lịch cron
        cron('0 2 * * *')  // Chạy lúc 2h sáng hàng ngày
    }

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test -- --coverage'
            }
        }
    }

    post {
        always { cleanWs() }
        success { echo '✅ Pipeline thành công!' }
        failure { echo '❌ Pipeline thất bại!' }
    }
}
```

---

## Agents và Stages

### Multi-agent pipeline

```groovy
pipeline {
    agent { label 'docker' }  // Chỉ chạy trên agent có label 'docker'

    stages {
        stage('Checkout') {
            agent any         // Override agent cho stage này
            steps { checkout scm }
        }

        stage('Build & Test') {
            agent {
                docker {
                    image 'node:20-alpine'
                    args '-v /root/.npm:/home/node/.npm'
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Parallel Tests') {
            parallel {
                stage('Unit') {
                    steps { sh 'npm run test:unit' }
                }
                stage('Integration') {
                    steps { sh 'npm run test:integration' }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
                expression { return env.MANUAL_DEPLOY == 'true' }
            }
            agent none
            input message: 'Deploy to production?', ok: 'Deploy'
            steps { sh './deploy.sh' }
        }
    }
}
```

### Agent types

| Agent type | Mô tả | Use case |
|---|---|---|
| `agent any` | Bất kỳ agent nào | Pipeline đơn giản |
| `agent none` | Không cần agent | Chạy script lightweight |
| `agent { label 'x' }` | Agent có label cụ thể | Máy chuyên dụng |
| `agent { docker {...} }` | Trong container | Isolated environment |
| `agent { kubernetes {...} }` | Trên K8s pod | Cloud-native CI/CD |

---

## Post Actions

### 4 loại post conditions

```groovy
post {
    // ✅ Chạy LUÔN LUÔN — bất kể kết quả
    always {
        junit 'test-results/*.xml'
        cleanWs()
        slackSend color: 'good', message: "Build: ${env.BUILD_NUMBER}"
    }

    // ✅ Chỉ khi pipeline thành công
    success {
        echo '🎉 Deploy thành công!'
        slackSend channel: '#deployments', message: "✅ ${env.BUILD_URL}"
    }

    // ❌ Chỉ khi pipeline thất bại
    failure {
        echo '💥 Build thất bại!'
        slackSend color: 'danger', channel: '#alerts', message: "❌ ${env.BUILD_URL}"
        archiveArtifacts artifacts: 'logs/*.log'
    }

    // ⚠️ Chỉ khi bị abort/hủy
    aborted {
        echo '⏹️ Pipeline bị hủy!'
    }
}
```

| Condition | Trigger khi | Thường dùng cho |
|---|---|---|
| `always` | Mọi trường hợp | Cleanup, upload report, notify |
| `success` | Pipeline pass ✅ | Celebration, auto-deploy |
| `failure` | Pipeline fail ❌ | Alert, archive logs |
| `aborted` | Pipeline bị hủy ⏹️ | Notify team |

---

## Pipeline as Code thực tế

### Full TypeScript project pipeline

```groovy
// Jenkinsfile — Full CI/CD cho TypeScript Next.js app
pipeline {
    agent {
        kubernetes {
            label 'node-pool'
            yaml '''
                apiVersion: v1
                kind: Pod
                spec:
                  containers:
                  - name: node
                    image: node:20-alpine
                    workingDir: /workspace
                    volumeMounts:
                    - name: npm-cache
                      mountPath: /root/.npm
                  volumes:
                  - name: npm-cache
                    persistentVolumeClaim:
                      claimName: npm-cache-pvc
            '''
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        NODE_ENV        = 'ci'
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME        = 'my-app'
    }

    stages {
        stage('Install') {
            steps { sh 'npm ci --cache .npm' }
        }

        stage('Lint & Type Check') {
            steps {
                sh 'npm run lint'
                sh 'npx tsc --noEmit'
            }
        }

        stage('Test') {
            parallel {
                stage('Unit')    { steps { sh 'npm run test:unit -- --coverage' } }
                stage('Integration') { steps { sh 'npm run test:integration' } }
            }
        }

        stage('Build Docker') {
            when { branch 'main' }
            steps {
                script {
                    env.IMAGE_TAG = "${DOCKER_REGISTRY}/${APP_NAME}:${env.BUILD_NUMBER}"
                }
                sh 'docker build -t $IMAGE_TAG .'
                sh 'docker push $IMAGE_TAG'
            }
        }

        stage('Deploy Staging') {
            when { branch 'main' }
            steps {
                sh """
                    kubectl set image deployment/${APP_NAME} \\
                        ${APP_NAME}=${IMAGE_TAG} \\
                        --namespace=staging
                    kubectl rollout status deployment/${APP_NAME} \\
                        --namespace=staging --timeout=120s
                """
            }
        }

        stage('Deploy Production') {
            when {
                branch 'main'
                expression { return env.MANUAL_DEPLOY == 'true' }
            }
            input message: 'Deploy to production?', ok: 'Deploy'
            steps {
                sh """
                    kubectl set image deployment/${APP_NAME} \\
                        ${APP_NAME}=${IMAGE_TAG} \\
                        --namespace=production
                """
            }
        }
    }

    post {
        always   { cleanWs() }
        success  { echo '🚀 Deploy thành công!' }
        failure  { echo '💥 Pipeline thất bại!' }
    }
}
```

---

## Jenkins vs GitHub Actions

| Tiêu chí | Jenkins | GitHub Actions |
|---|---|---|
| **Hosting** | Self-hosted (tự quản) | GitHub-hosted hoặc self-hosted |
| **Config** | `Jenkinsfile` (Groovy) | `.github/workflows/*.yml` (YAML) |
| **Cài đặt** | Cần cài server + plugin | Có sẵn trong GitHub repo |
| **Parallelism** | Multi-node tốt | Matrix strategy |
| **Chi phí** | Free (self-hosted) | Gratis + paid minutes |
| **Plugins** | 1800+ plugins | GitHub Marketplace |
| **Phù hợp** | Enterprise, custom infra | Cloud-native, rapid iteration |

```
┌─────────────────────────────────────────────────────────────────┐
│              WHEN TO CHOOSE JENKINS                            │
│                                                                 │
│  Jenkins ✅  khi:                                               │
│  ├─ Cần self-hosted (data sovereignty, compliance)             │
│  ├─ Enterprise với nhiều custom plugins                        │
│  ├─ Cần parallel builds trên nhiều agent nodes                 │
│  └─ Legacy infrastructure, muốn duy trì                        │
│                                                                 │
│  GitHub Actions ✅ khi:                                         │
│  ├─ Repo đã trên GitHub, muốn setup nhanh                       │
│  ├─ Team nhỏ, rapid iteration                                   │
│  ├─ Cloud-native, serverless approach                           │
│  └─ Không muốn quản lý infrastructure                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│            RECOMMENDED PIPELINE STRUCTURE                       │
│                                                                 │
│  Install → Lint → Type Check → Test → Build → Deploy           │
│     │        │        │         │        │        │             │
│   (fast)   (fail   (quick    (isolated (heavy   (gated)        │
│            fast)    check)     runs)    step)    approval)      │
│                                                                 │
│  Parallel: Unit + Integration tests chạy cùng lúc               │
│  Post: cleanup + notify + archive artifacts                     │
└─────────────────────────────────────────────────────────────────┘
```

```
✅ LUÔN làm:
├─ Viết Jenkinsfile chung (commit vào git — version-controlled)
├─ Dùng `agent { kubernetes {...} }` để scale linh hoạt
├─ Đặt `timeout` tránh pipeline treo vô hạn
├─ Dùng `options { disableConcurrentBuilds() }` tránh race condition
├─ Archive artifacts quan trọng (report, logs)
└─ Dùng shared library (`@Library`) tái sử dụng logic

❌ KHÔNG bao giờ:
├─ Hardcode credentials trong Jenkinsfile
├─ Bỏ qua `cleanWs()` — tốn disk nhanh
├─ Để pipeline chạy > 30 phút (dùng parallel tối ưu)
├─ Deploy production không qua approval gate
└─ Dùng `npm install` thay vì `npm ci` (không reproducible)
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|---|---|
| **Jenkinsfile** | Định nghĩa pipeline trong code, version-controlled |
| **Declarative** | Cú pháp `pipeline {}` rõ ràng, dễ đọc |
| **Agent** | Nơi chạy pipeline — có thể override per-stage |
| **Stage** | Giai đoạn logic trong pipeline |
| **Post actions** | `always` / `success` / `failure` / `aborted` |
| **Kubernetes agent** | Chạy pipeline trong containerized environment |

```
┌──────────────────────────────────────────────────────────────┐
│                JENKINS QUICK REFERENCE                       │
│                                                              │
│  Structure    → pipeline { agent {} stages {} post {} }      │
│  Step         → sh 'command' / bat 'command'                 │
│  Condition    → when { branch 'main' } / input {}            │
│  Parallel     → parallel { stage('A'){...} stage('B'){...} } │
│  Env vars     → environment { KEY = 'value' }               │
│  Options      → timeout / disableConcurrent / timestamps    │
│  Post         → always / success / failure / aborted         │
│                                                              │
│  Alternatives: GitHub Actions / GitLab CI / CircleCI        │
└──────────────────────────────────────────────────────────────┘
```

> **"Infrastructure as Code applies to CI/CD too — your pipeline should live in git."**

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|---|---|
| [Git Flow](../8.1-gitflow/README.md) | Branch strategy trigger pipeline |
| [GitHub Actions](../8.2-github-actions/README.md) | Alternative CI/CD platform |
| [Docker](../8.4-docker/README.md) | Containerized Jenkins agents |
| [Kubernetes](../8.5-kubernetes/README.md) | K8s-based Jenkins pipelines |
