/**
 * 9.3 OAuth 2.0 — Mô phỏng Authorization Code Flow
 *
 * Minh họa các bên trong OAuth 2.0:
 * - Resource Owner (User)
 * - Client (Ứng dụng web)
 * - Authorization Server (cấp authorization code + token)
 * - Resource Server (API chứa dữ liệu)
 *
 * Flow: Auth Request → User login/consent → Authorization Code
 *      → Exchange code → Access Token + Refresh Token → Gọi API →
 *      Access token hết hạn → Refresh token xoay vòng.
 *
 * Toàn bộ mô phỏng bằng object + Promise/setTimeout (giả lập network).
 */

// ─────────────────────────────── Types ─────────────────────────────────────
interface OAuthClient {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  name: string;
}

interface OAuthUser {
  id: string;
  name: string;
}

interface OAuthAccessToken {
  token: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
}

interface OAuthRefreshToken {
  token: string;
  clientId: string;
  userId: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// ────────────────────────── Authorization Server ───────────────────────────
class OAuthAuthorizationServer {
  private clients: Map<string, OAuthClient> = new Map();
  private authCodes: Map<string, { clientId: string; userId: string }> = new Map();
  private accessTokens: Map<string, OAuthAccessToken> = new Map();
  private refreshTokens: Map<string, OAuthRefreshToken> = new Map();

  registerClient(client: OAuthClient): void {
    this.clients.set(client.clientId, client);
  }

  // Bước 1: Client gửi auth request — server tạo trang login/consent
  buildAuthorizeUrl(clientId: string, redirectUri: string): string {
    const client = this.clients.get(clientId);
    if (!client) throw new Error("Không tìm thấy client");
    if (client.redirectUri !== redirectUri) throw new Error("redirect_uri không khớp");
    return (
      "https://auth.example.com/authorize" +
      `?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  }

  // Bước 3-4: User login + consent → server phát authorization code
  async authorize(
    clientId: string,
    redirectUri: string,
    user: OAuthUser
  ): Promise<string> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error("Không tìm thấy client");
    if (client.redirectUri !== redirectUri) throw new Error("redirect_uri không khớp");

    return new Promise((resolve) => {
      setTimeout(() => {
        const code = Math.random().toString(36).slice(2, 18);
        this.authCodes.set(code, { clientId, userId: user.id });
        console.log(`   🔐 User ${user.name} authorize → code = ${code}`);
        resolve(code);
      }, 30);
    });
  }

  // Bước 5-6: Client đổi code lấy token (kèm client_secret)
  async exchangeCodeForToken(
    code: string,
    clientSecret: string
  ): Promise<OAuthTokenResponse> {
    const record = this.authCodes.get(code);
    if (!record) throw new Error("Authorization code không hợp lệ hoặc đã dùng");

    const client = this.clients.get(record.clientId);
    if (!client || client.clientSecret !== clientSecret) {
      throw new Error("client_secret sai");
    }
    this.authCodes.delete(code); // code chỉ dùng 1 lần

    return new Promise((resolve) => {
      setTimeout(() => {
        const accessToken: OAuthAccessToken = {
          token: `at_${Math.random().toString(36).slice(2, 18)}`,
          clientId: record.clientId,
          userId: record.userId,
          scopes: ["profile", "email"],
          expiresAt: Date.now() + 300_000, // 5 phút
        };
        const refreshToken: OAuthRefreshToken = {
          token: `rt_${Math.random().toString(36).slice(2, 18)}`,
          clientId: record.clientId,
          userId: record.userId,
        };
        this.accessTokens.set(accessToken.token, accessToken);
        this.refreshTokens.set(refreshToken.token, refreshToken);

        console.log(`   🎫 Access token  : ${accessToken.token}`);
        console.log(`   🎫 Refresh token : ${refreshToken.token}`);
        resolve({
          access_token: accessToken.token,
          token_type: "Bearer",
          expires_in: 300,
          refresh_token: refreshToken.token,
          scope: "profile email",
        });
      }, 40);
    });
  }

  // Tạo token mới từ refresh token (rotation — token cũ bị vô hiệu)
  async refreshAccessToken(refreshTokenRaw: string): Promise<OAuthTokenResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const record = this.refreshTokens.get(refreshTokenRaw);
        if (!record) {
          reject(new Error("Refresh token không hợp lệ hoặc đã bị xoay vòng"));
          return;
        }
        this.refreshTokens.delete(refreshTokenRaw); // vô hiệu token cũ

        const accessToken: OAuthAccessToken = {
          token: `at_${Math.random().toString(36).slice(2, 18)}`,
          clientId: record.clientId,
          userId: record.userId,
          scopes: ["profile", "email"],
          expiresAt: Date.now() + 300_000,
        };
        const newRefresh: OAuthRefreshToken = {
          token: `rt_${Math.random().toString(36).slice(2, 18)}`,
          clientId: record.clientId,
          userId: record.userId,
        };
        this.accessTokens.set(accessToken.token, accessToken);
        this.refreshTokens.set(newRefresh.token, newRefresh);

        console.log(`   🔄 Refresh xoay vòng → access mới: ${accessToken.token}`);
        resolve({
          access_token: accessToken.token,
          token_type: "Bearer",
          expires_in: 300,
          refresh_token: newRefresh.token,
          scope: "profile email",
        });
      }, 40);
    });
  }

  // Resource server dùng để kiểm tra access token
  introspect(token: string): OAuthAccessToken | null {
    const record = this.accessTokens.get(token);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      console.log("   ⏰ Access token đã hết hạn!");
      return null;
    }
    return record;
  }
}

// ─────────────────────────── Resource Server ────────────────────────────────
class OAuthResourceServer {
  constructor(private authServer: OAuthAuthorizationServer) {}

  getUserProfile(accessToken: string): { userId: string; name: string } | null {
    const token = this.authServer.introspect(accessToken);
    if (!token) return null;
    const user = OAuth_USERS.find((u) => u.id === token.userId);
    return user ? { userId: user.id, name: user.name } : null;
  }
}

const OAuth_USERS: OAuthUser[] = [
  { id: "u-1", name: "Alice" },
  { id: "u-2", name: "Bob" },
];

// ─────────────────────────── Mô phỏng Client App ───────────────────────────
async function runOAuthFlow(): Promise<void> {
  const authServer = new OAuthAuthorizationServer();
  const resourceServer = new OAuthResourceServer(authServer);

  const myApp: OAuthClient = {
    clientId: "client-wedapp-01",
    clientSecret: "client-secret-xxx",
    redirectUri: "https://myapp.com/callback",
    name: "My Web App",
  };
  authServer.registerClient(myApp);

  // 1. Client đưa user đến trang login của Auth Server
  console.log("1️⃣ Client xây dựng authorize URL:");
  const authorizeUrl = authServer.buildAuthorizeUrl(
    myApp.clientId,
    myApp.redirectUri
  );
  console.log(`   ${authorizeUrl}`);
  console.log("");

  // 2-4. User login + consent → nhận authorization code
  console.log("2️⃣ User login + consent trên Auth Server:");
  const code = await authServer.authorize(
    myApp.clientId,
    myApp.redirectUri,
    OAuth_USERS[0]
  );
  console.log("");

  // 5-6. Exchange code → access + refresh token
  console.log("3️⃣ Client đổi code lấy token (kèm client_secret):");
  const tokens = await authServer.exchangeCodeForToken(
    code,
    myApp.clientSecret
  );
  console.log("");

  // 7. Gọi API với Bearer token
  console.log("4️⃣ Client gọi API với Authorization: Bearer <access_token>:");
  const profile = resourceServer.getUserProfile(tokens.access_token);
  console.log(
    profile
      ? `   ✅ API trả về: ${profile.name} (userId=${profile.userId})`
      : "   ❌ API từ chối (token không hợp lệ)"
  );
  console.log("");

  // Simulate access token hết hạn → dùng refresh token
  console.log("5️⃣ Giả lập access token hết hạn → gọi refresh token:");
  const refreshed = await authServer.refreshAccessToken(tokens.refresh_token);
  console.log("");

  // Dùng refresh token CŨ lần nữa → bị từ chối (rotation)
  console.log("6️⃣ Dùng lại refresh token cũ (rotation đã vô hiệu):");
  try {
    await authServer.refreshAccessToken(tokens.refresh_token);
  } catch (error) {
    console.log(`   ❌ ${(error as Error).message}`);
  }
  console.log("");

  // Gọi API bằng token mới
  const profile2 = resourceServer.getUserProfile(refreshed.access_token);
  console.log("7️⃣ Gọi API bằng access token mới:");
  console.log(
    profile2
      ? `   ✅ API trả về: ${profile2.name}`
      : "   ❌ API từ chối"
  );
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== OAuth 2.0 Authorization Code Flow Demo ===");
console.log("");

void runOAuthFlow().then(() => {
  console.log("");
  console.log("✅ OAuth 2.0 tách quyền khỏi password: user authorize 1 lần, client nhận access token (ngắn hạn) + refresh token (xoay vòng) để gọi API.");
});
export {};