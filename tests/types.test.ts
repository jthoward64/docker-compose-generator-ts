import { describe, expect, it } from 'vitest';

import { isNetworkReference, type NetworkReference } from '../lib/types.js';

describe('isNetworkReference', () => {
  it('returns true for external network reference objects', () => {
    const ref: NetworkReference = { name: 'net', external: true, externalName: 'prod-net' };
    expect(isNetworkReference(ref)).toBe(true);
  });

  it('returns false for regular network inputs', () => {
    expect(isNetworkReference({ name: 'net', driver: 'bridge' })).toBe(false);
    expect(isNetworkReference({ name: 'net', external: { name: 'ext' } } as any)).toBe(false);
  });
});
