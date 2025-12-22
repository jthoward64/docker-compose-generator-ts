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

export interface StackDsl {
  name: (value: string) => void;
  /** Define a single network */
  network: <R>(
    fn: NetworkResourceFn<R>
  ) => R extends Promise<infer U>
    ? Promise<[NetworkHandle, U]>
    : [NetworkHandle, R];
  /** Define a single volume */
  volume: <R>(
    fn: VolumeResourceFn<R>
  ) => R extends Promise<infer U>
    ? Promise<[VolumeHandle, U]>
    : [VolumeHandle, R];
  /** Define a single secret */
  secret: <R>(
    fn: SecretResourceFn<R>
  ) => R extends Promise<infer U>
    ? Promise<[SecretHandle, U]>
    : [SecretHandle, R];
  /** Define a single config */
  config: <R>(
    fn: ConfigResourceFn<R>
  ) => R extends Promise<infer U>
    ? Promise<[ConfigHandle, U]>
    : [ConfigHandle, R];
  /** Define a service */
  service: <R>(
    builder: ServiceResourceFn<R>
  ) => R extends Promise<infer U>
    ? Promise<[ServiceHandle, U]>
    : [ServiceHandle, R];
}

export type StackFn<R = void> = (dsl: StackDsl) => R;
