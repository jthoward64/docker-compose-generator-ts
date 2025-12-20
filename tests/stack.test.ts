import { describe, expect, it } from 'vitest';

import { stack } from '../lib/stack.js';
import { ComposeDependsOnCondition, ComposeServiceNetworkConfig, NetworkName, ServiceName } from '../lib/types.js';

describe('StackBuilder and ComposeStack', () => {
  it('builds a stack with networks, volumes, secrets, configs, and services', () => {
    let appNetwork: { name: string } | undefined;

    const compose = stack((s) => {
      s.name('demo-stack');

      s.networks((n) => {
        appNetwork = n.add({ name: 'app', driver: 'bridge', enableIpv6: true, labels: { role: 'app' } });
        n.external('ext-net', 'external-net');
      });

      s.volumes((v) => {
        v.add({ name: 'data', driver: 'local', labels: { tier: 'persistent' } });
        v.external('logs');
      });

      s.secrets((sec) => {
        sec.file('db_password', './secrets/db_password.txt');
      });

      s.configs((cfg) => {
        cfg.content('app_config', '{"enabled":true}');
      });

      const db = s.service((svc) => {
        svc.name('db');
        svc.image('postgres:16');
        svc.environment((env) => {
          env.add('POSTGRES_PASSWORD', 'pw');
        });
        svc.volumes((v) => {
          v.quick('data', '/var/lib/postgresql/data');
        });
        svc.networks((n) => {
          if (!appNetwork) throw new Error('network missing');
          n.add(appNetwork);
        });
        svc.healthcheck({
          test: ['CMD-SHELL', 'pg_isready -U postgres'],
          interval: '10s',
          timeout: '5s',
          retries: 3,
        });
      });

      s.service((svc) => {
        svc.name('api');
        svc.image('node:20');
        svc.ports((p) => {
          p.quick(8080, 3000);
          p.add({ target: 9229, published: 49229, protocol: 'tcp' });
        });
        svc.networks((n) => {
          if (!appNetwork) throw new Error('network missing');
          n.add(appNetwork, (cfg) => {
            cfg.alias('api');
            cfg.ipv4Address('172.30.0.10');
            cfg.macAddress('02:42:ac:11:00:0a');
            cfg.driverOpt('com.docker.network', 'custom');
            cfg.linkLocalIp('169.254.1.1');
            cfg.priority(10);
            cfg.gwPriority(5);
          });
        });
        svc.depends((d) => {
          d.on(db, 'service_healthy');
        });
        svc.environment((env) => {
          env.add('NODE_ENV', 'production');
        });
      });
    });

    const obj = compose.toObject();

    expect(obj.name).toBe('demo-stack');
    expect(obj.networks?.app?.driver).toBe('bridge');
    expect(obj.networks?.app?.enable_ipv6).toBe(true);
    expect(obj.networks?.['ext-net']?.external).toEqual({ name: 'external-net' });

    expect(obj.volumes?.data?.driver).toBe('local');
    expect(obj.volumes?.logs?.external).toBe(true);

    expect(obj.secrets?.db_password?.file).toBe('./secrets/db_password.txt');
    expect(obj.configs?.app_config?.content).toBe('{"enabled":true}');

    const api = obj.services?.api;
    const dbService = obj.services?.db;
    expect(api?.ports).toEqual([
      { target: 3000, published: 8080 },
      { target: 9229, published: 49229, protocol: 'tcp' },
    ]);
    const networksRecord = (api?.networks as Record<NetworkName, ComposeServiceNetworkConfig | null>);
    expect(networksRecord?.app?.aliases).toContain('api');
    expect(networksRecord?.app?.ipv4_address).toBe('172.30.0.10');
    expect(networksRecord?.app?.mac_address).toBe('02:42:ac:11:00:0a');
    expect(networksRecord?.app?.driver_opts?.['com.docker.network']).toBe('custom');
    expect((api?.depends_on as Record<ServiceName, ComposeDependsOnCondition>)?.db?.condition).toBe('service_healthy');
    expect(api?.environment).toEqual({ NODE_ENV: 'production' });

    expect(dbService?.healthcheck?.interval).toBe('10s');
    expect(dbService?.volumes?.[0]).toBe('data:/var/lib/postgresql/data');

    const yaml = compose.toYAML();
    expect(yaml).toContain('services:');
    expect(yaml).toContain('api:');
    expect(yaml).toContain('db:');
  });

  it('throws when adding duplicate networks', () => {
    expect(() =>
      stack((s) => {
        s.networks((n) => {
          n.add({ name: 'dup' });
          n.add({ name: 'dup' });
        });
      }),
    ).toThrow(/already exists/);
  });

  it('supports ipam and external resources and matches snapshot', () => {
    const compose = stack((s) => {
      s.name('external-stack');

      s.networks((n) => {
        n.add({
          name: 'custom-net',
          driver: 'bridge',
          ipam: {
            driver: 'my-ipam',
            config: [{ subnet: '10.10.0.0/16', ipRange: '10.10.0.0/24', gateway: '10.10.0.1', auxAddresses: { host1: '10.10.0.2' } }],
            options: { foo: 'bar' },
          },
          enableIpv4: true,
          enableIpv6: false,
          attachable: true,
        });
        n.external('existing', 'real-net');
      });

      s.volumes((v) => {
        v.external('ext-vol');
      });

      s.secrets((sec) => {
        sec.external('ext-secret');
      });

      s.configs((cfg) => {
        cfg.external('ext-config');
      });

      s.service((svc) => {
        svc.name('only');
        svc.image('busybox');
      });
    });

    expect(compose.toObject()).toMatchSnapshot();
  });

  it('allows building a stack with no services (name only)', () => {
    const compose = stack((s) => {
      s.name('empty');
    });

    expect(compose.toObject()).toEqual({ name: 'empty' });
  });
});
