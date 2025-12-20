import type {
  BlkioConfig,
  Credential,
  DeployConfig,
  DevelopConfig,
  Healthcheck,
  Logging,
  ProviderConfig,
  ServiceBuild,
} from '../types.ts';

import type {
  ConfigsDsl,
  DependsDsl,
  ExposeDsl,
  GpusDsl,
  GroupsDsl,
  HooksDsl,
  KeyValueDsl,
  KeyValueNumericDsl,
  ListDsl,
  NetworksDsl,
  PortsDsl,
  SecretsDsl,
  UlimitsDsl,
  VolumesDsl,
} from './builders.ts';

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
  depends: (fn: (dsl: DependsDsl) => void) => void;
  networks: (fn: (dsl: NetworksDsl) => void) => void;
  links: (fn: (dsl: ListDsl) => void) => void;
  externalLinks: (fn: (dsl: ListDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Network configuration
  // ─────────────────────────────────────────────────────────────────────────
  networkMode: (value: string) => void;
  macAddress: (value: string) => void;
  dns: (fn: (dsl: ListDsl) => void) => void;
  dnsOpt: (fn: (dsl: ListDsl) => void) => void;
  dnsSearch: (fn: (dsl: ListDsl) => void) => void;
  extraHosts: (fn: (dsl: KeyValueDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Ports & Expose
  // ─────────────────────────────────────────────────────────────────────────
  ports: (fn: (dsl: PortsDsl) => void) => void;
  expose: (fn: (dsl: ExposeDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Environment & Config
  // ─────────────────────────────────────────────────────────────────────────
  environment: (fn: (dsl: KeyValueDsl) => void) => void;
  envFile: (fn: (dsl: ListDsl) => void) => void;
  labels: (fn: (dsl: KeyValueDsl) => void) => void;
  labelFile: (fn: (dsl: ListDsl) => void) => void;
  annotations: (fn: (dsl: KeyValueDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes & Storage
  // ─────────────────────────────────────────────────────────────────────────
  volumes: (fn: (dsl: VolumesDsl) => void) => void;
  volumesFrom: (fn: (dsl: ListDsl) => void) => void;
  tmpfs: (fn: (dsl: ListDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Secrets & Configs
  // ─────────────────────────────────────────────────────────────────────────
  secrets: (fn: (dsl: SecretsDsl) => void) => void;
  configs: (fn: (dsl: ConfigsDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Health & Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  healthcheck: (value: Healthcheck) => void;
  restart: (value: string) => void;
  stopSignal: (value: string) => void;
  stopGracePeriod: (value: string) => void;
  postStart: (fn: (dsl: HooksDsl) => void) => void;
  preStop: (fn: (dsl: HooksDsl) => void) => void;

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
  capAdd: (fn: (dsl: ListDsl) => void) => void;
  capDrop: (fn: (dsl: ListDsl) => void) => void;
  securityOpt: (fn: (dsl: ListDsl) => void) => void;

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
  ulimits: (fn: (dsl: UlimitsDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Device & cgroup
  // ─────────────────────────────────────────────────────────────────────────
  devices: (fn: (dsl: ListDsl) => void) => void;
  deviceCgroupRules: (fn: (dsl: ListDsl) => void) => void;

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
  sysctls: (fn: (dsl: KeyValueNumericDsl) => void) => void;
  cgroupParent: (value: string) => void;
  cgroup: (value: 'host' | 'private') => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Isolation & storage
  // ─────────────────────────────────────────────────────────────────────────
  isolation: (value: string) => void;
  storageOpt: (fn: (dsl: KeyValueDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Credentials
  // ─────────────────────────────────────────────────────────────────────────
  credentialSpec: (value: Credential) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Pull & Profiles
  // ─────────────────────────────────────────────────────────────────────────
  pullPolicy: (value: 'always' | 'never' | 'missing' | 'build') => void;
  pullRefreshAfter: (value: string) => void;
  profiles: (fn: (dsl: ListDsl) => void) => void;

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
  gpus: (fn: (dsl: GpusDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Groups
  // ─────────────────────────────────────────────────────────────────────────
  groupAdd: (fn: (dsl: GroupsDsl) => void) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Provider (external management)
  // ─────────────────────────────────────────────────────────────────────────
  provider: (value: ProviderConfig) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // API socket
  // ─────────────────────────────────────────────────────────────────────────
  useApiSocket: (value: boolean) => void;
}

export type ServiceFn = (dsl: ServiceDsl) => void;

export {};