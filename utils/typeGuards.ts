/**
 * Type guard utilities for safe type checking
 * Reduces the need for 'as any' type assertions
 */

/**
 * Type guard to check if a value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/**
 * Type guard to check if a value has all required properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  ...keys: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) return false;
  return keys.every(key => key in value);
}

/**
 * Safe property access with type checking
 * 
 * @example
 * ```ts
 * const name = safeGet(user, 'name', isString); // string | null
 * ```
 */
export function safeGet<T>(
  obj: unknown,
  key: string,
  guard?: (value: unknown) => value is T
): T | null {
  if (!isObject(obj) || !(key in obj)) return null;
  const value = obj[key];
  if (guard && !guard(value)) return null;
  return value as T;
}

/**
 * Type-safe object property access
 * 
 * @example
 * ```ts
 * const user = { name: 'John', age: 30 };
 * const name = getProperty(user, 'name'); // string
 * const age = getProperty(user, 'age'); // number
 * ```
 */
export function getProperty<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

/**
 * Type guard for checking if an object matches a shape
 * 
 * @example
 * ```ts
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * function isUser(data: unknown): data is User {
 *   return (
 *     isObject(data) &&
 *     isString(data.id) &&
 *     isString(data.name) &&
 *     isString(data.email)
 *   );
 * }
 * ```
 */
export function createTypeGuard<T>(
  check: (value: unknown) => boolean
): (value: unknown) => value is T {
  return check as (value: unknown) => value is T;
}

/**
 * Safe array access with bounds checking
 */
export function safeArrayAccess<T>(array: T[], index: number): T | null {
  if (index < 0 || index >= array.length) return null;
  return array[index] ?? null;
}

/**
 * Type guard for checking if value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

