/**
 * 5.4.2 OAuth 2.0 — Mô phỏng Authorization Code Flow + Refresh Token
 *
 * Các vai trò:
 * - Resource Owner (User sở hữu dữ liệu)
 * - Client (ứng dụng xin quyền)
 * - Authorization Server (cấp code + token)
 * - Resource Server (API trả dữ liệu theo access token)
 *
 * Flow: authorize URL → user đồng ý → code → đổi code lấy access+refresh
 *       → gọi API bằng access token → hết hạn → refresh xoay vòng.
 */

import { randomBytes } from "node:crypto";

// ──────────────────────────────── Types ─────────────────────────────────────
interface OAuthFlowClient {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  name: string;
}

interface OAuthFlowUser {
  id: string;
  name: string;
}

interface OAuthFlowToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

// ────────────────────────── Authorization Server ────────────────────────────
class OAuthFlowServer {
  private clients = new Map<string, OAuthFlowClient>();
  private codes = new Map<string, { clientId: string; userId: string }>();
  private tokens = new Map<string, OAuthFlowToken>();
  private usedRefreshTokens = new Set<string>();

  registerClient(client: OAuthFlowClient): void {
    this.clients.set(client.clientId, client);
  }

  // Bước 1: Client dẫn user tới trang login của server
  buildAuthorizeUrl(clientId: string, redirectUri: string): string {
    if (this.clients.get(clientId)?.redirectUri !== redirectUri) {
      throw new Error("redirect_uri không khớp");
    }
    return (
      "https://auth.example.com/authorize" +
      `?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  }

  // Bước 2-3: User login + đồng ý → server phát authorization code (1 lần)
  authorize(clientId: string, redirectUri: string, user: OAuthFlowUser): string {
    if (this.clients.get(clientId)?.redirectUri !== redirectUri) {
      throw new Error("redirect_uri không khớp");
    }
    const code = randomBytes(8).toString("hex");
    this.codes.set(code, { clientId, userId: user.id });
    console.log(`   🔐 ${user.name} đồng ý → authorization code: ${code}`);
    return code;
  }

  // Bước 4-5: Client đổi code + client_secret → access token + refresh token
  exchangeCodeForToken(code: string, clientSecret: string): OAuthFlowToken {
    const record = this.codes.get(code);
    if (!record) throw new Error("Code không hợp lệ hoặc đã dùng");
    this.codes.delete(code); // code dùng 1 lần

    const client = this.clients.get(record.clientId);
    if (!client || client.clientSecret !== clientSecret) {
      throw new Error("client_secret sai");
    }

    const token: OAuthFlowToken = {
      accessToken: `at_${randomBytes(8).toString("hex")}`,
      refreshToken: `rt_${randomBytes(8).toString("hex")}`,
      expiresAt: Date.now() + 60_000, // 60 giây để demo refresh
      userId: record.userId,
    };
    this.tokens.set(token.accessToken, token);
    console.log(`   🎫 Access token : ${token.accessToken}`);
    console.log(`   🎫 Refresh token: ${token.refreshToken} (thời hạn 60s)`);
    return token;
  }

  // Bước 7: Resource Server kiểm tra access token
  introspect(accessToken: string): OAuthFlowUser | null {
    const token = this.tokens.get(accessToken);
    if (!token) return null;
    if (Date.now() > token.expiresAt) {
      console.log(`   ⏰ Access token hết hạn → bị từ chối`);
      return null;
    }
    return { id: token.userId, name: `user-${token.userId}` };
  }

  // Bước 8: Refresh token xoay vòng → access token mới, refresh cũ bị vô hiệu
  refreshAccessToken(refreshToken: string): OAuthFlowToken {
    if (this.usedRefreshTokens.has(refreshToken)) {
      throw new Error("Refresh token đã bị xoay vòng — nguy cơ bị đánh cắp!");
    }
    const current = [...this.tokens.values()].find((t) => t.refreshToken === refreshToken);
    if (!current) throw new Error("Refresh token không hợp lệ");

    this.usedRefreshTokens.add(refreshToken);

    const newToken: OAuthFlowToken = {
      accessToken: `at_${randomBytes(8).toString("hex")}`,
      refreshToken: `rt_${randomBytes(8).toString("hex")}`,
      expiresAt: Date.now() + 60_000,
      userId: current.userId,
    };
    this.tokens.set(newToken.accessToken, newToken);
    this.tokens.delete(current.accessToken);
    console.log(`   🔄 Refresh xoay vòng → access mới: ${newToken.accessToken}`);
    return newToken;
  }
}

// ──────────────────────── Resource Server (API) ─────────────────────────────
class OAuthFlowResourceServer {
  constructor(private readonly authServer: OAuthFlowServer) {}

  getProfile(accessToken: string): string | null {
    const user = this.authServer.introspect(accessToken);
    if (!user) return null;
    return `✅ API trả về profile của ${user.name}`;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== OAuth 2.0 Authorization Code Flow Demo ===");
console.log("");

const authServer = new OAuthFlowServer();
const resourceServer = new OAuthFlowResourceServer(authServer);

const app: OAuthFlowClient = {
  clientId: "client-web-001",
  clientSecret: "secret-xyz-123",
  redirectUri: "https://myapp.com/callback",
  name: "My Web App",
};
authServer.registerClient(app);

console.log("1️⃣ Client tạo authorize URL đưa user sang Auth Server:");
const url = authServer.buildAuthorizeUrl(app.clientId, app.redirectUri);
console.log(`   ${url}`);
console.log("");

console.log("2️⃣ User login + đồng ý → nhận authorization code:");
const code = authServer.authorize(app.clientId, app.redirectUri, { id: "u-1", name: "Son" });
console.log("");

console.log("3️⃣ Client đổi code lấy access + refresh token:");
const tokens = authServer.exchangeCodeForToken(code, app.clientSecret);
console.log("");

console.log("4️⃣ Gọi API bằng access token:");
console.log(`   ${resourceServer.getProfile(tokens.accessToken) ?? "   ❌ API từ chối"}`);
console.log("");

console.log("5️⃣ Giả lập access token hết hạn → phải dùng refresh token:");
console.log(`   ${resourceServer.getProfile(tokens.accessToken) ?? "   ❌ API từ chối (token đã hết hạn)"}`);
const refreshed = authServer.refreshAccessToken(tokens.refreshToken);
console.log(`   ${resourceServer.getProfile(refreshed.accessToken) ?? "   ❌ API từ chối"}`);
console.log("");

console.log("6️⃣ Dùng LẠI refresh token cũ → bị chặn (rotation):");
try {
  authServer.refreshAccessToken(tokens.refreshToken);
  console.log("   ⚠️ Không nên xảy ra!");
} catch (error) {
  console.log(`   ❌ ${(error as Error).message}`);
}
console.log("");

console.log("✅ OAuth 2.0: user không chia sẻ password, chỉ cấp code một lần; access token ngắn hạn + refresh token xoay vòng giúp cấp quyền an toàn.");
export {};