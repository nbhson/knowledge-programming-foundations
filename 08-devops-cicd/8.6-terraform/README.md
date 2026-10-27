# 🏗️ 8.6 Terraform — Infrastructure as Code

> **Terraform** là công cụ Infrastructure as Code (IaC) phổ biến nhất của HashiCorp — cho phép định nghĩa và quản lý infrastructure (server, network, database...) qua code thay vì click trên web console.
> Được tạo 2014, giờ là standard industry cho cloud provisioning. Terraform CLI bản hiện hành là **1.12.x**; nếu cần phương án open-source thuần, xem thêm **OpenTofu** — fork của Terraform sau khi HashiCorp chuyển sang license BUSL (2023).

---

## 📚 Mục lục

- [Nguyên tắc Infrastructure as Code](#nguyên-tắc-infrastructure-as-code)
- [Tại sao Terraform thay vì CloudFormation/Pulumi?](#tại-sao-terraform)
- [Provider Configuration](#provider-configuration)
- [Basic Resource Definitions](#basic-resource-definitions)
- [State Management](#state-management)
- [Modules](#modules)
- [Workspaces & Environments](#workspaces--environments)
- [Best Practices](#best-practices)

---

## Nguyên tắc Infrastructure as Code

```
┌──────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE AS CODE                        │
│                                                                  │
│   ❌ KHÔNG CÓ IaC                              ✅ CÓ IaC       │
│   ┌──────────────┐                           ┌──────────────┐   │
│   │ ClickConsole │                           │ Terraform    │   │
│   │  - Thủ công  │                           │  - Versioned │   │
│   │  - Không tái │                           │  - Reusable  │   │
│   │    sử dụng   │                           │  - Drift detect│  │
│   │  - Dễ sai    │                           │  - Audit trail │  │
│   └──────┬───────┘                           └──────┬───────┘   │
│          ↓                                            ↓          │
│   Manual setup                 git push → terraform apply      │
│   Slow, error-prone            Fast, repeatable, auditable     │
│   "Ai đó cấu hình hôm qua"     "Commit hôm qua nói gì"         │
└──────────────────────────────────────────────────────────────────┘
```

### 4 nguyên tắc cốt lõi

| Nguyên tắc | Mô tả | Ví dụ vi phạm |
|------------|-------|---------------|
| **Declarative** | Khai báo "cái gì" cần có, không phải "làm thế nào" | imperative: "tạo VPC rồi tạo subnet..." → Terraform: `resource "aws_vpc" {...}` |
| **Immutable** | Thay đổi = destroy + recreate, không edit tại chỗ | editing EC2 instance qua console → Terraform sẽ replace khi config đổi |
| **Idempotent** | Chạy nhiều lần cho cùng kết quả | `terraform apply` 10 lần = cùng state, không tạo 10 resource |
| **Versioned** | Code infrastructure lưu trong git, review được | PR review cho thay đổi infra = same rigor như code review |

### Terraform workflow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Write    │ →  │ Plan     │ →  │ Apply    │ →  │ Monitor  │
│ Code     │    │ (preview)│    │ (execute)│    │ (drift)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │                │                │
  main.tf        terraform          terraform      terraform
                 plan --out         apply            drift detection
```

| Command | Hoạt động | Output |
|---------|-----------|--------|
| `terraform init` | Cài provider plugins, khởi tạo backend | `.terraform/` folder |
| `terraform plan` | Preview changes — so sánh desired vs actual | Text report: `+ create`, `- destroy`, `~ update` |
| `terraform apply` | Áp dụng changes | Infrastructure thay đổi theo plan |
| `terraform destroy` | Xóa toàn bộ resources quản lý bởi Terraform | Empty state |
| `terraform fmt` | Format code theo chuẩn HashiCorp | Code đẹp hơn |
| `terraform validate` | Kiểm tra syntax + nội tại | Pass/Fail |

---

## Tại sao Terraform?

| Tool | Ngôn ngữ | Multi-cloud | Learning curve | Phù hợp |
|------|----------|-------------|----------------|---------|
| **Terraform** | HCL | ✅ AWS/Azure/GCP... | Thấp-Trung bình | General purpose, team Việt Nam |
| **CloudFormation** | JSON/YAML | ❌ AWS only | Cao (cú pháp khó đọc) | AWS-only enterprise |
| **Pulumi** | TS/Python/Go | ✅ Multi-cloud | Thấp (dùng ngôn ngữ thật) | Team muốn type safety |
| **AWS CDK** | TS/Python | ❌ AWS only | Trung bình | AWS + TypeScript preference |

**Lý do Terraform phổ biến nhất:**
- Multi-cloud (1 code cho AWS + Azure + GCP)
- Huge provider ecosystem (200+ providers)
- State-driven (biết chính xác cái gì đang tồn tại)
- Community lớn, hàng nghìn modules sẵn có
- HCL (HashiCorp Configuration Language) — declarative, readable

---

## Provider Configuration

### Provider basics

```hcl
# main.tf — Cấu hình provider
terraform {
  required_version = ">= 1.5.0"   # Tối thiểu Terraform version

  required_providers {
    aws = {
      source  = "hashicorp/aws"   # Registry source
      version = "~> 5.0"          # Semantic version constraint
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# AWS provider
provider "aws" {
  region = var.aws_region

  default_tags {                    # Tự động add tags cho mọi resource
    tags = {
      Project     = "myapp"
      Environment = var.env
      ManagedBy   = "terraform"
      Team        = "platform"
    }
  }
}

# Azure provider (nếu dùng multi-cloud)
provider "azurerm" {
  features {}
}
```

### Variables & Outputs

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"    # Singapore — gần Việt Nam nhất

  validation {
    condition     = can(regex("^ap-", var.aws_region))
    error_message = "Region phải bắt đầu với 'ap-'."
  }
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "instance_count phải từ 1 đến 10."
  }
}

variable "allowed_cidr" {
  description = "CIDR blocks allowed to access"
  type        = list(string)
  default     = ["10.0.0.0/8"]      # Only internal networks
}

# outputs.tf
output "instance_ids" {
  description = "IDs of created instances"
  value       = aws_instance.web[*].id   # List of all IDs
}

output "app_url" {
  description = "Application URL"
  value       = aws_instance.web[0].public_ip
}

output "security_group_id" {
  description = "SG ID for reference"
  value       = aws_security_group.web.id
}
```

---

## Basic Resource Definitions

### AWS Example (VPC + EC2 + Security Group)

```hcl
# resources/infrastructure.tf

# Data sources — query existing AWS resources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]      # AWS owned Ubuntu AMI

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC — Network tier 1
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"     # 65,536 IP addresses
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.env}-vpc"
  }
}

# Public Subnets — 2 AZs cho HA
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.env}-public-${count.index + 1}"
    Tier = "public"
  }
}

# Internet Gateway — outbound internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.env}-igw" }
}

# Route Table — route to internet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.env}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group — firewall rules
resource "aws_security_group" "web" {
  name        = "${var.env}-web-sg"
  description = "Allow HTTP/HTTPS inbound"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr
  }

  # SSH chỉ từ VPN/internal (bảo mật)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]      # Chỉ internal network
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]       # Allow all outbound
  }

  tags = { Name = "${var.env}-web-sg" }
}

# EC2 Instances
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public[count.index % 2].id   # Spread across AZs
  vpc_security_group_ids = [aws_security_group.web.id]

  # User data — bootstrap script chạy khi instance khởi tạo
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              EOF

  tags = {
    Name        = "${var.env}-web-${count.index + 1}"
    Role        = "web-server"
    Environment = var.env
  }
}
```

### Terraform State Commands

```bash
# Khởi tạo workspace (download providers, init backend)
terraform init

# Preview changes (không áp dụng — chỉ xem)
terraform plan -var='env=staging'
terraform plan -var='env=production' -out=prod.plan

# Apply changes (dùng plan file để auditable)
terraform apply prod.plan

# Destroy everything managed by this config
terraform destroy

# View current state
terraform state list                    # Liệt kê tất cả resources
terraform state show aws_instance.web[0]  # Chi tiết 1 resource
terraform state pull                    # Download state (backup)
terraform state mv aws_instance.web aws_module.aws_instance.web  # Di chuyển resource

# Import existing resource into Terraform management
terraform import aws_instance.web i-0abc123def456
```

---

## State Management

### Local vs Remote State

| | Local State | Remote State (S3 + DynamoDB) |
|---|---|---|
| **Vị trí** | `terraform.tfstate` local | S3 bucket |
| **Collaboration** | 1 người (file lock local) | Team nhiều người (DynamoDB lock) |
| **Locking** | Không | DynamoDB table prevents concurrent writes |
| **Security** | Ít an toàn (file trên disk) | Encryption + IAM + bucket policies |
| **Versioning** | Không (ghi đè) | S3 versioning giữ lịch sử state |
| **Phù hợp** | Dev local, solo | Production team |

### Remote state configuration

```hcl
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true               # AES-256 encryption at rest
    dynamodb_table = "terraform-locks"  # State locking
  }
}
```

### State file — quan trọng thế nào?

State file là **bản đồ** giữa code Terraform và infrastructure thực tế. Mất state = Terraform không biết nó đã tạo gì → có thể:
- **Tạo trùng resource** (nếu code giống nhưng state mất)
- **Không thể delete** (vì không track được)
- **Drift không phát hiện được**

**Never commit `terraform.tfstate` vào git!** (có thể chứa secrets)

### State best practices

```
✅ LUÔN làm:
├─ Dùng remote backend cho production (S3 + DynamoDB lock)
├─ Bật versioning cho state bucket (S3) — recover được nếu xóa nhầm
├─ Dùng workspaces cho multiple environments (dev/staging/prod)
├─ Không commit tfstate vào git
├─ Dùng terraform import để bring existing resources
├─ Backup state định kỳ (s3 cp terraform.tfstate backup/)
└─ Dùng `terraform state mv` để refactor structure mà không destroy

❌ KHÔNG bao giờ:
├─ Edit tfstate file thủ công (dùng `terraform state rm/mv/import` thay thế)
├─ Chia sẻ state file qua email/cloud storage không bảo mật
├─ Chạy terraform apply từ nhiều máy cùng lúc (không có lock)
├─ Xóa state file bừa bãi (resource mất connection với Terraform)
└─ Dùng local state cho production
```

---

## Modules

Module = container tái sử dụng của Terraform code. Giống như function trong lập trình.

```
modules/
├── network/
│   ├── main.tf        # VPC, subnets, IGW, route tables
│   ├── variables.tf
│   └── outputs.tf
├── compute/
│   ├── main.tf        # EC2 instances, ASG
│   ├── variables.tf
│   └── outputs.tf
└── database/
    ├── main.tf        # RDS cluster
    ├── variables.tf
    └── outputs.tf

environments/
├── staging/
│   └── main.tf        # module calls + variables
└── production/
    └── main.tf
```

**Ví dụ module call:**

```hcl
# environments/production/main.tf
module "network" {
  source       = "../../modules/network"
  env          = "production"
  cidr_block   = "10.0.0.0/16"
  az_count     = 3
}

module "compute" {
  source         = "../../modules/compute"
  env            = "production"
  vpc_id         = module.network.vpc_id
  subnet_ids     = module.network.public_subnet_ids
  instance_count = 3
  instance_type  = "t3.medium"
}

module "database" {
  source      = "../../modules/database"
  env         = "production"
  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.private_subnet_ids
}
```

---

## Workspaces & Environments

```
workspace: default    → terraform.tfstate (local)
workspace: staging    → terraform.tfstate.staging
workspace: production → terraform.tfstate.production
```

```bash
# Tạo và switch workspace
terraform workspace new staging
terraform workspace select staging
terraform workspace select production

# Mỗi workspace có state riêng — isolates resources giữa env
# Nhưng cùng 1 codebase (main.tf) — DRY
```

> 💡 **Misconception:** Workspace không phải là cách tốt cho production isolation. Nên dùng **separate state files** (different S3 keys) hoặc **separate root modules** cho production vs staging. Workspace phù hợp cho dev/test cá nhân.

---

## Best Practices

```
✅ LUÔN làm:
├─ Chia nhỏ thành modules (network, compute, database) — tái sử dụng
├─ Dùng locals cho values lặp lại — tránh hardcode
├─ Áp dụng lifecycle rules (create_before_destroy = true) — zero downtime
├─ Dùng remote state với locking (S3 + DynamoDB)
├─ Format code: terraform fmt -recursive
├─ Validate: terraform validate trước khi apply
├─ Luôn chạy plan trước apply: terraform plan -out=plan.tfplan
├─ Dùng `ignore_changes` cho attributes do external system quản lý
└─ Version lock providers: required_providers { aws = { version = "~> 5.0" } }

❌ KHÔNG bao giờ:
├─ Hardcode giá trị trong resource (dùng variable)
├─ Chạy apply mà không plan beforehand
├─ Xóa resource khỏi code mà không destroy (gây drift)
├─ Commit secrets vào terraform files (dùng environment variables hoặc AWS Secrets Manager)
├─ Dùng `terraform apply` không có lock (risk concurrent modification)
└─ Giữ state file local cho production
```

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **Provider** | Plugin kết nối Terraform với cloud (AWS, Azure, GCP) |
| **Resource** | Đơn vị infrastructure (server, DB, network) |
| **State** | File lưu mapping giữa code và thực tế — heart of Terraform |
| **Module** | Đóng gói code Terraform tái sử dụng |
| **Workspace** | Tách state cho different environments (dev/staging/prod) |
| **Plan** | Preview changes trước khi apply — không modify gì |
| **Apply** | Execute plan, tạo/sửa/xóa resources |
| **Import** | Đưa resource có sẵn vào Terraform management |

```
┌──────────────────────────────────────────────────────────────┐
│                TERRAFORM QUICK REFERENCE                     │
│                                                              │
│  init     → terraform init                                  │
│  plan     → terraform plan -var='env=prod'                  │
│  apply    → terraform apply                                 │
│  destroy  → terraform destroy                               │
│  fmt      → terraform fmt -recursive                        │
│  validate → terraform validate                              │
│  state    → terraform state list/show/mv/import             │
│  output   → terraform output                                │
│  workspace→ terraform workspace new/select/list             │
│                                                              │
│  Lifecycle: init → plan → apply → monitor → (repeat)       │
│                                                              │
│  Alternatives: Pulumi / CloudFormation / CDK                │
└──────────────────────────────────────────────────────────────┘
```

> 💡 **"If you can't describe what you are going to consume with enough detail to write a Terraform file, you don't understand your infrastructure well enough to manage it."**

---

## ▶️ Chạy ví dụ

Chạy demo HCL + mô phỏng `terraform plan`/`apply` (idempotent):

```bash
cd 08-devops-cicd/8.6-terraform
npx ts-node examples/index.ts
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [Docker](../8.4-docker/README.md) | Container builds — target của infrastructure |
| [Kubernetes](../8.5-kubernetes/README.md) | Deploy targets — Terraform tạo K8s cluster |
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD deployment — terraform plan/apply trong pipeline |
| [Git Flow](../8.1-gitflow/README.md) | Version control workflow cho Terraform code |
