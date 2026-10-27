/**
 * 🌉 Bridge Pattern — Remote × Device Demo
 * Remote (abstraction) kết hợp Device (implementation) độc lập.
 */

interface Device {
  setVolume(percent: number): void;
}

class TV implements Device {
  setVolume(percent: number): void {
    console.log(`📺 TV volume: ${percent}%`);
  }
}

class Radio implements Device {
  setVolume(percent: number): void {
    console.log(`📻 Radio volume: ${percent}%`);
  }
}

abstract class Remote {
  constructor(protected device: Device) {}
  abstract volumeUp(): void;
  abstract volumeDown(): void;
}

class BasicRemote extends Remote {
  volumeUp(): void { this.device.setVolume(20); }
  volumeDown(): void { this.device.setVolume(5); }
}

class AdvancedRemote extends Remote {
  volumeUp(): void { this.device.setVolume(50); }
  volumeDown(): void { this.device.setVolume(0); }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🌉 BRIDGE PATTERN DEMO                 ║');
  console.log('╚══════════════════════════════════════════╝');

  console.log('\n1️⃣ AdvancedRemote + TV:');
  const tvRemote = new AdvancedRemote(new TV());
  tvRemote.volumeUp();
  tvRemote.volumeDown();

  console.log('\n2️⃣ BasicRemote + Radio:');
  const radioRemote = new BasicRemote(new Radio());
  radioRemote.volumeUp();
  radioRemote.volumeDown();

  console.log('\n3️⃣ AdvancedRemote + Radio (đổi thiết bị, không đổi remote):');
  const radioAdv = new AdvancedRemote(new Radio());
  radioAdv.volumeUp();

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ 2 × 2 = 4 tổ hợp chỉ cần 2 remote + 2 device');
  console.log('  ✅ Đổi device không đổi remote — và ngược lại');
}

main();

export {};