import { describe, expect, it } from "vitest";

import { stack } from "../lib/stack.js";

describe("Service DSL helpers", () => {
  it("supports quick helpers for ports, volumes, ulimits, gpus, and depends", () => {
    const [compose] = stack((s) => {
      s.name("helpers");

      s.service((svc) => {
        svc.name("worker");
        svc.image("busybox");

        svc.ports({ target: 80, published: 8080 });
        svc.ports({ target: 9000 });
        svc.ports({ target: 443, published: 4443, protocol: "tcp" });

        svc.volumes("/host/path", "/container", "ro");
        svc.volumes({
          type: "volume",
          source: "named",
          target: "/data",
          readOnly: true,
        });

        svc.ulimits("nofile", 1024);
        svc.ulimits("memlock", -1, -1);

        svc.gpus((g) => {
          g.all();
        });

        svc.depends({ name: "other-service" } as any);
      });
    });

    const worker = compose.toObject().services?.worker;
    expect(worker?.ports).toEqual([
      { target: 80, published: 8080 },
      { target: 9000 },
      { target: 443, published: 4443, protocol: "tcp" },
    ]);

    expect(worker?.volumes).toEqual([
      "/host/path:/container:ro",
      { type: "volume", source: "named", target: "/data", read_only: true },
    ]);

    expect(worker?.ulimits).toEqual({
      nofile: 1024,
      memlock: { soft: -1, hard: -1 },
    });

    expect(worker?.gpus).toBe("all");
    expect(worker?.depends_on).toEqual(["other-service"]);
  });

  it("covers networking/expose and mixed depends_on paths", () => {
    let a: any;
    let b: any;
    const [compose] = stack((s) => {
      const [aHandle] = s.service((svc) => {
        svc.name("a");
        svc.image("alpine");
      });
      a = aHandle;

      const [bHandle] = s.service((svc) => {
        svc.name("b");
        svc.image("alpine");
        svc.expose(7000);
        svc.dns("8.8.8.8");
        svc.dnsOpt("rotate");
        svc.dnsSearch("example.local");
        svc.extraHosts("db", "10.0.0.5");
        svc.links("legacy");
        svc.externalLinks("ext:alias");
        svc.depends(a);
        svc.depends({ name: "c" } as any, "service_healthy");
      });
      b = bHandle;
    });

    const obj = compose.toObject();
    const svc = obj.services?.b;
    expect(svc?.expose).toEqual([7000]);
    expect(svc?.dns).toEqual(["8.8.8.8"]);
    expect(svc?.dns_opt).toEqual(["rotate"]);
    expect(svc?.dns_search).toEqual(["example.local"]);
    expect(svc?.extra_hosts).toEqual({ db: "10.0.0.5" });
    expect(svc?.links).toEqual(["legacy"]);
    expect(svc?.external_links).toEqual(["ext:alias"]);
    // depends_on should become record because a condition was used
    expect(svc?.depends_on).toEqual({
      a: { condition: "service_started" },
      c: { condition: "service_healthy" },
    });
  });

  it("requires service name before build", () => {
    const buildStack = () =>
      stack((s) => {
        s.service((svc) => {
          svc.image("alpine");
        });
      });

    expect(buildStack).toThrow(/Service name must be set/);
  });

  it("supports configuring build via DSL", () => {
    const [compose] = stack((s) => {
      s.name("build-dsl");

      s.service((svc) => {
        svc.name("api");
        svc.build((b) => {
          b.context("./app");
          b.dockerfile("Dockerfile.dev");
          b.dockerfileInline("FROM node:22");
          b.arg("NODE_ENV", "development");
          b.ssh("default", "ssh-default");
          b.label("org.opencontainers.image.title", "api");
          b.cacheFrom("type=local,src=cache");
          b.cacheTo("type=local,dest=cache");
          b.noCache(true);
          b.additionalContext("common", "./common");
          b.network("host");
          b.target("dev");
          b.shmSize("1g");
          b.extraHost("db", "10.0.0.5");
          b.isolation("process");
          b.privileged(true);
          b.secret("npmrc");
          b.tag("api:dev");
          b.ulimit("nofile", 1024, 2048);
          b.platform("linux/amd64");
          b.pull("always");
          b.provenance(true);
          b.sbom(false);
          b.entitlement("network.host");
        });
      });
    });

    const api = compose.toObject().services?.api;
    expect(api?.build).toEqual({
      context: "./app",
      dockerfile: "Dockerfile.dev",
      dockerfile_inline: "FROM node:22",
      args: { NODE_ENV: "development" },
      ssh: { default: "ssh-default" },
      labels: { "org.opencontainers.image.title": "api" },
      cache_from: ["type=local,src=cache"],
      cache_to: ["type=local,dest=cache"],
      no_cache: true,
      additional_contexts: { common: "./common" },
      network: "host",
      target: "dev",
      shm_size: "1g",
      extra_hosts: { db: "10.0.0.5" },
      isolation: "process",
      privileged: true,
      secrets: ["npmrc"],
      tags: ["api:dev"],
      ulimits: { nofile: { soft: 1024, hard: 2048 } },
      platforms: ["linux/amd64"],
      pull: "always",
      provenance: true,
      sbom: false,
      entitlements: ["network.host"],
    });
  });
});
