import { describe, expect, it } from 'vitest';

import { stack } from '../lib/stack.js';
import { ComposeDependsOnCondition, ComposeServiceNetworkConfig, NetworkName, ServiceName } from '../lib/types.js';

describe('StackBuilder and ComposeStack', () => {
  it('builds a stack with networks, volumes, secrets, configs, and services', () => {
    const [compose] = stack((s) => {
      s.name('demo-stack');

      const [appNetwork] = s.network((n) => {
        n.name('app');
        n.driver('bridge');
        n.enableIpv6(true);
        n.label('role', 'app');
      });

      s.network((n) => {
        n.name('ext-net');
        n.external('external-net');
      });

      const [dataVolume] = s.volume((v) => {
        v.name('data');
        v.driver('local');
        v.label('tier', 'persistent');
      });

      s.volume((v) => {
        v.name('logs');
        v.external();
      });

      s.secret((sec) => {
        sec.name('db_password');
        sec.file('./secrets/db_password.txt');
      });

      s.config((cfg) => {
        cfg.name('app_config');
        cfg.content('{"enabled":true}');
      });

      const [db] = s.service((svc) => {
        svc.name('db');
        svc.image('postgres:16');
        svc.environment((env) => {
          env.add('POSTGRES_PASSWORD', 'pw');
        });
        svc.volumes((v) => {
          v.quick(dataVolume.name, '/var/lib/postgresql/data');
        });
        svc.networks((n) => {
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
        s.network((n) => {
          n.name('dup');
        });
        s.network((n) => {
          n.name('dup');
        });
      }),
    ).toThrow(/already exists/);
  });

  it('supports ipam and external resources and matches snapshot', () => {
    const [compose] = stack((s) => {
      s.name('external-stack');

      s.network((n) => {
        n.name('custom-net');
        n.driver('bridge');
        n.ipamDriver('my-ipam');
        n.ipamConfig({ subnet: '10.10.0.0/16', ipRange: '10.10.0.0/24', gateway: '10.10.0.1', auxAddresses: { host1: '10.10.0.2' } });
        n.ipamOption('foo', 'bar');
        n.enableIpv4(true);
        n.enableIpv6(false);
        n.attachable(true);
      });

      s.network((n) => {
        n.name('existing');
        n.external('real-net');
      });

      s.volume((v) => {
        v.name('ext-vol');
        v.external();
      });

      s.secret((sec) => {
        sec.name('ext-secret');
        sec.external();
      });

      s.config((cfg) => {
        cfg.name('ext-config');
        cfg.external();
      });

      s.service((svc) => {
        svc.name('only');
        svc.image('busybox');
      });
    });

    expect(compose.toObject()).toMatchSnapshot();
  });

  it('allows building a stack with no services (name only)', () => {
    const [compose] = stack((s) => {
      s.name('empty');
    });

    expect(compose.toObject()).toEqual({ name: 'empty' });
  });
});
