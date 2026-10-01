import fs from 'node:fs';
import path from 'node:path';

export interface DemoFile {
  path: string;
  content: string;
  isTest?: boolean;
}

export const DEMO_SHOP_FILES: Record<string, string> = {
  'package.json': JSON.stringify(
    {
      name: 'demo-shop',
      version: '1.2.0',
      private: true,
      description: 'E-commerce shopping cart and checkout service',
      scripts: {
        test: 'node --test test/cart.test.mjs',
        lint: "node -e 'console.log(\"✓ Lint: all files passed styling and formatting guidelines.\")'",
        build: "node -e 'console.log(\"✓ Build: compiled 24 modules successfully.\")'",
        typecheck: "node -e 'console.log(\"✓ Typecheck: 0 errors found.\")'"
      },
      dependencies: {
        express: '^4.21.2',
        zod: '^3.23.8'
      },
      devDependencies: {
        typescript: '^5.4.5'
      }
    },
    null,
    2
  ),

  'src/types/index.ts': `export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  expiresAt: string;
  minSubtotal?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  promoCode?: string | null;
}

export interface UserAddress {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface Order {
  id: string;
  cart: Cart;
  total: number;
  shippingAddress?: UserAddress;
  billingAddress: UserAddress;
}
`,

  'src/services/cartService.ts': `import { Cart, CartItem, PromoCode } from '../types/index.js';

export function calculateSubtotal(items: CartItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

/**
 * Calculates applied discount on the cart.
 * BUG IN DEMO: Does not check if promo is null or if discountPercent exists before calculation.
 */
export function calculateDiscount(subtotal: number, promo: PromoCode | null | undefined): number {
  // Line 42: Potential null reference bug
  const discount = (subtotal * promo!.discountPercent) / 100;
  return Math.min(discount, subtotal);
}

export function calculateCartTotal(cart: Cart, promo: PromoCode | null | undefined): { subtotal: number; discount: number; total: number } {
  const subtotal = calculateSubtotal(cart.items);
  const discount = promo ? calculateDiscount(subtotal, promo) : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total
  };
}
`,

  'src/services/checkoutService.ts': `import { Order } from '../types/index.js';

export function getTaxRateByCountry(country: string): number {
  switch (country.toUpperCase()) {
    case 'US': return 0.08;
    case 'CA': return 0.13;
    case 'GB': return 0.20;
    case 'DE': return 0.19;
    default: return 0.05;
  }
}

/**
 * Calculates final taxes for an order.
 * BUG: Assumes order.shippingAddress is always populated.
 */
export function calculateOrderTax(order: Order): number {
  // Vulnerable to undefined shippingAddress for digital goods orders
  const taxRate = getTaxRateByCountry(order.shippingAddress!.country);
  return order.total * taxRate;
}
`,

  'src/services/catalogService.ts': `export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
}

const CATALOG: Product[] = [
  { id: 'p1', title: 'Mechanical Keyboard Pro', category: 'electronics', price: 149.99 },
  { id: 'p2', title: 'Wireless Ergonomic Mouse', category: 'electronics', price: 79.99 },
  { id: 'p3', title: 'Ultra-wide Monitor 34"', category: 'displays', price: 499.99 },
  { id: 'p4', title: 'USB-C Charging Hub', category: 'accessories', price: 45.00 }
];

export function searchProducts(query: string): Product[] {
  if (!query) return CATALOG;
  // Security review flag: unsafe dynamic regex
  try {
    const rx = new RegExp(query, 'i');
    return CATALOG.filter(p => rx.test(p.title) || rx.test(p.category));
  } catch {
    return [];
  }
}
`,

  'test/cart.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';

// Helper reproduction of cartService logic for deterministic test execution
function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

function calculateDiscount(subtotal, promo) {
  // When buggy: promo.discountPercent throws when promo is null
  return (subtotal * promo.discountPercent) / 100;
}

test('Cart Service: calculateSubtotal calculates items correctly', () => {
  const items = [
    { id: '1', price: 20, quantity: 2 },
    { id: '2', price: 50, quantity: 1 }
  ];
  assert.equal(calculateSubtotal(items), 90);
});

test('Cart Service: calculateDiscount applies 20% discount correctly with valid promo', () => {
  const promo = { code: 'SAVE20', discountPercent: 20 };
  const subtotal = 100;
  const discount = (subtotal * promo.discountPercent) / 100;
  assert.equal(discount, 20);
});

test('Cart Service: calculateDiscount handles null or undefined promo without crashing', (t) => {
  // This test checks the bug!
  // If the bug exists, calculateDiscount(100, null) throws TypeError
  let errorCaught = null;
  try {
    const res = calculateDiscount(100, null);
    assert.equal(res, 0, 'Discount for null promo must be 0');
  } catch (err) {
    errorCaught = err;
  }

  if (errorCaught) {
    assert.fail(\`Regression detected: calculateDiscount crashed with \${errorCaught.name}: \${errorCaught.message}\`);
  }
});
`,

  'test/cart.test.fixed.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';

function calculateSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

function calculateDiscount(subtotal, promo) {
  if (!promo || typeof promo.discountPercent !== 'number' || isNaN(promo.discountPercent)) {
    return 0;
  }
  const discount = (subtotal * promo.discountPercent) / 100;
  return Math.min(discount, subtotal);
}

test('Cart Service: calculateSubtotal calculates items correctly', () => {
  const items = [
    { id: '1', price: 20, quantity: 2 },
    { id: '2', price: 50, quantity: 1 }
  ];
  assert.equal(calculateSubtotal(items), 90);
});

test('Cart Service: calculateDiscount applies 20% discount correctly with valid promo', () => {
  const promo = { code: 'SAVE20', discountPercent: 20 };
  assert.equal(calculateDiscount(100, promo), 20);
});

test('Cart Service: calculateDiscount handles null or undefined promo gracefully', () => {
  assert.equal(calculateDiscount(100, null), 0);
  assert.equal(calculateDiscount(100, undefined), 0);
  assert.equal(calculateDiscount(100, {}), 0);
});

test('Cart Service: calculateDiscount prevents negative discount or overflow', () => {
  const promo = { code: 'SUPER', discountPercent: 150 };
  assert.equal(calculateDiscount(100, promo), 100);
});
`
};

/**
 * Initializes a demo-shop workspace in the given directory
 */
export function initializeDemoShopWorkspace(targetDir: string, useFixedVersion = false): void {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  for (const [relPath, content] of Object.entries(DEMO_SHOP_FILES)) {
    if (relPath === 'test/cart.test.fixed.mjs') continue;

    const fullPath = path.join(targetDir, relPath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }

    if (relPath === 'test/cart.test.mjs' && useFixedVersion) {
      fs.writeFileSync(fullPath, DEMO_SHOP_FILES['test/cart.test.fixed.mjs'], 'utf-8');
    } else if (relPath === 'src/services/cartService.ts' && useFixedVersion) {
      // Write the fixed cartService
      const fixedContent = `import { Cart, CartItem, PromoCode } from '../types/index.js';

export function calculateSubtotal(items: CartItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

/**
 * Calculates applied discount on the cart with defensive null checks.
 * REPAIRED: Checks for null/undefined promo and validates discountPercent.
 */
export function calculateDiscount(subtotal: number, promo: PromoCode | null | undefined): number {
  if (!promo || typeof promo.discountPercent !== 'number' || isNaN(promo.discountPercent)) {
    return 0;
  }
  const discount = (subtotal * promo.discountPercent) / 100;
  return Math.min(Math.max(0, discount), subtotal);
}

export function calculateCartTotal(cart: Cart, promo: PromoCode | null | undefined): { subtotal: number; discount: number; total: number } {
  const subtotal = calculateSubtotal(cart.items);
  const discount = promo ? calculateDiscount(subtotal, promo) : 0;
  const total = Math.max(0, subtotal - discount);

  return {
    subtotal,
    discount,
    total
  };
}
`;
      fs.writeFileSync(fullPath, fixedContent, 'utf-8');
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  }
}
