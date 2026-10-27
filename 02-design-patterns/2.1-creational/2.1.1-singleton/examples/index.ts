/**
 * 2.1.1 Singleton Pattern - Database Connection Demo
 *
 * Đảm bảo chỉ có 1 instance duy nhất của DatabaseConnection.
 * Mọi nơi gọi getInstance() đều nhận cùng 1 instance.
 */

class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private connected = false;
  private queryCount = 0;

  // Constructor private → không thể `new` từ bên ngoài
  private constructor() {
    console.log("🔧 DatabaseConnection instance created");
  }

  // Điểm truy cập toàn cục — lazy initialization
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  connect(): void {
    if (!this.connected) {
      console.log("🔌 Connecting to database...");
      this.connected = true;
    } else {
      console.log("ℹ️ Already connected");
    }
  }

  query(sql: string): void {
    if (!this.connected) {
      this.connect();
    }
    this.queryCount++;
    console.log(`📊 [Query ${this.queryCount}] ${sql}`);
  }

  getQueryCount(): number {
    return this.queryCount;
  }
}

// --- Demo ---
console.log("=== Singleton Demo ===");
console.log("");

// Lấy instance từ 2 nơi khác nhau
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

// Kiểm tra cùng 1 instance
console.log(`db1 === db2: ${db1 === db2}`); // true
console.log("");

// Sử dụng instance
db1.connect();
db2.connect(); // "Already connected" — vì cùng instance
console.log("");

db1.query("SELECT * FROM users");
db2.query("SELECT * FROM orders");
db1.query("INSERT INTO logs ...");
console.log("");

console.log(`Total queries: ${db1.getQueryCount()}`);

// Thử tạo instance mới — sẽ lỗi vì constructor private
// const db3 = new DatabaseConnection(); // ❌ Error: Constructor of class 'DatabaseConnection' is private

console.log("");
console.log("✅ Singleton đảm bảo chỉ 1 instance duy nhất");