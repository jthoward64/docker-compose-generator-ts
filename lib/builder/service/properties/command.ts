import type { ServiceState } from "../service-state.ts";

export class CommandProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  set(value: string | string[]): void {
    this.state.setCommand(value);
  }
}
