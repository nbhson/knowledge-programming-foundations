# 🏗️ 8.6 Terraform — Infrastructure as Code

> **Terraform** là công cụ Infrastructure as Code (IaC) phổ biến nhất của HashiCorp — cho phép định nghĩa và quản lý infrastructure (server, network, database...) qua code thay vì click trên web console.

---

## 📚 Mục lục

- [Nguyên tắc Infrastructure as Code](#nguyên-tắc-infrastructure-as-code)
- [Provider Configuration](#provider-configuration)
- [Basic Resource Definitions](#basic-resource-definitions)
- [State Management](#state-management)
- [Best Practices](#best-practices)

---

## Nguyên tắc Infrastructure as Code

```
┌──────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE AS CODE                        │
│                                                                  │
│   ❌ KHÔNG CÓ IaC                      ✅ CÓ IaC               │
│   ┌──────────────┐                   ┌──────────────┐            │
│   │ ClickConsole │                   │ Terraform    │            │
│   │  - Thủ công  │                   │  - Versioned │            │
│   │  - Không tái │                   │  - Reusable  │            │
│   │    sử dụng   │                   │  - Drift detect│          │
│   │  - Dễ sai    │                   │  - Audit trail │          │
│   └──────┬───────┘                   └──────┬───────┘            │
│          ↓                                    ↓                  │
│   Manual setup                 git push → terraform apply        │
│   Slow, error-prone            Fast, repeatable, auditable       │
└──────────────────────────────────────────────────────────────────┘
```

| Nguyên tắc | Mô tả |
|------------|-------|
| **Declarative** | Khai báo "cái gì" cần có, không phải "làm thế nào" |
| **Immutable** | Thay đổi = destroy + recreate, không edit tại chỗ |
| **Idempotent** | Chạy nhiều lần cho cùng kết quả |
| **Versioned** | Code infrastructure lưu trong git, review được |

---

## Provider Configuration

### Provider basics

```hcl
# main.tf — Cấu hình provider
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

  default_tags {
    tags = {
      Project     = "myapp"
      Environment = var.env
      ManagedBy   = "terraform"
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
  default     = "ap-southeast-1"
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
}

# Outputs
output "instance_ids" {
  description = "IDs of created instances"
  value       = aws_instance.web[*].id
}

output "app_url" {
  description = "Application URL"
  value       = aws_instance.web[0].public_ip
}
```

---

## Basic Resource Definitions

### AWS Example

```hcl
# resources/infrastructure.tf

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.env}-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.env}-public-${count.index + 1}"
  }
}

# Security Group
resource "aws_security_group" "web" {
  name        = "${var.env}-web-sg"
  description = "Allow HTTP/HTTPS traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public[count.index % 2].id

  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              EOF

  tags = {
    Name = "${var.env}-web-${count.index + 1}"
  }
}

# Data sources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
```

### Terraform State Commands

```bash
# Khởi tạo workspace
terraform init

# Preview changes
terraform plan -var='env=staging'

# Apply changes
terraform apply -var='env=staging'

# Destroy everything
terraform destroy

# View current state
terraform state list
terraform state show aws_instance.web[0]

# Move resource to new module
terraform state mv aws_instance.web aws_module.aws_instance.web
```

---

## State Management

### Local vs Remote State

| | Local State | Remote State (S3 + DynamoDB) |
|---|---|---|
| **Vị trí** | `terraform.tfstate` local | S3 bucket |
| **Collaboration** | 1 người | Team多人 |
| **Locking** | Không | DynamoDB table |
| **Security** | Ít an toàn | Encryption + IAM |
| **Phù hợp** | Dev local | Production team |

### Remote state configuration

```hcl
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### State best practices

```
✅ LUÔN làm:
├─ Dùng remote backend cho production
├─ Bật versioning cho state bucket
├─ Dùng workspaces cho multiple environments
├─ Không commit tfstate vào git
└─ Dùng terraform import để bring existing resources

❌ KHÔNG bao giờ:
├─ Edit tfstate file thủ công
├─ Chia sẻ state file qua email/cloud storage không bảo mật
├─ Chạy terraform apply từ nhiều máy cùng lúc (không có lock)
└─ Xóa state file bừa bãi (resource mất connection)
```

---

## Best Practices

```
✅ LUÔN làm:
├─ Chia nhỏ thành modules (network, compute, database)
├─ Dùng locals cho values lặp lại
├─ Áp dụng lifecycle rules (create_before_destroy)
├─ Dùng remote state với locking
├─ Format code: terraform fmt
└─ Validate: terraform validate trước khi apply

❌ KHÔNG bao giờ:
├─ Hardcode giá trị trong resource (dùng variable)
├─ Chạy apply mà không plan beforehand
├─ Xóa resource khỏi code mà không destroy (drift)
└─ Commit secrets vào terraform files
```

---

## Module Structure Example

```
modules/
├── network/
│   ├── main.tf        # VPC, subnets, IGW
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

---

## Tổng kết

| Khái niệm | Tóm tắt |
|-----------|---------|
| **Provider** | Plugin kết nối Terraform với cloud (AWS, Azure, GCP) |
| **Resource** | Đơn vị infrastructure (server, DB, network) |
| **State** | File lưu mapping giữa code và thực tế |
| **Module** | Đóng gói code Terraform tái sử dụng |
| **Workspace** | Tách state cho different environments |
| **Plan** | Preview changes trước khi apply |

```
┌──────────────────────────────────────────────────────────────┐
│                TERRAFORM QUICK REFERENCE                     │
│                                                              │
│  init     → terraform init                                  │
│  plan     → terraform plan -var='env=prod'                  │
│  apply    → terraform apply                                 │
│  destroy  → terraform destroy                               │
│  fmt      → terraform fmt                                   │
│  validate → terraform validate                              │
│  state    → terraform state list/show/mv                    │
│  output   → terraform output                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔗 Liên kết

| Chủ đề liên quan | Vị trí |
|------------------|--------|
| [Docker](../8.4-docker/README.md) | Container builds |
| [Kubernetes](../8.5-kubernetes/README.md) | Deploy targets |
| [GitHub Actions](../8.2-github-actions/README.md) | CI/CD deployment |
| [Git Flow](../8.1-gitflow/README.md) | Version control workflow |
