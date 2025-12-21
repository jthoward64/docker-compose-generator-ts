import type {
  ComposeBlkioConfig,
  ComposeBuild,
  ComposeCredentialSpec,
  ComposeDependsOn,
  ComposeDependsOnCondition,
  ComposeDeploy,
  ComposeDevelopment,
  ComposeDevice,
  ComposeEnvFile,
  ComposeExtends,
  ComposeGpus,
  ComposeHealthcheck,
  ComposeLogging,
  ComposePort,
  ComposePullPolicy,
  ComposeProvider,
  ComposeService,
  ComposeServiceConfig,
  ComposeServiceNetworkConfig,
  ComposeServiceSecret,
  ComposeServiceVolume,
  ComposeUlimits,
  DependsOnConditionInput,
  ServiceName,
} from '../../types.ts';

type Pruned<T> = { [K in keyof T as T[K] extends undefined ? never : K]: T[K] };

const pruneUndefined = <T extends object>(value: T): Pruned<T> => {
  const result = { ...value } as Record<string, unknown>;
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });
  return result as Pruned<T>;
};

export class ServiceState {
  private nameValue: ServiceName = '';

  // Core
  private imageValue?: string;
  private buildValue?: ComposeBuild;
  private commandValue?: string | string[] | null;
  private entrypointValue?: string | string[] | null;
  private workingDirValue?: string;

  // Environment
  private environmentValue?: Record<string, string | number | boolean | null> | string[];
  private envFileValue?: ComposeEnvFile;

  // Networking
  private networksMap = new Map<string, ComposeServiceNetworkConfig | null>();
  private networkModeValue?: string;
  private portsValue?: ComposePort[];
  private exposeValue?: Array<string | number>;
  private dnsValue?: string | string[];
  private dnsOptValue?: string[];
  private dnsSearchValue?: string | string[];
  private extraHostsValue?: Record<string, string | string[]> | string[];
  private hostnameValue?: string;
  private domainnameValue?: string;
  private macAddressValue?: string;
  private linksValue?: string[];
  private externalLinksValue?: string[];

  // Dependencies
  private dependsOnValue?: ComposeDependsOn;

  // Volumes
  private volumesValue?: ComposeServiceVolume[];
  private volumesFromValue?: string[];
  private tmpfsValue?: string | string[];

  // Health
  private healthcheckValue?: ComposeHealthcheck;

  // Logging
  private loggingValue?: ComposeLogging;

  // Deploy
  private deployValue?: ComposeDeploy;

  // Development
  private developValue?: ComposeDevelopment;

  // Labels & Annotations
  private labelsValue?: Record<string, string> | string[];
  private annotationsValue?: Record<string, string> | string[];
  private labelFileValue?: string | string[];

  // Secrets & Configs
  private secretsValue?: ComposeServiceSecret[];
  private configsValue?: ComposeServiceConfig[];

  // Resource limits
  private ulimitsValue?: ComposeUlimits;
  private sysctlsValue?: Record<string, string | number> | string[];
  private blkioConfigValue?: ComposeBlkioConfig;
  private cpuCountValue?: number | string;
  private cpuPercentValue?: number | string;
  private cpuSharesValue?: number | string;
  private cpuQuotaValue?: number | string;
  private cpuPeriodValue?: number | string;
  private cpuRtPeriodValue?: number | string;
  private cpuRtRuntimeValue?: number | string;
  private cpusValue?: number | string;
  private cpusetValue?: string;
  private memLimitValue?: number | string;
  private memReservationValue?: number | string;
  private memSwappinessValue?: number | string;
  private memswapLimitValue?: number | string;
  private pidsLimitValue?: number | string;
  private shmSizeValue?: number | string;
  private oomKillDisableValue?: boolean | string;
  private oomScoreAdjValue?: number | string;

  // Devices & capabilities
  private devicesValue?: ComposeDevice[];
  private deviceCgroupRulesValue?: string[];
  private capAddValue?: string[];
  private capDropValue?: string[];
  private gpusValue?: ComposeGpus;

  // Security
  private credentialSpecValue?: ComposeCredentialSpec;
  private privilegedValue?: boolean | string;
  private readOnlyValue?: boolean | string;
  private securityOptValue?: string[];
  private userValue?: string;
  private groupAddValue?: Array<string | number>;
  private usernsMode?: string;

  // Process/container
  private containerNameValue?: string;
  private initValue?: boolean | string;
  private ipcValue?: string;
  private isolationValue?: string;
  private pidValue?: string | null;
  private platformValue?: string;
  private restartValue?: string;
  private runtimeValue?: string;
  private scaleValue?: number | string;
  private stopGracePeriodValue?: string;
  private stopSignalValue?: string;
  private storageOptValue?: Record<string, string | number>;
  private ttyValue?: boolean | string;
  private stdinOpenValue?: boolean | string;
  private utsValue?: string;

  // Cgroup
  private cgroupValue?: 'host' | 'private';
  private cgroupParentValue?: string;

  // Extends & Provider
  private extendsValue?: ComposeExtends;
  private providerValue?: ComposeProvider;

  // Profiles & policies
  private profilesValue?: string[];
  private pullPolicyValue?: ComposePullPolicy;
  private pullRefreshAfterValue?: string;
  private attachValue?: boolean | string;
  private useApiSocketValue?: boolean;

  // Lifecycle hooks
  private postStartValue?: ComposeService['post_start'];
  private preStopValue?: ComposeService['pre_stop'];

  get name(): ServiceName {
    return this.nameValue;
  }

  setName(value: ServiceName): void {
    this.nameValue = value;
  }

  // Core setters
  setImage(value: string): void {
    this.imageValue = value;
  }

  setBuild(value: ComposeBuild): void {
    this.buildValue = value;
  }

  setCommand(value: string | string[] | null): void {
    this.commandValue = value;
  }

  setEntrypoint(value: string | string[] | null): void {
    this.entrypointValue = value;
  }

  setWorkingDir(value: string): void {
    this.workingDirValue = value;
  }

  // Environment setters
  setEnvironment(value: Record<string, string | number | boolean | null> | string[]): void {
    this.environmentValue = Array.isArray(value) ? [...value] : { ...value };
  }

  setEnvFile(value: ComposeEnvFile): void {
    this.envFileValue = value;
  }

  // Network setters
  setNetwork(name: string, config: ComposeServiceNetworkConfig | null): void {
    this.networksMap.set(name, config);
  }

  setNetworkMode(value: string): void {
    this.networkModeValue = value;
  }

  setPorts(values: ComposePort[]): void {
    this.portsValue = [...values];
  }

  setExpose(values: Array<string | number>): void {
    this.exposeValue = [...values];
  }

  setDns(value: string | string[]): void {
    this.dnsValue = value;
  }

  setDnsOpt(value: string[]): void {
    this.dnsOptValue = [...value];
  }

  setDnsSearch(value: string | string[]): void {
    this.dnsSearchValue = value;
  }

  setExtraHosts(value: Record<string, string | string[]> | string[]): void {
    this.extraHostsValue = value;
  }

  setHostname(value: string): void {
    this.hostnameValue = value;
  }

  setDomainname(value: string): void {
    this.domainnameValue = value;
  }

  setMacAddress(value: string): void {
    this.macAddressValue = value;
  }

  setLinks(value: string[]): void {
    this.linksValue = [...value];
  }

  setExternalLinks(value: string[]): void {
    this.externalLinksValue = [...value];
  }

  // Dependencies
  setDependsOn(value: ComposeDependsOn): void {
    this.dependsOnValue = value;
  }

  addDependency(name: ServiceName): void {
    if (!this.dependsOnValue) {
      this.dependsOnValue = [];
    }
    if (Array.isArray(this.dependsOnValue)) {
      this.dependsOnValue.push(name);
    }
  }

  addDependsOn(name: ServiceName, config?: DependsOnConditionInput): void {
    if (!config) {
      this.addDependency(name);
      return;
    }
    // Convert to record format if currently an array
    if (Array.isArray(this.dependsOnValue)) {
      const newRecord: Record<ServiceName, ComposeDependsOnCondition> = {};
      for (const dep of this.dependsOnValue) {
        newRecord[dep] = { condition: 'service_started' };
      }
      this.dependsOnValue = newRecord;
    }
    if (!this.dependsOnValue) {
      this.dependsOnValue = {};
    }
    const dependsOnRecord = this.dependsOnValue as Record<ServiceName, ComposeDependsOnCondition>;
    const condition: ComposeDependsOnCondition = { condition: config.condition };
    if (config.restart !== undefined) condition.restart = config.restart;
    if (config.required !== undefined) condition.required = config.required;
    dependsOnRecord[name] = condition;
  }

  // Volumes
  setVolumes(value: ComposeServiceVolume[]): void {
    this.volumesValue = [...value];
  }

  setVolumesFrom(value: string[]): void {
    this.volumesFromValue = [...value];
  }

  setTmpfs(value: string | string[]): void {
    this.tmpfsValue = value;
  }

  // Health
  setHealthcheck(value: ComposeHealthcheck): void {
    this.healthcheckValue = value;
  }

  // Logging
  setLogging(value: ComposeLogging): void {
    this.loggingValue = value;
  }

  // Deploy
  setDeploy(value: ComposeDeploy): void {
    this.deployValue = value;
  }

  // Development
  setDevelop(value: ComposeDevelopment): void {
    this.developValue = value;
  }

  // Labels
  setLabels(value: Record<string, string> | string[]): void {
    this.labelsValue = value;
  }

  setAnnotations(value: Record<string, string> | string[]): void {
    this.annotationsValue = value;
  }

  setLabelFile(value: string | string[]): void {
    this.labelFileValue = value;
  }

  // Secrets & Configs
  setSecrets(value: ComposeServiceSecret[]): void {
    this.secretsValue = [...value];
  }

  setConfigs(value: ComposeServiceConfig[]): void {
    this.configsValue = [...value];
  }

  // Resource limits
  setUlimits(value: ComposeUlimits): void {
    this.ulimitsValue = value;
  }

  setSysctls(value: Record<string, string | number> | string[]): void {
    this.sysctlsValue = value;
  }

  setBlkioConfig(value: ComposeBlkioConfig): void {
    this.blkioConfigValue = value;
  }

  setCpuCount(value: number | string): void {
    this.cpuCountValue = value;
  }

  setCpuPercent(value: number | string): void {
    this.cpuPercentValue = value;
  }

  setCpuShares(value: number | string): void {
    this.cpuSharesValue = value;
  }

  setCpuQuota(value: number | string): void {
    this.cpuQuotaValue = value;
  }

  setCpuPeriod(value: number | string): void {
    this.cpuPeriodValue = value;
  }

  setCpuRtPeriod(value: number | string): void {
    this.cpuRtPeriodValue = value;
  }

  setCpuRtRuntime(value: number | string): void {
    this.cpuRtRuntimeValue = value;
  }

  setCpus(value: number | string): void {
    this.cpusValue = value;
  }

  setCpuset(value: string): void {
    this.cpusetValue = value;
  }

  setMemLimit(value: number | string): void {
    this.memLimitValue = value;
  }

  setMemReservation(value: number | string): void {
    this.memReservationValue = value;
  }

  setMemSwappiness(value: number | string): void {
    this.memSwappinessValue = value;
  }

  setMemswapLimit(value: number | string): void {
    this.memswapLimitValue = value;
  }

  setPidsLimit(value: number | string): void {
    this.pidsLimitValue = value;
  }

  setShmSize(value: number | string): void {
    this.shmSizeValue = value;
  }

  setOomKillDisable(value: boolean | string): void {
    this.oomKillDisableValue = value;
  }

  setOomScoreAdj(value: number | string): void {
    this.oomScoreAdjValue = value;
  }

  // Devices
  setDevices(value: ComposeDevice[]): void {
    this.devicesValue = [...value];
  }

  setDeviceCgroupRules(value: string[]): void {
    this.deviceCgroupRulesValue = [...value];
  }

  setCapAdd(value: string[]): void {
    this.capAddValue = [...value];
  }

  setCapDrop(value: string[]): void {
    this.capDropValue = [...value];
  }

  setGpus(value: ComposeGpus): void {
    this.gpusValue = value;
  }

  // Security
  setCredentialSpec(value: ComposeCredentialSpec): void {
    this.credentialSpecValue = value;
  }

  setPrivileged(value: boolean | string): void {
    this.privilegedValue = value;
  }

  setReadOnly(value: boolean | string): void {
    this.readOnlyValue = value;
  }

  setSecurityOpt(value: string[]): void {
    this.securityOptValue = [...value];
  }

  setUser(value: string): void {
    this.userValue = value;
  }

  setGroupAdd(value: Array<string | number>): void {
    this.groupAddValue = [...value];
  }

  setUsernsMode(value: string): void {
    this.usernsMode = value;
  }

  // Container/process
  setContainerName(value: string): void {
    this.containerNameValue = value;
  }

  setInit(value: boolean | string): void {
    this.initValue = value;
  }

  setIpc(value: string): void {
    this.ipcValue = value;
  }

  setIsolation(value: string): void {
    this.isolationValue = value;
  }

  setPid(value: string | null): void {
    this.pidValue = value;
  }

  setPlatform(value: string): void {
    this.platformValue = value;
  }

  setRestart(value: string): void {
    this.restartValue = value;
  }

  setRuntime(value: string): void {
    this.runtimeValue = value;
  }

  setScale(value: number | string): void {
    this.scaleValue = value;
  }

  setStopGracePeriod(value: string): void {
    this.stopGracePeriodValue = value;
  }

  setStopSignal(value: string): void {
    this.stopSignalValue = value;
  }

  setStorageOpt(value: Record<string, string | number>): void {
    this.storageOptValue = { ...value };
  }

  setTty(value: boolean | string): void {
    this.ttyValue = value;
  }

  setStdinOpen(value: boolean | string): void {
    this.stdinOpenValue = value;
  }

  setUts(value: string): void {
    this.utsValue = value;
  }

  // Cgroup
  setCgroup(value: 'host' | 'private'): void {
    this.cgroupValue = value;
  }

  setCgroupParent(value: string): void {
    this.cgroupParentValue = value;
  }

  // Extends & Provider
  setExtends(value: ComposeExtends): void {
    this.extendsValue = value;
  }

  setProvider(value: ComposeProvider): void {
    this.providerValue = value;
  }

  // Profiles & policies
  setProfiles(value: string[]): void {
    this.profilesValue = [...value];
  }

  setPullPolicy(value: ComposePullPolicy): void {
    this.pullPolicyValue = value;
  }

  setPullRefreshAfter(value: string): void {
    this.pullRefreshAfterValue = value;
  }

  setAttach(value: boolean | string): void {
    this.attachValue = value;
  }

  setUseApiSocket(value: boolean): void {
    this.useApiSocketValue = value;
  }

  // Lifecycle hooks
  setPostStart(value: ComposeService['post_start']): void {
    this.postStartValue = value;
  }

  setPreStop(value: ComposeService['pre_stop']): void {
    this.preStopValue = value;
  }

  previewComposeService(): ComposeService {
    return {
      image: this.imageValue,
      build: this.buildValue,
      command: this.commandValue,
      entrypoint: this.entrypointValue,
      working_dir: this.workingDirValue,
      environment: this.environmentValue,
      env_file: this.envFileValue,
      networks: this.networksMap.size
        ? Object.fromEntries(this.networksMap.entries())
        : undefined,
      network_mode: this.networkModeValue,
      ports: this.portsValue,
      expose: this.exposeValue,
      dns: this.dnsValue,
      dns_opt: this.dnsOptValue,
      dns_search: this.dnsSearchValue,
      extra_hosts: this.extraHostsValue,
      hostname: this.hostnameValue,
      domainname: this.domainnameValue,
      mac_address: this.macAddressValue,
      links: this.linksValue,
      external_links: this.externalLinksValue,
      depends_on: this.dependsOnValue,
      volumes: this.volumesValue,
      volumes_from: this.volumesFromValue,
      tmpfs: this.tmpfsValue,
      healthcheck: this.healthcheckValue,
      logging: this.loggingValue,
      deploy: this.deployValue,
      develop: this.developValue,
      labels: this.labelsValue,
      annotations: this.annotationsValue,
      label_file: this.labelFileValue,
      secrets: this.secretsValue,
      configs: this.configsValue,
      ulimits: this.ulimitsValue,
      sysctls: this.sysctlsValue,
      blkio_config: this.blkioConfigValue,
      cpu_count: this.cpuCountValue,
      cpu_percent: this.cpuPercentValue,
      cpu_shares: this.cpuSharesValue,
      cpu_quota: this.cpuQuotaValue,
      cpu_period: this.cpuPeriodValue,
      cpu_rt_period: this.cpuRtPeriodValue,
      cpu_rt_runtime: this.cpuRtRuntimeValue,
      cpus: this.cpusValue,
      cpuset: this.cpusetValue,
      mem_limit: this.memLimitValue,
      mem_reservation: this.memReservationValue,
      mem_swappiness: this.memSwappinessValue,
      memswap_limit: this.memswapLimitValue,
      pids_limit: this.pidsLimitValue,
      shm_size: this.shmSizeValue,
      oom_kill_disable: this.oomKillDisableValue,
      oom_score_adj: this.oomScoreAdjValue,
      devices: this.devicesValue,
      device_cgroup_rules: this.deviceCgroupRulesValue,
      cap_add: this.capAddValue,
      cap_drop: this.capDropValue,
      gpus: this.gpusValue,
      credential_spec: this.credentialSpecValue,
      privileged: this.privilegedValue,
      read_only: this.readOnlyValue,
      security_opt: this.securityOptValue,
      user: this.userValue,
      group_add: this.groupAddValue,
      userns_mode: this.usernsMode,
      container_name: this.containerNameValue,
      init: this.initValue,
      ipc: this.ipcValue,
      isolation: this.isolationValue,
      pid: this.pidValue,
      platform: this.platformValue,
      restart: this.restartValue,
      runtime: this.runtimeValue,
      scale: this.scaleValue,
      stop_grace_period: this.stopGracePeriodValue,
      stop_signal: this.stopSignalValue,
      storage_opt: this.storageOptValue,
      tty: this.ttyValue,
      stdin_open: this.stdinOpenValue,
      uts: this.utsValue,
      cgroup: this.cgroupValue,
      cgroup_parent: this.cgroupParentValue,
      extends: this.extendsValue,
      provider: this.providerValue,
      profiles: this.profilesValue,
      pull_policy: this.pullPolicyValue,
      pull_refresh_after: this.pullRefreshAfterValue,
      attach: this.attachValue,
      use_api_socket: this.useApiSocketValue,
      post_start: this.postStartValue,
      pre_stop: this.preStopValue,
    } as ComposeService;
  }

  validationSnapshot(): ComposeService & { name: ServiceName } {
    return { ...this.previewComposeService(), name: this.nameValue } as ComposeService & { name: ServiceName };
  }

  finalize(): ComposeService {
    return pruneUndefined(this.previewComposeService()) as ComposeService;
  }
}
