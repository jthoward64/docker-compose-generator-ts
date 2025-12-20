export type ServiceName = string;
export type NetworkName = string;
export type VolumeName = string;
export type SecretName = string;
export type ConfigName = string;

// ─────────────────────────────────────────────────────────────────────────────
// Service network attachment
// ─────────────────────────────────────────────────────────────────────────────
export interface ServiceNetworkAttachment {
  aliases?: string[];
  ipv4Address?: string;
  ipv6Address?: string;
  interfaceName?: string;
  linkLocalIps?: string[];
  macAddress?: string;
  driverOpts?: Record<string, string | number>;
  priority?: number;
  gwPriority?: number;
}

export interface ComposeServiceNetworkConfig {
  aliases?: string[];
  ipv4_address?: string;
  ipv6_address?: string;
  interface_name?: string;
  link_local_ips?: string[];
  mac_address?: string;
  driver_opts?: Record<string, string | number>;
  priority?: number;
  gw_priority?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Healthcheck
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeHealthcheck {
  disable?: boolean | string;
  interval?: string;
  retries?: number | string;
  test?: string | string[];
  timeout?: string;
  start_period?: string;
  start_interval?: string;
}

export interface HealthcheckInput {
  disable?: boolean | string;
  interval?: string;
  retries?: number | string;
  test?: string | string[];
  timeout?: string;
  startPeriod?: string;
  startInterval?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeLogging {
  driver?: string;
  options?: Record<string, string | number | null>;
}

export interface LoggingInput {
  driver?: string;
  options?: Record<string, string | number | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ulimits
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeUlimitValue {
  soft: number | string;
  hard: number | string;
}

export type ComposeUlimits = Record<string, number | string | ComposeUlimitValue>;

// ─────────────────────────────────────────────────────────────────────────────
// Build configuration
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeBuildConfig {
  context?: string;
  dockerfile?: string;
  dockerfile_inline?: string;
  args?: Record<string, string> | string[];
  ssh?: Record<string, string> | string[];
  labels?: Record<string, string> | string[];
  cache_from?: string[];
  cache_to?: string[];
  no_cache?: boolean | string;
  additional_contexts?: Record<string, string> | string[];
  network?: string;
  target?: string;
  shm_size?: number | string;
  extra_hosts?: Record<string, string | string[]> | string[];
  isolation?: string;
  privileged?: boolean | string;
  secrets?: Array<string | ComposeServiceSecretConfig>;
  tags?: string[];
  ulimits?: ComposeUlimits;
  platforms?: string[];
  pull?: boolean | string;
  provenance?: string | boolean;
  sbom?: string | boolean;
  entitlements?: string[];
}

export type ComposeBuild = string | ComposeBuildConfig;

export interface BuildInput {
  context?: string;
  dockerfile?: string;
  dockerfileInline?: string;
  args?: Record<string, string> | string[];
  ssh?: Record<string, string> | string[];
  labels?: Record<string, string> | string[];
  cacheFrom?: string[];
  cacheTo?: string[];
  noCache?: boolean | string;
  additionalContexts?: Record<string, string> | string[];
  network?: string;
  target?: string;
  shmSize?: number | string;
  extraHosts?: Record<string, string | string[]> | string[];
  isolation?: string;
  privileged?: boolean | string;
  secrets?: Array<string | ServiceSecretInput>;
  tags?: string[];
  ulimits?: ComposeUlimits;
  platforms?: string[];
  pull?: boolean | string;
  provenance?: string | boolean;
  sbom?: string | boolean;
  entitlements?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Blkio config
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeBlkioLimit {
  path: string;
  rate: number | string;
}

export interface ComposeBlkioWeight {
  path: string;
  weight: number | string;
}

export interface ComposeBlkioConfig {
  device_read_bps?: ComposeBlkioLimit[];
  device_read_iops?: ComposeBlkioLimit[];
  device_write_bps?: ComposeBlkioLimit[];
  device_write_iops?: ComposeBlkioLimit[];
  weight?: number | string;
  weight_device?: ComposeBlkioWeight[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Credential spec
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeCredentialSpec {
  config?: string;
  file?: string;
  registry?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Depends on
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeDependsOnCondition {
  condition: 'service_started' | 'service_healthy' | 'service_completed_successfully';
  restart?: boolean | string;
  required?: boolean;
}

export type ComposeDependsOn = ServiceName[] | Record<ServiceName, ComposeDependsOnCondition>;

export interface DependsOnConditionInput {
  condition: 'service_started' | 'service_healthy' | 'service_completed_successfully';
  restart?: boolean | string;
  required?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Devices
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeDeviceMapping {
  source: string;
  target?: string;
  permissions?: string;
}

export type ComposeDevice = string | ComposeDeviceMapping;

// ─────────────────────────────────────────────────────────────────────────────
// Ports
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposePortConfig {
  name?: string;
  mode?: string;
  host_ip?: string;
  target: number | string;
  published?: number | string;
  protocol?: string;
  app_protocol?: string;
}

export type ComposePort = string | number | ComposePortConfig;

export interface PortInput {
  name?: string;
  mode?: string;
  hostIp?: string;
  target: number | string;
  published?: number | string;
  protocol?: string;
  appProtocol?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Volumes (service-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeVolumeBindOptions {
  propagation?: string;
  create_host_path?: boolean | string;
  recursive?: 'enabled' | 'disabled' | 'writable' | 'readonly';
  selinux?: 'z' | 'Z';
}

export interface ComposeVolumeVolumeOptions {
  labels?: Record<string, string> | string[];
  nocopy?: boolean | string;
  subpath?: string;
}

export interface ComposeVolumeTmpfsOptions {
  size?: number | string;
  mode?: number | string;
}

export interface ComposeVolumeImageOptions {
  subpath?: string;
}

export interface ComposeVolumeConfig {
  type: 'bind' | 'volume' | 'tmpfs' | 'cluster' | 'npipe' | 'image';
  source?: string;
  target?: string;
  read_only?: boolean | string;
  consistency?: string;
  bind?: ComposeVolumeBindOptions;
  volume?: ComposeVolumeVolumeOptions;
  tmpfs?: ComposeVolumeTmpfsOptions;
  image?: ComposeVolumeImageOptions;
}

export type ComposeServiceVolume = string | ComposeVolumeConfig;

export interface VolumeBindInput {
  propagation?: string;
  createHostPath?: boolean | string;
  recursive?: 'enabled' | 'disabled' | 'writable' | 'readonly';
  selinux?: 'z' | 'Z';
}

export interface VolumeVolumeInput {
  labels?: Record<string, string> | string[];
  nocopy?: boolean | string;
  subpath?: string;
}

export interface VolumeTmpfsInput {
  size?: number | string;
  mode?: number | string;
}

export interface VolumeImageInput {
  subpath?: string;
}

export interface ServiceVolumeInput {
  type: 'bind' | 'volume' | 'tmpfs' | 'cluster' | 'npipe' | 'image';
  source?: string;
  target?: string;
  readOnly?: boolean | string;
  consistency?: string;
  bind?: VolumeBindInput;
  volume?: VolumeVolumeInput;
  tmpfs?: VolumeTmpfsInput;
  image?: VolumeImageInput;
}

// ─────────────────────────────────────────────────────────────────────────────
// Secrets & Configs (service-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeServiceSecretConfig {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number | string;
}

export type ComposeServiceSecret = string | ComposeServiceSecretConfig;

export interface ServiceSecretInput {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number | string;
}

export interface ComposeServiceConfigConfig {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number | string;
}

export type ComposeServiceConfig = string | ComposeServiceConfigConfig;

export interface ServiceConfigInput {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number | string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployment
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeResourceLimits {
  cpus?: number | string;
  memory?: string;
  pids?: number | string;
}

export interface ComposeGenericResource {
  discrete_resource_spec?: {
    kind: string;
    value: number | string;
  };
}

export interface ComposeDeviceRequest {
  capabilities: string[];
  count?: number | string;
  device_ids?: string[];
  driver?: string;
  options?: Record<string, string> | string[];
}

export interface ComposeResourceReservations {
  cpus?: number | string;
  memory?: string;
  generic_resources?: ComposeGenericResource[];
  devices?: ComposeDeviceRequest[];
}

export interface ComposeResources {
  limits?: ComposeResourceLimits;
  reservations?: ComposeResourceReservations;
}

export interface ComposeRollbackConfig {
  parallelism?: number | string;
  delay?: string;
  failure_action?: string;
  monitor?: string;
  max_failure_ratio?: number | string;
  order?: 'start-first' | 'stop-first';
}

export interface ComposeUpdateConfig {
  parallelism?: number | string;
  delay?: string;
  failure_action?: string;
  monitor?: string;
  max_failure_ratio?: number | string;
  order?: 'start-first' | 'stop-first';
}

export interface ComposeRestartPolicy {
  condition?: string;
  delay?: string;
  max_attempts?: number | string;
  window?: string;
}

export interface ComposePlacementPreference {
  spread?: string;
}

export interface ComposePlacement {
  constraints?: string[];
  preferences?: ComposePlacementPreference[];
  max_replicas_per_node?: number | string;
}

export interface ComposeDeploy {
  mode?: string;
  endpoint_mode?: string;
  replicas?: number | string;
  labels?: Record<string, string> | string[];
  rollback_config?: ComposeRollbackConfig;
  update_config?: ComposeUpdateConfig;
  resources?: ComposeResources;
  restart_policy?: ComposeRestartPolicy;
  placement?: ComposePlacement;
}

// ─────────────────────────────────────────────────────────────────────────────
// Development (watch)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeServiceHook {
  command: string | string[];
  user?: string;
  privileged?: boolean | string;
  working_dir?: string;
  environment?: Record<string, string | number | boolean | null> | string[];
}

export interface ComposeWatchAction {
  path: string;
  action: 'rebuild' | 'sync' | 'restart' | 'sync+restart' | 'sync+exec';
  ignore?: string | string[];
  include?: string | string[];
  target?: string;
  exec?: ComposeServiceHook;
  initial_sync?: boolean;
}

export interface ComposeDevelopment {
  watch?: ComposeWatchAction[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Extends
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeExtendsConfig {
  service: string;
  file?: string;
}

export type ComposeExtends = string | ComposeExtendsConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeProvider {
  type: string;
  options?: Record<string, string | number | boolean | Array<string | number | boolean>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GPUs
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeGpuDevice {
  capabilities?: string[];
  count?: number | string;
  device_ids?: string[];
  driver?: string;
  options?: Record<string, string> | string[];
}

export type ComposeGpus = 'all' | ComposeGpuDevice[];

// ─────────────────────────────────────────────────────────────────────────────
// Env file
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeEnvFileConfig {
  path: string;
  format?: string;
  required?: boolean | string;
}

export type ComposeEnvFile = string | Array<string | ComposeEnvFileConfig>;

// ─────────────────────────────────────────────────────────────────────────────
// Full ComposeService
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeService {
  image?: string;
  build?: ComposeBuild;
  command?: string | string[] | null;
  entrypoint?: string | string[] | null;
  environment?: Record<string, string | number | boolean | null> | string[];
  env_file?: ComposeEnvFile;
  ports?: ComposePort[];
  expose?: Array<string | number>;
  volumes?: ComposeServiceVolume[];
  volumes_from?: string[];
  depends_on?: ComposeDependsOn;
  networks?: ServiceName[] | Record<NetworkName, ComposeServiceNetworkConfig | null>;
  network_mode?: string;
  healthcheck?: ComposeHealthcheck;
  logging?: ComposeLogging;
  deploy?: ComposeDeploy;
  develop?: ComposeDevelopment;
  labels?: Record<string, string> | string[];
  annotations?: Record<string, string> | string[];
  secrets?: ComposeServiceSecret[];
  configs?: ComposeServiceConfig[];
  ulimits?: ComposeUlimits;
  sysctls?: Record<string, string | number> | string[];
  devices?: ComposeDevice[];
  blkio_config?: ComposeBlkioConfig;
  credential_spec?: ComposeCredentialSpec;
  cap_add?: string[];
  cap_drop?: string[];
  cgroup?: 'host' | 'private';
  cgroup_parent?: string;
  container_name?: string;
  cpu_count?: number | string;
  cpu_percent?: number | string;
  cpu_shares?: number | string;
  cpu_quota?: number | string;
  cpu_period?: number | string;
  cpu_rt_period?: number | string;
  cpu_rt_runtime?: number | string;
  cpus?: number | string;
  cpuset?: string;
  dns?: string | string[];
  dns_opt?: string[];
  dns_search?: string | string[];
  domainname?: string;
  extends?: ComposeExtends;
  provider?: ComposeProvider;
  external_links?: string[];
  extra_hosts?: Record<string, string | string[]> | string[];
  gpus?: ComposeGpus;
  group_add?: Array<string | number>;
  hostname?: string;
  init?: boolean | string;
  ipc?: string;
  isolation?: string;
  links?: string[];
  mac_address?: string;
  mem_limit?: number | string;
  mem_reservation?: number | string;
  mem_swappiness?: number | string;
  memswap_limit?: number | string;
  oom_kill_disable?: boolean | string;
  oom_score_adj?: number | string;
  pid?: string | null;
  pids_limit?: number | string;
  platform?: string;
  post_start?: ComposeServiceHook[];
  pre_stop?: ComposeServiceHook[];
  privileged?: boolean | string;
  profiles?: string[];
  pull_policy?: string;
  pull_refresh_after?: string;
  read_only?: boolean | string;
  restart?: string;
  runtime?: string;
  scale?: number | string;
  security_opt?: string[];
  shm_size?: number | string;
  stdin_open?: boolean | string;
  stop_grace_period?: string;
  stop_signal?: string;
  storage_opt?: Record<string, string>;
  tmpfs?: string | string[];
  tty?: boolean | string;
  user?: string;
  uts?: string;
  userns_mode?: string;
  working_dir?: string;
  attach?: boolean | string;
  label_file?: string | string[];
  device_cgroup_rules?: string[];
  use_api_socket?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Networks (top-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeIpamConfig {
  subnet?: string;
  ip_range?: string;
  gateway?: string;
  aux_addresses?: Record<string, string>;
}

export interface ComposeIpam {
  driver?: string;
  config?: ComposeIpamConfig[];
  options?: Record<string, string>;
}

export interface ComposeNetwork {
  name?: string;
  driver?: string;
  driver_opts?: Record<string, string | number>;
  ipam?: ComposeIpam;
  external?: boolean | string | { name?: string };
  internal?: boolean | string;
  enable_ipv4?: boolean | string;
  enable_ipv6?: boolean | string;
  attachable?: boolean | string;
  labels?: Record<string, string> | string[];
}

export interface NetworkInput {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string | number>;
  ipam?: {
    driver?: string;
    config?: Array<{
      subnet?: string;
      ipRange?: string;
      gateway?: string;
      auxAddresses?: Record<string, string>;
    }>;
    options?: Record<string, string>;
  };
  external?: boolean | string | { name?: string };
  internal?: boolean | string;
  enableIpv4?: boolean | string;
  enableIpv6?: boolean | string;
  attachable?: boolean | string;
  labels?: Record<string, string> | string[];
}

/**
 * A reference to an external network defined outside this compose file.
 * Use this when you want to connect services to an existing network.
 */
export interface NetworkReference {
  /** The name to use locally in this compose file */
  name: string;
  /** Mark this as an external network reference (must be true) */
  external: true;
  /** The actual external network name (if different from local name) */
  externalName?: string;
}

/** Helper to check if input is a NetworkReference */
export const isNetworkReference = (
  input: NetworkInput | NetworkReference,
): input is NetworkReference => {
  return 'external' in input && input.external === true && !('driver' in input);
};

// ─────────────────────────────────────────────────────────────────────────────
// Volumes (top-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeVolume {
  name?: string;
  driver?: string;
  driver_opts?: Record<string, string | number>;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
}

export interface VolumeInput {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string | number>;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
}

export interface VolumeHandle {
  readonly name: VolumeName;
}

// ─────────────────────────────────────────────────────────────────────────────
// Secrets (top-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeSecret {
  name?: string;
  file?: string;
  environment?: string;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
  driver?: string;
  driver_opts?: Record<string, string | number>;
  template_driver?: string;
}

export interface SecretInput {
  name: string;
  file?: string;
  environment?: string;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
  driver?: string;
  driverOpts?: Record<string, string | number>;
  templateDriver?: string;
}

export interface SecretHandle {
  readonly name: SecretName;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configs (top-level)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeConfig {
  name?: string;
  file?: string;
  content?: string;
  environment?: string;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
  template_driver?: string;
}

export interface ConfigInput {
  name: string;
  file?: string;
  content?: string;
  environment?: string;
  external?: boolean | string | { name?: string };
  labels?: Record<string, string> | string[];
  templateDriver?: string;
}

export interface ConfigHandle {
  readonly name: ConfigName;
}

// ─────────────────────────────────────────────────────────────────────────────
// Include
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeIncludeConfig {
  path: string | string[];
  env_file?: string | string[];
  project_directory?: string;
}

export type ComposeInclude = string | ComposeIncludeConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Models (AI)
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeModel {
  name?: string;
  model: string;
  context_size?: number;
  runtime_flags?: string[];
}

export interface ModelInput {
  name: string;
  model: string;
  contextSize?: number;
  runtimeFlags?: string[];
}

export interface ModelHandle {
  readonly name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full ComposeFile
// ─────────────────────────────────────────────────────────────────────────────
export interface ComposeFile {
  version?: string;
  name?: string;
  include?: ComposeInclude[];
  services?: Record<ServiceName, ComposeService>;
  networks?: Record<NetworkName, ComposeNetwork | null>;
  volumes?: Record<VolumeName, ComposeVolume | null>;
  secrets?: Record<SecretName, ComposeSecret>;
  configs?: Record<ConfigName, ComposeConfig>;
  models?: Record<string, ComposeModel>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handles
// ─────────────────────────────────────────────────────────────────────────────
export interface ServiceHandle {
  readonly name: ServiceName;
}

export interface NetworkHandle {
  readonly name: NetworkName;
}

// ─────────────────────────────────────────────────────────────────────────────
// DSL type aliases for cleaner API
// ─────────────────────────────────────────────────────────────────────────────
export type BlkioConfig = ComposeBlkioConfig;
export type Credential = ComposeCredentialSpec;
export type DependencyConfig = DependsOnConditionInput;
export type DeployConfig = ComposeDeploy;
export type DevelopConfig = ComposeDevelopment;
export type GpuConfig = ComposeGpuDevice;
export type Healthcheck = HealthcheckInput;
export type Logging = LoggingInput;
export type ProviderConfig = ComposeProvider;
export type ServiceBuild = ComposeBuild | BuildInput;
export type ServiceHook = ComposeServiceHook;
export type ServiceVolume = ComposeServiceVolume | ServiceVolumeInput;
export type Ulimits = ComposeUlimits;
