import type { ServiceHandle } from '../types.ts';

import type { ServiceDsl } from './service.ts';
import type {
  StackConfigsDsl,
  StackNetworksDsl,
  StackSecretsDsl,
  StackVolumesDsl,
} from './builders.ts';

export type { ServiceDsl } from './service.ts';

export interface StackDsl {
  name: (value: string) => void;
  /** Define networks for the stack */
  networks: (fn: (dsl: StackNetworksDsl) => void) => void;
  /** Define volumes for the stack */
  volumes: (fn: (dsl: StackVolumesDsl) => void) => void;
  /** Define secrets for the stack */
  secrets: (fn: (dsl: StackSecretsDsl) => void) => void;
  /** Define configs for the stack */
  configs: (fn: (dsl: StackConfigsDsl) => void) => void;
  /** Define a service */
  service: (builder: (dsl: ServiceDsl) => void) => ServiceHandle;
}
