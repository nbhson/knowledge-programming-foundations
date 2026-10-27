/**
 * 3.2.5 DIP (Dependency Inversion Principle) - Demo
 *
 * Phụ thuộc abstraction, không phụ thuộc cụ thể.
 * Module cấp cao không nên phụ thuộc module cấp thấp.
 */

// --- ❌ BAD: UserService tạo trực tiếp MySQLDatabase ---
class MySQLDatabaseBad {
  save(user: any) {
    console.log(`💾 MySQL: saved ${user.name}`);
  }
}

class UserServiceBad {
  private db = new MySQLDatabaseBad(); // cụ thể, khó đổi

  saveUser(user: any) {
    this.db.save(user);
  }
}

// --- ✅ GOOD: phụ thuộc interface UserRepository ---
interface UserRepository {
  save(user: any): void;
}

class MySQLDatabase implements UserRepository {
  save(user: any): void {
    console.log(`💾 MySQL: saved ${user.name}`);
  }
}

class PostgresDatabase implements UserRepository {
  save(user: any): void {
    console.log(`🐘 Postgres: saved ${user.name}`);
  }
}

class UserService {
  private db: UserRepository;

  constructor(db: UserRepository) {
    this.db = db; // abstraction
  }

  saveUser(user: any) {
    this.db.save(user);
  }
}

// --- Demo ---
console.log("=== DIP Demo ===");
console.log("");

const user = { name: "Son Nguyen" };

// GOOD: đổi database = truyền class khác, không sửa UserService
const mysqlService = new UserService(new MySQLDatabase());
mysqlService.saveUser(user);
console.log("");

const postgresService = new UserService(new PostgresDatabase());
postgresService.saveUser(user);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  UserServiceBad tạo MySQLDatabaseBad → đổi DB phải sửa service");
console.log("   GOOD: UserService nhận UserRepository → đổi DB không sửa service");
console.log("");

console.log("🔧 Lợi ích: linh hoạt, dễ test (mock), dễ mở rộng");
console.log("");

console.log("✅ DIP: phụ thuộc abstraction, không phụ thuộc cụ thể");

export {};