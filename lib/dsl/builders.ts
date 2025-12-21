import type {
  GpuConfig,
  NetworkHandle,
  PortInput,
  ServiceHandle,
  ServiceHook,
  ComposeServiceSecretConfig,
} from "../types.ts";

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
  quick: (
    hostOrContainer: number,
    container?: number,
    protocol?: "tcp" | "udp"
  ) => void;
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
// Volumes now use overloaded function signatures on ServiceDsl
// Secrets/configs/expose now use single-call helpers on ServiceDsl

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
  on: (
    service: ServiceHandle,
    condition:
      | "service_started"
      | "service_healthy"
      | "service_completed_successfully"
  ) => void;
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
  add: <R = void>(
    network: NetworkHandle,
    attachment?: (dsl: NetworkAttachmentDsl) => R
  ) => R | undefined;
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
 * DSL for configuring build options
 */
export interface BuildDsl {
  context: (value: string) => void;
  dockerfile: (value: string) => void;
  dockerfileInline: (value: string) => void;
  arg: (key: string, value: string) => void;
  ssh: (key: string, value: string) => void;
  label: (key: string, value: string) => void;
  cacheFrom: (value: string) => void;
  cacheTo: (value: string) => void;
  noCache: (value: boolean | string) => void;
  additionalContext: (name: string, path: string) => void;
  network: (value: string) => void;
  target: (value: string) => void;
  shmSize: (value: number | string) => void;
  extraHost: (host: string, address: string | string[]) => void;
  isolation: (value: string) => void;
  privileged: (value: boolean | string) => void;
  secret: (value: string | ComposeServiceSecretConfig) => void;
  tag: (value: string) => void;
  ulimit: (name: string, soft: number | string, hard?: number | string) => void;
  platform: (value: string) => void;
  pull: (value: boolean | string) => void;
  provenance: (value: string | boolean) => void;
  sbom: (value: string | boolean) => void;
  entitlement: (value: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Callback helpers (function types)
// ─────────────────────────────────────────────────────────────────────────────
export type PortsFn<R = void> = (dsl: PortsDsl) => R;
export type UlimitsFn<R = void> = (dsl: UlimitsDsl) => R;
export type DependsFn<R = void> = (dsl: DependsDsl) => R;
export type NetworkAttachmentFn<R = void> = (dsl: NetworkAttachmentDsl) => R;
export type NetworksFn<R = void> = (dsl: NetworksDsl) => R;
export type GpusFn<R = void> = (dsl: GpusDsl) => R;
export type HooksFn<R = void> = (dsl: HooksDsl) => R;
export type BuildFn<R = void> = (dsl: BuildDsl) => R;

export type NetworkResourceFn<R = void> = (dsl: NetworkResourceDsl) => R;
export type VolumeResourceFn<R = void> = (dsl: VolumeResourceDsl) => R;
export type SecretResourceFn<R = void> = (dsl: SecretResourceDsl) => R;
export type ConfigResourceFn<R = void> = (dsl: ConfigResourceDsl) => R;

// ─────────────────────────────────────────────────────────────────────────────
// Single-resource Stack builders (ergonomic variants)
// ─────────────────────────────────────────────────────────────────────────────

export interface NetworkResourceDsl {
  name: (value: string) => void;
  driver: (value: string) => void;
  driverOpt: (key: string, value: string | number) => void;
  ipamDriver: (value: string) => void;
  ipamConfig: (config: {
    subnet?: string;
    ipRange?: string;
    gateway?: string;
    auxAddresses?: Record<string, string>;
  }) => void;
  ipamOption: (key: string, value: string) => void;
  external: (externalName?: string) => void;
  internal: (value: boolean | string) => void;
  enableIpv4: (value: boolean | string) => void;
  enableIpv6: (value: boolean | string) => void;
  attachable: (value: boolean | string) => void;
  label: (key: string, value: string) => void;
  labels: (value: Record<string, string>) => void;
}

export interface VolumeResourceDsl {
  name: (value: string) => void;
  driver: (value: string) => void;
  driverOpt: (key: string, value: string | number) => void;
  external: (externalName?: string) => void;
  label: (key: string, value: string) => void;
  labels: (value: Record<string, string>) => void;
}

export interface SecretResourceDsl {
  name: (value: string) => void;
  file: (filePath: string) => void;
  environment: (envVar: string) => void;
  external: (externalName?: string) => void;
  label: (key: string, value: string) => void;
  labels: (value: Record<string, string>) => void;
  driver: (value: string) => void;
  driverOpt: (key: string, value: string | number) => void;
  templateDriver: (value: string) => void;
}

export interface ConfigResourceDsl {
  name: (value: string) => void;
  file: (filePath: string) => void;
  content: (value: string) => void;
  environment: (envVar: string) => void;
  external: (externalName?: string) => void;
  label: (key: string, value: string) => void;
  labels: (value: Record<string, string>) => void;
  templateDriver: (value: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder implementations
// ─────────────────────────────────────────────────────────────────────────────

export const createPortsBuilder = (): {
  dsl: PortsDsl;
  values: PortInput[];
} => {
  const values: PortInput[] = [];
  return {
    dsl: {
      add: (port: PortInput) => values.push(port),
      quick: (
        hostOrContainer: number,
        container?: number,
        protocol?: "tcp" | "udp"
      ) => {
        if (container === undefined) {
          // Single arg: container port only
          values.push({ target: hostOrContainer, protocol });
        } else {
          // Two args: host:container
          values.push({
            target: container,
            published: hostOrContainer,
            protocol,
          });
        }
      },
    },
    values,
  };
};

// Removed in favor of direct helpers on ServiceDsl

export const createUlimitsBuilder = (): {
  dsl: UlimitsDsl;
  values: Record<string, number | { soft: number; hard: number }>;
} => {
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

type DependsCondition =
  | "service_started"
  | "service_healthy"
  | "service_completed_successfully";

export const createDependsBuilder = (): {
  dsl: DependsDsl;
  simple: ServiceHandle[];
  conditions: Array<{ service: ServiceHandle; condition: DependsCondition }>;
} => {
  const simple: ServiceHandle[] = [];
  const conditions: Array<{
    service: ServiceHandle;
    condition: DependsCondition;
  }> = [];
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

export const createGpusBuilder = (): {
  dsl: GpusDsl;
  values: { all: boolean; devices: GpuConfig[] };
} => {
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

export const createHooksBuilder = (): {
  dsl: HooksDsl;
  values: ServiceHook[];
} => {
  const values: ServiceHook[] = [];
  return {
    dsl: {
      add: (hook: ServiceHook) => values.push(hook),
    },
    values,
  };
};
