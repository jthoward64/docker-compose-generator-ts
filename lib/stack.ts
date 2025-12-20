import { StackBuilder } from './builder/stack/stack-builder.ts';
import type { StackDsl } from './dsl/stack.ts';
import type { ComposeStack } from './compose-stack.ts';

export const stack = (builder: (dsl: StackDsl) => void): ComposeStack => {
  const stackBuilder = new StackBuilder();
  builder(stackBuilder.createDsl());
  return stackBuilder.build();
};
