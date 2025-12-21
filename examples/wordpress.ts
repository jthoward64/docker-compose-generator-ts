/**
 * WordPress Example
 *
 * This example demonstrates a WordPress setup with:
 * - WordPress with PHP-FPM
 * - MySQL database
 * - Persistent volumes for data and uploads
 */

import { stack } from "../lib/index.ts";

const [compose] = stack((s) => {
  s.name("wordpress");

  // Define volumes
  const [dbData] = s.volume((v) => {
    v.name("db-data");
  });

  const [wpContent] = s.volume((v) => {
    v.name("wp-content");
  });

  // Define network
  const [wpNetwork] = s.network((n) => {
    n.name("wordpress-net");
  });

  // MySQL Database
  const [db] = s.service((svc) => {
    svc.name("mysql");
    svc.image("mysql:8.0");
    svc.restart("always");

    svc.environment("MYSQL_ROOT_PASSWORD", "rootpassword");
    svc.environment("MYSQL_DATABASE", "wordpress");
    svc.environment("MYSQL_USER", "wordpress");
    svc.environment("MYSQL_PASSWORD", "wordpress");

    svc.volumes(dbData.name, "/var/lib/mysql");

    svc.networks((n) => {
      n.add(wpNetwork);
    });

    svc.healthcheck({
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"],
      interval: "10s",
      timeout: "5s",
      retries: 5,
    });
  });

  // WordPress
  s.service((svc) => {
    svc.name("wordpress");
    svc.image("wordpress:latest");
    svc.restart("always");

    svc.ports({ target: 80, published: 8080 });

    svc.environment("WORDPRESS_DB_HOST", "mysql");
    svc.environment("WORDPRESS_DB_USER", "wordpress");
    svc.environment("WORDPRESS_DB_PASSWORD", "wordpress");
    svc.environment("WORDPRESS_DB_NAME", "wordpress");

    svc.volumes(wpContent.name, "/var/www/html/wp-content");

    svc.networks((n) => {
      n.add(wpNetwork);
    });

    svc.depends(db, "service_healthy");
  });
});

console.log(compose.toYAML());
