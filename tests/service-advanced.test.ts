import { describe, expect, it } from "vitest";

import { stack } from "../lib/stack.js";

describe("Service DSL advanced coverage", () => {
  it("builds a fully configured service and matches snapshot", () => {
    const [compose] = stack((s) => {
      s.name("full-service-stack");

      const [netHandle] = s.network((n) => {
        n.name("front");
        n.driver("bridge");
        n.ipamDriver("custom");
        n.ipamConfig({ subnet: "10.5.0.0/16", gateway: "10.5.0.1" });
      });

      const [secretA] = s.secret((sec) => {
        sec.name("api_key");
        sec.file("./secrets/api_key");
      });

      const [secretB] = s.secret((sec) => {
        sec.name("token");
        sec.environment("TOKEN_VAR");
      });

      const [configA] = s.config((cfg) => {
        cfg.name("nginx_conf");
        cfg.file("./nginx.conf");
      });

      const [configB] = s.config((cfg) => {
        cfg.name("app_cfg");
        cfg.content('{"feature":true}');
      });

      s.service((svc) => {
        svc.name("web");
        svc.image("nginx:alpine");
        svc.containerName("web-1");
        svc.hostname("webhost");
        svc.domainname("example.local");
        svc.command(["nginx", "-g", "daemon off;"]);
        svc.entrypoint("/docker-entrypoint.sh");
        svc.workingDir("/app");
        svc.user("1000:1000");

        svc.envFile("./env/common");
        svc.envFile("./env/prod");

        svc.environment("APP_MODE", "prod");
        svc.environment("FEATURE_X", "true");

        svc.labels("traefik.enable", "true");

        svc.annotations("com.example.note", "hello");

        svc.labelFile("./labels.txt");

        svc.networkMode("bridge");
        svc.links("db");
        svc.externalLinks("legacy:alias");
        svc.macAddress("02:42:ac:11:00:0b");

        svc.ports({ target: 80, published: 8080 });
        svc.ports({ target: 443, published: 9443, protocol: "tcp" });

        svc.expose(8081);

        svc.volumes("/host/config", "/etc/nginx/conf.d", "ro");
        svc.volumes({ type: "volume", source: "shared-data", target: "/data" });
        svc.volumesFrom("other-service");
        svc.tmpfs("/tmp");

        svc.secret(secretA!);
        svc.secret(secretB!);

        svc.config(configA!);
        svc.config(configB!);

        svc.healthcheck({
          test: ["CMD", "curl", "-f", "http://localhost"],
          interval: "30s",
          timeout: "5s",
          retries: 2,
        });
        svc.logging({
          driver: "json-file",
          options: { "max-size": "10m", "max-file": 3 },
        });

        svc.deploy({
          replicas: 2,
          restart_policy: { condition: "on-failure" },
          resources: {
            limits: { cpus: "0.50", memory: "256M" },
            reservations: { cpus: "0.25", memory: "128M" },
          },
          labels: { "deploy-label": "yes" },
        });

        svc.develop({
          watch: [
            {
              path: "./src",
              action: "sync",
              target: "/app",
              ignore: ["node_modules"],
              include: ["src/**"],
              initial_sync: true,
              exec: { command: "npm run build", user: "1000" },
            },
          ],
        });

        svc.ulimits("nofile", 1024, 2048);

        svc.sysctls("net.core.somaxconn", 1024);

        svc.blkioConfig({ weight: 10 });
        svc.cpuCount(2);
        svc.cpuPercent(50);
        svc.cpuShares(1024);
        svc.cpuQuota(50000);
        svc.cpuPeriod(100000);
        svc.cpuRtPeriod(200000);
        svc.cpuRtRuntime(150000);
        svc.cpus("1.5");
        svc.cpuset("0,1");
        svc.memLimit("512m");
        svc.memReservation("256m");
        svc.memSwappiness(10);
        svc.memSwapLimit("1g");
        svc.pidsLimit(100);
        svc.shmSize("1g");
        svc.oomKillDisable(true);
        svc.oomScoreAdj(-500);

        svc.devices("/dev/kvm:/dev/kvm");
        svc.deviceCgroupRules("c 10:200 rwm");
        svc.capAdd("NET_ADMIN");
        svc.capDrop("MKNOD");

        svc.gpus((g) => {
          g.add({ device_ids: ["0"], capabilities: ["gpu"] } as any);
        });

        svc.credentialSpec({ file: "spec.json" });
        svc.privileged(true);
        svc.readOnly(false);
        svc.securityOpt("no-new-privileges:true");
        svc.groupAdd("app");
        svc.groupAdd(1001);
        svc.usernsMode("host");

        svc.init(true);
        svc.ipc("shareable");
        svc.isolation("process");
        svc.pid("host");
        svc.platform("linux/amd64");
        svc.restart("always");
        svc.runtime("runc");
        svc.scale(3);
        svc.stopGracePeriod("30s");
        svc.stopSignal("SIGTERM");
        svc.storageOpt("size", "20G");
        svc.tty(true);
        svc.stdinOpen(true);
        svc.uts("host");
        svc.cgroup("host");
        svc.cgroupParent("/sys/fs/cgroup");
        svc.extends({ service: "base", file: "./base.yml" });
        svc.provider({ type: "aws", options: { region: "us-east-1" } });
        svc.profiles("prod");
        svc.profiles("blue");
        svc.pullPolicy("always");
        svc.pullRefreshAfter("24h");
        svc.attach(false);
        svc.useApiSocket(true);

        svc.postStart({ command: "echo post" });
        svc.preStop({ command: ["sleep", "5"] });

        svc.networks((n) => {
          n.add(netHandle!, (a) => {
            a.alias("web");
            a.ipv4Address("10.5.0.10");
            a.interfaceName("eth0");
            a.linkLocalIp("169.254.2.2");
            a.priority(1);
            a.gwPriority(2);
            a.macAddress("02:42:ac:11:00:0c");
            a.driverOpt("com.docker.opt", "1");
          });
        });
      });
    });

    expect(compose.toObject()).toMatchSnapshot();
    expect(compose.toYAML()).toMatchSnapshot();
  });
});
