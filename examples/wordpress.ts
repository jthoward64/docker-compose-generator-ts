/**
 * WordPress Example
 *
 * This example demonstrates a WordPress setup with:
 * - WordPress with PHP-FPM
 * - MySQL database
 * - Persistent volumes for data and uploads
 */

import { stack } from '../lib/index.ts';

const [compose] = stack((s) => {
  s.name('wordpress');

  // Define volumes
  s.volumes((v) => {
    v.add({ name: 'db-data' });
    v.add({ name: 'wp-content' });
  });

  // Define network
  const wpNetwork = s.networks((n) => {
    const [handle] = n.add({ name: 'wordpress-net' });
    return handle;
  });

  // MySQL Database
  const [db] = s.service((svc) => {
    svc.name('mysql');
    svc.image('mysql:8.0');
    svc.restart('always');

    svc.environment((env) => {
      env.add('MYSQL_ROOT_PASSWORD', 'rootpassword');
      env.add('MYSQL_DATABASE', 'wordpress');
      env.add('MYSQL_USER', 'wordpress');
      env.add('MYSQL_PASSWORD', 'wordpress');
    });

    svc.volumes((v) => {
      v.quick('db-data', '/var/lib/mysql');
    });

    svc.networks((n) => {
      n.add(wpNetwork);
    });

    svc.healthcheck({
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
      interval: '10s',
      timeout: '5s',
      retries: 5,
    });
  });

  // WordPress
  s.service((svc) => {
    svc.name('wordpress');
    svc.image('wordpress:latest');
    svc.restart('always');

    svc.ports((p) => {
      p.quick(8080, 80);
    });

    svc.environment((env) => {
      env.add('WORDPRESS_DB_HOST', 'mysql');
      env.add('WORDPRESS_DB_USER', 'wordpress');
      env.add('WORDPRESS_DB_PASSWORD', 'wordpress');
      env.add('WORDPRESS_DB_NAME', 'wordpress');
    });

    svc.volumes((v) => {
      v.quick('wp-content', '/var/www/html/wp-content');
    });

    svc.networks((n) => {
      n.add(wpNetwork);
    });

    svc.depends((d) => {
      d.on(db, 'service_healthy');
    });
  });
});

console.log(compose.toYAML());
