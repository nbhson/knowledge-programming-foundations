# 🔌 17.7 Model Context Protocol (MCP)

> **MCP là "USB-C cho AI":** chuẩn mở kết nối AI agent ↔ tools/data,
> viết integration **1 lần** để mọi client (Claude, ChatGPT, Gemini, Copilot...) dùng được.

---

## 🎯 Vấn Đề

Mỗi AI assistant cần nối vào một đống tools/dữ liệu khác nhau: tra đơn hàng, đọc docs, gọi API nội bộ...
Không có chuẩn chung thì mỗi cặp **client × tool** phải viết integration riêng — **M assistants × N tools = M×N lần code**,
mỗi lần một kiểu auth, một kiểu schema, một kiểu lỗi.

```
Không có MCP:  Assistant A ──code riêng──► Tool 1, Tool 2, Tool 3   (M×N integration)
Có MCP:        Assistant A ─┐
               Assistant B ─┼── chuẩn MCP ──► MCP Server (tools/resources/prompts viết 1 lần)
               Assistant C ─┘
```

**MCP** do Anthropic phát hành 11/2024, là **open standard**, từ 2025 do **Linux Foundation** quản trị,
được Anthropic/OpenAI/Google/Microsoft/AWS chấp nhận — hàng nghìn MCP servers trong cộng đồng.
Ba khái niệm chính:

| Khái niệm | Vai trò | Ví dụ |
|---|---|---|
| **Resources** | Dữ liệu read-only | docs, policy, schema DB |
| **Tools** | Hàm agent gọi được | `get_weather`, `search_docs` |
| **Prompts** | Template tương tác có sẵn | template CSKH, template review code |

Transport: `stdio` (server local, chạy cùng máy) hoặc HTTP (Streamable HTTP — server remote).
Lưu ý: **MCP ≠ tool calling** — tool calling là cơ chế của từng LLM vendor; MCP là protocol chuẩn
phía dưới để expose tools/resources/prompts cho bất kỳ client nào.

---

## 💻 Code Ví Dụ

```typescript
// MCP Server expose 3 loại capability: tools / resources / prompts
class McpServer {
  register(cap: Capability): void { /* ... */ }
  listCapabilities(): Array<{ kind: string; name: string; description: string }> { /* ... */ }
  callTool(name: string, args: Record<string, string>): string { /* validate schema rồi chạy */ }
  readResource(uri: string): string { /* read-only data */ }
}

// Client connect server, discover capabilities, gọi tool qua CÙNG một protocol
const host = new McpClient();
host.connect(companyServer);
host.listAllCapabilities();                              // liệt kê mọi tool/resource/prompt
host.invoke("company-tools", "lookup_order", { id: "A2" }); // gọi tool → nhận result
```

> Xem đầy đủ trong `examples/index.ts` — chạy: `npx ts-node examples/index.ts`

**So sánh cách nối AI ↔ tools:**

| Cách làm | Ai viết integration | Tái sử dụng | Chuẩn hóa |
|---|---|---|---|
| **MCP** | Server author viết 1 lần | Mọi MCP client dùng được | Protocol mở (Linux Foundation) |
| **Tool calling riêng lẻ** | Từng LLM vendor định nghĩa schema riêng | Chỉ trong LLM đó | Mỗi vendor một kiểu |
| **Custom integration** | Từng cặp client × tool (M×N) | Không tái sử dụng | Không có |

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Viết 1 lần, dùng mọi nơi | Tool expose qua MCP → mọi client (IDE, chatbot, agent) dùng ngay |
| Giảm M×N xuống M+N | M assistants + N tools chỉ cần mỗi bên nói chuẩn chung |
| Discover động | Client liệt kê tools/resources lúc handshake — thêm tool không phải sửa client |
| Hệ sinh thái | Hàng nghìn MCP servers có sẵn (GitHub, DB, browser, cloud...) |

---

## ⚠️ Lưu Ý

- **Security là số 1:** dùng auth token, scoped permission (mỗi tool chỉ quyền tối thiểu), sandbox chạy cách ly.
  **Không tin MCP server lạ** — tool description có thể chứa prompt injection đánh lừa agent gọi hành động nguy hiểm.
- **Version protocol:** client/server phải thương lượng version khi handshake — kiểm tra tương thích khi upgrade.
- **Local vs remote:** server `stdio` chạy trên máy user (dữ liệu không rời máy); server HTTP remote tiện chia sẻ
  nhưng phải bảo mật transport + auth đúng chuẩn.

---

## 🎯 Khi Nào Dùng

- Agent/assistant cần gọi **nhiều tools của bên thứ ba** mà không muốn viết integration riêng từng cái.
- Doanh nghiệp muốn expose dữ liệu nội bộ (docs, DB, API) cho **nhiều AI client cùng lúc**.
- Không cần khi app chỉ gọi đúng 1 tool của 1 vendor — tool calling trực tiếp đơn giản hơn.

---

## 🔗 Liên Quan

- [17.5 AI Agents](../17.5-ai-agents/README.md) — agent gọi tools qua MCP thay vì tự định nghĩa.
- [17.1 Prompt Engineering](../17.1-prompt-engineering/README.md) — Prompts là 1 trong 3 capability của MCP.
- [11.6 Rate Limiting](../../11-networking-apis/11.6-rate-limiting/README.md) — server MCP remote cũng cần rate limit.

---

## 📚 Tài Liệu

- 📖 [MCP — Official Docs](https://modelcontextprotocol.io)
- 📖 [Anthropic: Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- 📖 [Spec — GitHub modelcontextprotocol](https://github.com/modelcontextprotocol)

---

## ▶️ Chạy Ví Dụ

```bash
cd 17-ai-llm-engineering/17.7-model-context-protocol
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [17.6 LLM Eval & Safety](../17.6-llm-eval-safety/README.md) — đo lường và guardrail cho pipeline LLM.
