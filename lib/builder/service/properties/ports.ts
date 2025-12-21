import type { PortInput } from "../../../types.ts";
import type { ServiceState } from "../service-state.ts";

export class PortsProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  set(values: Array<string | number | PortInput>): void {
    this.state.setPorts(values);
  }
}
