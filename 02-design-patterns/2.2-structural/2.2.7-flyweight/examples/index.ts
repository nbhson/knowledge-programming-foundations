/**
 * 🌳 Flyweight Pattern — Rừng cây Demo
 * Chia sẻ state intrinsic (loài, màu, texture) giữa hàng nghìn cây;
 * mỗi cây chỉ giữ state extrinsic (tọa độ) + tham chiếu dùng chung.
 * Chạy: npx ts-node examples/index.ts
 */

// ❌ BAD — mỗi cây nhân bản toàn bộ dữ liệu (intrinsic + extrinsic)
class TreeBad {
  constructor(
    readonly name: string,
    readonly color: string,
    readonly texture: string,
    readonly x: number,
    readonly y: number,
  ) {}

  render(): void {
    console.log(`   🌳 ${this.name} (${this.color}) tại (${this.x}, ${this.y})`);
  }
}

// ✅ GOOD — Flyweight: intrinsic dùng chung, immutable
class TreeType {
  constructor(
    readonly name: string,
    readonly color: string,
    readonly texture: string,
  ) {}

  draw(x: number, y: number): void {
    console.log(`   🌳 ${this.name} (${this.color}) tại (${x}, ${y})`);
  }
}

// ✅ GOOD — Factory đảm bảo mỗi intrinsic chỉ có 1 instance
class TreeTypeFactory {
  private types = new Map<string, TreeType>();

  getTreeType(name: string, color: string, texture: string): TreeType {
    const key = `${name}_${color}`;
    let type = this.types.get(key);
    if (!type) {
      type = new TreeType(name, color, texture);
      this.types.set(key, type);
    }
    return type;
  }

  count(): number {
    return this.types.size;
  }
}

// ✅ GOOD — Context: chỉ giữ extrinsic (x, y) + ref tới flyweight
class Tree {
  constructor(
    private x: number,
    private y: number,
    private type: TreeType,
  ) {}

  render(): void {
    this.type.draw(this.x, this.y);
  }
}

function main(): void {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🌳 FLYWEIGHT PATTERN DEMO              ║');
  console.log('╚══════════════════════════════════════════╝');

  const SPECIES: Array<[string, string, string]> = [
    ['Oak', 'green', 'oak.png'],
    ['Pine', 'dark-green', 'pine.png'],
    ['Birch', 'light-green', 'birch.png'],
  ];
  const TOTAL = 9000;

  console.log(`\n❌ BAD — ${TOTAL} cây, mỗi cây giữ toàn bộ dữ liệu:`);
  const badForest: TreeBad[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const s = SPECIES[i % SPECIES.length] as [string, string, string];
    badForest.push(new TreeBad(s[0], s[1], s[2], i, i * 2));
  }
  const badCopies = badForest.length; // mỗi cây 1 bản copy intrinsic
  console.log(`   ${badCopies} bản copy (name, color, texture) cho ${SPECIES.length} loài`);

  console.log(`\n✅ GOOD — ${TOTAL} cây, chia sẻ TreeType qua factory:`);
  const factory = new TreeTypeFactory();
  const goodForest: Tree[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const s = SPECIES[i % SPECIES.length] as [string, string, string];
    goodForest.push(new Tree(i, i * 2, factory.getTreeType(s[0], s[1], s[2])));
  }
  console.log(`   ${factory.count()} TreeType dùng chung cho ${goodForest.length} cây`);

  console.log('\n🌲 Render 3 cây mẫu (GOOD):');
  goodForest.slice(0, 3).forEach((t) => t.render());

  console.log('\n📝 KẾT LUẬN:');
  console.log(`  ✅ BAD:  ${badCopies} bản copy intrinsic (tốn RAM theo số cây)`);
  console.log(`  ✅ GOOD: ${factory.count()} flyweight cho ${goodForest.length} cây (tốn RAM theo số loài)`);
  console.log('  ✅ Mỗi cây chỉ giữ extrinsic (x, y) + 1 tham chiếu dùng chung');
}

main();

export {};
