/**
 * 18.5 Compilers & Interpreters — mini expression evaluator:
 * lex (tách token) → parse (đệ quy theo độ ưu tiên) → eval (tính giá trị).
 * Hỗ trợ + - * / và ngoặc. Thay thế an toàn cho eval()/Function().
 */

export {};

type TokenType = "num" | "op" | "lparen" | "rparen";

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

/** LEX: chuỗi → danh sách token (kèm vị trí để báo lỗi đẹp) */
function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const start = i;
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) num += input[i++];
      if (num.split(".").length > 2) throw new Error(`Số không hợp lệ tại cột ${start}: '${num}'`);
      tokens.push({ type: "num", value: num, pos: start });
    } else if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch, pos: i });
      i++;
    } else if (ch === "(") {
      tokens.push({ type: "lparen", value: ch, pos: i });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: "rparen", value: ch, pos: i });
      i++;
    } else {
      throw new Error(`Ký tự lạ '${ch}' tại cột ${i}`);
    }
  }
  return tokens;
}

/** AST node của biểu thức */
type ExprNode =
  | { kind: "num"; value: number }
  | { kind: "bin"; op: string; left: ExprNode; right: ExprNode };

/** PARSE: Pratt-style đệ quy — expr (+-) → term (×/) → factor (số/ngoặc/âm) */
function parse(tokens: Token[]): ExprNode {
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function parseExpr(): ExprNode {
    let left = parseTerm();
    while (peek() !== undefined && peek()?.type === "op" && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = (tokens[pos++] as Token).value;
      const right = parseTerm();
      left = { kind: "bin", op, left, right };
    }
    return left;
  }

  function parseTerm(): ExprNode {
    let left = parseFactor();
    while (peek() !== undefined && peek()?.type === "op" && (peek()?.value === "*" || peek()?.value === "/")) {
      const op = (tokens[pos++] as Token).value;
      const right = parseFactor();
      left = { kind: "bin", op, left, right };
    }
    return left;
  }

  function parseFactor(): ExprNode {
    const t = tokens[pos++];
    if (t === undefined) throw new Error("Biểu thức kết thúc đột ngột");
    if (t.type === "num") return { kind: "num", value: parseFloat(t.value) };
    if (t.type === "lparen") {
      const inner = parseExpr();
      const closing = tokens[pos++];
      if (closing === undefined || closing.type !== "rparen") throw new Error(`Thiếu ')' sau cột ${t.pos}`);
      return inner;
    }
    if (t.type === "op" && t.value === "-") {
      // Dấu âm đơn: -x ≡ (0 - x)
      const operand = parseFactor();
      return { kind: "bin", op: "-", left: { kind: "num", value: 0 }, right: operand };
    }
    throw new Error(`Token không mong đợi '${t.value}' tại cột ${t.pos}`);
  }

  const root = parseExpr();
  if (pos < tokens.length) {
    throw new Error(`Token thừa '${(tokens[pos] as Token).value}' tại cột ${(tokens[pos] as Token).pos}`);
  }
  return root;
}

/** EVAL: duyệt AST tính giá trị */
function evalNode(node: ExprNode): number {
  if (node.kind === "num") return node.value;
  const l = evalNode(node.left);
  const r = evalNode(node.right);
  switch (node.op) {
    case "+":
      return l + r;
    case "-":
      return l - r;
    case "*":
      return l * r;
    case "/":
      if (r === 0) throw new Error("Chia cho 0");
      return l / r;
    default:
      throw new Error(`Toán tử lạ: ${node.op}`);
  }
}

/** In AST dạng cây để học (không cần cho tính toán) */
function printAst(node: ExprNode, indent: string = ""): string {
  if (node.kind === "num") return `${indent}${node.value}`;
  return `${indent}(${node.op}\n${printAst(node.left, indent + "  ")}\n${printAst(node.right, indent + "  ")}\n${indent})`;
}

/** API chính: lex → parse → eval */
function evaluate(input: string): number {
  return evalNode(parse(lex(input)));
}

function main(): void {
  console.log("=== 18.5 Compilers & Interpreters Demo ===");
  console.log("");

  const expr = "2 + 3 * 4";
  console.log(`1. LEX "${expr}":`);
  console.log(`   ${lex(expr).map((t) => `[${t.type}:${t.value}]`).join(" ")}`);
  console.log("");

  console.log("2. PARSE → AST (nhân ưu tiên hơn cộng):");
  console.log(printAst(parse(lex(expr))));
  console.log("");

  console.log("3. EVAL test cases:");
  const cases: Array<[string, number]> = [
    ["2 + 3 * 4", 14],
    ["(2 + 3) * 4", 20],
    ["10 / 2 - 3", 2],
    ["-5 + 10", 5],
    ["2 * (3 + 4) / 2", 7],
  ];
  for (const [input, expected] of cases) {
    const got = evaluate(input);
    console.log(`   "${input}" = ${got} ${got === expected ? "✅" : `❌ (mong đợi ${expected})`}`);
  }
  console.log("");

  console.log("4. Lỗi đẹp (vị trí + nguyên nhân):");
  for (const bad of ["2 + * 3", "(2 + 3", "2 & 3", "1/0"]) {
    try {
      evaluate(bad);
      console.log(`   "${bad}" → không lỗi (bất ngờ!)`);
    } catch (e) {
      console.log(`   "${bad}" → Error: ${(e as Error).message}`);
    }
  }
  console.log("");
  console.log("✅ Lex → parse → eval hoạt động (thay thế an toàn cho eval())");
}

main();
