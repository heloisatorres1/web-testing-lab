/** Reference data for SauceDemo, recorded during the exploratory session (see docs/exploration). */

export const SAUCEDEMO_URL = 'https://www.saucedemo.com';

export const PASSWORD = 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type Username = (typeof USERS)[keyof typeof USERS];

/** Every user that is allowed to log in. */
export const ACCEPTED_USERS: Username[] = [
  USERS.standard,
  USERS.problem,
  USERS.performanceGlitch,
  USERS.error,
  USERS.visual,
];

export interface Product {
  id: string;
  name: string;
  price: number;
}

/** The catalog as shown to standard_user (the reference). */
export const PRODUCTS: Product[] = [
  { id: 'sauce-labs-backpack', name: 'Sauce Labs Backpack', price: 29.99 },
  { id: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light', price: 9.99 },
  { id: 'sauce-labs-bolt-t-shirt', name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  { id: 'sauce-labs-fleece-jacket', name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  { id: 'sauce-labs-onesie', name: 'Sauce Labs Onesie', price: 7.99 },
  { id: 'test.allthethings()-t-shirt-(red)', name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
];

export function product(nameOrId: string): Product {
  const found = PRODUCTS.find((p) => p.name === nameOrId || p.id === nameOrId);
  if (!found) throw new Error(`Unknown product: ${nameOrId}`);
  return found;
}

export const TAX_RATE = 0.08;

export const MESSAGES = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  wrongCredentials: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  loginRequired: (path: string) => `Epic sadface: You can only access '${path}' when you are logged in.`,
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
  orderComplete: 'Thank you for your order!',
} as const;

export const CUSTOMER = { firstName: 'Ana', lastName: 'Silva', postalCode: '86000-000' };

/** Rounds money the way the shop does: to the nearest cent. */
export const toCents = (value: number) => Math.round(value * 100) / 100;
