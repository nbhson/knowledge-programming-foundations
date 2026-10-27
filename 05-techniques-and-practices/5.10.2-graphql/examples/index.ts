/**
 * 5.10.2 GraphQL — Mini Parser + Resolver Demo
 *
 * Mô phỏng một mini GraphQL engine bằng TS thuần:
 *   - Parser   : đọc chuỗi query `{ user(id: "1") { id name } }`
 *   - Resolver : hàm trả dữ liệu cho từng field
 *   - Selection: chỉ lấy đúng field client yêu cầu (không over-fetching)
 *
 * KHÔNG dùng apollo/graphql lib — object + hàm thuần.
 */

// ─────────────────────────── Dữ liệu mẫu ───────────────────────────

interface MiniGqlUser {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
}

interface MiniGqlTeam {
  id: string;
  name: string;
}

const gqlUsers: MiniGqlUser[] = [
  { id: "1", name: "John", email: "john@example.com", role: "dev", teamId: "t1" },
  { id: "2", name: "Jane", email: "jane@example.com", role: "pm", teamId: "t2" },
];

const gqlTeams: MiniGqlTeam[] = [
  { id: "t1", name: "Platform" },
  { id: "t2", name: "Product" },
];

// ─────────────────────────── Tokenizer + Parser ───────────────────────────

type MiniGqlTokenType = "name" | "string" | "lbrace" | "rbrace" | "lparen" | "rparen" | "colon" | "comma";

interface MiniGqlToken {
  type: MiniGqlTokenType;
  value: string;
}

interface MiniGqlArg {
  [key: string]: string | number | boolean;
}

interface MiniGqlField {
  name: string;
  args: MiniGqlArg;
  selections: MiniGqlField[];
}

function tokenizeGql(query: string): MiniGqlToken[] {
  const tokens: MiniGqlToken[] = [];
  let i = 0;
  while (i < query.length) {
    const c = query[i];
    if (c === '"') {
      let value = "";
      i++;
      while (i < query.length && query[i] !== '"') {
        value += query[i];
        i++;
      }
      i++;
      tokens.push({ type: "string", value });
    } else if (c === "{") {
      tokens.push({ type: "lbrace", value: "{" });
      i++;
    } else if (c === "}") {
      tokens.push({ type: "rbrace", value: "}" });
      i++;
    } else if (c === "(") {
      tokens.push({ type: "lparen", value: "(" });
      i++;
    } else if (c === ")") {
      tokens.push({ type: "rparen", value: ")" });
      i++;
    } else if (c === ":") {
      tokens.push({ type: "colon", value: ":" });
      i++;
    } else if (c === ",") {
      tokens.push({ type: "comma", value: "," });
      i++;
    } else if (/[A-Za-z0-9_]/.test(c)) {
      let word = "";
      while (i < query.length && /[A-Za-z0-9_]/.test(query[i])) {
        word += query[i];
        i++;
      }
      tokens.push({ type: /^\d+$/.test(word) ? "name" : "name", value: word });
    } else {
      i++; // bỏ qua khoảng trắng
    }
  }
  return tokens;
}

interface MiniGqlCursor {
  pos: number;
}

class MiniGqlParser {
  private tokens: MiniGqlToken[];
  private pos = 0;

  constructor(query: string) {
    this.tokens = tokenizeGql(query);
  }

  private peek(): MiniGqlToken | undefined {
    return this.tokens[this.pos];
  }

  private advance(): MiniGqlToken {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private expect(type: MiniGqlTokenType): MiniGqlToken {
    const tok = this.advance();
    if (tok.type !== type) throw new Error(`Mong đợi ${type}, gặp ${String(tok.type)}`);
    return tok;
  }

  private parseValue(): string | number | boolean {
    const tok = this.peek();
    if (!tok) throw new Error("Query rỗng ở arguments");
    if (tok.type === "string") {
      return this.advance().value;
    }
    if (tok.type === "name") {
      const v = this.advance().value;
      if (v === "true") return true;
      if (v === "false") return false;
      const num = Number(v);
      return Number.isNaN(num) ? v : num;
    }
    throw new Error(`Không hỗ trợ token ${tok.type}`);
  }

  private parseArguments(): MiniGqlArg {
    this.expect("lparen");
    const args: MiniGqlArg = {};
    while (this.peek()?.type !== "rparen") {
      const key = this.expect("name").value;
      this.expect("colon");
      args[key] = this.parseValue();
      if (this.peek()?.type === "comma") this.advance();
    }
    this.expect("rparen");
    return args;
  }

  private parseField(): MiniGqlField {
    const name = this.expect("name").value;
    const field: MiniGqlField = { name, args: {}, selections: [] };
    if (this.peek()?.type === "lparen") field.args = this.parseArguments();
    if (this.peek()?.type === "lbrace") field.selections = this.parseSelectionSet();
    return field;
  }

  private parseSelectionSet(): MiniGqlField[] {
    this.expect("lbrace");
    const fields: MiniGqlField[] = [];
    while (this.peek()?.type !== "rbrace") {
      fields.push(this.parseField());
      if (this.peek()?.type === "comma") this.advance();
    }
    this.expect("rbrace");
    return fields;
  }

  parse(): MiniGqlField[] {
    const root = this.parseSelectionSet();
    if (this.pos !== this.tokens.length) throw new Error("Query có phần dư không hợp lệ");
    return root;
  }
}

// ─────────────────────────── Resolver Engine ───────────────────────────

type MiniGqlResolver = (parent: unknown, args: MiniGqlArg) => unknown;

class MiniGqlEngine {
  private resolvers = new Map<string, MiniGqlResolver>();

  add(name: string, resolver: MiniGqlResolver): void {
    this.resolvers.set(name, resolver);
  }

  // Chạy query, trả về dữ liệu đã cắt theo selection set
  execute(query: string): Record<string, unknown> {
    const roots = new MiniGqlParser(query).parse();
    const out: Record<string, unknown> = {};
    for (const root of roots) {
      out[root.name] = this.resolveField(root, undefined);
    }
    return out;
  }

  private resolveField(field: MiniGqlField, parent: unknown): unknown {
    const resolver = this.resolvers.get(field.name);
    let value: unknown;
    if (resolver) {
      value = resolver(parent, field.args);
    } else if (isGqlRecord(parent)) {
      value = parent[field.name];
    } else {
      return undefined;
    }

    // Có selection set → cắt dữ liệu (chống over-fetching)
    if (field.selections.length > 0) {
      return this.applySelection(value, field.selections);
    }
    return value;
  }

  private applySelection(value: unknown, selections: MiniGqlField[]): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.applySelection(item, selections));
    }
    if (!isGqlRecord(value)) return value;

    const out: Record<string, unknown> = {};
    for (const field of selections) {
      out[field.name] = this.resolveField(field, value);
    }
    return out;
  }
}

function isGqlRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== MiniGqlEngine Demo ===");
  console.log("");

  const engine = new MiniGqlEngine();
  engine.add("user", (_parent, args) => gqlUsers.find((u) => u.id === String(args.id)) ?? null);
  engine.add("users", () => gqlUsers);
  engine.add("team", (parent) => {
    if (!isGqlRecord(parent)) return null;
    const user = parent as unknown as MiniGqlUser;
    return gqlTeams.find((t) => t.id === user.teamId) ?? null;
  });

  console.log("1️⃣ Chọn đúng field (không over-fetching):");
  const r1 = engine.execute(`{
    user(id: "1") {
      id
      name
    }
  }`);
  console.log(`   query: { user(id: \"1\") { id name } }`);
  console.log(`   → ${JSON.stringify(r1)}  (email/role/teamId không được trả về)`);
  console.log("");

  console.log("2️⃣ Nested — user kèm team:");
  const r2 = engine.execute(`{
    user(id: "1") {
      name
      team {
        name
      }
    }
  }`);
  console.log(`   → ${JSON.stringify(r2)}`);
  console.log("");

  console.log("3️⃣ Argument + list — danh sách users kèm role:");
  const r3 = engine.execute(`{
    users {
      id
      name
      role
    }
  }`);
  console.log(`   → ${JSON.stringify(r3)}`);
  console.log("");

  console.log("4️⃣ 1 endpoint /graphql — client tự quyết định dữ liệu:");
  const r4 = engine.execute(`{
    user(id: "2") {
      email
      team {
        name
      }
    }
  }`);
  console.log(`   → ${JSON.stringify(r4)}`);
  console.log("");

  console.log("✅ GraphQL: parser + resolver + selection set → đúng field, đúng dữ liệu, 1 endpoint");
}

run();
export {};