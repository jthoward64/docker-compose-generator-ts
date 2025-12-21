import { describe, expect, it } from 'vitest';

import { stack } from '../lib/stack.js';

describe('Service DSL helpers', () => {
  it('supports quick helpers for ports, volumes, ulimits, gpus, and depends', () => {
    const [compose] = stack((s) => {
      s.name('helpers');

      s.service((svc) => {
        svc.name('worker');
        svc.image('busybox');

        svc.ports((p) => {
          p.quick(8080, 80);
          p.quick(9000);
          p.add({ target: 443, published: 4443, protocol: 'tcp' });
        });

        svc.volumes((v) => {
          v.quick('/host/path', '/container', 'ro');
          v.add({ type: 'volume', source: 'named', target: '/data', read_only: true });
        });

        svc.ulimits((u) => {
          u.quick('nofile', 1024);
          u.add('memlock', -1, -1);
        });

        svc.gpus((g) => {
          g.all();
        });

        svc.depends((d) => {
          d.add({ name: 'other-service' } as any);
        });
      });
    });

    const worker = compose.toObject().services?.worker;
    expect(worker?.ports).toEqual([
      { target: 80, published: 8080 },
      { target: 9000 },
      { target: 443, published: 4443, protocol: 'tcp' },
    ]);

    expect(worker?.volumes).toEqual([
      '/host/path:/container:ro',
      { type: 'volume', source: 'named', target: '/data', read_only: true },
    ]);

    expect(worker?.ulimits).toEqual({
      nofile: 1024,
      memlock: { soft: -1, hard: -1 },
    });

    expect(worker?.gpus).toBe('all');
    expect(worker?.depends_on).toEqual(['other-service']);
  });

  it('covers networking/expose and mixed depends_on paths', () => {
    let a: any;
    let b: any;
    const [compose] = stack((s) => {
      const [aHandle] = s.service((svc) => {
        svc.name('a');
        svc.image('alpine');
      });
      a = aHandle;

      const [bHandle] = s.service((svc) => {
        svc.name('b');
        svc.image('alpine');
        svc.expose((e) => e.add(7000));
        svc.dns((d) => d.add('8.8.8.8'));
        svc.dnsOpt((d) => d.add('rotate'));
        svc.dnsSearch((d) => d.add('example.local'));
        svc.extraHosts((h) => h.add('db', '10.0.0.5'));
        svc.links((l) => l.add('legacy')); 
        svc.externalLinks((l) => l.add('ext:alias'));
        svc.depends((d) => {
          d.add(a);
          d.on({ name: 'c' } as any, 'service_healthy');
        });
      });
      b = bHandle;
    });

    const obj = compose.toObject();
    const svc = obj.services?.b;
    expect(svc?.expose).toEqual([7000]);
    expect(svc?.dns).toEqual(['8.8.8.8']);
    expect(svc?.dns_opt).toEqual(['rotate']);
    expect(svc?.dns_search).toEqual(['example.local']);
    expect(svc?.extra_hosts).toEqual({ db: '10.0.0.5' });
    expect(svc?.links).toEqual(['legacy']);
    expect(svc?.external_links).toEqual(['ext:alias']);
    // depends_on should become record because a condition was used
    expect(svc?.depends_on).toEqual({ a: { condition: 'service_started' }, c: { condition: 'service_healthy' } });
  });


  it('requires service name before build', () => {
    const buildStack = () =>
      stack((s) => {
        s.service((svc) => {
          svc.image('alpine');
        });
      });

    expect(buildStack).toThrow(/Service name must be set/);
  });
});
