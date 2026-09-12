// TDD Examples - Test-Driven Development: Red → Green → Refactor

import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────
// 🔴 STEP 1: RED — Viết test TRƯỚC khi có code
// (Test sẽ FAIL vì function chưa tồn tại)
// ─────────────────────────────────────────────

describe('calculateDiscount (TDD)', () => {
  // Test case 1: Discount for orders over $100
  it('should apply 10% discount for orders over $100', () => {
    // ❌ FAIL: calculateDiscount is not defined yet
    expect(calculateDiscount(150)).toBe(135);
  });

  // Test case 2: No discount for orders under $100
  it('should not apply discount for orders under $100', () => {
    expect(calculateDiscount(50)).toBe(50);
  });

  // Test case 3: Edge case - exactly at threshold
  it('should not apply discount exactly at threshold', () => {
    expect(calculateDiscount(100)).toBe(100);
  });
});

// ─────────────────────────────────────────────
// 🟢 STEP 2: GREEN — Viết code TỐI THIỂU để pass test
// (Không cần clean, chỉ cần pass)
// ─────────────────────────────────────────────

function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  return amount;
}
// ✅ Bây giờ tất cả test PASS

// ─────────────────────────────────────────────
// 🔵 STEP 3: REFACTOR — Làm sạch code
// (Giữ nguyên behavior, cải thiện readability)
// ─────────────────────────────────────────────

const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1;

function calculateDiscountRefactored(amount: number): number {
  return amount > DISCOUNT_THRESHOLD
    ? amount * (1 - DISCOUNT_RATE)
    : amount;
}

// Verify behavior unchanged
expect(calculateDiscountRefactored(150)).toBe(135);
expect(calculateDiscountRefactored(50)).toBe(50);
expect(calculateDiscountRefactored(100)).toBe(100);
// ✅ Tất cả test vẫn PASS sau refactor

// ─────────────────────────────────────────────
// Ví dụ phức tạp hơn: Password Validator
// ─────────────────────────────────────────────

describe('validatePassword (TDD)', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(validatePassword('lowercase123!')).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(validatePassword('NoNumbers!')).toBe(false);
  });

  it('should reject passwords without special characters', () => {
    expect(validatePassword('NoSpecial1')).toBe(false);
  });

  it('should accept valid password', () => {
    expect(validatePassword('ValidPass1!')).toBe(true);
  });
});

function validatePassword(password: string): boolean {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

console.log('✅ TDD examples defined');
