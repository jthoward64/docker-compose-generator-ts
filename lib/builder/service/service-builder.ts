import { ZodError } from 'zod';

import type {
  BlkioConfig,
  ComposeBuild,
  ComposeCredentialSpec,
  ComposeDeploy,
  ComposeDevelopment,
  ComposeVolumeBindOptions,
  ComposeVolumeConfig,
  ComposeGpuDevice,
  ComposePullPolicy,
  ComposeProvider,
  ComposeService,
  ComposeServiceConfig,
  ComposeServiceSecret,
  ComposeServiceVolume,
  ComposeUlimits,
  HealthcheckInput,
  LoggingInput,
  NetworkHandle,
  ServiceHandle,
  ServiceNetworkAttachment,
  ServiceVolumeInput,
} from '../../types.ts';
import {
  createDependsBuilder,
  createGpusBuilder,
  createGroupsBuilder,
  createHooksBuilder,
  createKeyValueBuilder,
  createKeyValueNumericBuilder,
  createListBuilder,
  createPortsBuilder,
  createUlimitsBuilder,
  type DependsDsl,
  type GpusDsl,
  type GroupsDsl,
  type HooksDsl,
  type KeyValueDsl,
  type KeyValueNumericDsl,
  type ListDsl,
  type NetworkAttachmentDsl,
  type NetworksDsl,
  type PortsDsl,
  type UlimitsDsl,
} from '../../dsl/builders.ts';
import { CommandProperty } from './properties/command.ts';
import { DependsProperty } from './properties/depends.ts';
import { EnvironmentProperty } from './properties/environment.ts';
import { ImageProperty } from './properties/image.ts';
import { NameProperty } from './properties/name.ts';
import { ServiceNetworksBuilder } from './properties/networks.ts';
import { PortsProperty } from './properties/ports.ts';
import { composeServiceSchema, serviceSchema } from './service-schemas.ts';
import { ServiceState } from './service-state.ts';

export class ServiceBuilder implements ServiceHandle {
  static readonly composeSchema = composeServiceSchema;
  static readonly schema = serviceSchema;

  readonly schema = ServiceBuilder.schema;

  private readonly state = new ServiceState();
  private readonly nameProperty = new NameProperty(this.state);
  private readonly imageProperty = new ImageProperty(this.state);
  private readonly commandProperty = new CommandProperty(this.state);
  private readonly environmentProperty = new EnvironmentProperty(this.state);
  private readonly portsProperty = new PortsProperty(this.state);
  private readonly dependsProperty = new DependsProperty(this.state);
  private readonly networksProperty = new ServiceNetworksBuilder(this.state);
  private readonly volumesList: ComposeServiceVolume[] = [];
  private readonly exposeList: Array<string | number> = [];
  private readonly secretsList: ComposeServiceSecret[] = [];
  private readonly configsList: ComposeServiceConfig[] = [];

  get name(): string {
    return this.state.name;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  setName(value: string): void {
    this.nameProperty.set(value);
  }

  image(value: string): void {
    this.imageProperty.set(value);
  }

  containerName(value: string): void {
    this.state.setContainerName(value);
  }

  hostname(value: string): void {
    this.state.setHostname(value);
  }

  domainname(value: string): void {
    this.state.setDomainname(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Execution
  // ─────────────────────────────────────────────────────────────────────────
  command(value: string | string[]): void {
    this.commandProperty.set(value);
  }

  entrypoint(value: string | string[]): void {
    this.state.setEntrypoint(value);
  }

  workingDir(value: string): void {
    this.state.setWorkingDir(value);
  }

  user(value: string): void {
    this.state.setUser(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build
  // ─────────────────────────────────────────────────────────────────────────
  build(value: string | ComposeBuild): void {
    this.state.setBuild(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Dependencies
  // ─────────────────────────────────────────────────────────────────────────
  depends<R>(fn: (dsl: DependsDsl) => R): R {
    const { dsl, simple, conditions } = createDependsBuilder();
    const result = fn(dsl);
    
    if (simple.length > 0) {
      this.dependsProperty.add(...simple);
    }
    for (const { service, condition } of conditions) {
      this.state.addDependsOn(service.name, { condition });
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Networks
  // ─────────────────────────────────────────────────────────────────────────
  networks<R>(fn: (dsl: NetworksDsl) => R): R {
    const dsl: NetworksDsl = {
      add: <RAttachment = void>(network: NetworkHandle, attachmentFn?: (dsl: NetworkAttachmentDsl) => RAttachment) => {
        if (!attachmentFn) {
          this.networksProperty.add(network);
          return undefined;
        }

        const attachment: ServiceNetworkAttachment = {};
        const aliases: string[] = [];
        const linkLocalIps: string[] = [];
        const driverOpts: Record<string, string | number> = {};
        
        const attachmentDsl: NetworkAttachmentDsl = {
          alias: (alias) => { aliases.push(alias); },
          ipv4Address: (address) => { attachment.ipv4Address = address; },
          ipv6Address: (address) => { attachment.ipv6Address = address; },
          interfaceName: (name) => { attachment.interfaceName = name; },
          linkLocalIp: (ip) => { linkLocalIps.push(ip); },
          macAddress: (address) => { attachment.macAddress = address; },
          driverOpt: (key, value) => { driverOpts[key] = value; },
          priority: (value) => { attachment.priority = value; },
          gwPriority: (value) => { attachment.gwPriority = value; },
        };
        const attachmentResult = attachmentFn(attachmentDsl);
        
        if (aliases.length > 0) {
          attachment.aliases = aliases;
        }
        if (linkLocalIps.length > 0) {
          attachment.linkLocalIps = linkLocalIps;
        }
        if (Object.keys(driverOpts).length > 0) {
          attachment.driverOpts = driverOpts;
        }
        
        this.networksProperty.add(network, attachment);
        return attachmentResult;
      },
    };
    return fn(dsl);
  }

  links<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setLinks(values);
    }
    return result;
  }

  externalLinks<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setExternalLinks(values);
    }
    return result;
  }

  networkMode(value: string): void {
    this.state.setNetworkMode(value);
  }

  macAddress(value: string): void {
    this.state.setMacAddress(value);
  }

  dns<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setDns(values);
    }
    return result;
  }

  dnsOpt<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setDnsOpt(values);
    }
    return result;
  }

  dnsSearch<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setDnsSearch(values);
    }
    return result;
  }

  extraHosts<R>(fn: (dsl: KeyValueDsl) => R): R {
    const { dsl, values } = createKeyValueBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setExtraHosts(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ports
  // ─────────────────────────────────────────────────────────────────────────
  ports<R>(fn: (dsl: PortsDsl) => R): R {
    const { dsl, values } = createPortsBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.portsProperty.set(values);
    }
    return result;
  }

  expose(port: number | string | Array<number | string>): void {
    const entries = Array.isArray(port) ? port : [port];
    this.exposeList.push(...entries);
    this.state.setExpose(this.exposeList);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Environment
  // ─────────────────────────────────────────────────────────────────────────
  environment<R>(fn: (dsl: KeyValueDsl) => R): R {
    const { dsl, values } = createKeyValueBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.environmentProperty.set(values);
    }
    return result;
  }

  envFile<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setEnvFile(values);
    }
    return result;
  }

  labels<R>(fn: (dsl: KeyValueDsl) => R): R {
    const { dsl, values } = createKeyValueBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setLabels(values);
    }
    return result;
  }

  labelFile<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setLabelFile(values);
    }
    return result;
  }

  annotations<R>(fn: (dsl: KeyValueDsl) => R): R {
    const { dsl, values } = createKeyValueBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setAnnotations(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes
  // ─────────────────────────────────────────────────────────────────────────
  private normalizeVolumeInput(input: ServiceVolumeInput): ComposeServiceVolume {
    const config: ComposeVolumeConfig = { type: input.type };

    if (input.source) config.source = input.source;
    if (input.target) config.target = input.target;
    if (input.consistency) config.consistency = input.consistency;
    if (input.readOnly !== undefined) config.read_only = input.readOnly;

    if (input.bind) {
      const { createHostPath, ...rest } = input.bind;
      const bind: ComposeVolumeBindOptions = { ...rest };
      if (createHostPath !== undefined) bind.create_host_path = createHostPath;
      config.bind = bind;
    }

    if (input.volume) config.volume = { ...input.volume };
    if (input.tmpfs) config.tmpfs = { ...input.tmpfs };
    if (input.image) config.image = { ...input.image };

    return config;
  }

  volumes(volume: ServiceVolumeInput): void;
  volumes(source: string, target: string, mode?: string): void;
  volumes(volumeOrSource: ServiceVolumeInput | string, target?: string, mode?: string): void {
    if (typeof volumeOrSource === 'string') {
      if (!target) throw new Error('Target is required when specifying a source string for volumes');
      const spec = mode ? `${volumeOrSource}:${target}:${mode}` : `${volumeOrSource}:${target}`;
      this.volumesList.push(spec);
    } else {
      this.volumesList.push(this.normalizeVolumeInput(volumeOrSource));
    }
    this.state.setVolumes(this.volumesList);
  }

  volumesFrom<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setVolumesFrom(values);
    }
    return result;
  }

  tmpfs<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setTmpfs(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Secrets & Configs
  // ─────────────────────────────────────────────────────────────────────────
  secret(secret: { name: string }): void {
    this.secretsList.push(secret.name);
    this.state.setSecrets(this.secretsList);
  }

  config(config: { name: string }): void {
    this.configsList.push(config.name);
    this.state.setConfigs(this.configsList);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Health & Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  healthcheck(value: HealthcheckInput): void {
    this.state.setHealthcheck(value);
  }

  restart(value: string): void {
    this.state.setRestart(value);
  }

  stopSignal(value: string): void {
    this.state.setStopSignal(value);
  }

  stopGracePeriod(value: string): void {
    this.state.setStopGracePeriod(value);
  }

  postStart<R>(fn: (dsl: HooksDsl) => R): R {
    const { dsl, values } = createHooksBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setPostStart(values);
    }
    return result;
  }

  preStop<R>(fn: (dsl: HooksDsl) => R): R {
    const { dsl, values } = createHooksBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setPreStop(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Runtime
  // ─────────────────────────────────────────────────────────────────────────
  runtime(value: string): void {
    this.state.setRuntime(value);
  }

  platform(value: string): void {
    this.state.setPlatform(value);
  }

  init(value: boolean): void {
    this.state.setInit(value);
  }

  privileged(value: boolean): void {
    this.state.setPrivileged(value);
  }

  readOnly(value: boolean): void {
    this.state.setReadOnly(value);
  }

  tty(value: boolean): void {
    this.state.setTty(value);
  }

  stdinOpen(value: boolean): void {
    this.state.setStdinOpen(value);
  }

  attach(value: boolean): void {
    this.state.setAttach(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Security
  // ─────────────────────────────────────────────────────────────────────────
  capAdd<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setCapAdd(values);
    }
    return result;
  }

  capDrop<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setCapDrop(values);
    }
    return result;
  }

  securityOpt<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setSecurityOpt(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Deployment
  // ─────────────────────────────────────────────────────────────────────────
  deploy(value: ComposeDeploy): void {
    this.state.setDeploy(value);
  }

  develop(value: ComposeDevelopment): void {
    this.state.setDevelop(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CPU
  // ─────────────────────────────────────────────────────────────────────────
  cpuCount(value: number): void {
    this.state.setCpuCount(value);
  }

  cpuPercent(value: number): void {
    this.state.setCpuPercent(value);
  }

  cpuShares(value: number): void {
    this.state.setCpuShares(value);
  }

  cpuPeriod(value: number): void {
    this.state.setCpuPeriod(value);
  }

  cpuQuota(value: number): void {
    this.state.setCpuQuota(value);
  }

  cpuRtRuntime(value: string | number): void {
    this.state.setCpuRtRuntime(value);
  }

  cpuRtPeriod(value: string | number): void {
    this.state.setCpuRtPeriod(value);
  }

  cpus(value: number | string): void {
    this.state.setCpus(value);
  }

  cpuset(value: string): void {
    this.state.setCpuset(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Memory
  // ─────────────────────────────────────────────────────────────────────────
  memLimit(value: string | number): void {
    this.state.setMemLimit(value);
  }

  memReservation(value: string | number): void {
    this.state.setMemReservation(value);
  }

  memSwapLimit(value: string | number): void {
    this.state.setMemswapLimit(value);
  }

  memSwappiness(value: number): void {
    this.state.setMemSwappiness(value);
  }

  shmSize(value: string | number): void {
    this.state.setShmSize(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IO
  // ─────────────────────────────────────────────────────────────────────────
  blkioConfig(value: BlkioConfig): void {
    this.state.setBlkioConfig(value);
  }

  oomKillDisable(value: boolean): void {
    this.state.setOomKillDisable(value);
  }

  oomScoreAdj(value: number): void {
    this.state.setOomScoreAdj(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────────────────
  logging(value: LoggingInput): void {
    this.state.setLogging(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ulimits
  // ─────────────────────────────────────────────────────────────────────────
  ulimits<R>(fn: (dsl: UlimitsDsl) => R): R {
    const { dsl, values } = createUlimitsBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setUlimits(values as ComposeUlimits);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Devices
  // ─────────────────────────────────────────────────────────────────────────
  devices<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setDevices(values);
    }
    return result;
  }

  deviceCgroupRules<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setDeviceCgroupRules(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Process
  // ─────────────────────────────────────────────────────────────────────────
  pid(value: string): void {
    this.state.setPid(value);
  }

  pidsLimit(value: number): void {
    this.state.setPidsLimit(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // IPC & UTS
  // ─────────────────────────────────────────────────────────────────────────
  ipc(value: string): void {
    this.state.setIpc(value);
  }

  uts(value: string): void {
    this.state.setUts(value);
  }

  usernsMode(value: string): void {
    this.state.setUsernsMode(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sysctls
  // ─────────────────────────────────────────────────────────────────────────
  sysctls<R>(fn: (dsl: KeyValueNumericDsl) => R): R {
    const { dsl, values } = createKeyValueNumericBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setSysctls(values);
    }
    return result;
  }

  cgroupParent(value: string): void {
    this.state.setCgroupParent(value);
  }

  cgroup(value: 'host' | 'private'): void {
    this.state.setCgroup(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Storage
  // ─────────────────────────────────────────────────────────────────────────
  isolation(value: string): void {
    this.state.setIsolation(value);
  }

  storageOpt<R>(fn: (dsl: KeyValueDsl) => R): R {
    const { dsl, values } = createKeyValueBuilder();
    const result = fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setStorageOpt(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Credentials
  // ─────────────────────────────────────────────────────────────────────────
  credentialSpec(value: ComposeCredentialSpec): void {
    this.state.setCredentialSpec(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pull & Profiles
  // ─────────────────────────────────────────────────────────────────────────
  pullPolicy(value: ComposePullPolicy): void {
    this.state.setPullPolicy(value);
  }

  pullRefreshAfter(value: string): void {
    this.state.setPullRefreshAfter(value);
  }

  profiles<R>(fn: (dsl: ListDsl) => R): R {
    const { dsl, values } = createListBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setProfiles(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Scale
  // ─────────────────────────────────────────────────────────────────────────
  scale(value: number): void {
    this.state.setScale(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Extends
  // ─────────────────────────────────────────────────────────────────────────
  extends(value: { service: string; file?: string }): void {
    this.state.setExtends(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GPUs
  // ─────────────────────────────────────────────────────────────────────────
  gpus<R>(fn: (dsl: GpusDsl) => R): R {
    const { dsl, values } = createGpusBuilder();
    const result = fn(dsl);
    if (values.all) {
      this.state.setGpus('all');
    } else if (values.devices.length > 0) {
      this.state.setGpus(values.devices as ComposeGpuDevice[]);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Groups
  // ─────────────────────────────────────────────────────────────────────────
  groupAdd<R>(fn: (dsl: GroupsDsl) => R): R {
    const { dsl, values } = createGroupsBuilder();
    const result = fn(dsl);
    if (values.length > 0) {
      this.state.setGroupAdd(values);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Provider
  // ─────────────────────────────────────────────────────────────────────────
  provider(value: ComposeProvider): void {
    this.state.setProvider(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API socket
  // ─────────────────────────────────────────────────────────────────────────
  useApiSocket(value: boolean): void {
    this.state.setUseApiSocket(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Validation & Build
  // ─────────────────────────────────────────────────────────────────────────
  validate(): void {
    const snapshot = this.state.validationSnapshot();
    const result = this.schema.safeParse(snapshot);
    if (!result.success) {
      throw new ZodError([
        ...result.error.issues,
        {
          code: 'custom',
          path: [],
          message: `Snapshot: ${JSON.stringify(snapshot)}`,
        },
      ]);
    }
  }

  toComposeService(): ComposeService {
    if (!this.state.name) {
      throw new Error('Service name must be set');
    }

    this.validate();
    return this.state.finalize();
  }
}
