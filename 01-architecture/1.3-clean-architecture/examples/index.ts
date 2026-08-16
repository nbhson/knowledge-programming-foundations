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
 */… [CCR retrieve hash=7c43d4e5e4c4e3e3e3e3e3e3 chars=7500]