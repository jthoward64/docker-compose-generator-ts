import { ComposeStack } from "../../compose-stack.ts";
import { ServiceBuilder } from "../service/service-builder.ts";
import { composeFileSchema } from "./stack-schemas.ts";
import {
  type ComposeConfig,
  type ComposeFile,
  type ComposeIpam,
  type ComposeNetwork,
  type ComposeSecret,
  type ComposeService,
  type ComposeVolume,
  type ConfigHandle,
  type ConfigInput,
  type ConfigName,
  type NetworkHandle,
  type NetworkInput,
  type NetworkName,
  type SecretHandle,
  type SecretInput,
  type SecretName,
  type ServiceHandle,
  type ServiceName,
  type VolumeHandle,
  type VolumeInput,
  type VolumeName,
} from "../../types.ts";
import { pruneUndefined } from "../../utils/prune.ts";
import type { ServiceDsl, StackDsl } from "../../dsl/stack.ts";
import type { ServiceResourceFn } from "../../dsl/service.ts";
import type {
  NetworkResourceDsl,
  VolumeResourceDsl,
  SecretResourceDsl,
  ConfigResourceDsl,
  NetworkResourceFn,
  VolumeResourceFn,
  SecretResourceFn,
  ConfigResourceFn,
} from "../../dsl/builders.ts";

const toComposeIpam = (
  input: NetworkInput["ipam"]
): ComposeIpam | undefined => {
  if (!input) return undefined;
  return pruneUndefined({
    driver: input.driver,
    config: input.config?.map((c) =>
      pruneUndefined({
        subnet: c.subnet,
        ip_range: c.ipRange,
        gateway: c.gateway,
        aux_addresses: c.auxAddresses,
      })
    ),
    options: input.options,
  });
};

export class StackBuilder {
  static readonly schema = composeFileSchema;
  readonly schema = StackBuilder.schema;

  private stackName?: string;
  private networksMap = new Map<NetworkName, ComposeNetwork | null>();
  private volumesMap = new Map<VolumeName, ComposeVolume | null>();
  private secretsMap = new Map<SecretName, ComposeSecret>();
  private configsMap = new Map<ConfigName, ComposeConfig>();
  private servicesMap = new Map<ServiceName, ComposeService>();

  name(value: string): void {
    this.stackName = value;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers for adding individual items
  // ─────────────────────────────────────────────────────────────────────────

  private addNetwork(input: NetworkInput): NetworkHandle {
    const { name } = input;
    if (!name) {
      throw new Error("Network name must be provided");
    }
    if (this.networksMap.has(name)) {
      throw new Error(`Network with name "${name}" already exists`);
    }

    const network: ComposeNetwork = pruneUndefined({
      name: input.name,
      driver: input.driver,
      driver_opts: input.driverOpts,
      ipam: toComposeIpam(input.ipam),
      external: input.external,
      internal: input.internal,
      enable_ipv4: input.enableIpv4,
      enable_ipv6: input.enableIpv6,
      attachable: input.attachable,
      labels: input.labels,
    });

    this.networksMap.set(name, network);
    return { name } satisfies NetworkHandle;
  }

  private addExternalNetwork(
    name: string,
    externalName?: string
  ): NetworkHandle {
    if (this.networksMap.has(name)) {
      throw new Error(`Network with name "${name}" already exists`);
    }

    const network: ComposeNetwork = {
      external: externalName ? { name: externalName } : true,
    };
    this.networksMap.set(name, network);
    return { name } satisfies NetworkHandle;
  }

  private addVolume(input: VolumeInput): VolumeHandle {
    const { name } = input;
    if (!name) {
      throw new Error("Volume name must be provided");
    }
    if (this.volumesMap.has(name)) {
      throw new Error(`Volume with name "${name}" already exists`);
    }

    const volume: ComposeVolume = pruneUndefined({
      name: input.name,
      driver: input.driver,
      driver_opts: input.driverOpts,
      external: input.external,
      labels: input.labels,
    });

    this.volumesMap.set(name, volume);
    return { name } satisfies VolumeHandle;
  }

  private addExternalVolume(name: string, externalName?: string): VolumeHandle {
    if (this.volumesMap.has(name)) {
      throw new Error(`Volume with name "${name}" already exists`);
    }

    const volume: ComposeVolume = externalName
      ? { external: { name: externalName } }
      : { external: true };
    this.volumesMap.set(name, volume);
    return { name } satisfies VolumeHandle;
  }

  private addSecret(input: SecretInput): SecretHandle {
    const { name } = input;
    if (!name) {
      throw new Error("Secret name must be provided");
    }
    if (this.secretsMap.has(name)) {
      throw new Error(`Secret with name "${name}" already exists`);
    }

    const secret: ComposeSecret = pruneUndefined({
      name: input.name,
      file: input.file,
      environment: input.environment,
      external: input.external,
      labels: input.labels,
      driver: input.driver,
      driver_opts: input.driverOpts,
      template_driver: input.templateDriver,
    });

    this.secretsMap.set(name, secret);
    return { name } satisfies SecretHandle;
  }

  private addConfig(input: ConfigInput): ConfigHandle {
    const { name } = input;
    if (!name) {
      throw new Error("Config name must be provided");
    }
    if (this.configsMap.has(name)) {
      throw new Error(`Config with name "${name}" already exists`);
    }

    const config: ComposeConfig = pruneUndefined({
      name: input.name,
      file: input.file,
      content: input.content,
      environment: input.environment,
      external: input.external,
      labels: input.labels,
      template_driver: input.templateDriver,
    });

    this.configsMap.set(name, config);
    return { name } satisfies ConfigHandle;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Single-resource ergonomic builders
  // ─────────────────────────────────────────────────────────────────────────

  network<R>(fn: NetworkResourceFn<R>): [NetworkHandle, R] {
    const state: Partial<NetworkInput> & {
      externalName?: string;
      externalFlag?: boolean;
    } = {};
    const ipamConfig: NonNullable<NetworkInput["ipam"]>["config"] = [];
    let ipamOptions: Record<string, string> | undefined;

    const dsl: NetworkResourceDsl = {
      name: (value) => {
        state.name = value;
      },
      driver: (value) => {
        state.driver = value;
      },
      driverOpt: (key, value) => {
        if (!state.driverOpts) state.driverOpts = {};
        state.driverOpts[key] = value;
      },
      ipamDriver: (value) => {
        if (!state.ipam) state.ipam = {};
        state.ipam.driver = value;
      },
      ipamConfig: (config) => {
        ipamConfig.push({
          subnet: config.subnet,
          ipRange: config.ipRange,
          gateway: config.gateway,
          auxAddresses: config.auxAddresses,
        });
      },
      ipamOption: (key, value) => {
        if (!ipamOptions) ipamOptions = {};
        ipamOptions[key] = value;
      },
      external: (externalName) => {
        state.externalFlag = true;
        state.externalName = externalName;
      },
      internal: (value) => {
        state.internal = value;
      },
      enableIpv4: (value) => {
        state.enableIpv4 = value;
      },
      enableIpv6: (value) => {
        state.enableIpv6 = value;
      },
      attachable: (value) => {
        state.attachable = value;
      },
      label: (key, value) => {
        if (!state.labels) state.labels = {};
        if (Array.isArray(state.labels)) {
          state.labels.push(`${key}=${value}`);
        } else {
          (state.labels as Record<string, string>)[key] = value;
        }
      },
      labels: (value) => {
        state.labels = {
          ...(state.labels as Record<string, string> | undefined),
          ...value,
        };
      },
    };

    const result = fn(dsl);

    if (!state.name) {
      throw new Error("Network name must be provided");
    }

    if (state.externalFlag) {
      const handle = this.addExternalNetwork(state.name, state.externalName);
      return [handle, result];
    }

    if (ipamConfig.length || ipamOptions || state.ipam?.driver) {
      state.ipam = {
        driver: state.ipam?.driver,
        config: ipamConfig.length ? ipamConfig : undefined,
        options: ipamOptions,
      };
    }

    const handle = this.addNetwork(state as NetworkInput);
    return [handle, result];
  }

  volume<R>(fn: VolumeResourceFn<R>): [VolumeHandle, R] {
    const state: Partial<VolumeInput> & {
      externalName?: string;
      externalFlag?: boolean;
    } = {};

    const dsl: VolumeResourceDsl = {
      name: (value) => {
        state.name = value;
      },
      driver: (value) => {
        state.driver = value;
      },
      driverOpt: (key, value) => {
        if (!state.driverOpts) state.driverOpts = {};
        state.driverOpts[key] = value;
      },
      external: (externalName) => {
        state.externalFlag = true;
        state.externalName = externalName;
      },
      label: (key, value) => {
        if (!state.labels) state.labels = {};
        if (Array.isArray(state.labels)) {
          state.labels.push(`${key}=${value}`);
        } else {
          (state.labels as Record<string, string>)[key] = value;
        }
      },
      labels: (value) => {
        state.labels = {
          ...(state.labels as Record<string, string> | undefined),
          ...value,
        };
      },
    };

    const result = fn(dsl);

    if (!state.name) {
      throw new Error("Volume name must be provided");
    }

    if (state.externalFlag) {
      const handle = this.addExternalVolume(state.name, state.externalName);
      return [handle, result];
    }

    const handle = this.addVolume(state as VolumeInput);
    return [handle, result];
  }

  secret<R>(fn: SecretResourceFn<R>): [SecretHandle, R] {
    const state: Partial<SecretInput> & {
      externalName?: string;
      externalFlag?: boolean;
    } = {};

    const dsl: SecretResourceDsl = {
      name: (value) => {
        state.name = value;
      },
      file: (filePath) => {
        state.file = filePath;
      },
      environment: (envVar) => {
        state.environment = envVar;
      },
      external: (externalName) => {
        state.externalFlag = true;
        state.externalName = externalName;
      },
      label: (key, value) => {
        if (!state.labels) state.labels = {};
        if (Array.isArray(state.labels)) {
          state.labels.push(`${key}=${value}`);
        } else {
          (state.labels as Record<string, string>)[key] = value;
        }
      },
      labels: (value) => {
        state.labels = {
          ...(state.labels as Record<string, string> | undefined),
          ...value,
        };
      },
      driver: (value) => {
        state.driver = value;
      },
      driverOpt: (key, value) => {
        if (!state.driverOpts) state.driverOpts = {};
        state.driverOpts[key] = value;
      },
      templateDriver: (value) => {
        state.templateDriver = value;
      },
    };

    const result = fn(dsl);

    if (!state.name) {
      throw new Error("Secret name must be provided");
    }

    if (state.externalFlag) {
      const handle = this.addSecret({
        name: state.name,
        external: state.externalName ? { name: state.externalName } : true,
      });
      return [handle, result];
    }

    const handle = this.addSecret(state as SecretInput);
    return [handle, result];
  }

  config<R>(fn: ConfigResourceFn<R>): [ConfigHandle, R] {
    const state: Partial<ConfigInput> & {
      externalName?: string;
      externalFlag?: boolean;
    } = {};

    const dsl: ConfigResourceDsl = {
      name: (value) => {
        state.name = value;
      },
      file: (filePath) => {
        state.file = filePath;
      },
      content: (value) => {
        state.content = value;
      },
      environment: (envVar) => {
        state.environment = envVar;
      },
      external: (externalName) => {
        state.externalFlag = true;
        state.externalName = externalName;
      },
      label: (key, value) => {
        if (!state.labels) state.labels = {};
        if (Array.isArray(state.labels)) {
          state.labels.push(`${key}=${value}`);
        } else {
          (state.labels as Record<string, string>)[key] = value;
        }
      },
      labels: (value) => {
        state.labels = {
          ...(state.labels as Record<string, string> | undefined),
          ...value,
        };
      },
      templateDriver: (value) => {
        state.templateDriver = value;
      },
    };

    const result = fn(dsl);

    if (!state.name) {
      throw new Error("Config name must be provided");
    }

    if (state.externalFlag) {
      const handle = this.addConfig({
        name: state.name,
        external: state.externalName ? { name: state.externalName } : true,
      });
      return [handle, result];
    }

    const handle = this.addConfig(state as ConfigInput);
    return [handle, result];
  }

  service<R>(builderFn: (dsl: ServiceDsl) => R): [ServiceHandle, R] {
    const serviceBuilder = new ServiceBuilder();

    // Use a Proxy to dynamically delegate all ServiceDsl methods to ServiceBuilder
    // This ensures the DSL always exposes all ServiceBuilder methods without explicit mappings
    const dsl = new Proxy(serviceBuilder, {
      get(target, prop: string) {
        // Special case: 'name' in ServiceDsl sets the name, but ServiceBuilder has 'setName'
        if (prop === "name") {
          return (value: string) => target.setName(value);
        }

        // For all other properties, delegate to the corresponding method on ServiceBuilder
        const method = target[prop as keyof ServiceBuilder];
        if (typeof method === "function") {
          return method.bind(target);
        }

        return undefined;
      },
    }) as unknown as ServiceDsl;

    const result = builderFn(dsl);

    const serviceSpec = serviceBuilder.toComposeService();

    if (this.servicesMap.has(serviceBuilder.name)) {
      throw new Error(
        `Service with name "${serviceBuilder.name}" already exists`
      );
    }

    this.servicesMap.set(serviceBuilder.name, serviceSpec);
    return [{ name: serviceBuilder.name } satisfies ServiceHandle, result];
  }

  createDsl(): StackDsl {
    return {
      name: (value: string) => this.name(value),
      network: <R>(fn: NetworkResourceFn<R>) => this.network(fn),
      volume: <R>(fn: VolumeResourceFn<R>) => this.volume(fn),
      secret: <R>(fn: SecretResourceFn<R>) => this.secret(fn),
      config: <R>(fn: ConfigResourceFn<R>) => this.config(fn),
      service: <R>(fn: ServiceResourceFn<R>) => this.service(fn),
    } satisfies StackDsl;
  }

  validate(): void {
    this.schema.parse(this.previewSpec());
  }

  private previewSpec(): ComposeFile {
    return {
      name: this.stackName,
      services: this.servicesMap.size
        ? Object.fromEntries(this.servicesMap.entries())
        : undefined,
      networks: this.networksMap.size
        ? Object.fromEntries(this.networksMap.entries())
        : undefined,
      volumes: this.volumesMap.size
        ? Object.fromEntries(this.volumesMap.entries())
        : undefined,
      secrets: this.secretsMap.size
        ? Object.fromEntries(this.secretsMap.entries())
        : undefined,
      configs: this.configsMap.size
        ? Object.fromEntries(this.configsMap.entries())
        : undefined,
    };
  }

  build(): ComposeStack {
    const spec = this.previewSpec();
    this.validate();
    return new ComposeStack(pruneUndefined(spec));
  }
}
