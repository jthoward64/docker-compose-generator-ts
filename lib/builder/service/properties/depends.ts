import type { ServiceHandle } from '../../../types.ts';
import type { ServiceState } from '../service-state.ts';

export class DependsProperty {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  add(...services: ServiceHandle[]): void {
    for (const service of services) {
      this.state.addDependency(service.name);
    }
  }
}
