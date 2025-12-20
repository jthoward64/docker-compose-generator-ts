import { ZodError } from 'zod';

import type {
  BlkioConfig,
  ComposeBuild,
  ComposeCredentialSpec,
  ComposeDeploy,
  ComposeDevelopment,
  ComposeGpuDevice,
  ComposeProvider,
  ComposeService,
  ComposeUlimits,
  HealthcheckInput,
  LoggingInput,
  NetworkHandle,
  ServiceHandle,
  ServiceNetworkAttachment,
  ServiceVolumeInput,
} from '../../types.ts';
import {
  createConfigsBuilder,
  createDependsBuilder,
  createExposeBuilder,
  createGpusBuilder,
  createGroupsBuilder,
  createHooksBuilder,
  createKeyValueBuilder,
  createKeyValueNumericBuilder,
  createListBuilder,
  createPortsBuilder,
  createSecretsBuilder,
  createUlimitsBuilder,
  createVolumesBuilder,
  type ConfigsDsl,
  type DependsDsl,
  type ExposeDsl,
  type GpusDsl,
  type GroupsDsl,
  type HooksDsl,
  type KeyValueDsl,
  type KeyValueNumericDsl,
  type ListDsl,
  type NetworkAttachmentDsl,
  type NetworksDsl,
  type PortsDsl,
  type SecretsDsl,
  type UlimitsDsl,
  type VolumesDsl,
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
  depends(fn: (dsl: DependsDsl) => void): void {
    const { dsl, simple, conditions } = createDependsBuilder();
    fn(dsl);
    
    if (simple.length > 0) {
      this.dependsProperty.add(...simple);
    }
    for (const { service, condition } of conditions) {
      this.state.addDependsOn(service.name, { condition });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Networks
  // ─────────────────────────────────────────────────────────────────────────
  networks(fn: (dsl: NetworksDsl) => void): void {
    const dsl: NetworksDsl = {
      add: (network: NetworkHandle, attachmentFn?: (dsl: NetworkAttachmentDsl) => void) => {
        if (!attachmentFn) {
          this.networksProperty.add(network);
          return;
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
        attachmentFn(attachmentDsl);
        
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
      },
    };
    fn(dsl);
  }

  links(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setLinks(values);
    }
  }

  externalLinks(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setExternalLinks(values);
    }
  }

  networkMode(value: string): void {
    this.state.setNetworkMode(value);
  }

  macAddress(value: string): void {
    this.state.setMacAddress(value);
  }

  dns(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setDns(values);
    }
  }

  dnsOpt(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setDnsOpt(values);
    }
  }

  dnsSearch(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setDnsSearch(values);
    }
  }

  extraHosts(fn: (dsl: KeyValueDsl) => void): void {
    const { dsl, values } = createKeyValueBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setExtraHosts(values);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ports
  // ─────────────────────────────────────────────────────────────────────────
  ports(fn: (dsl: PortsDsl) => void): void {
    const { dsl, values } = createPortsBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.portsProperty.set(values);
    }
  }

  expose(fn: (dsl: ExposeDsl) => void): void {
    const { dsl, values } = createExposeBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setExpose(values);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Environment
  // ─────────────────────────────────────────────────────────────────────────
  environment(fn: (dsl: KeyValueDsl) => void): void {
    const { dsl, values } = createKeyValueBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.environmentProperty.set(values);
    }
  }

  envFile(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setEnvFile(values);
    }
  }

  labels(fn: (dsl: KeyValueDsl) => void): void {
    const { dsl, values } = createKeyValueBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setLabels(values);
    }
  }

  labelFile(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setLabelFile(values);
    }
  }

  annotations(fn: (dsl: KeyValueDsl) => void): void {
    const { dsl, values } = createKeyValueBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setAnnotations(values);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes
  // ─────────────────────────────────────────────────────────────────────────
  volumes(fn: (dsl: VolumesDsl) => void): void {
    const { dsl, values } = createVolumesBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setVolumes(values as ServiceVolumeInput[]);
    }
  }

  volumesFrom(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setVolumesFrom(values);
    }
  }

  tmpfs(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setTmpfs(values);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Secrets & Configs
  // ─────────────────────────────────────────────────────────────────────────
  secrets(fn: (dsl: SecretsDsl) => void): void {
    const { dsl, values } = createSecretsBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setSecrets(values.map((s) => s.name));
    }
  }

  configs(fn: (dsl: ConfigsDsl) => void): void {
    const { dsl, values } = createConfigsBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setConfigs(values.map((c) => c.name));
    }
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

  postStart(fn: (dsl: HooksDsl) => void): void {
    const { dsl, values } = createHooksBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setPostStart(values);
    }
  }

  preStop(fn: (dsl: HooksDsl) => void): void {
    const { dsl, values } = createHooksBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setPreStop(values);
    }
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
  capAdd(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setCapAdd(values);
    }
  }

  capDrop(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setCapDrop(values);
    }
  }

  securityOpt(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setSecurityOpt(values);
    }
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
  ulimits(fn: (dsl: UlimitsDsl) => void): void {
    const { dsl, values } = createUlimitsBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setUlimits(values as ComposeUlimits);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Devices
  // ─────────────────────────────────────────────────────────────────────────
  devices(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setDevices(values);
    }
  }

  deviceCgroupRules(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setDeviceCgroupRules(values);
    }
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
  sysctls(fn: (dsl: KeyValueNumericDsl) => void): void {
    const { dsl, values } = createKeyValueNumericBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setSysctls(values);
    }
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

  storageOpt(fn: (dsl: KeyValueDsl) => void): void {
    const { dsl, values } = createKeyValueBuilder();
    fn(dsl);
    if (Object.keys(values).length > 0) {
      this.state.setStorageOpt(values);
    }
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
  pullPolicy(value: 'always' | 'never' | 'missing' | 'build'): void {
    this.state.setPullPolicy(value);
  }

  pullRefreshAfter(value: string): void {
    this.state.setPullRefreshAfter(value);
  }

  profiles(fn: (dsl: ListDsl) => void): void {
    const { dsl, values } = createListBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setProfiles(values);
    }
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
  gpus(fn: (dsl: GpusDsl) => void): void {
    const { dsl, values } = createGpusBuilder();
    fn(dsl);
    if (values.all) {
      this.state.setGpus('all');
    } else if (values.devices.length > 0) {
      this.state.setGpus(values.devices as ComposeGpuDevice[]);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Groups
  // ─────────────────────────────────────────────────────────────────────────
  groupAdd(fn: (dsl: GroupsDsl) => void): void {
    const { dsl, values } = createGroupsBuilder();
    fn(dsl);
    if (values.length > 0) {
      this.state.setGroupAdd(values);
    }
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
