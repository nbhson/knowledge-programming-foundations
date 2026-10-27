/**
 * 🔄 State Pattern — Order Status Demo
 * Hành vi thay đổi theo trạng thái — hết if/else trạng thái chồng chất.
 */

interface OrderState {
  next(order: Order): void;
  cancel(order: Order): void;
  getStatus(): string;
}

class DraftState implements OrderState {
  next(order: Order): void {
    order.setState(new SubmittedState());
  }
  cancel(order: Order): void {
    order.setState(new CancelledState());
  }
  getStatus(): string {
    return '📝 Draft';
  }
}

class SubmittedState implements OrderState {
  next(order: Order): void {
    order.setState(new ApprovedState());
  }
  cancel(order: Order): void {
    order.setState(new CancelledState());
  }
  getStatus(): string {
    return '📨 Submitted';
  }
}

class ApprovedState implements OrderState {
  next(order: Order): void {
    console.log('   ⚠️ Đã duyệt — không thể chuyển tiếp');
  }
  cancel(order: Order): void {
    console.log('   ⚠️ Đã duyệt — không thể hủy');
  }
  getStatus(): string {
    return '✅ Approved';
  }
}

class CancelledState implements OrderState {
  next(order: Order): void {
    console.log('   ⚠️ Đã hủy — không thể chuyển tiếp');
  }
  cancel(order: Order): void {
    console.log('   ⚠️ Đã hủy rồi');
  }
  getStatus(): string {
    return '❌ Cancelled';
  }
}

class Order {
  private state: OrderState = new DraftState();

  setState(state: OrderState): void {
    this.state = state;
    console.log(`   → Trạng thái: ${state.getStatus()}`);
  }

  next(): void {
    this.state.next(this);
  }

  cancel(): void {
    this.state.cancel(this);
  }

  getStatus(): string {
    return this.state.getStatus();
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🔄 STATE PATTERN DEMO                  ║');
  console.log('╚══════════════════════════════════════════╝');

  const order = new Order();
  console.log(`\n1️⃣ Khởi tạo: ${order.getStatus()}`);

  console.log('\n2️⃣ next() → Submitted:');
  order.next();

  console.log('\n3️⃣ next() → Approved:');
  order.next();

  console.log('\n4️⃣ Thử cancel khi đã Approved:');
  order.cancel();

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Hành vi theo trạng thái — không if/else');
  console.log('  ✅ Mỗi trạng thái tự quyết định chuyển tiếp hợp lệ');
  console.log('  ✅ Thêm trạng thái mới → thêm class, không sửa code cũ');
}

main();

export {};