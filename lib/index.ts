// This file exports the public API of the DSL and related types.

export { stack } from './stack.ts';
export { ComposeStack } from './compose-stack.ts';
export type {
	ComposeFile,
	ComposeNetwork,
	ComposeService,
	NetworkHandle,
	NetworkInput,
	ServiceHandle,
	ServiceNetworkAttachment,
} from './types.ts';
export type * from './types.ts';
export type {
	ListDsl,
	KeyValueDsl,
	KeyValueNumericDsl,
	PortsDsl,
	VolumesDsl,
	SecretsDsl,
	ConfigsDsl,
	ExposeDsl,
	UlimitsDsl,
	DependsDsl,
	NetworkAttachmentDsl,
	NetworksDsl,
	GpusDsl,
	HooksDsl,
	GroupsDsl,
	StackNetworksDsl,
	StackVolumesDsl,
	StackSecretsDsl,
	StackConfigsDsl,
	ListFn,
	KeyValueFn,
	KeyValueNumericFn,
	PortsFn,
	VolumesFn,
	SecretsFn,
	ConfigsFn,
	ExposeFn,
	UlimitsFn,
	DependsFn,
	NetworkAttachmentFn,
	NetworksFn,
	GpusFn,
	HooksFn,
	GroupsFn,
	StackNetworksFn,
	StackVolumesFn,
	StackSecretsFn,
	StackConfigsFn,
} from './dsl/builders.ts';
export type { ServiceDsl, ServiceFn } from './dsl/service.ts';
export type { StackDsl, StackFn, StackServiceFn } from './dsl/stack.ts';
