/**
 * 5.2.9 FDD (Feature-Driven Development) — Phát triển theo từng feature
 *
 * Mô phỏng 5 bước (process) của FDD:
 * 1. Develop Overall Model — dựng domain model tổng thể
 * 2. Build Feature List     — feature nhỏ, dạng "<action> <result> <object>"
 * 3. Plan by Feature        — phân công & lập lịch theo feature
 * 4. Design by Feature      — thiết kế chi tiết cho cụm feature nhỏ
 * 5. Build by Feature       — code + review + test, MỖI feature = thành quả nhìn thấy
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface FddFeature {
  action: string;
  result: string;
  object: string;
  owner: string;
  status: "planned" | "designed" | "built";
}

class FddProject {
  private features: FddFeature[] = [];

  /** Bước 2: Build Feature List — quy ước "<action> the <result> for a/an <object>" */
  addFeature(action: string, result: string, object: string): void {
    this.features.push({ action, result, object, owner: "-", status: "planned" });
  }

  describe(feature: FddFeature): string {
    return `${feature.action} ${feature.result} for ${feature.object}`;
  }

  buildOverallModel(): void {
    console.log("\n1️⃣ DEVELOP OVERALL MODEL — domain model tổng thể:");
    console.log("   Khách hàng · Đơn hàng · Sản phẩm · Giỏ hàng · Thanh toán");
  }

  listFeatures(): void {
    console.log("\n2️⃣ BUILD FEATURE LIST — mỗi feature nhỏ, có giá trị, người dùng đọc hiểu:");
    for (const f of this.features) {
      console.log(`   • "${this.describe(f)}" — ${f.status}`);
    }
  }

  /** Bước 3: Plan by Feature — gán owner theo feature */
  planByFeature(owners: Record<string, string>): void {
    console.log("\n3️⃣ PLAN BY FEATURE — phân công & lập lịch theo feature:");
    for (const f of this.features) {
      f.owner = owners[this.describe(f)] ?? "dev";
      console.log(`   • ${this.describe(f)} → ${f.owner}`);
    }
  }

  /** Bước 4: Design by Feature — thiết kế chi tiết cho cụm feature nhỏ */
  designByFeature(): void {
    console.log("\n4️⃣ DESIGN BY FEATURE — thiết kế chi tiết (class diagram) cho từng cụm <= 2 tuần:");
    for (const f of this.features) {
      console.log(`   • "Add ${f.result}" cần: Entity, Repository, Service, Controller`);
    }
  }

  /** Bước 5: Build by Feature — code + review + test rồi tích hợp ngay */
  buildByFeature(): void {
    console.log("\n5️⃣ BUILD BY FEATURE — MỖI feature: code → review → test → integrate:");
    for (const f of this.features) {
      f.status = "built";
      console.log(`   ✅ ${this.describe(f)} (${f.owner}) — done, đã tích hợp, demo được ngay`);
    }
  }

  progress(): void {
    const built = this.features.filter((f) => f.status === "built").length;
    console.log(`\n📊 Tiến độ: ${built}/${this.features.length} feature built (${((built / this.features.length) * 100).toFixed(0)}%)`);
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.9 FDD — Feature-Driven Development Demo ===\n");

const project = new FddProject();
project.buildOverallModel();

project.addFeature("Check", "the stock", "a product");
project.addFeature("Add", "a product", "this order");
project.addFeature("Calculate", "the total", "this order");
project.addFeature("Apply", "a discount", "a loyal customer");

project.listFeatures();
project.planByFeature({
  "Check the stock for a product": "Mai",
  "Add a product for this order": "Huy",
  "Calculate the total for this order": "An",
  "Apply a discount for a loyal customer": "Mai",
});
project.designByFeature();
project.buildByFeature();
project.progress();

console.log("\n✅ FDD: thành quả = FEATURE (nhìn thấy & demo được), không phải 'task' — domain model tốt giúp feature rõ ràng.");

export {};