import { StackBuilder } from "./builder/stack/stack-builder.ts";
import type { StackFn } from "./dsl/stack.ts";
import type { ComposeStack } from "./compose-stack.ts";

export const stack = <R>(builder: StackFn<R>): [ComposeStack, R] => {
  const stackBuilder = new StackBuilder();
  const result = builder(stackBuilder.createDsl());
  return [stackBuilder.build(), result];
};
