import { ZodError } from "zod";

import {
  createGpusBuilder,
  type BuildFn,
  type GpusDsl,
  type NetworkFn,
} from "../../dsl/builders.ts";
import type {
  BlkioConfig,
  ComposeCredentialSpec,
  ComposeDeploy,
  ComposeDevelopment,
  ComposeDevice,
  ComposeGpuDevice,
  ComposePort,
  ComposeProvider,
  ComposePullPolicy,
  ComposeRestartPolicyValue,
  ComposeService,
  ComposeServiceConfig,
  ComposeServiceSecret,
  ComposeServiceVolume,
  ComposeUlimits,
  HealthcheckInput,
  LoggingInput,
  ServiceHandle,
  ServiceVolumeInput,
  ServiceHook,
} from "../../types.ts";
import { composeServiceSchema, serviceSchema } from "./service-schemas.ts";
import { ServiceState } from "./service-state.ts";
import { createBuildBuilder } from "./build-dsl.ts";
import { createListCollector, createMapCollector } from "./collectors.ts";
import { ServiceNetworks } from "./network-attachments.ts";
import { runNetworkDsl } from "./network-dsl.ts";
import { normalizeVolumeInput } from "./volume-normalizer.ts";

export class ServiceBuilder implements ServiceHandle {
  static readonly composeSchema = composeServiceSchema;
  static readonly schema = serviceSchema;

  readonly schema = ServiceBuilder.schema;

  private readonly state = new ServiceState();
  private readonly networks = new ServiceNetworks(this.state);

  private readonly volumesCollector = createListCollector<ComposeServiceVolume>(
    (values) => this.state.setVolumes(values)
  );
  private readonly exposeCollector = createListCollector<string | number>(
    (values) => this.state.setExpose(values)
  );
  private readonly secretsCollector = createListCollector<ComposeServiceSecret>(
    (values) => this.state.setSecrets(values)
  );
  private readonly configsCollector = createListCollector<ComposeServiceConfig>(
    (values) => this.state.setConfigs(values)
  );
  private readonly linksCollector = createListCollector<string>((values) =>
    this.state.setLinks(values)
  );
  private readonly externalLinksCollector = createListCollector<string>(
    (values) => this.state.setExternalLinks(values)
  );
  private readonly dnsCollector = createListCollector<string>((values) =>
    this.state.setDns(values)
  );
  private readonly dnsOptCollector = createListCollector<string>((values) =>
    this.state.setDnsOpt(values)
  );
  private readonly dnsSearchCollector = createListCollector<string>((values) =>
    this.state.setDnsSearch(values)
  );
  private readonly envFileCollector = createListCollector<string>((values) =>
    this.state.setEnvFile(values)
  );
  private readonly labelFileCollector = createListCollector<string>((values) =>
    this.state.setLabelFile(values)
  );
  private readonly volumesFromCollector = createListCollector<string>(
    (values) => this.state.setVolumesFrom(values)
  );
  private readonly tmpfsCollector = createListCollector<string>((values) =>
    this.state.setTmpfs(values)
  );
  private readonly devicesCollector = createListCollector<ComposeDevice>(
    (values) => this.state.setDevices(values)
  );
  private readonly deviceCgroupRulesCollector = createListCollector<string>(
    (values) => this.state.setDeviceCgroupRules(values)
  );
  private readonly portsCollector = createListCollector<ComposePort>((values) =>
    this.state.setPorts(values)
  );
  private readonly capAddCollector = createListCollector<string>((values) =>
    this.state.setCapAdd(values)
  );
  private readonly capDropCollector = createListCollector<string>((values) =>
    this.state.setCapDrop(values)
  );
  private readonly securityOptCollector = createListCollector<string>(
    (values) => this.state.setSecurityOpt(values)
  );
  private readonly profileCollector = createListCollector<string>((values) =>
    this.state.setProfiles(values)
  );
  private readonly groupAddCollector = createListCollector<string | number>(
    (values) => this.state.setGroupAdd(values)
  );
  private readonly postStartCollector = createListCollector<ServiceHook>(
    (values) => this.state.setPostStart(values)
  );
  private readonly preStopCollector = createListCollector<ServiceHook>(
    (values) => this.state.setPreStop(values)
  );

  private readonly environmentMap = createMapCollector<
    string | number | boolean | null
  >((values) => this.state.setEnvironment(values));
  private readonly labelsMap = createMapCollector<
    string | number | boolean | null
  >((values) => this.state.setLabels(values));
  private readonly annotationsMap = createMapCollector<
    string | number | boolean | null
  >((values) => this.state.setAnnotations(values));
  private readonly extraHostsMap = createMapCollector<string | string[]>(
    (values) => this.state.setExtraHosts(values)
  );
  private readonly storageOptMap = createMapCollector<string>((values) =>
    this.state.setStorageOpt(values)
  );
  private readonly ulimitsMap = createMapCollector<
    number | { soft: number; hard: number }
  >((values) => this.state.setUlimits(values as ComposeUlimits));
  private readonly sysctlsMap = createMapCollector<string | number>((values) =>
    this.state.setSysctls(values)
  );

  get name(): string {
    return this.state.name;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────
  setName(value: string): void {
    this.state.setName(value);
  }

  image(value: string): void {
    this.state.setImage(value);
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
    this.state.setCommand(value);
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
  build<R>(fn: BuildFn<R>): R {
    const { dsl, value } = createBuildBuilder();
    const result = fn(dsl);
    this.state.setBuild(value);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Dependencies
  // ─────────────────────────────────────────────────────────────────────────
  depends(
    service: ServiceHandle,
    condition?:
      | "service_started"
      | "service_healthy"
      | "service_completed_successfully"
  ): void {
    if (condition) {
      this.state.addDependsOn(service.name, { condition });
    } else {
      this.state.addDependency(service.name);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Networks
  // ─────────────────────────────────────────────────────────────────────────
  network<R>(fn: NetworkFn<R>): R {
    return runNetworkDsl(fn, (network, attachment) =>
      this.networks.add(network, attachment)
    );
  }

  links(value: string): void {
    this.linksCollector.add(value);
  }

  externalLinks(value: string): void {
    this.externalLinksCollector.add(value);
  }

  networkMode(value: string): void {
    this.state.setNetworkMode(value);
  }

  macAddress(value: string): void {
    this.state.setMacAddress(value);
  }

  dns(value: string): void {
    this.dnsCollector.add(value);
  }

  dnsOpt(value: string): void {
    this.dnsOptCollector.add(value);
  }

  dnsSearch(value: string): void {
    this.dnsSearchCollector.add(value);
  }

  extraHosts(host: string, address: string | string[]): void {
    this.extraHostsMap.set(host, address);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ports
  // ─────────────────────────────────────────────────────────────────────────
  ports(value: ComposePort): void;
  ports(
    source: number | string,
    target?: number | string,
    protocol?: "tcp" | "udp"
  ): void;
  ports(
    valueOrSource: ComposePort | number | string,
    target?: number | string,
    protocol?: "tcp" | "udp"
  ): void {
    const entry: ComposePort =
      typeof valueOrSource === "number" || typeof valueOrSource === "string"
        ? {
            target: target ?? valueOrSource,
            published: target ? valueOrSource : undefined,
            protocol,
          }
        : valueOrSource;

    this.portsCollector.add(entry);
  }

  expose(port: number | string | Array<number | string>): void {
    const entries = Array.isArray(port) ? port : [port];
    this.exposeCollector.addMany(entries);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Environment
  // ─────────────────────────────────────────────────────────────────────────
  environment(key: string, value: string | number | boolean | null): void {
    this.environmentMap.set(key, value);
  }

  envFile(value: string): void {
    this.envFileCollector.add(value);
  }

  labels(key: string, value: string | number | boolean | null): void {
    this.labelsMap.set(key, value);
  }

  labelFile(value: string): void {
    this.labelFileCollector.add(value);
  }

  annotations(key: string, value: string | number | boolean | null): void {
    this.annotationsMap.set(key, value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes
  // ─────────────────────────────────────────────────────────────────────────
  volumes(volume: ServiceVolumeInput): void;
  volumes(source: string, target: string, mode?: string): void;
  volumes(
    volumeOrSource: ServiceVolumeInput | string,
    target?: string,
    mode?: string
  ): void {
    if (typeof volumeOrSource === "string") {
      if (!target) {
        throw new Error(
          "Target is required when specifying a source string for volumes"
        );
      }
      const spec = mode
        ? `${volumeOrSource}:${target}:${mode}`
        : `${volumeOrSource}:${target}`;
      this.volumesCollector.add(spec);
    } else {
      this.volumesCollector.add(normalizeVolumeInput(volumeOrSource));
    }
  }

  volumesFrom(value: string): void {
    this.volumesFromCollector.add(value);
  }

  tmpfs(value: string): void {
    this.tmpfsCollector.add(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Secrets & Configs
  // ─────────────────────────────────────────────────────────────────────────
  secret(
    secret: { name: string },
    options?: {
      source?: string;
      target?: string;
      uid?: string;
      gid?: string;
      mode?: number | string;
    }
  ): void {
    if (!options) {
      this.secretsCollector.add(secret.name);
      return;
    }

    const source = options.source ?? secret.name;
    const target = options.target ?? source;
    const entry: ComposeServiceSecret = {
      source,
      target,
      uid: options.uid,
      gid: options.gid,
      mode: options.mode,
    };
    this.secretsCollector.add(entry);
  }

  config(
    config: { name: string },
    options?: {
      source?: string;
      target?: string;
      uid?: string;
      gid?: string;
      mode?: number | string;
    }
  ): void {
    if (!options) {
      this.configsCollector.add(config.name);
      return;
    }

    const source = options.source ?? config.name;
    const target = options.target ?? source;
    const entry: ComposeServiceConfig = {
      source,
      target,
      uid: options.uid,
      gid: options.gid,
      mode: options.mode,
    };
    this.configsCollector.add(entry);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Health & Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  healthcheck(value: HealthcheckInput): void {
    this.state.setHealthcheck(value);
  }

  restart(value: ComposeRestartPolicyValue): void {
    this.state.setRestart(value);
  }

  stopSignal(value: string): void {
    this.state.setStopSignal(value);
  }

  stopGracePeriod(value: string): void {
    this.state.setStopGracePeriod(value);
  }

  postStart(hook: ServiceHook): void {
    this.postStartCollector.add(hook);
  }

  preStop(hook: ServiceHook): void {
    this.preStopCollector.add(hook);
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
  capAdd(value: string): void {
    this.capAddCollector.add(value);
  }

  capDrop(value: string): void {
    this.capDropCollector.add(value);
  }

  securityOpt(value: string): void {
    this.securityOptCollector.add(value);
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
  ulimits(name: string, soft: number, hard?: number): void {
    this.ulimitsMap.set(name, hard === undefined ? soft : { soft, hard });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Devices
  // ─────────────────────────────────────────────────────────────────────────
  devices(value: ComposeDevice): void {
    this.devicesCollector.add(value);
  }

  deviceCgroupRules(value: string): void {
    this.deviceCgroupRulesCollector.add(value);
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
  sysctls(key: string, value: string | number): void {
    this.sysctlsMap.set(key, value);
  }

  cgroupParent(value: string): void {
    this.state.setCgroupParent(value);
  }

  cgroup(value: "host" | "private"): void {
    this.state.setCgroup(value);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Storage
  // ─────────────────────────────────────────────────────────────────────────
  isolation(value: string): void {
    this.state.setIsolation(value);
  }

  storageOpt(key: string, value: string): void {
    this.storageOptMap.set(key, value);
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

  profiles(value: string): void {
    this.profileCollector.add(value);
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
      this.state.setGpus("all");
    } else if (values.devices.length > 0) {
      this.state.setGpus(values.devices as ComposeGpuDevice[]);
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Groups
  // ─────────────────────────────────────────────────────────────────────────
  groupAdd(value: string | number): void {
    this.groupAddCollector.add(value);
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
          code: "custom",
          path: [],
          message: `Snapshot: ${JSON.stringify(snapshot)}`,
        },
      ]);
    }
  }

  toComposeService(): ComposeService {
    if (!this.state.name) {
      throw new Error("Service name must be set");
    }

    this.validate();
    return this.state.finalize();
  }
}
