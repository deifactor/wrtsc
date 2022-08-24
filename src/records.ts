/**
 * Utility functions for working with records.
 *
 * These all assume the record is a 'true' record: i.e., that there are no keys
 * that aren't in the enumeration type.
 */

export function keys<K extends string | number | symbol, V>(
  obj: Partial<Record<K, V>>
): K[] {
  return Object.keys(obj) as K[];
}

export function entries<K extends string | number | symbol, V>(
  obj: Partial<Record<K, V>>
): [K, V][] {
  return Object.entries(obj) as [K, V][];
}

/** Map a function over the values of a record. */
export function mapValues<K extends string | number | symbol, U, V>(
  obj: Record<K, U>,
  func: (val: U, key: K) => V
): Record<K, V> {
  const mapped = {} as Record<K, V>;
  Object.entries(obj).forEach(([key, val]) => {
    mapped[key as K] = func(val as U, key as K);
  });
  return mapped;
}

/** Construct a record from the list of its potential keys. The list *must* be exhaustive! */
export function makeValues<K extends string | number | symbol, V>(
  keys: readonly K[],
  func: (key: K) => V
): Record<K, V> {
  const mapped = {} as Record<K, V>;
  for (const key of keys) {
    mapped[key] = func(key);
  }
  return mapped;
}
