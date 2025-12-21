import { ZodError } from "zod";

import {
  createGpusBuilder,
  type BuildDsl,
  type BuildFn,
  type GpusDsl,
  type NetworkAttachmentDsl,
  type NetworksDsl,
} from "../../dsl/builders.ts";
import type {
  ServiceHook,
  ComposeServiceVolume,
  ComposeUlimits,
  HealthcheckInput,
  LoggingInput,
  NetworkHandle,
  ServiceHandle,
  ServiceNetworkAttachment,
  ServiceVolumeInput,
  ComposeServiceSecret,
  ComposeServiceConfig,
  ComposeDevice,
  ComposePort,
  ComposeDeploy,
  ComposeDevelopment,
  ComposeVolumeBindOptions,
  ComposeVolumeConfig,
  ComposeCredentialSpec,
  ComposePullPolicy,
  ComposeProvider,
  ComposeGpuDevice,
  ComposeService,
  BlkioConfig,
  ComposeBuildConfig,
  ComposeServiceSecretConfig,
} from "../../types.ts";
import { CommandProperty } from "./properties/command.ts";
import { DependsProperty } from "./properties/depends.ts";
import { EnvironmentProperty } from "./properties/environment.ts";
import { ImageProperty } from "./properties/image.ts";
import { NameProperty } from "./properties/name.ts";
import { ServiceNetworksBuilder } from "./properties/networks.ts";
import { PortsProperty } from "./properties/ports.ts";
import { composeServiceSchema, serviceSchema } from "./service-schemas.ts";
import { ServiceState } from "./service-state.ts";

const createBuildBuilder = () => {
  const build: ComposeBuildConfig = {};

  const ensureRecord = (key: keyof ComposeBuildConfig) => {
    const current = build[key];
    if (!current || Array.isArray(current)) {
      (build as Record<string, unknown>)[key as string] = {};
    }
    return (build as Record<string, unknown>)[key as string] as Record<
      string,
      any
    >;
  };

  const ensureArray = <T>(key: keyof ComposeBuildConfig) => {
    const current = build[key];
    if (!Array.isArray(current)) {
      (build as Record<string, unknown>)[key as string] = [];
    }
    return (build as Record<string, unknown>)[key as string] as T[];
  };

  const dsl: BuildDsl = {
    context: (value) => {
      build.context = value;
    },
    dockerfile: (value) => {
      build.dockerfile = value;
    },
    dockerfileInline: (value) => {
      build.dockerfile_inline = value;
    },
    arg: (key, value) => {
      const args = ensureRecord("args");
      args[key] = value;
    },
    ssh: (key, value) => {
      const ssh = ensureRecord("ssh");
      ssh[key] = value;
    },
    label: (key, value) => {
      const labels = ensureRecord("labels");
      labels[key] = value;
    },
    cacheFrom: (value) => {
      ensureArray<string>("cache_from").push(value);
    },
    cacheTo: (value) => {
      ensureArray<string>("cache_to").push(value);
    },
    noCache: (value) => {
      build.no_cache = value;
    },
    additionalContext: (name, path) => {
      const contexts = ensureRecord("additional_contexts");
      contexts[name] = path;
    },
    network: (value) => {
      build.network = value;
    },
    target: (value) => {
      build.target = value;
    },
    shmSize: (value) => {
      build.shm_size = value;
    },
    extraHost: (host, address) => {
      const hosts = ensureRecord("extra_hosts");
      hosts[host] = address;
    },
    isolation: (value) => {
      build.isolation = value;
    },
    privileged: (value) => {
      build.privileged = value;
    },
    secret: (value) => {
      ensureArray<string | ComposeServiceSecretConfig>("secrets").push(value);
    },
    tag: (value) => {
      ensureArray<string>("tags").push(value);
    },
    ulimit: (name, soft, hard) => {
      const ulimits = ensureRecord("ulimits");
      ulimits[name] = { soft, hard: hard ?? soft };
    },
    platform: (value) => {
      ensureArray<string>("platforms").push(value);
    },
    pull: (value) => {
      build.pull = value;
    },
    provenance: (value) => {
      build.provenance = value;
    },
    sbom: (value) => {
      build.sbom = value;
    },
    entitlement: (value) => {
      ensureArray<string>("entitlements").push(value);
    },
  };

  return { dsl, value: build };
};

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
  private readonly linksList: string[] = [];
  private readonly externalLinksList: string[] = [];
  private readonly dnsList: string[] = [];
  private readonly dnsOptList: string[] = [];
  private readonly dnsSearchList: string[] = [];
  private readonly envFileList: string[] = [];
  private readonly labelFileList: string[] = [];
  private readonly volumesFromList: string[] = [];
  private readonly tmpfsList: string[] = [];
  private readonly devicesList: ComposeDevice[] = [];
  private readonly deviceCgroupRulesList: string[] = [];
  private readonly portsList: ComposePort[] = [];
  private readonly capAddList: string[] = [];
  private readonly capDropList: string[] = [];
  private readonly securityOptList: string[] = [];
  private readonly profilesList: string[] = [];
  private readonly groupAddList: Array<string | number> = [];
  private readonly sysctlsMap: Record<string, string | number> = {};
  private readonly storageOptMap: Record<string, string> = {};
  private readonly ulimitsMap: Record<
    string,
    number | { soft: number; hard: number }
  > = {};
  private readonly environmentMap: Record<
    string,
    string | number | boolean | null
  > = {};
  private readonly labelsMap: Record<string, string | number | boolean | null> =
    {};
  private readonly annotationsMap: Record<
    string,
    string | number | boolean | null
  > = {};
  private readonly extraHostsMap: Record<string, string | string[]> = {};
  private readonly postStartList: ServiceHook[] = [];
  private readonly preStopList: ServiceHook[] = [];

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
      this.dependsProperty.add(service);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Networks
  // ─────────────────────────────────────────────────────────────────────────
  networks<R>(fn: (dsl: NetworksDsl) => R): R {
    const dsl: NetworksDsl = {
      add: <RAttachment = void>(
        network: NetworkHandle,
        attachmentFn?: (dsl: NetworkAttachmentDsl) => RAttachment
      ) => {
        if (!attachmentFn) {
          this.networksProperty.add(network);
          return undefined;
        }

        const attachment: ServiceNetworkAttachment = {};
        const aliases: string[] = [];
        const linkLocalIps: string[] = [];
        const driverOpts: Record<string, string | number> = {};

        const attachmentDsl: NetworkAttachmentDsl = {
          alias: (alias) => {
            aliases.push(alias);
          },
          ipv4Address: (address) => {
            attachment.ipv4Address = address;
          },
          ipv6Address: (address) => {
            attachment.ipv6Address = address;
          },
          interfaceName: (name) => {
            attachment.interfaceName = name;
          },
          linkLocalIp: (ip) => {
            linkLocalIps.push(ip);
          },
          macAddress: (address) => {
            attachment.macAddress = address;
          },
          driverOpt: (key, value) => {
            driverOpts[key] = value;
          },
          priority: (value) => {
            attachment.priority = value;
          },
          gwPriority: (value) => {
            attachment.gwPriority = value;
          },
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

  links(value: string): void {
    this.linksList.push(value);
    this.state.setLinks(this.linksList);
  }

  externalLinks(value: string): void {
    this.externalLinksList.push(value);
    this.state.setExternalLinks(this.externalLinksList);
  }

  networkMode(value: string): void {
    this.state.setNetworkMode(value);
  }

  macAddress(value: string): void {
    this.state.setMacAddress(value);
  }

  dns(value: string): void {
    this.dnsList.push(value);
    this.state.setDns(this.dnsList);
  }

  dnsOpt(value: string): void {
    this.dnsOptList.push(value);
    this.state.setDnsOpt(this.dnsOptList);
  }

  dnsSearch(value: string): void {
    this.dnsSearchList.push(value);
    this.state.setDnsSearch(this.dnsSearchList);
  }

  extraHosts(host: string, address: string | string[]): void {
    this.extraHostsMap[host] = address;
    this.state.setExtraHosts(this.extraHostsMap);
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

    this.portsList.push(entry);
    this.portsProperty.set(this.portsList);
  }

  expose(port: number | string | Array<number | string>): void {
    const entries = Array.isArray(port) ? port : [port];
    this.exposeList.push(...entries);
    this.state.setExpose(this.exposeList);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Environment
  // ─────────────────────────────────────────────────────────────────────────
  environment(key: string, value: string | number | boolean | null): void {
    this.environmentMap[key] = value;
    this.environmentProperty.set(this.environmentMap);
  }

  envFile(value: string): void {
    this.envFileList.push(value);
    this.state.setEnvFile(this.envFileList);
  }

  labels(key: string, value: string | number | boolean | null): void {
    this.labelsMap[key] = value;
    this.state.setLabels(this.labelsMap);
  }

  labelFile(value: string): void {
    this.labelFileList.push(value);
    this.state.setLabelFile(this.labelFileList);
  }

  annotations(key: string, value: string | number | boolean | null): void {
    this.annotationsMap[key] = value;
    this.state.setAnnotations(this.annotationsMap);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Volumes
  // ─────────────────────────────────────────────────────────────────────────
  private normalizeVolumeInput(
    input: ServiceVolumeInput
  ): ComposeServiceVolume {
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
  volumes(
    volumeOrSource: ServiceVolumeInput | string,
    target?: string,
    mode?: string
  ): void {
    if (typeof volumeOrSource === "string") {
      if (!target)
        throw new Error(
          "Target is required when specifying a source string for volumes"
        );
      const spec = mode
        ? `${volumeOrSource}:${target}:${mode}`
        : `${volumeOrSource}:${target}`;
      this.volumesList.push(spec);
    } else {
      this.volumesList.push(this.normalizeVolumeInput(volumeOrSource));
    }
    this.state.setVolumes(this.volumesList);
  }

  volumesFrom(value: string): void {
    this.volumesFromList.push(value);
    this.state.setVolumesFrom(this.volumesFromList);
  }

  tmpfs(value: string): void {
    this.tmpfsList.push(value);
    this.state.setTmpfs(this.tmpfsList);
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

  postStart(hook: ServiceHook): void {
    this.postStartList.push(hook);
    this.state.setPostStart(this.postStartList);
  }

  preStop(hook: ServiceHook): void {
    this.preStopList.push(hook);
    this.state.setPreStop(this.preStopList);
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
    this.capAddList.push(value);
    this.state.setCapAdd(this.capAddList);
  }

  capDrop(value: string): void {
    this.capDropList.push(value);
    this.state.setCapDrop(this.capDropList);
  }

  securityOpt(value: string): void {
    this.securityOptList.push(value);
    this.state.setSecurityOpt(this.securityOptList);
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
    this.ulimitsMap[name] = hard === undefined ? soft : { soft, hard };
    this.state.setUlimits(this.ulimitsMap as ComposeUlimits);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Devices
  // ─────────────────────────────────────────────────────────────────────────
  devices(value: ComposeDevice): void {
    this.devicesList.push(value);
    this.state.setDevices(this.devicesList);
  }

  deviceCgroupRules(value: string): void {
    this.deviceCgroupRulesList.push(value);
    this.state.setDeviceCgroupRules(this.deviceCgroupRulesList);
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
    this.sysctlsMap[key] = value;
    this.state.setSysctls(this.sysctlsMap);
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
    this.storageOptMap[key] = value;
    this.state.setStorageOpt(this.storageOptMap);
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
    this.profilesList.push(value);
    this.state.setProfiles(this.profilesList);
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
    this.groupAddList.push(value);
    this.state.setGroupAdd(this.groupAddList);
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
