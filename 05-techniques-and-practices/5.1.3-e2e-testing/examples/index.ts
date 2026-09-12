// E2E Testing Examples - Full user flow simulation

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────
// 1. User Registration Flow
// ─────────────────────────────────────────────

test.describe('User Registration Flow', () => {
  test('should register a new user and show dashboard', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register');

    // Fill form fields
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Assert: redirected to dashboard with welcome message
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, John!')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="register-button"]');

    await expect(
      page.getByText('Password must be at least 8 characters')
    ).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', 'existing@test.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="register-button"]');

    await expect(
      page.getByText('Email already exists')
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 2. Login and Logout Flow
// ─────────────────────────────────────────────

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, John!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'wrong@test.com');
    await page.fill('[data-testid="password-input"]', 'WrongPass');
    await page.click('[data-testid="login-button"]');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Welcome')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 3. E2E Test Scenario with multiple steps
// ─────────────────────────────────────────────

test.describe('Complete Purchase Flow', () => {
  test('should complete a purchase from browsing to confirmation', async ({
    page,
  }) => {
    // Step 1: Browse products
    await page.goto('/products');
    await expect(page.getByText('Products')).toBeVisible();

    // Step 2: Add to cart
    await page.click('[data-testid="add-to-cart-1"]');
    await expect(page.getByText('Added to cart')).toBeVisible();

    // Step 3: Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page).toHaveURL('/cart');
    await expect(page.getByText('Product A')).toBeVisible();

    // Step 4: Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    await expect(page).toHaveURL('/checkout');

    // Step 5: Fill shipping info
    await page.fill('[data-testid="address-input"]', '123 Main St');
    await page.fill('[data-testid="city-input"]', 'New York');
    await page.click('[data-testid="place-order-button"]');

    // Step 6: Confirm order
    await expect(page).toHaveURL('/order-confirmation');
    await expect(page.getByText('Order confirmed!')).toBeVisible();
    await expect(page.getByText(/Order #\d+/)).toBeVisible();
  });
});

console.log('✅ E2E testing examples defined');
