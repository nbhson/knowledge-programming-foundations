/**
 * 🧅 Clean Architecture — Bank Account Demo
 *
 * Layers (inner → outer):
 * 1. Entities (Enterprise Business Rules): Account, Money
 * 2. Use Cases (Application Business Rules): DepositUseCase, WithdrawUseCase, TransferUseCase
 * 3. Interface Adapters: AccountController, InMemoryAccountRepository, ConsolePresenter
 * 4. Frameworks & Drivers: Main (composition root)
 *
 * Dependency Rule: Inner layers know NOTHING about outer layers.
 * Dependencies point INWARD via interfaces (Ports).
 */

// ============================================
// ④ ENTITIES — Enterprise Business Rules (core, không phụ thuộc gì)
// ============================================

class Money {
  constructor(public readonly amount: number, public readonly currency: string = "VND") {
    if (amount < 0) throw new Error("Amount cannot be negative");
  }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }
  subtract(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("Currency mismatch");
    if (this.amount < other.amount) throw new Error("Insufficient funds");
    return new Money(this.amount - other.amount, this.currency);
  }
}

class Account {
  constructor(public readonly id: string, public readonly owner: string, private balance: Money) {}
  getBalance(): Money { return this.balance; }
  deposit(money: Money): void { this.balance = this.balance.add(money); }
  withdraw(money: Money): void { this.balance = this.balance.subtract(money); }
}

// ============================================
// ③ USE CASES — Application Business Rules
// Chỉ phụ thuộc Entities, không biết DB/framework
// ============================================

interface AccountRepository {
  findById(id: string): Account | undefined;
  save(account: Account): void;
}

class DepositUseCase {
  constructor(private repo: AccountRepository) {}
  execute(accountId: string, amount: number): Money {
    const acc = this.repo.findById(accountId);
    if (!acc) throw new Error(`Account ${accountId} not found`);
    const money = new Money(amount);
    acc.deposit(money);
    this.repo.save(acc);
    return acc.getBalance();
  }
}

class WithdrawUseCase {
  constructor(private repo: AccountRepository) {}
  execute(accountId: string, amount: number): Money {
    const acc = this.repo.findById(accountId);
    if (!acc) throw new Error(`Account ${accountId} not found`);
    acc.withdraw(new Money(amount));
    this.repo.save(acc);
    return acc.getBalance();
  }
}

class TransferUseCase {
  constructor(private repo: AccountRepository) {}
  execute(fromId: string, toId: string, amount: number): void {
    const from = this.repo.findById(fromId);
    const to = this.repo.findById(toId);
    if (!from || !to) throw new Error("Account not found");
    const money = new Money(amount);
    from.withdraw(money);
    to.deposit(money);
    this.repo.save(from);
    this.repo.save(to);
  }
}

// ============================================
// ② INTERFACE ADAPTERS — Controllers, Gateways, Presenters
// ============================================

class InMemoryAccountRepository implements AccountRepository {
  private store = new Map<string, Account>();
  findById(id: string): Account | undefined { return this.store.get(id); }
  save(account: Account): void { this.store.set(account.id, account); }
  seed(acc: Account): void { this.store.set(acc.id, acc); }
}

class AccountController {
  constructor(private depositUC: DepositUseCase, private withdrawUC: WithdrawUseCase, private transferUC: TransferUseCase) {}
  deposit(id: string, amount: number): void {
    try {
      const bal = this.depositUC.execute(id, amount);
      console.log(`  ✅ Deposit ${amount} → ${id}, balance: ${bal.amount} ${bal.currency}`);
    } catch (e: any) { console.log(`  ❌ ${e.message}`); }
  }
  withdraw(id: string, amount: number): void {
    try {
      const bal = this.withdrawUC.execute(id, amount);
      console.log(`  ✅ Withdraw ${amount} ← ${id}, balance: ${bal.amount} ${bal.currency}`);
    } catch (e: any) { console.log(`  ❌ ${e.message}`); }
  }
  transfer(from: string, to: string, amount: number): void {
    try {
      this.transferUC.execute(from, to, amount);
      console.log(`  ✅ Transfer ${amount}: ${from} → ${to}`);
    } catch (e: any) { console.log(`  ❌ ${e.message}`); }
  }
}

class ConsolePresenter {
  show(acc: Account): void {
    console.log(`  💳 ${acc.id} (${acc.owner}): ${acc.getBalance().amount} ${acc.getBalance().currency}`);
  }
}

// ============================================
// ① FRAMEWORKS & DRIVERS — Composition Root
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🧼 CLEAN ARCHITECTURE DEMO              ║");
  console.log("║  Bank Account - Dependency Rule inward   ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const repo = new InMemoryAccountRepository();
  repo.seed(new Account("acc-1", "Alice", new Money(1000)));
  repo.seed(new Account("acc-2", "Bob", new Money(500)));

  const depositUC = new DepositUseCase(repo);
  const withdrawUC = new WithdrawUseCase(repo);
  const transferUC = new TransferUseCase(repo);
  const controller = new AccountController(depositUC, withdrawUC, transferUC);
  const presenter = new ConsolePresenter();

  console.log("📋 Initial balances:");
  presenter.show(repo.findById("acc-1")!);
  presenter.show(repo.findById("acc-2")!);

  console.log("\n💸 Transactions:");
  controller.deposit("acc-1", 200);
  controller.withdraw("acc-2", 100);
  controller.transfer("acc-1", "acc-2", 300);
  controller.withdraw("acc-2", 2000); // fail: insufficient

  console.log("\n📋 Final balances:");
  presenter.show(repo.findById("acc-1")!);
  presenter.show(repo.findById("acc-2")!);

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Entities/UseCases không biết DB/framework");
  console.log("  ✅ Đổi InMemory → Postgres chỉ cần adapter mới");
  console.log("  ✅ Test UseCase với mock repo dễ dàng");
  console.log("  ❌ Nhiều lớp, boilerplate hơn");
}

main();
export {};
