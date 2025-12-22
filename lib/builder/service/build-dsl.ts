import type {
  ComposeBuildConfig,
  ComposeServiceSecretConfig,
} from "../../types.ts";
import type { BuildDsl } from "../../dsl/builders.ts";

const ensureRecord = (
  build: ComposeBuildConfig,
  key: keyof ComposeBuildConfig
) => {
  const current = build[key];
  if (!current || Array.isArray(current)) {
    (build as Record<string, unknown>)[key as string] = {};
  }
  return (build as Record<string, unknown>)[key as string] as Record<
    string,
    any
  >;
};

const ensureArray = <T>(
  build: ComposeBuildConfig,
  key: keyof ComposeBuildConfig
) => {
  const current = build[key];
  if (!Array.isArray(current)) {
    (build as Record<string, unknown>)[key as string] = [];
  }
  return (build as Record<string, unknown>)[key as string] as T[];
};

export const createBuildBuilder = () => {
  const build: ComposeBuildConfig = {};

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
      const args = ensureRecord(build, "args");
      args[key] = value;
    },
    ssh: (key, value) => {
      const ssh = ensureRecord(build, "ssh");
      ssh[key] = value;
    },
    label: (key, value) => {
      const labels = ensureRecord(build, "labels");
      labels[key] = value;
    },
    cacheFrom: (value) => {
      ensureArray<string>(build, "cache_from").push(value);
    },
    cacheTo: (value) => {
      ensureArray<string>(build, "cache_to").push(value);
    },
    noCache: (value) => {
      build.no_cache = value;
    },
    additionalContext: (name, path) => {
      const contexts = ensureRecord(build, "additional_contexts");
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
      const hosts = ensureRecord(build, "extra_hosts");
      hosts[host] = address;
    },
    isolation: (value) => {
      build.isolation = value;
    },
    privileged: (value) => {
      build.privileged = value;
    },
    secret: (value) => {
      ensureArray<string | ComposeServiceSecretConfig>(build, "secrets").push(
        value
      );
    },
    tag: (value) => {
      ensureArray<string>(build, "tags").push(value);
    },
    ulimit: (name, soft, hard) => {
      const ulimits = ensureRecord(build, "ulimits");
      ulimits[name] = { soft, hard: hard ?? soft };
    },
    platform: (value) => {
      ensureArray<string>(build, "platforms").push(value);
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
      ensureArray<string>(build, "entitlements").push(value);
    },
  };

  return { dsl, value: build } as const;
};
