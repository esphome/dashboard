"use strict";

export function isNumber(val: unknown): val is number {
  return typeof val === "number";
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isDefined(val: unknown): val is object {
  return typeof val !== "undefined";
}

export function isBoolean(val: unknown): val is boolean {
  return typeof val === "boolean";
}

export function isString(val: unknown): val is string {
  return typeof val === "string";
}

/**
 * Check that provided value is Iterable
 * @param val the value to check
 * @returns true if val is iterable, false otherwise
 */
export function isIterable(val: unknown): boolean {
  return Symbol.iterator in Object(val);
}
