import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────
const stringOrNumber = z.union([z.string(), z.number()]);
const booleanOrString = z.union([z.boolean(), z.string()]);
const listOrDict = z.union([
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  z.array(z.string()),
]);
const stringOrList = z.union([z.string(), z.array(z.string())]);
const command = z.union([z.null(), z.string(), z.array(z.string())]);

// ─────────────────────────────────────────────────────────────────────────────
// Service network config
// ─────────────────────────────────────────────────────────────────────────────
export const composeServiceNetworkConfigSchema = z
  .object({
    aliases: z.array(z.string()).optional(),
    ipv4_address: z.string().optional(),
    ipv6_address: z.string().optional(),
    interface_name: z.string().optional(),
    link_local_ips: z.array(z.string()).optional(),
    mac_address: z.string().optional(),
    driver_opts: z.record(z.string(), stringOrNumber).optional(),
    priority: z.number().optional(),
    gw_priority: z.number().optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Healthcheck
// ─────────────────────────────────────────────────────────────────────────────
const healthcheckSchema = z
  .object({
    disable: booleanOrString.optional(),
    interval: z.string().optional(),
    retries: stringOrNumber.optional(),
    test: z.union([z.string(), z.array(z.string())]).optional(),
    timeout: z.string().optional(),
    start_period: z.string().optional(),
    start_interval: z.string().optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────
const loggingSchema = z
  .object({
    driver: z.string().optional(),
    options: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Ulimits
// ─────────────────────────────────────────────────────────────────────────────
const ulimitValueSchema = z.union([
  stringOrNumber,
  z.object({ soft: stringOrNumber, hard: stringOrNumber }).strict(),
]);
const ulimitsSchema = z.record(z.string(), ulimitValueSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Service secret/config
// ─────────────────────────────────────────────────────────────────────────────
const serviceSecretConfigSchema = z.union([
  z.string(),
  z
    .object({
      source: z.string(),
      target: z.string().optional(),
      uid: z.string().optional(),
      gid: z.string().optional(),
      mode: stringOrNumber.optional(),
    })
    .strict(),
]);

// ─────────────────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────────────────
const buildConfigSchema = z
  .object({
    context: z.string().optional(),
    dockerfile: z.string().optional(),
    dockerfile_inline: z.string().optional(),
    args: listOrDict.optional(),
    ssh: listOrDict.optional(),
    labels: listOrDict.optional(),
    cache_from: z.array(z.string()).optional(),
    cache_to: z.array(z.string()).optional(),
    no_cache: booleanOrString.optional(),
    additional_contexts: listOrDict.optional(),
    network: z.string().optional(),
    target: z.string().optional(),
    shm_size: stringOrNumber.optional(),
    extra_hosts: z
      .union([
        z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        z.array(z.string()),
      ])
      .optional(),
    isolation: z.string().optional(),
    privileged: booleanOrString.optional(),
    secrets: z.array(serviceSecretConfigSchema).optional(),
    tags: z.array(z.string()).optional(),
    ulimits: ulimitsSchema.optional(),
    platforms: z.array(z.string()).optional(),
    pull: booleanOrString.optional(),
    provenance: z.union([z.string(), z.boolean()]).optional(),
    sbom: z.union([z.string(), z.boolean()]).optional(),
    entitlements: z.array(z.string()).optional(),
  })
  .strict();

const buildSchema = z.union([z.string(), buildConfigSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// Blkio
// ─────────────────────────────────────────────────────────────────────────────
const blkioLimitSchema = z.object({ path: z.string(), rate: stringOrNumber }).strict();
const blkioWeightSchema = z.object({ path: z.string(), weight: stringOrNumber }).strict();
const blkioConfigSchema = z
  .object({
    device_read_bps: z.array(blkioLimitSchema).optional(),
    device_read_iops: z.array(blkioLimitSchema).optional(),
    device_write_bps: z.array(blkioLimitSchema).optional(),
    device_write_iops: z.array(blkioLimitSchema).optional(),
    weight: stringOrNumber.optional(),
    weight_device: z.array(blkioWeightSchema).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Credential spec
// ─────────────────────────────────────────────────────────────────────────────
const credentialSpecSchema = z
  .object({
    config: z.string().optional(),
    file: z.string().optional(),
    registry: z.string().optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Depends on
// ─────────────────────────────────────────────────────────────────────────────
const dependsOnConditionSchema = z
  .object({
    condition: z.enum(['service_started', 'service_healthy', 'service_completed_successfully']),
    restart: booleanOrString.optional(),
    required: z.boolean().optional(),
  })
  .strict();

const dependsOnSchema = z.union([
  z.array(z.string()),
  z.record(z.string(), dependsOnConditionSchema),
]);

// ─────────────────────────────────────────────────────────────────────────────
// Devices
// ─────────────────────────────────────────────────────────────────────────────
const deviceMappingSchema = z
  .object({
    source: z.string(),
    target: z.string().optional(),
    permissions: z.string().optional(),
  })
  .strict();

const deviceSchema = z.union([z.string(), deviceMappingSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// Ports
// ─────────────────────────────────────────────────────────────────────────────
const portConfigSchema = z
  .object({
    name: z.string().optional(),
    mode: z.string().optional(),
    host_ip: z.string().optional(),
    target: stringOrNumber,
    published: stringOrNumber.optional(),
    protocol: z.string().optional(),
    app_protocol: z.string().optional(),
  })
  .strict();

const portSchema = z.union([z.string(), z.number(), portConfigSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// Volumes (service-level)
// ─────────────────────────────────────────────────────────────────────────────
const volumeBindOptionsSchema = z
  .object({
    propagation: z.string().optional(),
    create_host_path: booleanOrString.optional(),
    recursive: z.enum(['enabled', 'disabled', 'writable', 'readonly']).optional(),
    selinux: z.enum(['z', 'Z']).optional(),
  })
  .strict();

const volumeVolumeOptionsSchema = z
  .object({
    labels: listOrDict.optional(),
    nocopy: booleanOrString.optional(),
    subpath: z.string().optional(),
  })
  .strict();

const volumeTmpfsOptionsSchema = z
  .object({
    size: stringOrNumber.optional(),
    mode: stringOrNumber.optional(),
  })
  .strict();

const volumeImageOptionsSchema = z
  .object({
    subpath: z.string().optional(),
  })
  .strict();

const volumeConfigSchema = z
  .object({
    type: z.enum(['bind', 'volume', 'tmpfs', 'cluster', 'npipe', 'image']),
    source: z.string().optional(),
    target: z.string().optional(),
    read_only: booleanOrString.optional(),
    consistency: z.string().optional(),
    bind: volumeBindOptionsSchema.optional(),
    volume: volumeVolumeOptionsSchema.optional(),
    tmpfs: volumeTmpfsOptionsSchema.optional(),
    image: volumeImageOptionsSchema.optional(),
  })
  .strict();

const serviceVolumeSchema = z.union([z.string(), volumeConfigSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// Deploy
// ─────────────────────────────────────────────────────────────────────────────
const resourceLimitsSchema = z
  .object({
    cpus: stringOrNumber.optional(),
    memory: z.string().optional(),
    pids: stringOrNumber.optional(),
  })
  .strict();

const genericResourceSchema = z
  .object({
    discrete_resource_spec: z
      .object({
        kind: z.string(),
        value: stringOrNumber,
      })
      .strict()
      .optional(),
  })
  .strict();

const deviceRequestSchema = z
  .object({
    capabilities: z.array(z.string()),
    count: stringOrNumber.optional(),
    device_ids: z.array(z.string()).optional(),
    driver: z.string().optional(),
    options: listOrDict.optional(),
  })
  .strict();

const resourceReservationsSchema = z
  .object({
    cpus: stringOrNumber.optional(),
    memory: z.string().optional(),
    generic_resources: z.array(genericResourceSchema).optional(),
    devices: z.array(deviceRequestSchema).optional(),
  })
  .strict();

const resourcesSchema = z
  .object({
    limits: resourceLimitsSchema.optional(),
    reservations: resourceReservationsSchema.optional(),
  })
  .strict();

const rollbackConfigSchema = z
  .object({
    parallelism: stringOrNumber.optional(),
    delay: z.string().optional(),
    failure_action: z.string().optional(),
    monitor: z.string().optional(),
    max_failure_ratio: stringOrNumber.optional(),
    order: z.enum(['start-first', 'stop-first']).optional(),
  })
  .strict();

const updateConfigSchema = z
  .object({
    parallelism: stringOrNumber.optional(),
    delay: z.string().optional(),
    failure_action: z.string().optional(),
    monitor: z.string().optional(),
    max_failure_ratio: stringOrNumber.optional(),
    order: z.enum(['start-first', 'stop-first']).optional(),
  })
  .strict();

const restartPolicySchema = z
  .object({
    condition: z.string().optional(),
    delay: z.string().optional(),
    max_attempts: stringOrNumber.optional(),
    window: z.string().optional(),
  })
  .strict();

const placementPreferenceSchema = z.object({ spread: z.string().optional() }).strict();

const placementSchema = z
  .object({
    constraints: z.array(z.string()).optional(),
    preferences: z.array(placementPreferenceSchema).optional(),
    max_replicas_per_node: stringOrNumber.optional(),
  })
  .strict();

const deploySchema = z
  .object({
    mode: z.string().optional(),
    endpoint_mode: z.string().optional(),
    replicas: stringOrNumber.optional(),
    labels: listOrDict.optional(),
    rollback_config: rollbackConfigSchema.optional(),
    update_config: updateConfigSchema.optional(),
    resources: resourcesSchema.optional(),
    restart_policy: restartPolicySchema.optional(),
    placement: placementSchema.optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Development (watch)
// ─────────────────────────────────────────────────────────────────────────────
const serviceHookSchema = z
  .object({
    command: command,
    user: z.string().optional(),
    privileged: booleanOrString.optional(),
    working_dir: z.string().optional(),
    environment: listOrDict.optional(),
  })
  .strict();

const watchActionSchema = z
  .object({
    path: z.string(),
    action: z.enum(['rebuild', 'sync', 'restart', 'sync+restart', 'sync+exec']),
    ignore: stringOrList.optional(),
    include: stringOrList.optional(),
    target: z.string().optional(),
    exec: serviceHookSchema.optional(),
    initial_sync: z.boolean().optional(),
  })
  .strict();

const developmentSchema = z
  .object({
    watch: z.array(watchActionSchema).optional(),
  })
  .strict()
  .nullable();

// ─────────────────────────────────────────────────────────────────────────────
// Extends
// ─────────────────────────────────────────────────────────────────────────────
const extendsConfigSchema = z
  .object({
    service: z.string(),
    file: z.string().optional(),
  })
  .strict();

const extendsSchema = z.union([z.string(), extendsConfigSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
const providerSchema = z
  .object({
    type: z.string(),
    options: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([z.string(), z.number(), z.boolean()])),
        ]),
      )
      .optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// GPUs
// ─────────────────────────────────────────────────────────────────────────────
const gpuDeviceSchema = z
  .object({
    capabilities: z.array(z.string()),
    count: stringOrNumber.optional(),
    device_ids: z.array(z.string()).optional(),
    driver: z.string().optional(),
    options: listOrDict.optional(),
  })
  .strict();

const gpusSchema = z.union([z.literal('all'), z.array(gpuDeviceSchema)]);

// ─────────────────────────────────────────────────────────────────────────────
// Env file
// ─────────────────────────────────────────────────────────────────────────────
const envFileConfigSchema = z
  .object({
    path: z.string(),
    format: z.string().optional(),
    required: booleanOrString.optional(),
  })
  .strict();

const envFileSchema = z.union([z.string(), z.array(z.union([z.string(), envFileConfigSchema]))]);

// ─────────────────────────────────────────────────────────────────────────────
// Extra hosts
// ─────────────────────────────────────────────────────────────────────────────
const extraHostsSchema = z.union([
  z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  z.array(z.string()),
]);

// ─────────────────────────────────────────────────────────────────────────────
// Full ComposeService schema
// ─────────────────────────────────────────────────────────────────────────────
export const composeServiceSchema = z
  .object({
    image: z.string().optional(),
    build: buildSchema.optional(),
    command: command.optional(),
    entrypoint: command.optional(),
    environment: listOrDict.optional(),
    env_file: envFileSchema.optional(),
    ports: z.array(portSchema).optional(),
    expose: z.array(stringOrNumber).optional(),
    volumes: z.array(serviceVolumeSchema).optional(),
    volumes_from: z.array(z.string()).optional(),
    depends_on: dependsOnSchema.optional(),
    networks: z
      .union([
        z.array(z.string()),
        z.record(z.string(), composeServiceNetworkConfigSchema.nullable()),
      ])
      .optional(),
    network_mode: z.string().optional(),
    healthcheck: healthcheckSchema.optional(),
    logging: loggingSchema.optional(),
    deploy: deploySchema.optional(),
    develop: developmentSchema.optional(),
    labels: listOrDict.optional(),
    annotations: listOrDict.optional(),
    secrets: z.array(serviceSecretConfigSchema).optional(),
    configs: z.array(serviceSecretConfigSchema).optional(),
    ulimits: ulimitsSchema.optional(),
    sysctls: listOrDict.optional(),
    devices: z.array(deviceSchema).optional(),
    blkio_config: blkioConfigSchema.optional(),
    credential_spec: credentialSpecSchema.optional(),
    cap_add: z.array(z.string()).optional(),
    cap_drop: z.array(z.string()).optional(),
    cgroup: z.enum(['host', 'private']).optional(),
    cgroup_parent: z.string().optional(),
    container_name: z.string().optional(),
    cpu_count: stringOrNumber.optional(),
    cpu_percent: stringOrNumber.optional(),
    cpu_shares: stringOrNumber.optional(),
    cpu_quota: stringOrNumber.optional(),
    cpu_period: stringOrNumber.optional(),
    cpu_rt_period: stringOrNumber.optional(),
    cpu_rt_runtime: stringOrNumber.optional(),
    cpus: stringOrNumber.optional(),
    cpuset: z.string().optional(),
    dns: stringOrList.optional(),
    dns_opt: z.array(z.string()).optional(),
    dns_search: stringOrList.optional(),
    domainname: z.string().optional(),
    extends: extendsSchema.optional(),
    provider: providerSchema.optional(),
    external_links: z.array(z.string()).optional(),
    extra_hosts: extraHostsSchema.optional(),
    gpus: gpusSchema.optional(),
    group_add: z.array(stringOrNumber).optional(),
    hostname: z.string().optional(),
    init: booleanOrString.optional(),
    ipc: z.string().optional(),
    isolation: z.string().optional(),
    links: z.array(z.string()).optional(),
    mac_address: z.string().optional(),
    mem_limit: stringOrNumber.optional(),
    mem_reservation: stringOrNumber.optional(),
    mem_swappiness: stringOrNumber.optional(),
    memswap_limit: stringOrNumber.optional(),
    oom_kill_disable: booleanOrString.optional(),
    oom_score_adj: stringOrNumber.optional(),
    pid: z.string().nullable().optional(),
    pids_limit: stringOrNumber.optional(),
    platform: z.string().optional(),
    post_start: z.array(serviceHookSchema).optional(),
    pre_stop: z.array(serviceHookSchema).optional(),
    privileged: booleanOrString.optional(),
    profiles: z.array(z.string()).optional(),
    pull_policy: z
      .union([
        z.enum(['always', 'never', 'build', 'if_not_present', 'missing', 'refresh', 'daily', 'weekly']),
        z.string().regex(/^every_([0-9]+[wdhms])+$/),
      ])
      .optional(),
    pull_refresh_after: z.string().optional(),
    read_only: booleanOrString.optional(),
    restart: z.string().optional(),
    runtime: z.string().optional(),
    scale: stringOrNumber.optional(),
    security_opt: z.array(z.string()).optional(),
    shm_size: stringOrNumber.optional(),
    stdin_open: booleanOrString.optional(),
    stop_grace_period: z.string().optional(),
    stop_signal: z.string().optional(),
    storage_opt: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    tmpfs: stringOrList.optional(),
    tty: booleanOrString.optional(),
    user: z.string().optional(),
    uts: z.string().optional(),
    userns_mode: z.string().optional(),
    working_dir: z.string().optional(),
    attach: booleanOrString.optional(),
    label_file: stringOrList.optional(),
    device_cgroup_rules: z.array(z.string()).optional(),
    use_api_socket: z.boolean().optional(),
  })
  .strict();

export const serviceSchema = composeServiceSchema
  .extend({ name: z.string().min(1, 'Service name must be set') })
  .strict();
