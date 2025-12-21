import type {
  BlkioConfig,
  Credential,
  DeployConfig,
  DevelopConfig,
  Healthcheck,
  Logging,
  ProviderConfig,
  ServiceBuild,
} from "../types.ts";

import type {
  ListFn,
  KeyValueFn,
  KeyValueNumericFn,
  PortsFn,
  UlimitsFn,
  DependsFn,
  NetworksFn,
  GpusFn,
  HooksFn,
  GroupsFn,
} from "./builders.ts";
import type { ConfigHandle, SecretHandle, ServiceVolumeInput } from "../types.ts";

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
  build: (value: string | ServiceBuild) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Dependencies & Networking
  // ─────────────────────────────────────────────────────────────────────────
  depends: <R>(fn: DependsFn<R>) => R;
  networks: <R>(fn: NetworksFn<R>) => R;
  links: <R>(fn: ListFn<R>) => R;
  externalLinks: <R>(fn: ListFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Network configuration
  // ─────────────────────────────────────────────────────────────────────────
  networkMode: (value: string) => void;
  macAddress: (value: string) => void;
  dns: <R>(fn: ListFn<R>) => R;
  dnsOpt: <R>(fn: ListFn<R>) => R;
  dnsSearch: <R>(fn: ListFn<R>) => R;
  extraHosts: <R>(fn: KeyValueFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Ports & Expose
  // ─────────────────────────────────────────────────────────────────────────
  ports: <R>(fn: PortsFn<R>) => R;
  expose: (port: number | string | Array<number | string>) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Environment & Config
  // ─────────────────────────────────────────────────────────────────────────
  environment: <R>(fn: KeyValueFn<R>) => R;
  envFile: <R>(fn: ListFn<R>) => R;
  labels: <R>(fn: KeyValueFn<R>) => R;
  labelFile: <R>(fn: ListFn<R>) => R;
  annotations: <R>(fn: KeyValueFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes & Storage
  // ─────────────────────────────────────────────────────────────────────────
  volumes: {
    (volume: ServiceVolumeInput): void;
    (source: string, target: string, mode?: string): void;
  };
  volumesFrom: <R>(fn: ListFn<R>) => R;
  tmpfs: <R>(fn: ListFn<R>) => R;

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
  postStart: <R>(fn: HooksFn<R>) => R;
  preStop: <R>(fn: HooksFn<R>) => R;

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
  capAdd: <R>(fn: ListFn<R>) => R;
  capDrop: <R>(fn: ListFn<R>) => R;
  securityOpt: <R>(fn: ListFn<R>) => R;

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
  ulimits: <R>(fn: UlimitsFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Device & cgroup
  // ─────────────────────────────────────────────────────────────────────────
  devices: <R>(fn: ListFn<R>) => R;
  deviceCgroupRules: <R>(fn: ListFn<R>) => R;

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
  sysctls: <R>(fn: KeyValueNumericFn<R>) => R;
  cgroupParent: (value: string) => void;
  cgroup: (value: "host" | "private") => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Isolation & storage
  // ─────────────────────────────────────────────────────────────────────────
  isolation: (value: string) => void;
  storageOpt: <R>(fn: KeyValueFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Credentials
  // ─────────────────────────────────────────────────────────────────────────
  credentialSpec: (value: Credential) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Pull & Profiles
  // ─────────────────────────────────────────────────────────────────────────
  pullPolicy: (value: "always" | "never" | "missing" | "build") => void;
  pullRefreshAfter: (value: string) => void;
  profiles: <R>(fn: ListFn<R>) => R;

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
  groupAdd: <R>(fn: GroupsFn<R>) => R;

  // ─────────────────────────────────────────────────────────────────────────
  // Provider (external management)
  // ─────────────────────────────────────────────────────────────────────────
  provider: (value: ProviderConfig) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // API socket
  // ─────────────────────────────────────────────────────────────────────────
  useApiSocket: (value: boolean) => void;
}

export type ServiceFn<R = void> = (dsl: ServiceDsl) => R;

export {};
