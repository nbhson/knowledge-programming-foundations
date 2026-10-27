/**
 * 🎯 Domain-Driven Design — Shipping Domain Demo
 *
 * Bounded Context: Shipping
 * Entities: Shipment (Aggregate Root)
 * Value Objects: TrackingId, Address, Location
 * Domain Events: ShipmentDelivered
 * Repository: ShipmentRepository (interface)
 */

// ============================================
// VALUE OBJECTS — bất biến, không có identity, so sánh theo giá trị
// ============================================

class TrackingId {
  constructor(public readonly value: string) {
    if (!value || value.length < 5) throw new Error("Invalid tracking id");
  }
  equals(other: TrackingId): boolean { return this.value === other.value; }
}

class Address {
  constructor(public readonly street: string, public readonly city: string, public readonly country: string) {}
  toString(): string { return `${this.street}, ${this.city}, ${this.country}`; }
  equals(other: Address): boolean { return this.street === other.street && this.city === other.city && this.country === other.country; }
}

class Location {
  constructor(public readonly lat: number, public readonly lng: number) {}
  toString(): string { return `(${this.lat}, ${this.lng})`; }
}

// ============================================
// DOMAIN EVENTS
// ============================================

class ShipmentDelivered {
  constructor(public readonly trackingId: TrackingId, public readonly deliveredAt: Date) {}
}

// ============================================
// ENTITY / AGGREGATE ROOT — có identity, quản lý invariant qua root
// ============================================

class Shipment {
  private locations: Location[] = [];
  private delivered = false;
  private events: ShipmentDelivered[] = [];

  constructor(public readonly trackingId: TrackingId, public readonly origin: Address, public readonly destination: Address) {}

  addLocation(loc: Location): void {
    if (this.delivered) throw new Error("Cannot update delivered shipment");
    this.locations.push(loc);
    console.log(`  📍 ${this.trackingId.value}: moved to ${loc}`);
  }

  deliver(): ShipmentDelivered {
    if (this.delivered) throw new Error("Already delivered");
    if (this.locations.length === 0) throw new Error("Cannot deliver without transit");
    this.delivered = true;
    const ev = new ShipmentDelivered(this.trackingId, new Date());
    this.events.push(ev);
    console.log(`  ✅ Delivered ${this.trackingId.value} to ${this.destination}`);
    return ev;
  }

  getStatus(): string { return this.delivered ? "DELIVERED" : `IN_TRANSIT (${this.locations.length} hops)`; }
  getEvents(): ShipmentDelivered[] { return [...this.events]; }
}

// ============================================
// REPOSITORY — interface lưu aggregate
// ============================================

interface ShipmentRepository {
  save(shipment: Shipment): void;
  findById(id: TrackingId): Shipment | undefined;
}

class InMemoryShipmentRepository implements ShipmentRepository {
  private store = new Map<string, Shipment>();
  save(s: Shipment): void { this.store.set(s.trackingId.value, s); }
  findById(id: TrackingId): Shipment | undefined { return this.store.get(id.value); }
}

// ============================================
// DOMAIN SERVICE — logic liên quan nhiều aggregate
// ============================================

class ShippingCostService {
  calculate(shipment: Shipment): number {
    // đơn giản: phí cố định + số chặng
    const hops = (shipment as any).locations?.length ?? 0;
    return 50000 + hops * 10000;
  }
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🎯 DDD — SHIPPING DOMAIN DEMO           ║");
  console.log("║  Bounded Context: Shipping               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const repo: ShipmentRepository = new InMemoryShipmentRepository();
  const costService = new ShippingCostService();

  const tid = new TrackingId("TRK-12345");
  const shipment = new Shipment(tid, new Address("123 Le Loi", "HCM", "VN"), new Address("456 Hoan Kiem", "Hanoi", "VN"));
  repo.save(shipment);

  console.log(`📦 Created shipment ${tid.value}: ${shipment.origin} → ${shipment.destination}`);
  console.log(`   Value Object equality: TrackingId("TRK-12345").equals(TRK-12345) = ${tid.equals(new TrackingId("TRK-12345"))}`);

  shipment.addLocation(new Location(10.8, 106.6));
  shipment.addLocation(new Location(21.0, 105.8));
  console.log(`   Status: ${shipment.getStatus()}`);
  console.log(`   Shipping cost: ${costService.calculate(shipment)} VND`);

  const ev = shipment.deliver();
  console.log(`   Event: ShipmentDelivered at ${ev.deliveredAt.toISOString()}`);
  console.log(`   Status: ${shipment.getStatus()}`);

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Ubiquitous Language: Shipment, TrackingId, Location");
  console.log("  ✅ Aggregate Root (Shipment) bảo vệ invariant");
  console.log("  ✅ Value Objects bất biến, so sánh theo giá trị");
  console.log("  ✅ Repository che giấu persistence");
}

main();
export {};
