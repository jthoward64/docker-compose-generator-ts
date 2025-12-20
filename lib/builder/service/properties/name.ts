import type { ServiceState } from '../service-state.ts';

export class NameProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  set(value: string): void {
    this.state.setName(value);
  }
}
