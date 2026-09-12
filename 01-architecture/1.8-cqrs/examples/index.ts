/**
 * ⚔️ CQRS Demo — Product Catalog
 *
 * Tách Command (ghi) và Query (đọc) thành 2 model/handler riêng.
 * Write DB (normalized) sync → Read DB (denormalized) qua event.
 */

// ============================================
// DOMAIN MODELS
// ============================================

interface Product { id: string; name: string; price: number; stock: number; }
interface ProductReadModel { id: string; name: string; price: number; stock: number; displayText: string; }

// ============================================
// WRITE SIDE — Commands
// ============================================

type Command = { type: "CreateProduct"; payload: { id: string; name: string; price: number; stock: number } } | { type: "UpdatePrice"; payload: { id: string; price: number } } | { type: "UpdateStock"; payload: { id: string; stock: number } };

class InMemoryEventStore {
  private events: { type: string; payload: any; at: Date }[] = [];
  append(type: string, payload: any): void { this.events.push({ type, payload, at: new Date() }); }
  all(): any[] { return [...this.events]; }
}

class ProductCommandHandler {
  private writeDb = new Map<string, Product>();
  constructor(private eventStore: InMemoryEventStore, private projector: (e: any) => void) {}
  handle(cmd: Command): string {
    switch (cmd.type) {
      case "CreateProduct": {
        const p = cmd.payload;
        if (this.writeDb.has(p.id)) throw new Error(`Product ${p.id} exists`);
        this.writeDb.set(p.id, { ...p });
        this.eventStore.append("ProductCreated", p);
        this.projector({ type: "ProductCreated", payload: p });
        console.log(`  ✏️ [Command] Created ${p.id}: ${p.name}`);
        return p.id;
      }
      case "UpdatePrice": {
        const p = this.writeDb.get(cmd.payload.id);
        if (!p) throw new Error("Not found");
        p.price = cmd.payload.price;
        this.eventStore.append("PriceUpdated", cmd.payload);
        this.projector({ type: "PriceUpdated", payload: cmd.payload });
        console.log(`  ✏️ [Command] Price ${cmd.payload.id} → $${cmd.payload.price}`);
        return p.id;
      }
      case "UpdateStock": {
        const p = this.writeDb.get(cmd.payload.id);
        if (!p) throw new Error("Not found");
        p.stock = cmd.payload.stock;
        this.eventStore.append("StockUpdated", cmd.payload);
        this.projector({ type: "StockUpdated", payload: cmd.payload });
        console.log(`  ✏️ [Command] Stock ${cmd.payload.id} → ${cmd.payload.stock}`);
        return p.id;
      }
    }
  }
  // Command chỉ trả id/status, không trả read model phức tạp
}

// ============================================
// READ SIDE — Queries (denormalized, tối ưu đọc)
// ============================================

class ProductReadModelStore {
  private readDb = new Map<string, ProductReadModel>();
  project(event: { type: string; payload: any }): void {
    if (event.type === "ProductCreated") {
      const p = event.payload;
      this.readDb.set(p.id, { ...p, displayText: `${p.name} — $${p.price} (${p.stock} left)` });
    } else if (event.type === "PriceUpdated") {
      const m = this.readDb.get(event.payload.id);
      if (m) { m.price = event.payload.price; m.displayText = `${m.name} — $${m.price} (${m.stock} left)`; }
    } else if (event.type === "StockUpdated") {
      const m = this.readDb.get(event.payload.id);
      if (m) { m.stock = event.payload.stock; m.displayText = `${m.name} — $${m.price} (${m.stock} left)`; }
    }
  }
  getById(id: string): ProductReadModel | undefined { return this.readDb.get(id); }
  list(): ProductReadModel[] { return Array.from(this.readDb.values()); }
}

class ProductQueryHandler {
  constructor(private readStore: ProductReadModelStore) {}
  getProduct(id: string): ProductReadModel | undefined {
    console.log(`  🔍 [Query] Get ${id}`);
    return this.readStore.getById(id);
  }
  listProducts(): ProductReadModel[] {
    console.log(`  🔍 [Query] List all`);
    return this.readStore.list();
  }
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ⚔️  CQRS DEMO — Product Catalog         ║");
  console.log("║  Command (write) ≠ Query (read)          ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const readStore = new ProductReadModelStore();
  const eventStore = new InMemoryEventStore();
  const cmdHandler = new ProductCommandHandler(eventStore, e => readStore.project(e));
  const queryHandler = new ProductQueryHandler(readStore);

  // Commands (ghi)
  cmdHandler.handle({ type: "CreateProduct", payload: { id: "p1", name: "Laptop", price: 1500, stock: 10 } });
  cmdHandler.handle({ type: "CreateProduct", payload: { id: "p2", name: "Mouse", price: 25, stock: 100 } });
  cmdHandler.handle({ type: "UpdatePrice", payload: { id: "p1", price: 1400 } });

  // Queries (đọc) — không chạm Write DB
  console.log("\n📋 Read Model (denormalized):");
  queryHandler.listProducts().forEach(p => console.log(`  📦 ${p.id}: ${p.displayText}`));

  console.log("\n🔎 Get p1:");
  const p1 = queryHandler.getProduct("p1");
  console.log(`  → ${p1?.displayText}`);

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Command trả id/status, Query trả read model");
  console.log("  ✅ Read model denormalized → query nhanh");
  console.log("  ✅ Write/Read scale độc lập, đồng bộ qua event");
  console.log("  ⚠️ Eventual consistency: read có thể chậm hơn write 1 nhịp");
}

main();
export {};
