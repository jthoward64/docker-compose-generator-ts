import { ComposeStack } from '../../compose-stack.ts';
import { ServiceBuilder } from '../service/service-builder.ts';
import { composeFileSchema } from './stack-schemas.ts';
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
} from '../../types.ts';
import type { ServiceDsl, StackDsl } from '../../dsl/stack.ts';
import type {
  StackConfigsDsl,
  StackNetworksDsl,
  StackSecretsDsl,
  StackVolumesDsl,
} from '../../dsl/builders.ts';

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

const toComposeIpam = (
  input: NetworkInput['ipam'],
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
      }),
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
      throw new Error('Network name must be provided');
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

  private addExternalNetwork(name: string, externalName?: string): NetworkHandle {
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
      throw new Error('Volume name must be provided');
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

  private addExternalVolume(name: string): VolumeHandle {
    if (this.volumesMap.has(name)) {
      throw new Error(`Volume with name "${name}" already exists`);
    }

    const volume: ComposeVolume = { external: true };
    this.volumesMap.set(name, volume);
    return { name } satisfies VolumeHandle;
  }

  private addSecret(input: SecretInput): SecretHandle {
    const { name } = input;
    if (!name) {
      throw new Error('Secret name must be provided');
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
      throw new Error('Config name must be provided');
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
  // Public DSL methods
  // ─────────────────────────────────────────────────────────────────────────

  networks(fn: (dsl: StackNetworksDsl) => void): void {
    const dsl: StackNetworksDsl = {
      add: (input: NetworkInput) => this.addNetwork(input),
      external: (name: string, externalName?: string) => this.addExternalNetwork(name, externalName),
    };
    fn(dsl);
  }

  volumes(fn: (dsl: StackVolumesDsl) => void): void {
    const dsl: StackVolumesDsl = {
      add: (input: VolumeInput) => this.addVolume(input),
      external: (name: string) => this.addExternalVolume(name),
    };
    fn(dsl);
  }

  secrets(fn: (dsl: StackSecretsDsl) => void): void {
    const dsl: StackSecretsDsl = {
      add: (input: SecretInput) => this.addSecret(input),
      file: (name: string, filePath: string) => this.addSecret({ name, file: filePath }),
      environment: (name: string, envVar: string) => this.addSecret({ name, environment: envVar }),
      external: (name: string) => this.addSecret({ name, external: true }),
    };
    fn(dsl);
  }

  configs(fn: (dsl: StackConfigsDsl) => void): void {
    const dsl: StackConfigsDsl = {
      add: (input: ConfigInput) => this.addConfig(input),
      file: (name: string, filePath: string) => this.addConfig({ name, file: filePath }),
      content: (name: string, content: string) => this.addConfig({ name, content }),
      environment: (name: string, envVar: string) => this.addConfig({ name, environment: envVar }),
      external: (name: string) => this.addConfig({ name, external: true }),
    };
    fn(dsl);
  }

  service(builderFn: (dsl: ServiceDsl) => void): ServiceHandle {
    const serviceBuilder = new ServiceBuilder();

    // Use a Proxy to dynamically delegate all ServiceDsl methods to ServiceBuilder
    // This ensures the DSL always exposes all ServiceBuilder methods without explicit mappings
    const dsl = new Proxy(serviceBuilder, {
      get(target, prop: string) {
        // Special case: 'name' in ServiceDsl sets the name, but ServiceBuilder has 'setName'
        if (prop === 'name') {
          return (value: string) => target.setName(value);
        }

        // For all other properties, delegate to the corresponding method on ServiceBuilder
        const method = target[prop as keyof ServiceBuilder];
        if (typeof method === 'function') {
          return method.bind(target);
        }

        return undefined;
      },
    }) as unknown as ServiceDsl;

    builderFn(dsl);

    const serviceSpec = serviceBuilder.toComposeService();

    if (this.servicesMap.has(serviceBuilder.name)) {
      throw new Error(`Service with name "${serviceBuilder.name}" already exists`);
    }

    this.servicesMap.set(serviceBuilder.name, serviceSpec);
    return { name: serviceBuilder.name } satisfies ServiceHandle;
  }

  createDsl(): StackDsl {
    return {
      name: (value: string) => this.name(value),
      networks: (fn: (dsl: StackNetworksDsl) => void) => this.networks(fn),
      volumes: (fn: (dsl: StackVolumesDsl) => void) => this.volumes(fn),
      secrets: (fn: (dsl: StackSecretsDsl) => void) => this.secrets(fn),
      configs: (fn: (dsl: StackConfigsDsl) => void) => this.configs(fn),
      service: (fn: (dsl: ServiceDsl) => void) => this.service(fn),
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
