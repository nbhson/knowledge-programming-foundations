/**
 * 🧮 Interpreter Pattern — Expression Evaluator Demo
 * Mỗi quy tắc grammar (số, biến, cộng, trừ, nhân) là 1 class Expression;
 * biểu thức phức = cây Expression, interpret(context) đệ quy ra kết quả.
 * Chạy: npx ts-node examples/index.ts
 */

// Context — biến → giá trị
type Context = Map<string, number>;

// ❌ BAD — eval: chạy code tùy ý + không kiểm soát grammar
function evalBad(expr: string, ctx: Context): number {
  const names = [...ctx.keys()];
  const values = [...ctx.values()];
  // ⚠️ Nguy hiểm: expr có thể chứa code độc hại; lỗi cú pháp khó bắt
  const fn = new Function(...names, `return (${expr});`) as (...args: number[]) => number;
  return fn(...values);
}

// ✅ GOOD — AbstractExpression
interface Expression {
  interpret(ctx: Context): number;
}

// ✅ GOOD — Terminal: số literal
class Num implements Expression {
  constructor(private value: number) {}

  interpret(_ctx: Context): number {
    return this.value;
  }
}

// ✅ GOOD — Terminal: biến, tra giá trị trong context
class Var implements Expression {
  constructor(private name: string) {}

  interpret(ctx: Context): number {
    const v = ctx.get(this.name);
    if (v === undefined) {
      throw new Error(`Biến chưa gán: ${this.name}`);
    }
    return v;
  }
}

// ✅ GOOD — Nonterminal: cộng
class Add implements Expression {
  constructor(
    private left: Expression,
    private right: Expression,
  ) {}

  interpret(ctx: Context): number {
    return this.left.interpret(ctx) + this.right.interpret(ctx);
  }
}

// ✅ GOOD — Nonterminal: trừ
class Subtract implements Expression {
  constructor(
    private left: Expression,
    private right: Expression,
  ) {}

  interpret(ctx: Context): number {
    return this.left.interpret(ctx) - this.right.interpret(ctx);
  }
}

// ✅ GOOD — Nonterminal: nhân
class Multiply implements Expression {
  constructor(
    private left: Expression,
    private right: Expression,
  ) {}

  interpret(ctx: Context): number {
    return this.left.interpret(ctx) * this.right.interpret(ctx);
  }
}

function main(): void {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🧮 INTERPRETER PATTERN DEMO           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\nBiểu thức: a + b * 2 - 1  với { a: 3, b: 4 } → 3 + 8 - 1 = 10');

  const ctx: Context = new Map([
    ['a', 3],
    ['b', 4],
  ]);

  console.log('\n❌ BAD — eval/new Function (nhanh nhưng nguy hiểm):');
  const badResult = evalBad('a + b * 2 - 1', ctx);
  console.log(`   kết quả = ${badResult} (⚠️ expr lạ như "process.exit()" cũng chạy!)`);

  console.log('\n✅ GOOD — cây Expression, interpret với context:');
  // Cây cho: (a + (b * 2)) - 1 — parse 1 lần
  const expr: Expression = new Subtract(
    new Add(new Var('a'), new Multiply(new Var('b'), new Num(2))),
    new Num(1),
  );
  console.log(`   ctx {a:3, b:4} → ${expr.interpret(ctx)}`);
  console.log(`   ctx {a:10, b:1} → ${expr.interpret(new Map([['a', 10], ['b', 1]]))} (cây cũ, context mới)`);

  console.log('\n❌ GOOD cũng báo lỗi rõ khi thiếu biến:');
  try {
    expr.interpret(new Map([['a', 1]]));
  } catch (e) {
    console.log(`   ⛔ ${(e as Error).message}`);
  }

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ BAD:  eval gọn 1 dòng nhưng chạy code tùy ý — lỗ hổng bảo mật');
  console.log('  ✅ GOOD: grammar thành class — parse 1 lần, interpret N context, lỗi rõ ràng');
  console.log('  ✅ Thêm toán tử mới (Power, Mod) = thêm 1 class, không đụng code cũ');
}

main();

export {};
