import type { ServiceState } from "../service-state.ts";

export class EnvironmentProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  set(value: Record<string, string | number | boolean | null>): void {
    this.state.setEnvironment(value);
  }
}
