import type {
  BlkioConfig,
  Credential,
  DeployConfig,
  DevelopConfig,
  ComposePort,
  ServiceHook,
  ServiceHandle,
  Healthcheck,
  Logging,
  ComposeDevice,
  ProviderConfig,
  ServiceBuild,
} from "../types.ts";

import type { BuildFn, NetworksFn, GpusFn } from "./builders.ts";
import type {
  ConfigHandle,
  SecretHandle,
  ServiceVolumeInput,
} from "../types.ts";

export interface ServiceDsl {
  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  name: (value: string) => void;
  image: (value: string) => void;
  containerName: (value: string) => void;
  hostname: (value: string) => void;
  domainname: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Execution
  // ─────────────────────────────────────────────────────────────────────────
  command: (value: string | string[]) => void;
  entrypoint: (value: string | string[]) => void;
  workingDir: (value: string) => void;
  user: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Build
  // ─────────────────────────────────────────────────────────────────────────
  build: {
    (value: string | ServiceBuild): void;
    <R>(fn: BuildFn<R>): R;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Dependencies & Networking
  // ─────────────────────────────────────────────────────────────────────────
  depends: (
    service: ServiceHandle,
    condition?:
      | "service_started"
      | "service_healthy"
      | "service_completed_successfully"
  ) => void;
  networks: <R>(fn: NetworksFn<R>) => R;
  links: (value: string) => void;
  externalLinks: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Network configuration
  // ─────────────────────────────────────────────────────────────────────────
  networkMode: (value: string) => void;
  macAddress: (value: string) => void;
  dns: (value: string) => void;
  dnsOpt: (value: string) => void;
  dnsSearch: (value: string) => void;
  extraHosts: (host: string, address: string | string[]) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Ports & Expose
  // ─────────────────────────────────────────────────────────────────────────
  ports: (value: ComposePort) => void;
  expose: (port: number | string | Array<number | string>) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Environment & Config
  // ─────────────────────────────────────────────────────────────────────────
  environment: (key: string, value: string | number | boolean | null) => void;
  envFile: (value: string) => void;
  labels: (key: string, value: string | number | boolean | null) => void;
  labelFile: (value: string) => void;
  annotations: (key: string, value: string | number | boolean | null) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes & Storage
  // ─────────────────────────────────────────────────────────────────────────
  volumes: {
    (volume: ServiceVolumeInput): void;
    (source: string, target: string, mode?: string): void;
  };
  volumesFrom: (value: string) => void;
  tmpfs: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Secrets & Configs
  // ─────────────────────────────────────────────────────────────────────────
  secret: (secret: SecretHandle) => void;
  config: (config: ConfigHandle) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Health & Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  healthcheck: (value: Healthcheck) => void;
  restart: (value: string) => void;
  stopSignal: (value: string) => void;
  stopGracePeriod: (value: string) => void;
  postStart: (hook: ServiceHook) => void;
  preStop: (hook: ServiceHook) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Runtime
  // ─────────────────────────────────────────────────────────────────────────
  runtime: (value: string) => void;
  platform: (value: string) => void;
  init: (value: boolean) => void;
  privileged: (value: boolean) => void;
  readOnly: (value: boolean) => void;
  tty: (value: boolean) => void;
  stdinOpen: (value: boolean) => void;
  attach: (value: boolean) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Security
  // ─────────────────────────────────────────────────────────────────────────
  capAdd: (value: string) => void;
  capDrop: (value: string) => void;
  securityOpt: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Deployment & Resources
  // ─────────────────────────────────────────────────────────────────────────
  deploy: (value: DeployConfig) => void;
  develop: (value: DevelopConfig) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // CPU limits
  // ─────────────────────────────────────────────────────────────────────────
  cpuCount: (value: number) => void;
  cpuPercent: (value: number) => void;
  cpuShares: (value: number) => void;
  cpuPeriod: (value: number) => void;
  cpuQuota: (value: number) => void;
  cpuRtRuntime: (value: string | number) => void;
  cpuRtPeriod: (value: string | number) => void;
  cpus: (value: number | string) => void;
  cpuset: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Memory limits
  // ─────────────────────────────────────────────────────────────────────────
  memLimit: (value: string | number) => void;
  memReservation: (value: string | number) => void;
  memSwapLimit: (value: string | number) => void;
  memSwappiness: (value: number) => void;
  shmSize: (value: string | number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // IO limits
  // ─────────────────────────────────────────────────────────────────────────
  blkioConfig: (value: BlkioConfig) => void;
  oomKillDisable: (value: boolean) => void;
  oomScoreAdj: (value: number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────────────────
  logging: (value: Logging) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Ulimits
  // ─────────────────────────────────────────────────────────────────────────
  ulimits: (name: string, soft: number, hard?: number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Device & cgroup
  // ─────────────────────────────────────────────────────────────────────────
  devices: (value: ComposeDevice) => void;
  deviceCgroupRules: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Process
  // ─────────────────────────────────────────────────────────────────────────
  pid: (value: string) => void;
  pidsLimit: (value: number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // IPC & UTS
  // ─────────────────────────────────────────────────────────────────────────
  ipc: (value: string) => void;
  uts: (value: string) => void;
  usernsMode: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Sysctls & cgroup
  // ─────────────────────────────────────────────────────────────────────────
  sysctls: (key: string, value: string | number) => void;
  cgroupParent: (value: string) => void;
  cgroup: (value: "host" | "private") => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Isolation & storage
  // ─────────────────────────────────────────────────────────────────────────
  isolation: (value: string) => void;
  storageOpt: (key: string, value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Credentials
  // ─────────────────────────────────────────────────────────────────────────
  credentialSpec: (value: Credential) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Pull & Profiles
  // ─────────────────────────────────────────────────────────────────────────
  pullPolicy: (value: "always" | "never" | "missing" | "build") => void;
  pullRefreshAfter: (value: string) => void;
  profiles: (value: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Scaling
  // ─────────────────────────────────────────────────────────────────────────
  scale: (value: number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Extensions
  // ─────────────────────────────────────────────────────────────────────────
  extends: (value: { service: string; file?: string }) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // GPUs
  // ─────────────────────────────────────────────────────────────────────────
  gpus: <R>(fn: GpusFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Groups
  // ─────────────────────────────────────────────────────────────────────────
  groupAdd: (value: string | number) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Provider (external management)
  // ─────────────────────────────────────────────────────────────────────────
  provider: (value: ProviderConfig) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // API socket
  // ─────────────────────────────────────────────────────────────────────────
  useApiSocket: (value: boolean) => void;
}

export type ServiceResourceFn<R = void> = (dsl: ServiceDsl) => R;

export {};
