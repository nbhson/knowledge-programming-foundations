/**
 * 5.9 Code Organization — Demo tổng quan
 *
 * Ba cách tổ chức mã nguồn (bản đầy đủ ở từng leaf 5.9.1 → 5.9.3):
 *   1. Barrel Exports           — index.ts re-export, import gọn 1 nơi
 *   2. Feature-based Organization — gom mọi thứ của 1 feature vào 1 folder
 *   3. Layered Organization     — gom code theo tầng, gọi đúng 1 chiều
 */

// ────────── 1. BARREL EXPORTS (khái niệm) ──────────
// Các file trong 1 folder: order.model.ts, order.repository.ts, order.service.ts
// LAZY stash: barrel index.ts chỉ cần thêm 3 dòng `export * from ...` → consumer import 1 chỗ.
class CoOrderModel {
  constructor(readonly id: string, readonly total: number) {}
}

class CoOrderRepository {
  private rows = new Map<string, CoOrderModel>();
  save(order: CoOrderModel): void {
    this.rows.set(order.id, order);
  }
  find(id: string): CoOrderModel | null {
    return this.rows.get(id) ?? null;
  }
}

class CoOrderService {
  constructor(private readonly repo: CoOrderRepository) {}
  create(id: string, total: number): CoOrderModel {
    const order = new CoOrderModel(id, total);
    this.repo.save(order);
    return order;
  }
}

// (Barrel thật: export * from "./order.model"; export * from "./order.repository"; ...)

// ────────── 2. FEATURE-BASED (khái niệm) ──────────
// Mỗi feature là 1 class gói trọn model + service + handler của riêng nó
class CoAuthFeature {
  readonly key = "auth";
  login(username: string, password: string): string {
    return username === "admin" && password === "secret" ? "token-123" : "";
  }
}

class CoProductFeature {
  readonly key = "products";
  private items = new Map<string, string>();
  add(id: string, title: string): string {
    this.items.set(id, title);
    return `${id}: ${title}`;
  }
  list(): string[] {
    return [...this.items.values()];
  }
}

// ────────── 3. LAYERED (khái niệm) ──────────
// Presentation → Service → Data. Gọi ĐÚNG 1 chiều, không đi ngược lên.
class CoOrderDataAccess {
  private statusById = new Map<string, string>();
  setStatus(id: string, status: string): void {
    this.statusById.set(id, status);
  }
  getStatus(id: string): string {
    return this.statusById.get(id) ?? "unknown";
  }
}

class CoOrderBusinessService {
  constructor(private readonly data: CoOrderDataAccess) {}
  ship(id: string): string {
    const current = this.data.getStatus(id);
    if (current === "pending") {
      this.data.setStatus(id, "shipped");
      return "Đơn hàng đã được giao";
    }
    return `Không thể ship (trạng thái hiện tại: ${current})`;
  }
}

class CoOrderController {
  constructor(private readonly service: CoOrderBusinessService) {}
  handleShip(id: string): string {
    return `[Controller] ${this.service.ship(id)}`;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Code Organization Demo (tổng quan) ===");
console.log("");

console.log("1️⃣ BARREL EXPORTS — import 1 điểm thay vì nhiều đường sâu:");
const coRepo = new CoOrderRepository();
const coSvc = new CoOrderService(coRepo);
coSvc.create("ord-100", 1500000);
console.log("  ✅ import { CoOrderModel, CoOrderRepository, CoOrderService } from './order' — 1 dòng thay cho 3 import sâu");
console.log(`     (order.id=${coSvc.create("ord-101", 250000).id} tìm lại: ${coRepo.find("ord-100")?.total} đồng)`);
console.log("     💬 Đổi cấu trúc bên trong folder → consumer không phải sửa gì");
console.log("");

console.log("2️⃣ FEATURE-BASED — gom theo feature, thêm feature chỉ là 'thêm 1 mảnh':");
const coApp = new Map<string, CoAuthFeature | CoProductFeature>();
coApp.set("auth", new CoAuthFeature());
coApp.set("products", new CoProductFeature());
const coProducts = coApp.get("products") as CoProductFeature;
coProducts.add("p1", "Laptop");
coProducts.add("p2", "Chuột");
console.log(`  ✅ Features đăng ký: ${[...coApp.keys()].join(", ")} — ${coProducts.list().join(" · ")}`);
console.log("     💬 Toàn bộ code của 'auth' nằm 1 chỗ (model+service+handler) → dễ di chuyển, ít conflict");
console.log("");

console.log("3️⃣ LAYERED — presentation → service → data, gọi đúng 1 chiều:");
const coData = new CoOrderDataAccess();
coData.setStatus("ord-100", "pending");
const coLogic = new CoOrderBusinessService(coData);
const coController = new CoOrderController(coLogic);
console.log(`  ✅ ${coController.handleShip("ord-100")}`);
console.log("     💬 Data layer KHÔNG biết service/controller — đổi DB không ảnh hưởng tầng trên");
console.log("");
console.log("✅ Code Organization: chọn đúng cách sắp xếp → dễ navigate, maintain, scale (xem 5.9.1 → 5.9.3)");
console.log("");

export {};