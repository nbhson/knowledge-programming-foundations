/**
 * 💬 Mediator Pattern — Chat Room Demo
 * Nhiều user giao tiếp qua 1 trung tâm — giảm coupling N:N → N:1.
 */

interface Mediator {
  send(message: string, from: User): void;
}

class ChatRoom implements Mediator {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  send(message: string, from: User): void {
    for (const user of this.users) {
      if (user !== from) {
        user.receive(message, from.getName());
      }
    }
  }
}

class User {
  constructor(
    private name: string,
    private mediator: Mediator,
  ) {}

  getName(): string {
    return this.name;
  }

  send(message: string): void {
    console.log(`💬 ${this.name} gửi: "${message}"`);
    this.mediator.send(message, this);
  }

  receive(message: string, from: string): void {
    console.log(`   📥 ${this.name} nhận từ ${from}: "${message}"`);
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   💬 MEDIATOR PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  const chat = new ChatRoom();
  const alice = new User('Alice', chat);
  const bob = new User('Bob', chat);
  const carol = new User('Carol', chat);

  chat.addUser(alice);
  chat.addUser(bob);
  chat.addUser(carol);

  console.log('\n1️⃣ Alice gửi:');
  alice.send('Chào mọi người!');

  console.log('\n2️⃣ Bob gửi:');
  bob.send('Chào Alice!');

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ User không biết nhau — chỉ biết Mediator');
  console.log('  ✅ Thêm user mới → không sửa user cũ');
  console.log('  ✅ Coupling N:N → N:1');
}

main();

export {};