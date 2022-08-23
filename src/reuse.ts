/** Things that you can pass to `reuseFrom`. */
import equal from "fast-deep-equal";
/** If an object has this as a property name, `reuse` will always leave the object as-is. */
export const skipReuse = Symbol("skipReuse");
export type Reusable =
  | { [skipReuse]: true }
  | string
  | number
  | boolean
  | undefined
  | null
  | { [P in string]: Reusable } // can't use Record here for some reason
  | Reusable[];

/**
 * If there are any properties on `target` that are deep-equal to objects on
 * `source`, copies them over.
 *
 * Any object with a `[skipReuse]` property will be omitted. This is mostly
 * useful for Zone/Task, since they have fields that are difficult to introspect.
 *
 * For arrays, elements are only candidates for copying if they're at the same
 * index (e.g., deleting the first element will cause nothing to be reused).
 *
 * The point of this is that it lets us use React's shallow equality for the
 * view model without having to write a custom `React.memo` comparator everywhere.
 *
 * Returns the reused object. This may or may not be the same object as `target`.
 */
export function reuse<T extends Reusable>(target: T, source: T): T {
  if (typeof source !== typeof target) {
    return target;
  }
  if (typeof source !== "object") {
    return target;
  }
  if (Array.isArray(target)) {
    if (Array.isArray(source)) {
      for (let i = 0; i < target.length; i++) {
        target[i] = reuse(target[i], source[i]);
      }
    }
    return target;
  }
  // Manually narrow down to the last possible case.
  const src = source as Record<string, Reusable>;
  const tgt = target as Record<string, Reusable>;
  // Recursively reuse the fields. We do this first so that `equal` will do less
  // work in the case where they're equal. There's probably a better
  // implementation to this, but... eh.
  Object.keys(tgt).forEach((k) => {
    tgt[k] = reuse(tgt[k], src[k]);
  });
  return equal(target, source) ? source : target;
}
