export type Pruned<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

/**
 * Remove keys whose values are `undefined`. Useful for shaping Compose output.
 */
export const pruneUndefined = <T extends object>(value: T): Pruned<T> => {
  const result = { ...value } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result as Pruned<T>;
};
