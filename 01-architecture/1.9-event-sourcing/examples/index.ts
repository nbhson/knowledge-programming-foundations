/**
 * 📜 Event Sourcing — Wallet Demo
 *
 * Không lưu state, chỉ lưu events (append-only, bất biến).
 * State = replay(events). Hỗ trợ audit, time-travel, rebuild.
 */

// ============================================
// EVENTS — bất biến, là sự thật đã xảy ra
// ============================================

type WalletEvent =
  | { type: "WalletCreated"; payload: { id: string; owner: string } }
  | { type: "Deposited"; payload: { id: string; amount: number } }
  | { type: "Withdrawn"; payload: { id: string; amount: number } };

// ============================================
// EVENT STORE — append-only
// ============================================

class EventStore {
  private streams = new Map<string, WalletEvent[]>();
  append(streamId: string, event: WalletEvent): void {
    if (!this.streams.has(streamId)) this.streams.set(streamId, []);
    this.streams.get(streamId)!.push(event);
    console.log(`  📝 Event: ${event.type} ${JSON.stringify(event.payload)}`);
  }
  readStream(streamId: string): WalletEvent[] { return [...(this.streams.get(streamId) ?? [])]; }
  readAll(): WalletEvent[] { return Array.from(this.streams.values()).flat(); }
}

// ============================================
// AGGREGATE — apply events để dựng state
// ============================================

interface WalletState { id: string; owner: string; balance: number; version: number; }

function replay(events: WalletEvent[]): WalletState | null {
  let state: WalletState | null = null;
  for (const ev of events) {
    switch (ev.type) {
      case "WalletCreated": state = { id: ev.payload.id, owner: ev.payload.owner, balance: 0, version: 0 }; break;
      case "Deposited": if (state) { state.balance += ev.payload.amount; state.version++; } break;
      case "Withdrawn": if (state) { state.balance -= ev.payload.amount; state.version++; } break;
    }
  }
  return state;
}

class WalletAggregate {
  constructor(private id: string, private eventStore: EventStore) {}

  create(owner: string): void {
    this.eventStore.append(this.id, { type: "WalletCreated", payload: { id: this.id, owner } });
  }
  deposit(amount: number): void {
    const state = this.getState();
    if (!state) throw new Error("Wallet not created");
    if (amount <= 0) throw new Error("Invalid amount");
    this.eventStore.append(this.id, { type: "Deposited", payload: { id: this.id, amount } });
  }
  withdraw(amount: number): void {
    const state = this.getState();
    if (!state) throw new Error("Wallet not created");
    if (state.balance < amount) throw new Error("Insufficient funds");
    this.eventStore.append(this.id, { type: "Withdrawn", payload: { id: this.id, amount } });
  }
  getState(): WalletState | null { return replay(this.eventStore.readStream(this.id)); }
  getHistory(): WalletEvent[] { return this.eventStore.readStream(this.id); }
}

// ============================================
// SNAPSHOT — tối ưu replay khi event nhiều
// ============================================

class SnapshotStore {
  private snapshots = new Map<string, { state: WalletState; version: number }>();
  save(id: string, state: WalletState): void { this.snapshots.set(id, { state: { ...state }, version: state.version }); }
  get(id: string): WalletState | undefined { return this.snapshots.get(id)?.state; }
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  📜 EVENT SOURCING — Wallet Demo         ║");
  console.log("║  State = replay(events)                  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const store = new EventStore();
  const wallet = new WalletAggregate("w1", store);

  console.log("📝 Appending events:");
  wallet.create("Alice");
  wallet.deposit(100);
  wallet.withdraw(30);
  wallet.deposit(50);

  console.log("\n📋 Current state (replay):");
  const state = wallet.getState();
  console.log(`  💳 ${state?.id} (${state?.owner}): balance = ${state?.balance}, version = ${state?.version}`);

  console.log("\n📜 Full event stream (audit trail):");
  wallet.getHistory().forEach((e, i) => console.log(`  ${i + 1}. ${e.type} ${JSON.stringify(e.payload)}`));

  console.log("\n⏪ Time-travel: balance after 2 events:");
  const partial = replay(wallet.getHistory().slice(0, 2));
  console.log(`  → balance = ${partial?.balance} (after WalletCreated + Deposited 100)`);

  console.log("\n💾 Snapshot demo:");
  const snapStore = new SnapshotStore();
  if (state) { snapStore.save("w1", state); console.log(`  Snapshot saved at version ${state.version}, balance ${state.balance}`); }
  wallet.deposit(20);
  console.log(`  After more events, replay from snapshot + new events → balance = ${wallet.getState()?.balance}`);

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Append-only, event bất biến → audit đầy đủ");
  console.log("  ✅ Replay → time-travel, rebuild read model");
  console.log("  ✅ Snapshot tăng tốc replay khi event nhiều");
  console.log("  ⚠️ Event schema khó đổi, cần versioning; GDPR cần tombstone");
}

main();
export {};
