import { z } from 'zod';
import { composeServiceSchema } from '../service/service-schemas.ts';

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

// ─────────────────────────────────────────────────────────────────────────────
// IPAM
// ─────────────────────────────────────────────────────────────────────────────
const ipamConfigSchema = z
  .object({
    subnet: z.string().optional(),
    ip_range: z.string().optional(),
    gateway: z.string().optional(),
    aux_addresses: z.record(z.string(), z.string()).optional(),
  })
  .strict();

const ipamSchema = z
  .object({
    driver: z.string().optional(),
    config: z.array(ipamConfigSchema).optional(),
    options: z.record(z.string(), z.string()).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Network
// ─────────────────────────────────────────────────────────────────────────────
export const networkSchema = z
  .union([
    z
      .object({
        name: z.string().optional(),
        external: z.union([z.literal(true), z.object({ name: z.string() }).strict()]),
      })
      .strict(),
    z
      .object({
        name: z.string().optional(),
        driver: z.string().optional(),
        driver_opts: z.record(z.string(), stringOrNumber).optional(),
        ipam: ipamSchema.optional(),
        external: z.literal(false).optional(),
        internal: booleanOrString.optional(),
        enable_ipv4: booleanOrString.optional(),
        enable_ipv6: booleanOrString.optional(),
        attachable: booleanOrString.optional(),
        labels: listOrDict.optional(),
      })
      .strict(),
  ])
  .nullable();

// ─────────────────────────────────────────────────────────────────────────────
// Volume
// ─────────────────────────────────────────────────────────────────────────────
export const volumeSchema = z
  .union([
    z
      .object({
        name: z.string().optional(),
        external: z.union([z.literal(true), z.object({ name: z.string() }).strict()]),
      })
      .strict(),
    z
      .object({
        name: z.string().optional(),
        driver: z.string().optional(),
        driver_opts: z.record(z.string(), stringOrNumber).optional(),
        external: z.literal(false).optional(),
        labels: listOrDict.optional(),
      })
      .strict(),
  ])
  .nullable();

// ─────────────────────────────────────────────────────────────────────────────
// Secret
// ─────────────────────────────────────────────────────────────────────────────
export const secretSchema = z
  .union([
    z
      .object({
        name: z.string().optional(),
        external: z.union([z.literal(true), z.object({ name: z.string() }).strict()]),
      })
      .strict(),
    z
      .object({
        name: z.string().optional(),
        file: z.string().optional(),
        environment: z.string().optional(),
        external: z.literal(false).optional(),
        labels: listOrDict.optional(),
        driver: z.string().optional(),
        driver_opts: z.record(z.string(), stringOrNumber).optional(),
        template_driver: z.string().optional(),
      })
      .strict(),
  ]);

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
export const configSchema = z
  .union([
    z
      .object({
        name: z.string().optional(),
        external: z.union([z.literal(true), z.object({ name: z.string() }).strict()]),
      })
      .strict(),
    z
      .object({
        name: z.string().optional(),
        file: z.string().optional(),
        content: z.string().optional(),
        environment: z.string().optional(),
        external: z.literal(false).optional(),
        labels: listOrDict.optional(),
        template_driver: z.string().optional(),
      })
      .strict(),
  ]);

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────
export const modelSchema = z
  .object({
    name: z.string().optional(),
    model: z.string(),
    context_size: z.number().optional(),
    runtime_flags: z.array(z.string()).optional(),
  })
  .strict();

// ─────────────────────────────────────────────────────────────────────────────
// Include
// ─────────────────────────────────────────────────────────────────────────────
const includeConfigSchema = z
  .object({
    path: stringOrList,
    env_file: stringOrList.optional(),
    project_directory: z.string().optional(),
  })
  .strict();

export const includeSchema = z.union([z.string(), includeConfigSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// ComposeFile
// ─────────────────────────────────────────────────────────────────────────────
export const composeFileSchema = z
  .object({
    version: z.string().optional(),
    name: z.string().optional(),
    include: z.array(includeSchema).optional(),
    services: z.record(z.string(), composeServiceSchema).optional(),
    networks: z.record(z.string(), networkSchema).optional(),
    volumes: z.record(z.string(), volumeSchema).optional(),
    secrets: z.record(z.string(), secretSchema).optional(),
    configs: z.record(z.string(), configSchema).optional(),
    models: z.record(z.string(), modelSchema).optional(),
  })
  .strict();
