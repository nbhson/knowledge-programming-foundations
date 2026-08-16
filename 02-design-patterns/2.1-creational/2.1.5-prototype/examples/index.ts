/**
 * 2.1.5 Prototype Pattern - Report Clone Demo
 *
 * Tạo object mới bằng cách clone object hiện có (deep copy)
 * thay vì khởi tạo lại từ đầu (tốn kém).
 */

interface Prototype {
  clone(): Prototype;
}

class Report implements Prototype {
  constructor(
    public title: string,
    public data: number[],
    public metadata: { author: string; createdAt: Date }
  ) {}

  // Deep copy — clone nested object
  clone(): Report {
    return new Report(
      this.title,
      [...this.data],
      {
        author: this.metadata.author,
        createdAt: new Date(this.metadata.createdAt.getTime()),
      }
    );
  }
}

// --- Demo ---
console.log("=== Prototype Demo ===");
console.log("");

// Tạo report gốc (trong thực tế tốn kém: query DB, parse file...)
const original = new Report("Sales Q1", [100, 200, 300], {
  author: "Alice",
  createdAt: new Date("2026-01-15"),
});

console.log("Original:", original.title, original.data, original.metadata.author);

// Clone nhanh chóng, chỉ sửa phần khác biệt
const copy = original.clone();
copy.title = "Sales Q2";
copy.data.push(400);

console.log("Copy:    ", copy.title, copy.data, copy.metadata.author);
console.log("");

// Kiểm tra deep copy: sửa copy không ảnh hưởng original
console.log(`Original data sau khi copy thay đổi: ${original.data}`); // [100, 200, 300]
console.log(`Copy data:                            ${copy.data}`);    // [100, 200, 300, 400]
console.log(`data độc lập nhau (deep copy):        ${original.data !== copy.data}`);
console.log("");

// Clone nhanh hơn nhiều so với khởi tạo lại từ đầu
// (trong ví dụ thực tế: query DB/parse file tốn hàng trăm ms)
console.log("✅ Clone object tốn kém nhanh hơn khởi tạo lại từ đầu");