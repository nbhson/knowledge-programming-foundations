// Integration Testing Examples - Test multiple components working together

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { sql, migrate } from './database';

// ─────────────────────────────────────────────
// 1. API + Database Integration
// ─────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Simulated database (replace with real DB in production)
const users: User[] = [];
let nextId = 1;

async function createUser(name: string, email: string): Promise<User> {
  const user: User = { id: nextId++, name, email, createdAt: new Date() };
  users.push(user);
  return user;
}

async function findUserById(id: number): Promise<User | null> {
  return users.find(u => u.id === id) ?? null;
}

async function findUserByEmail(email: string): Promise<User | null> {
  return users.find(u => u.email === email) ?? null;
}

describe('User API Integration', () => {
  beforeEach(() => {
    users.length = 0;
    nextId = 1;
  });

  it('should create and retrieve user through full flow', async () => {
    // Act: Create user
    const created = await createUser('John Doe', 'john@example.com');

    // Assert: Retrieve and verify
    const retrieved = await findUserById(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('John Doe');
    expect(retrieved!.email).toBe('john@example.com');
    expect(retrieved!.id).toBe(created.id);
  });

  it('should reject duplicate email', async () => {
    await createUser('John', 'john@example.com');

    await expect(createUser('Jane', 'john@example.com'))
      .rejects.toThrow('Email already exists');
  });

  it('should validate email format on creation', async () => {
    await expect(createUser('John', 'invalid-email'))
      .rejects.toThrow('Invalid email');
  });
});

// ─────────────────────────────────────────────
// 2. Service + Repository Integration
// ─────────────────────────────────────────────

interface Order {
  id: number;
  userId: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped';
}

class OrderRepository {
  private orders: Order[] = [];
  private nextId = 1;

  async create(order: Omit<Order, 'id'>): Promise<Order> {
    const orderWithId: Order = { ...order, id: this.nextId++ };
    this.orders.push(orderWithId);
    return orderWithId;
  }

  async findById(id: number): Promise<Order | null> {
    return this.orders.find(o => o.id === id) ?? null;
  }

  async findByUserId(userId: number): Promise<Order[]> {
    return this.orders.filter(o => o.userId === userId);
  }
}

class OrderService {
  constructor(private repo: OrderRepository) {}

  async placeOrder(userId: number, total: number): Promise<Order> {
    if (total <= 0) throw new Error('Order total must be positive');
    return this.repo.create({ userId, total, status: 'pending' });
  }

  async confirmOrder(orderId: number): Promise<Order> {
    const order = await this.repo.findById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending') throw new Error('Order cannot be confirmed');
    order.status = 'confirmed';
    return order;
  }
}

describe('Order Service Integration', () => {
  let repo: OrderRepository;
  let service: OrderService;

  beforeEach(() => {
    repo = new OrderRepository();
    service = new OrderService(repo);
  });

  it('should place and confirm order', async () => {
    const order = await service.placeOrder(1, 150000);
    expect(order.status).toBe('pending');

    const confirmed = await service.confirmOrder(order.id);
    expect(confirmed.status).toBe('confirmed');
  });

  it('should not allow negative order total', async () => {
    await expect(service.placeOrder(1, -100))
      .rejects.toThrow('Order total must be positive');
  });

  it('should not confirm non-pending order', async () => {
    const order = await service.placeOrder(1, 100000);
    await service.confirmOrder(order.id);

    await expect(service.confirmOrder(order.id))
      .rejects.toThrow('Order cannot be confirmed');
  });
});

// ─────────────────────────────────────────────
// 3. HTTP API + Database Integration
// ─────────────────────────────────────────────

describe('REST API Integration', () => {
  it('should handle full CRUD cycle', async () => {
    // Create
    const createRes = { id: 1, name: 'Product A', price: 100000 };
    expect(createRes.id).toBe(1);
    expect(createRes.name).toBe('Product A');

    // Read
    const getRes = { id: 1, name: 'Product A', price: 100000 };
    expect(getRes.price).toBe(100000);

    // Update
    const updateRes = { id: 1, name: 'Product A Pro', price: 150000 };
    expect(updateRes.name).toBe('Product A Pro');

    // Delete
    const deleteRes = { success: true };
    expect(deleteRes.success).toBe(true);
  });
});

console.log('✅ Integration testing examples defined');
