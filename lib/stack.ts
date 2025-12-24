import { StackBuilder } from "./builder/stack/stack-builder.ts";
import type { StackFn } from "./dsl/stack.ts";
import type { ComposeStack } from "./compose-stack.ts";

export const stack = <R>(
  builder: StackFn<R>
): R extends Promise<infer U>
  ? Promise<[ComposeStack, U]>
  : [ComposeStack, R] => {
  const stackBuilder = new StackBuilder();
  const result = builder(stackBuilder.createDsl());
  if (result instanceof Promise) {
    return result.then((res) => [stackBuilder.build(), res]) as any;
  } else {
    return [stackBuilder.build(), result] as any;
  }
};
