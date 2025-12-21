import type { ConfigHandle, NetworkHandle, SecretHandle, ServiceHandle, VolumeHandle } from '../types.ts';

import type { ServiceDsl, ServiceFn } from './service.ts';
import type {
  StackConfigsFn,
  StackNetworksFn,
  StackSecretsFn,
  StackVolumesFn,
  NetworkResourceFn,
  VolumeResourceFn,
  SecretResourceFn,
  ConfigResourceFn,
} from './builders.ts';

export type { ServiceDsl, ServiceFn } from './service.ts';

export interface StackDsl {
  name: (value: string) => void;
  /** Define networks for the stack */
  networks: <R>(fn: StackNetworksFn<R>) => R;
  /** Define a single network */
  network: <R>(fn: NetworkResourceFn<R>) => [NetworkHandle, R];
  /** Define volumes for the stack */
  volumes: <R>(fn: StackVolumesFn<R>) => R;
  /** Define a single volume */
  volume: <R>(fn: VolumeResourceFn<R>) => [VolumeHandle, R];
  /** Define secrets for the stack */
  secrets: <R>(fn: StackSecretsFn<R>) => R;
  /** Define a single secret */
  secret: <R>(fn: SecretResourceFn<R>) => [SecretHandle, R];
  /** Define configs for the stack */
  configs: <R>(fn: StackConfigsFn<R>) => R;
  /** Define a single config */
  config: <R>(fn: ConfigResourceFn<R>) => [ConfigHandle, R];
  /** Define a service */
  service: <R>(builder: ServiceFn<R>) => [ServiceHandle, R];
}

export type StackFn<R = void> = (dsl: StackDsl) => R;
export type StackServiceFn<R = void> = (dsl: ServiceDsl) => R;
