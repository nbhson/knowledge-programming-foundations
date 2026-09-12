// Unit Testing Examples - Test các đơn vị chức năng trong isolation

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────
// 1. Pure function testing
// ─────────────────────────────────────────────

function calculateDiscount(price: number, percentage: number): number {
  if (price < 0) throw new Error('Price cannot be negative');
  if (percentage < 0 || percentage > 100) throw new Error('Percentage must be 0-100');
  return price * (1 - percentage / 100);
}

describe('calculateDiscount', () => {
  it('should apply discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  it('should return original price when discount is 0', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('should return 0 when discount is 100', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('should throw error for negative price', () => {
    expect(() => calculateDiscount(-10, 10))
      .toThrow('Price cannot be negative');
  });

  it('should throw error for invalid percentage', () => {
    expect(() => calculateDiscount(100, 150))
      .toThrow('Percentage must be 0-100');
  });
});

// ─────────────────────────────────────────────
// 2. Mock dependency testing
// ─────────────────────────────────────────────

interface UserRepository {
  findById(id: number): Promise<{ id: number; name: string; email: string } | null>;
  save(user: { id: number; name: string; email: string }): Promise<void>;
}

class UserService {
  constructor(private repo: UserRepository) {}

  async getUser(id: number) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUser(id: number, updates: Partial<{ name: string; email: string }>) {
    const user = await this.getUser(id);
    const updated = { ...user, ...updates };
    await this.repo.save(updated);
    return updated;
  }
}

describe('UserService', () => {
  let mockRepo: UserRepository;
  let userService: UserService;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    userService = new UserService(mockRepo);
  });

  it('should return user when found', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@test.com' };
    vi.mocked(mockRepo.findById).mockResolvedValue(mockUser);

    const result = await userService.getUser(1);

    expect(result).toEqual(mockUser);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
  });

  it('should throw error when user not found', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(userService.getUser(999))
      .rejects.toThrow('User not found');
  });

  it('should update and return user', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@test.com' };
    vi.mocked(mockRepo.findById).mockResolvedValue(mockUser);
    vi.mocked(mockRepo.save).mockResolvedValue(undefined);

    const result = await userService.updateUser(1, { name: 'Jane' });

    expect(result).toEqual({ id: 1, name: 'Jane', email: 'john@test.com' });
    expect(mockRepo.save).toHaveBeenCalledWith({ id: 1, name: 'Jane', email: 'john@test.com' });
  });
});

// ─────────────────────────────────────────────
// 3. Testing class with multiple methods
// ─────────────────────────────────────────────

class Cart {
  private items: Array<{ name: string; price: number; qty: number }> = [];

  addItem(name: string, price: number, qty: number = 1): void {
    if (price < 0 || qty < 0) throw new Error('Invalid price or quantity');
    this.items.push({ name, price, qty });
  }

  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.qty, 0);
  }

  clear(): void {
    this.items = [];
  }
}

describe('Cart', () => {
  let cart: Cart;

  beforeEach(() => {
    cart = new Cart();
  });

  it('should start empty', () => {
    expect(cart.getTotal()).toBe(0);
    expect(cart.getItemCount()).toBe(0);
  });

  it('should calculate total correctly', () => {
    cart.addItem('Apple', 1000, 2);
    cart.addItem('Banana', 500, 3);

    expect(cart.getTotal()).toBe(3500);
    expect(cart.getItemCount()).toBe(5);
  });

  it('should throw error for negative price', () => {
    expect(() => cart.addItem('Item', -100)).toThrow('Invalid price or quantity');
  });

  it('should clear cart', () => {
    cart.addItem('Item', 100);
    cart.clear();

    expect(cart.getTotal()).toBe(0);
  });
});

console.log('✅ Unit testing examples defined');
