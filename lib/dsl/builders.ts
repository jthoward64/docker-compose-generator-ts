import type {
  ConfigHandle,
  ConfigInput,
  GpuConfig,
  NetworkHandle,
  NetworkInput,
  PortInput,
  SecretHandle,
  SecretInput,
  ServiceHandle,
  ServiceHook,
  ServiceVolume,
  VolumeHandle,
  VolumeInput,
} from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Generic Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DSL for adding string items to a list
 */
export interface ListDsl {
  add: (value: string) => void;
}

/**
 * DSL for adding key-value pairs (string -> string)
 */
export interface KeyValueDsl {
  add: (key: string, value: string) => void;
}

/**
 * DSL for adding key-value pairs (string -> string | number)
 */
export interface KeyValueNumericDsl {
  add: (key: string, value: string | number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service-specific Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DSL for adding ports
 * @example
 * ports((p) => {
 *   p.add({ target: 80, published: 8080 });
 *   p.quick(80);           // container port only
 *   p.quick(8080, 80);     // host:container
 *   p.quick(8080, 80, 'udp'); // host:container/protocol
 * });
 */
export interface PortsDsl {
  /** Add a port with full configuration */
  add: (port: PortInput) => void;
  /** Quick add: (containerPort) or (hostPort, containerPort) or (hostPort, containerPort, protocol) */
  quick: (hostOrContainer: number, container?: number, protocol?: 'tcp' | 'udp') => void;
}

/**
 * DSL for adding volumes
 * @example
 * volumes((v) => {
 *   v.add({ type: 'bind', source: './data', target: '/data' });
 *   v.quick('./data', '/data');
 *   v.quick('./data', '/data', 'ro');
 * });
 */
export interface VolumesDsl {
  /** Add a volume with full configuration */
  add: (volume: ServiceVolume) => void;
  /** Quick add: source:target or source:target:mode */
  quick: (source: string, target: string, mode?: string) => void;
}

/**
 * DSL for adding secrets to a service
 */
export interface SecretsDsl {
  /** Add a secret handle */
  add: (secret: SecretHandle) => void;
}

/**
 * DSL for adding configs to a service
 */
export interface ConfigsDsl {
  /** Add a config handle */
  add: (config: ConfigHandle) => void;
}

/**
 * DSL for adding expose ports
 */
export interface ExposeDsl {
  /** Add an exposed port */
  add: (port: number) => void;
}

/**
 * DSL for adding ulimits
 */
export interface UlimitsDsl {
  /** Add a ulimit with soft/hard limits */
  add: (name: string, soft: number, hard: number) => void;
  /** Quick add: single value for both soft and hard */
  quick: (name: string, value: number) => void;
}

/**
 * DSL for adding service dependencies
 */
export interface DependsDsl {
  /** Add a simple dependency */
  add: (service: ServiceHandle) => void;
  /** Add a dependency with a condition */
  on: (service: ServiceHandle, condition: 'service_started' | 'service_healthy' | 'service_completed_successfully') => void;
}

/**
 * DSL for configuring a service's network attachment
 */
export interface NetworkAttachmentDsl {
  alias: (alias: string) => void;
  ipv4Address: (address: string) => void;
  ipv6Address: (address: string) => void;
  interfaceName: (name: string) => void;
  linkLocalIp: (ip: string) => void;
  macAddress: (address: string) => void;
  driverOpt: (key: string, value: string | number) => void;
  priority: (value: number) => void;
  gwPriority: (value: number) => void;
}

/**
 * DSL for adding networks to a service
 */
export interface NetworksDsl {
  /** Add a network with optional attachment configuration */
  add: (network: NetworkHandle, attachment?: (dsl: NetworkAttachmentDsl) => void) => void;
}

/**
 * DSL for adding GPUs
 */
export interface GpusDsl {
  /** Use all available GPUs */
  all: () => void;
  /** Add a specific GPU device configuration */
  add: (device: GpuConfig) => void;
}

/**
 * DSL for adding lifecycle hooks
 */
export interface HooksDsl {
  /** Add a lifecycle hook */
  add: (hook: ServiceHook) => void;
}

/**
 * DSL for adding group IDs
 */
export interface GroupsDsl {
  /** Add a group by name or ID */
  add: (group: string | number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Callback helpers (function types)
// ─────────────────────────────────────────────────────────────────────────────
export type ListFn = (dsl: ListDsl) => void;
export type KeyValueFn = (dsl: KeyValueDsl) => void;
export type KeyValueNumericFn = (dsl: KeyValueNumericDsl) => void;
export type PortsFn = (dsl: PortsDsl) => void;
export type VolumesFn = (dsl: VolumesDsl) => void;
export type SecretsFn = (dsl: SecretsDsl) => void;
export type ConfigsFn = (dsl: ConfigsDsl) => void;
export type ExposeFn = (dsl: ExposeDsl) => void;
export type UlimitsFn = (dsl: UlimitsDsl) => void;
export type DependsFn = (dsl: DependsDsl) => void;
export type NetworkAttachmentFn = (dsl: NetworkAttachmentDsl) => void;
export type NetworksFn = (dsl: NetworksDsl) => void;
export type GpusFn = (dsl: GpusDsl) => void;
export type HooksFn = (dsl: HooksDsl) => void;
export type GroupsFn = (dsl: GroupsDsl) => void;

export type StackNetworksFn = (dsl: StackNetworksDsl) => void;
export type StackVolumesFn = (dsl: StackVolumesDsl) => void;
export type StackSecretsFn = (dsl: StackSecretsDsl) => void;
export type StackConfigsFn = (dsl: StackConfigsDsl) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Stack-level Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DSL for defining stack networks
 */
export interface StackNetworksDsl {
  /** Add a network definition */
  add: (input: NetworkInput) => NetworkHandle;
  /** Reference an external network */
  external: (name: string, externalName?: string) => NetworkHandle;
}

/**
 * DSL for defining stack volumes
 */
export interface StackVolumesDsl {
  /** Add a volume definition */
  add: (input: VolumeInput) => VolumeHandle;
  /** Reference an external volume */
  external: (name: string) => VolumeHandle;
}

/**
 * DSL for defining stack secrets
 */
export interface StackSecretsDsl {
  /** Add a secret with full configuration */
  add: (input: SecretInput) => SecretHandle;
  /** Add a secret from a file */
  file: (name: string, filePath: string) => SecretHandle;
  /** Add a secret from an environment variable */
  environment: (name: string, envVar: string) => SecretHandle;
  /** Reference an external secret */
  external: (name: string) => SecretHandle;
}

/**
 * DSL for defining stack configs
 */
export interface StackConfigsDsl {
  /** Add a config with full configuration */
  add: (input: ConfigInput) => ConfigHandle;
  /** Add a config from a file */
  file: (name: string, filePath: string) => ConfigHandle;
  /** Add a config with inline content */
  content: (name: string, content: string) => ConfigHandle;
  /** Add a config from an environment variable */
  environment: (name: string, envVar: string) => ConfigHandle;
  /** Reference an external config */
  external: (name: string) => ConfigHandle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder implementations
// ─────────────────────────────────────────────────────────────────────────────

export const createListBuilder = (): { dsl: ListDsl; values: string[] } => {
  const values: string[] = [];
  return {
    dsl: {
      add: (value: string) => values.push(value),
    },
    values,
  };
};

export const createKeyValueBuilder = (): { dsl: KeyValueDsl; values: Record<string, string> } => {
  const values: Record<string, string> = {};
  return {
    dsl: {
      add: (key: string, value: string) => {
        values[key] = value;
      },
    },
    values,
  };
};

export const createKeyValueNumericBuilder = (): { dsl: KeyValueNumericDsl; values: Record<string, string | number> } => {
  const values: Record<string, string | number> = {};
  return {
    dsl: {
      add: (key: string, value: string | number) => {
        values[key] = value;
      },
    },
    values,
  };
};

export const createPortsBuilder = (): { dsl: PortsDsl; values: PortInput[] } => {
  const values: PortInput[] = [];
  return {
    dsl: {
      add: (port: PortInput) => values.push(port),
      quick: (hostOrContainer: number, container?: number, protocol?: 'tcp' | 'udp') => {
        if (container === undefined) {
          // Single arg: container port only
          values.push({ target: hostOrContainer, protocol });
        } else {
          // Two args: host:container
          values.push({ target: container, published: hostOrContainer, protocol });
        }
      },
    },
    values,
  };
};

export const createVolumesBuilder = (): { dsl: VolumesDsl; values: Array<string | ServiceVolume> } => {
  const values: Array<string | ServiceVolume> = [];
  return {
    dsl: {
      add: (volume: ServiceVolume) => values.push(volume),
      quick: (source: string, target: string, mode?: string) => {
        const spec = mode ? `${source}:${target}:${mode}` : `${source}:${target}`;
        values.push(spec);
      },
    },
    values,
  };
};

export const createSecretsBuilder = (): { dsl: SecretsDsl; values: SecretHandle[] } => {
  const values: SecretHandle[] = [];
  return {
    dsl: {
      add: (secret: SecretHandle) => values.push(secret),
    },
    values,
  };
};

export const createConfigsBuilder = (): { dsl: ConfigsDsl; values: ConfigHandle[] } => {
  const values: ConfigHandle[] = [];
  return {
    dsl: {
      add: (config: ConfigHandle) => values.push(config),
    },
    values,
  };
};

export const createExposeBuilder = (): { dsl: ExposeDsl; values: number[] } => {
  const values: number[] = [];
  return {
    dsl: {
      add: (port: number) => values.push(port),
    },
    values,
  };
};

export const createUlimitsBuilder = (): { dsl: UlimitsDsl; values: Record<string, number | { soft: number; hard: number }> } => {
  const values: Record<string, number | { soft: number; hard: number }> = {};
  return {
    dsl: {
      add: (name: string, soft: number, hard: number) => {
        values[name] = { soft, hard };
      },
      quick: (name: string, value: number) => {
        values[name] = value;
      },
    },
    values,
  };
};

type DependsCondition = 'service_started' | 'service_healthy' | 'service_completed_successfully';

export const createDependsBuilder = (): { dsl: DependsDsl; simple: ServiceHandle[]; conditions: Array<{ service: ServiceHandle; condition: DependsCondition }> } => {
  const simple: ServiceHandle[] = [];
  const conditions: Array<{ service: ServiceHandle; condition: DependsCondition }> = [];
  return {
    dsl: {
      add: (service: ServiceHandle) => simple.push(service),
      on: (service: ServiceHandle, condition: DependsCondition) => {
        conditions.push({ service, condition });
      },
    },
    simple,
    conditions,
  };
};

export const createGpusBuilder = (): { dsl: GpusDsl; values: { all: boolean; devices: GpuConfig[] } } => {
  const result = { all: false, devices: [] as GpuConfig[] };
  return {
    dsl: {
      all: () => {
        result.all = true;
      },
      add: (device: GpuConfig) => result.devices.push(device),
    },
    values: result,
  };
};

export const createHooksBuilder = (): { dsl: HooksDsl; values: ServiceHook[] } => {
  const values: ServiceHook[] = [];
  return {
    dsl: {
      add: (hook: ServiceHook) => values.push(hook),
    },
    values,
  };
};

export const createGroupsBuilder = (): { dsl: GroupsDsl; values: Array<string | number> } => {
  const values: Array<string | number> = [];
  return {
    dsl: {
      add: (group: string | number) => values.push(group),
    },
    values,
  };
};
