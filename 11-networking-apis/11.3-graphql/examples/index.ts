/**
 * 11.3 GraphQL - Resolver + Query Parsing Demo
 *
 * Mô phỏng một mini GraphQL engine bằng TypeScript thuần:
 * - Resolver: hàm trả về dữ liệu cho từng field
 * - Query parser: đọc chuỗi query như `{ user(id: "1") { id name } }`
 *   → chọn đúng field theo selection set (không over-fetching)
 * - Query + Mutation đơn giản
 *
 * KHÔNG dùng apollo/graphql lib — chỉ object + hàm.
 */

// ─────────────────────────── Dữ liệu mẫu ───────────────────────────

interface SimUser {
  id: string;
  name: string;
  email: string;
  postIds: string[];
}

interface SimPost {
  id: string;
  title: string;
  authorId: string;
}

const users: SimUser[] = [
  { id: "1", name: "John", email: "john@example.com", postIds: ["p1"] },
  { id: "2", name: "Jane", email: "jane@example.com", postIds: ["p2"] },
];

const posts: SimPost[] = [
  { id: "p1", title: "GraphQL Intro", authorId: "1" },
  { id: "p2", title: "REST vs GraphQL", authorId: "2" },
];

// ─────────────────────────── GraphQL Query Parser ───────────────────────────

type TokenType = "name" | "string" | "number" | "lbrace" | "rbrace" | "lparen" | "rparen" | "colon" | "comma";

interface Token {
  type: TokenType;
  value: string;
}

type ArgValue = string | number | boolean | ArgObject;

interface ArgObject {
  [key: string]: ArgValue;
}

interface SelectionField {
  name: string;
  args: Record<string, ArgValue>;
  selections: SelectionField[];
}

function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
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
      tokens.push({ type: /^\d+$/.test(word) ? "number" : "name", value: word });
    } else {
      i++; // bỏ qua khoảng trắng
    }
  }
  return tokens;
}

interface Cursor {
  pos: number;
}

function peek(tokens: Token[], cur: Cursor): Token | undefined {
  return tokens[cur.pos];
}

function advance(tokens: Token[], cur: Cursor): Token {
  const tok = tokens[cur.pos];
  cur.pos++;
  return tok;
}

function expect(tokens: Token[], cur: Cursor, type: TokenType): Token {
  const tok = advance(tokens, cur);
  if (tok.type !== type) throw new Error(`Mong đợi ${type} nhưng gặp ${tok.type}`);
  return tok;
}

function parseValue(tokens: Token[], cur: Cursor): ArgValue {
  const tok = peek(tokens, cur);
  if (!tok) throw new Error("Query rỗng ở arguments");
  if (tok.type === "string" || tok.type === "number") {
    advance(tokens, cur);
    return tok.type === "number" ? Number(tok.value) : tok.value;
  }
  if (tok.type === "lbrace") return parseValueObject(tokens, cur);
  throw new Error(`Không hỗ trợ giá trị ${tok.type}`);
}

function parseValueObject(tokens: Token[], cur: Cursor): ArgObject {
  expect(tokens, cur, "lbrace");
  const out: ArgObject = {};
  while (peek(tokens, cur)?.type !== "rbrace") {
    const key = expect(tokens, cur, "name");
    expect(tokens, cur, "colon");
    out[key.value] = parseValue(tokens, cur);
    if (peek(tokens, cur)?.type === "comma") advance(tokens, cur);
  }
  expect(tokens, cur, "rbrace");
  return out;
}

function parseArguments(tokens: Token[], cur: Cursor): Record<string, ArgValue> {
  expect(tokens, cur, "lparen");
  const args: Record<string, ArgValue> = {};
  while (peek(tokens, cur)?.type !== "rparen") {
    const key = expect(tokens, cur, "name");
    expect(tokens, cur, "colon");
    args[key.value] = parseValue(tokens, cur);
    if (peek(tokens, cur)?.type === "comma") advance(tokens, cur);
  }
  expect(tokens, cur, "rparen");
  return args;
}

function parseField(tokens: Token[], cur: Cursor): SelectionField {
  const nameTok = expect(tokens, cur, "name");
  const field: SelectionField = { name: nameTok.value, args: {}, selections: [] };

  if (peek(tokens, cur)?.type === "lparen") {
    field.args = parseArguments(tokens, cur);
  }
  if (peek(tokens, cur)?.type === "lbrace") {
    field.selections = parseSelectionSet(tokens, cur);
  }
  return field;
}

function parseSelectionSet(tokens: Token[], cur: Cursor): SelectionField[] {
  expect(tokens, cur, "lbrace");
  const fields: SelectionField[] = [];
  while (peek(tokens, cur)?.type !== "rbrace") {
    fields.push(parseField(tokens, cur));
    if (peek(tokens, cur)?.type === "comma") advance(tokens, cur);
  }
  expect(tokens, cur, "rbrace");
  return fields;
}

function parseQuery(query: string): { operation: string; fields: SelectionField[] } {
  const tokens = tokenize(query);
  const cur: Cursor = { pos: 0 };
  let operation = "query";
  if (peek(tokens, cur)?.type === "name") {
    operation = advance(tokens, cur).value;
  }
  const fields = parseSelectionSet(tokens, cur);
  return { operation, fields };
}

// ─────────────────────────── Resolver Engine ───────────────────────────

type ResolverFn = (parent: unknown, args: Record<string, ArgValue>) => unknown;

const resolvers = new Map<string, ResolverFn>();

// Query roots
resolvers.set("user", (_parent, args) => users.find((u) => u.id === String(args.id)) ?? null);
resolvers.set("users", () => users);
resolvers.set("post", (_parent, args) => posts.find((p) => p.id === String(args.id)) ?? null);

// Relational resolvers (field trên object)
resolvers.set("posts", (parent) => {
  const user = parent as SimUser;
  return posts.filter((p) => p.authorId === user.id);
});
resolvers.set("author", (parent) => {
  const post = parent as SimPost;
  return users.find((u) => u.id === post.authorId) ?? null;
});

// Mutation
resolvers.set("createUser", (_parent, args) => {
  const input = args.input;
  const name = isRecord(input) ? String(input["name"] ?? "") : "";
  const email = isRecord(input) ? String(input["email"] ?? "") : "";
  const user: SimUser = { id: String(users.length + 1), name, email, postIds: [] };
  users.push(user);
  return user;
});

function resolveField(field: SelectionField, parent: unknown): unknown {
  const resolver = resolvers.get(field.name);
  let value: unknown;
  if (resolver) {
    value = resolver(parent, field.args);
  } else if (isRecord(parent)) {
    value = parent[field.name];
  } else {
    return undefined;
  }

  // Áp dụng selection set — chỉ lấy đúng các field con được yêu cầu
  if (field.selections.length > 0) {
    return applySelection(value, field.selections);
  }
  return value;
}

function applySelection(value: unknown, selections: SelectionField[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => applySelection(item, selections));
  }
  if (!isRecord(value)) return value;

  const out: Record<string, unknown> = {};
  for (const field of selections) {
    out[field.name] = resolveField(field, value);
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// ─────────────────────────── Executor ───────────────────────────

interface ExecutionResult {
  data: unknown;
  errors: string[];
}

function executeGraphQL(query: string, debug = false): ExecutionResult {
  if (debug) console.log(`  📨 Query: ${query}`);
  try {
    const { operation, fields } = parseQuery(query);
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      data[field.name] = resolveField(field, undefined);
    }
    void operation;
    return { data, errors: [] };
  } catch (error) {
    return { data: null, errors: [String(error)] };
  }
}

// ───────────────────────────────── Demo ───────────────────────────────

function run(): void {
  console.log("=== GraphQL Demo ===");
  console.log("");

  console.log("1️⃣ Query users — chỉ lấy đúng field cần (no over-fetching):");
  const q1 = executeGraphQL(`{
    users {
      id
      name
    }
  }`);
  console.log(`   data = ${JSON.stringify(q1.data)}`);
  console.log("");

  console.log("2️⃣ Nested query — user kèm posts + author:");
  const q2 = executeGraphQL(`{
    user(id: "1") {
      id
      name
      posts {
        title
        author {
          name
        }
      }
    }
  }`);
  console.log(`   data = ${JSON.stringify(q2.data, null, 2)}`);
  console.log("");

  console.log("3️⃣ Không giống REST — chỉ 1 endpoint, dữ liệu do client chọn:");
  const q3 = executeGraphQL(`{
    post(id: "p2") {
      title
      author {
        email
      }
    }
  }`);
  console.log(`   data = ${JSON.stringify(q3.data)}`);
  console.log("");

  console.log("4️⃣ Mutation — tạo user mới:");
  const q4 = executeGraphQL(`mutation {
    createUser(input: { name: "Alice", email: "alice@example.com" }) {
      id
      name
    }
  }`);
  console.log(`   data = ${JSON.stringify(q4.data)}`);
  console.log("");

  console.log("5️⃣ Query lại users — thấy user mới Alice (id=3):");
  const q5 = executeGraphQL(`{
    users {
      id
      name
      email
    }
  }`);
  console.log(`   data = ${JSON.stringify(q5.data)}`);
  console.log("");

  console.log("✅ GraphQL: 1 endpoint + client tự chọn field + resolver trả đúng dữ liệu cần");
}

run();
export {};