# 📜 Lớp 3: Principles (Nguyên Tắc)

> **Principles** là các **quy tắc vàng** định hướng cách viết code tốt,
> duy trì codebase dễ bảo trì và mở rộng.
>
> **Ví dụ:** Quy chuẩn xây dựng — phải đúng kỹ thuật để tòa nhà vững chắc.

---

## 3.1 SOLID Principles

| Nguyên Tắc | Tên Đầy Đủ | Mô Tả |
|------------|-----------|-------|
| **S** | Single Responsibility Principle | Mỗi class chỉ nên có MỘT lý do để thay đổi |
| **O** | Open/Closed Principle | Mở để mở rộng, đóng để sửa đổi |
| **L** | Liskov Substitution Principle | Object có thể thay thế bởi subtype mà không sai chương trình |
| **I** | Interface Segregation Principle | Không ép client implement interface không sử dụng |
| **D** | Dependency Inversion Principle | Depend vào abstraction, không depend vào class cụ thể |

---

## 3.2 Other Principles

| Nguyên Tắc | Mô Tả |
|------------|-------|
| **DRY** (Don't Repeat Yourself) | Tránh trùng lặp mã nguồn — mỗi kiến thức có 1 source of truth duy nhất |
| **KISS** (Keep It Simple, Stupid) | Giữ mọi thứ đơn giản, tránh phức tạp hóa không cần thiết |
| **YAGNI** (You Ain't Gonna Need It) | Đừng viết code cho tương lai — chỉ viết khi thực sự cần |
| **SoC** (Separation of Concerns) | Mỗi module/class chỉ chịu trách nhiệm 1 lĩnh vực |
| **Law of Demeter** | Chỉ nói chuyện với đối tượng trực tiếp, không "chatter" với bạn của bạn |
| **Composition over Inheritance** | Ưu tiên composition (kết hợp) thay vì inheritance (kế thừa) |