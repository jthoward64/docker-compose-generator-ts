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
export type { ServiceDsl } from './dsl/service.ts';
export type { StackDsl } from './dsl/stack.ts';
