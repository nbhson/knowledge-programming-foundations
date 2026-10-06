/**
 * 13.9 API Gateway + Service Discovery — Demo
 *
 * Mô phỏng:
 *   - ServiceRegistry: register/deregister/health-check (mô hình service discovery)
 *   - ApiGateway: auth (API key) → rate limit (fixed window) → routing + round-robin → aggregation
 * Chạy: npx ts-node examples/index.ts (từ thư mục 13.9-api-gateway-discovery)
 */

interface ServiceInstance {
  readonly id: string;
  readonly host: string;
  healthy: boolean;
}

/** Registry: service name → danh sách instance (tim đập của service discovery). */
class ServiceRegistry {
  private readonly services = new Map<string, ServiceInstance[]>();

  register(service: string, instance: ServiceInstance): void {
    if (!this.services.has(service)) this.services.set(service, []);
    (this.services.get(service) as ServiceInstance[]).push(instance);
    console.log(`    📝 registry: ${service} += ${instance.id} (${instance.host})`);
  }

  deregister(service: string, id: string): void {
    const list = this.services.get(service) ?? [];
    this.services.set(
      service,
      list.filter((i) => i.id !== id)
    );
    console.log(`    🗑️  registry: ${service} -= ${id}`);
  }

  setHealthy(service: string, id: string, healthy: boolean): void {
    const inst = (this.services.get(service) ?? []).find((i) => i.id === id);
    if (inst) {
      inst.healthy = healthy;
      console.log(`    🩺 ${service}/${id} → ${healthy ? "healthy" : "UNHEALTHY"}`);
    }
  }

  healthyInstances(service: string): ServiceInstance[] {
    return (this.services.get(service) ?? []).filter((i) => i.healthy);
  }
}

/** Round-robin router trên tập instance khỏe mạnh (server-side discovery). */
class RoundRobinRouter {
  private readonly cursors = new Map<string, number>();

  pick(service: string, pool: ServiceInstance[]): ServiceInstance | null {
    if (pool.length === 0) return null;
    const cursor = this.cursors.get(service) ?? 0;
    const inst = pool[cursor % pool.length];
    this.cursors.set(service, cursor + 1);
    return inst;
  }
}

/** Rate limiter fixed-window trên mỗi user (đơn giản, deterministic cho demo). */
class FixedWindowLimiter {
  private readonly counts = new Map<string, number>();

  constructor(private readonly limit: number = 3) {}

  allow(userId: string): boolean {
    const used = this.counts.get(userId) ?? 0;
    if (used >= this.limit) return false;
    this.counts.set(userId, used + 1);
    return true;
  }
}

interface GatewayRequest {
  readonly path: string;
  readonly apiKey: string;
  readonly userId: string;
}

const ROUTES: Readonly<Record<string, string>> = {
  "/users": "user-service",
  "/orders": "order-service",
};

class ApiGateway {
  private static readonly VALID_KEY = "secret-key-123";

  constructor(
    private readonly registry: ServiceRegistry,
    private readonly router: RoundRobinRouter,
    private readonly limiter: FixedWindowLimiter
  ) {}

  /** Chuỗi xử lý: auth → rate limit → routing → forward (round-robin). */
  handle(req: GatewayRequest): string {
    if (req.apiKey !== ApiGateway.VALID_KEY) return "401 Unauthorized (sai API key)";
    if (!this.limiter.allow(req.userId)) return "429 Too Many Requests (vượt quota)";
    const service = ROUTES[req.path];
    if (!service) return "404 Not Found (không có route)";
    const inst = this.router.pick(service, this.registry.healthyInstances(service));
    if (!inst) return "503 Service Unavailable (không còn instance khỏe)";
    return `200 OK ← ${service}/${inst.id} (${inst.host})`;
  }

  /** Aggregation: 1 request client → gateway gọi N service rồi gộp response. */
  dashboard(req: GatewayRequest): string {
    const users = this.handle({ ...req, path: "/users" });
    const orders = this.handle({ ...req, path: "/orders" });
    return `dashboard = { users: [${users}], orders: [${orders}] }`;
  }
}

function main(): void {
  console.log("=== API Gateway + Service Discovery Demo ===");
  console.log("");

  const registry = new ServiceRegistry();
  const gateway = new ApiGateway(registry, new RoundRobinRouter(), new FixedWindowLimiter(3));

  console.log("1️⃣ Đăng ký service (discovery):");
  registry.register("user-service", { id: "u1", host: "10.0.0.1:3000", healthy: true });
  registry.register("user-service", { id: "u2", host: "10.0.0.2:3000", healthy: true });
  registry.register("order-service", { id: "o1", host: "10.0.0.3:3001", healthy: true });
  console.log("");

  console.log("2️⃣ Gateway pipeline — auth / rate-limit / routing / round-robin:");
  const good = { path: "/users", apiKey: "secret-key-123", userId: "alice" };
  console.log(`   ${gateway.handle(good)}`);
  console.log(`   ${gateway.handle(good)}`);
  console.log(`   sai key → ${gateway.handle({ ...good, apiKey: "nope" })}`);
  console.log(`   sai path → ${gateway.handle({ ...good, path: "/billing" })}`);
  console.log("");

  console.log("3️⃣ Rate limit (quota 3 req/user) — request thứ 4 của alice bị chặn:");
  console.log(`   ${gateway.handle(good)}`);
  console.log(`   ${gateway.handle(good)}`);
  console.log("");

  console.log("4️⃣ Failover — u1 unhealthy, traffic dồn về u2 (bob chưa chạm quota):");
  registry.setHealthy("user-service", "u1", false);
  const bob = { path: "/users", apiKey: "secret-key-123", userId: "bob" };
  console.log(`   ${gateway.handle(bob)}`);
  console.log(`   ${gateway.handle(bob)}`);
  console.log("");

  console.log("5️⃣ Aggregation — 1 call /dashboard gộp 2 service (carol):");
  console.log(`   ${gateway.dashboard({ path: "/dashboard", apiKey: "secret-key-123", userId: "carol" })}`);
  console.log("");
  console.log("✅ Gateway tập trung auth/rate-limit/routing/aggregation; registry + round-robin cho discovery & failover");
}

main();

export {};
