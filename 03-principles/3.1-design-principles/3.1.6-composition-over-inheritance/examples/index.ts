/**
 * 3.1.6 Composition over Inheritance - Demo
 *
 * Ưu tiên kết hợp (composition) thay vì kế thừa (inheritance).
 * Object xây dựng từ object nhỏ hơn — behavior là object riêng.
 */

// --- Behavior interfaces ---
interface Flyable {
  fly(): string;
}

interface Swimmable {
  swim(): string;
}

interface Speakable {
  speak(): string;
}

// --- Behavior implementations (nhỏ, tái sử dụng được) ---
class FlyWithWings implements Flyable {
  fly(): string {
    return "🕊️ Flying with wings";
  }
}

class SwimInWater implements Swimmable {
  swim(): string {
    return "🐧 Swimming in water";
  }
}

class SpeakQuack implements Speakable {
  speak(): string {
    return "🦆 Quack quack!";
  }
}

class SpeakChirp implements Speakable {
  speak(): string {
    return "🐦 Chirp chirp!";
  }
}

// --- ❌ BAD: Inheritance — override để vô hiệu hóa method ---
class Bird {
  fly(): string {
    return "🕊️ Flying";
  }
  swim(): string {
    return "🤷 Can't swim";
  }
  speak(): string {
    return "🤷 Can't speak";
  }
}

class PenguinBad extends Bird {
  fly(): string {
    return "🤷 Can't fly 😢"; // override để vô hiệu hóa — vụng về
  }
  swim(): string {
    return "🐧 Swimming";
  }
}

class DuckBad extends Bird {
  fly(): string {
    return "🦆 Flying with wings";
  }
  swim(): string {
    return "🦆 Swimming in pond";
  }
  speak(): string {
    return "🦆 Quack quack";
  }
}

// --- ✅ GOOD: Composition — kết hợp behavior cần thiết ---
class Penguin {
  private swimmer: Swimmable;
  private speaker: Speakable;

  constructor(swimmer: Swimmable, speaker: Speakable) {
    this.swimmer = swimmer;
    this.speaker = speaker;
  }

  swim(): string {
    return this.swimmer.swim();
  }

  speak(): string {
    return this.speaker.speak();
  }
}

class Duck {
  private flyer: Flyable;
  private swimmer: Swimmable;
  private speaker: Speakable;

  constructor(flyer: Flyable, swimmer: Swimmable, speaker: Speakable) {
    this.flyer = flyer;
    this.swimmer = swimmer;
    this.speaker = speaker;
  }

  fly(): string {
    return this.flyer.fly();
  }

  swim(): string {
    return this.swimmer.swim();
  }

  speak(): string {
    return this.speaker.speak();
  }
}

// --- Demo ---
console.log("=== Composition over Inheritance Demo ===");
console.log("");

// GOOD: Penguin chỉ có swim + speak, không có fly phương thức "câm"
const penguin = new Penguin(new SwimInWater(), new SpeakQuack());
console.log(`✅ Penguin: ${penguin.swim()}`);
console.log(`✅ Penguin: ${penguin.speak()}`);
console.log("");

// GOOD: Duck có đủ fly + swim + speak
const duck = new Duck(new FlyWithWings(), new SwimInWater(), new SpeakQuack());
console.log(`✅ Duck: ${duck.fly()}`);
console.log(`✅ Duck: ${duck.swim()}`);
console.log(`✅ Duck: ${duck.speak()}`);
console.log("");

// GOOD: thêm behavior mới cực dễ — kết hợp SpeakChirp cho Penguin khác
const penguinChirp = new Penguin(new SwimInWater(), new SpeakChirp());
console.log(`✅ Penguin (chirp): ${penguinChirp.speak()}`);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  PenguinBad phải override fly() để vô hiệu hóa");
console.log("   GOOD: Penguin không có fly() — chỉ kết hợp cái cần");
console.log("");

console.log("🔧 Lợi ích: behavior tái sử dụng, thêm mới không sửa class cũ");
console.log("");

console.log("✅ Composition: linh hoạt, ít ràng buộc, dễ mở rộng");

export {};