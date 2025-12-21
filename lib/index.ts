// This file exports the public API of the DSL and related types.

export { stack } from "./stack.ts";
export { ComposeStack } from "./compose-stack.ts";
export type {
  ComposeFile,
  ComposeNetwork,
  ComposeService,
  NetworkHandle,
  NetworkInput,
  ServiceHandle,
  ServiceNetworkAttachment,
} from "./types.ts";
export type * from "./types.ts";
export type {
  PortsDsl,
  UlimitsDsl,
  DependsDsl,
  NetworkAttachmentDsl,
  NetworksDsl,
  GpusDsl,
  HooksDsl,
  NetworkResourceDsl,
  VolumeResourceDsl,
  SecretResourceDsl,
  ConfigResourceDsl,
  PortsFn,
  UlimitsFn,
  DependsFn,
  NetworkAttachmentFn,
  NetworksFn,
  GpusFn,
  HooksFn,
  NetworkResourceFn,
  VolumeResourceFn,
  SecretResourceFn,
  ConfigResourceFn,
} from "./dsl/builders.ts";
export type { ServiceDsl, ServiceResourceFn } from "./dsl/service.ts";
export type {
  StackDsl,
  StackFn,
  StackNetworkFn,
  StackSecretFn,
  StackConfigFn,
  StackVolumeFn,
  StackServiceFn,
} from "./dsl/stack.ts";
