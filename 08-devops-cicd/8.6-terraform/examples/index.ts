/**
 * 8.6 Terraform — HCL block + mô phỏng terraform plan / apply (idempotent)
 *
 * Minh họa:
 * - Code HCL (provider + resource) dạng string.
 * - `terraform plan`: đối chiếu "desired config" với state → +create / ~update / no-op.
 * - `terraform apply`: ghi vào state. Chạy LẠI lần 2 → no-op (idempotent).
 */

// ──────────────────── Code HCL dạng string ────────────────────
const TerraformHcl = `
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "ap-southeast-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
}

variable "instance_type" {
  default = "t3.micro"
}
`;

// ──────────────────── Mô hình mô phỏng state ────────────────────
type TerraformPlanAction = "create" | "update" | "noop";

interface TerraformResource {
  address: string;
  action: TerraformPlanAction;
  detail: string;
}

class TerraformSimulator {
  private state: Record<string, string> = {};

  // plan: so sánh config với state, sinh ra các action
  plan(desired: { address: string; config: string; changedConfig?: string }[]): TerraformResource[] {
    const plan: TerraformResource[] = [];
    for (const d of desired) {
      if (!(d.address in this.state)) {
        plan.push({ address: d.address, action: "create", detail: `add: ${d.config}` });
      } else if (d.changedConfig !== undefined && this.state[d.address] !== d.changedConfig) {
        plan.push({ address: d.address, action: "update", detail: `thay đổi: ${this.state[d.address]} → ${d.changedConfig}` });
      } else {
        plan.push({ address: d.address, action: "noop", detail: "không có thay đổi" });
      }
    }
    return plan;
  }

  // apply: thực thi plan, cập nhật state
  apply(plan: TerraformResource[]): { created: number; updated: number } {
    let created = 0;
    let updated = 0;
    for (const r of plan) {
      if (r.action === "create") {
        this.state[r.address] = r.detail.replace(/^add: /, "");
        created++;
      } else if (r.action === "update") {
        const newVal = r.detail.split("→ ")[1];
        this.state[r.address] = newVal;
        updated++;
      }
    }
    return { created, updated };
  }
}

// ──────────────────── Helper in plan theo kiểu terraform ────────────────────
function printTerraformPlan(label: string, plan: TerraformResource[]): void {
  console.log(`\n📍 ${label}`);
  if (plan.length === 0) {
    console.log("  No changes. Infrastructure is up-to-date.");
    return;
  }
  console.log("  Terraform sẽ thực hiện các hành động sau:");
  for (const r of plan) {
    const icon = r.action === "create" ? "+" : r.action === "update" ? "~" : "=";
    console.log(`    ${icon} ${r.address}`);
    console.log(`        ${r.detail}`);
  }
  const toAdd = plan.filter((r) => r.action === "create").length;
  const toChange = plan.filter((r) => r.action === "update").length;
  const noop = plan.filter((r) => r.action === "noop").length;
  console.log(`  Plan: ${toAdd} to add, ${toChange} to change, ${noop} no-op.`);
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Terraform Demo ===");
console.log("HCL (string) + mô phỏng vòng đời plan/apply.\n");

console.log("📄 CODE HCL (string, không thực thi):");
console.log("```hcl" + TerraformHcl + "```");

const desiredConfigs = [
  { address: "aws_vpc.main", config: "cidr_block=10.0.0.0/16" },
  { address: "aws_subnet.public", config: "cidr_block=10.0.1.0/24" },
  { address: "aws_security_group.web", config: "cổng 80/443 mở" },
  { address: "aws_instance.web", config: "t3.micro" },
];

const sim = new TerraformSimulator();

console.log("\n🧪 LẦN CHẠY 1 — state trống:");
const plan1 = sim.plan(desiredConfigs);
printTerraformPlan("$ terraform plan (lần 1)", plan1);
const { created: created1 } = sim.apply(plan1);
console.log(`\n  ➡️  terraform apply → tạo ${created1} resource, đã ghi vào state.\n`);

console.log("🧪 LẦN CHẠY 2 — resource ĐÃ tồn tại trong state, chỉ đổi instance_type:");
const desiredConfigs2 = desiredConfigs.map((d) =>
  d.address === "aws_instance.web" ? { ...d, config: "t3.micro", changedConfig: "t3.small" } : d,
);
const plan2 = sim.plan(desiredConfigs2);
printTerraformPlan("$ terraform plan (lần 2)", plan2);
const { updated } = sim.apply(plan2);
console.log(`  ➡️  terraform apply → cập nhật ${updated} resource.\n`);

console.log("🧪 LẦN CHẠY 3 — không đổi gì cả:");
const desiredConfigs3 = desiredConfigs.map((d) =>
  d.address === "aws_instance.web" ? { ...d, config: "t3.small", changedConfig: "t3.small" } : d,
);
const plan3 = sim.plan(desiredConfigs3);
printTerraformPlan("$ terraform plan (lần 3)", plan3);

console.log("\n✅ Terraform idempotent: apply lặp lại khi không có thay đổi → no-op, trạng thái hội tụ");
export {};