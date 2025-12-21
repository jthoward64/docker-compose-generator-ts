import type { ServiceState } from "../service-state.ts";

export class ImageProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  set(value: string): void {
    this.state.setImage(value);
  }
}
