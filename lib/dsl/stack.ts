import type {
  ConfigHandle,
  NetworkHandle,
  SecretHandle,
  ServiceHandle,
  VolumeHandle,
} from "../types.ts";

import type {
  NetworkResourceFn,
  VolumeResourceFn,
  SecretResourceFn,
  ConfigResourceFn,
} from "./builders.ts";
import type { ServiceResourceFn } from "./service.ts";

export type { ServiceDsl } from "./service.ts";

export type StackNetworkFn<R = void> = (
  fn: NetworkResourceFn<R>,
) => [NetworkHandle, R];
export type StackVolumeFn<R = void> = (
  fn: VolumeResourceFn<R>,
) => [VolumeHandle, R];
export type StackSecretFn<R = void> = (
  fn: SecretResourceFn<R>,
) => [SecretHandle, R];
export type StackConfigFn<R = void> = (
  fn: ConfigResourceFn<R>,
) => [ConfigHandle, R];
export type StackServiceFn<R = void> = (
  builder: ServiceResourceFn<R>,
) => [ServiceHandle, R];

export interface StackDsl {
  name: (value: string) => void;
  /** Define a single network */
  network: <R>(fn: NetworkResourceFn<R>) => [NetworkHandle, R];
  /** Define a single volume */
  volume: <R>(fn: VolumeResourceFn<R>) => [VolumeHandle, R];
  /** Define a single secret */
  secret: <R>(fn: SecretResourceFn<R>) => [SecretHandle, R];
  /** Define a single config */
  config: <R>(fn: ConfigResourceFn<R>) => [ConfigHandle, R];
  /** Define a service */
  service: <R>(builder: ServiceResourceFn<R>) => [ServiceHandle, R];
}

export type StackFn<R = void> = (dsl: StackDsl) => R;
