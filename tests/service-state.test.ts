import { describe, expect, it } from 'vitest';

import { ServiceState } from '../lib/builder/service/service-state.js';
import type { ComposeDependsOnCondition } from '../lib/types.js';

describe('ServiceState addDependsOn conversion', () => {
  it('converts array depends_on to record and preserves restart/required', () => {
    const state = new ServiceState();
    state.setName('svc');

    // Start with array mode via simple dependency
    state.addDependency('a');
    // Now add a conditional dependency to force conversion to record
    state.addDependsOn('b', { condition: 'service_healthy', restart: 'on-failure', required: false } as ComposeDependsOnCondition);

    const depends = state.previewComposeService().depends_on as Record<string, ComposeDependsOnCondition>;
    expect(depends).toEqual({
      a: { condition: 'service_started' },
      b: { condition: 'service_healthy', restart: 'on-failure', required: false },
    });
  });
});
