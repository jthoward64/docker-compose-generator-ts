/**
 * GPU Machine Learning Training Example
 *
 * This example demonstrates a GPU-enabled ML training setup with:
 * - PyTorch training container with GPU access
 * - TensorBoard for visualization
 * - MLflow for experiment tracking
 * - MinIO for artifact storage
 */

import { stack } from "../lib/index.ts";

const [compose] = stack((s) => {
  s.name("ml-training");

  // Define volumes
  s.volume((v) => v.name("mlflow-data"));
  s.volume((v) => v.name("minio-data"));
  s.volume((v) => v.name("training-data"));
  s.volume((v) => v.name("model-artifacts"));

  // Define network
  const [mlNetwork] = s.network((n) => {
    n.name("ml-network");
  });

  // MinIO (S3-compatible storage)
  const [minio] = s.service((svc) => {
    svc.name("minio");
    svc.image("minio/minio");
    svc.restart("unless-stopped");
    svc.command('server /data --console-address ":9001"');

    svc.environment("MINIO_ROOT_USER", "minioadmin");
    svc.environment("MINIO_ROOT_PASSWORD", "minioadmin");

    svc.ports(9000, 9000); // API
    svc.ports(9001, 9001); // Console

    svc.volumes("minio-data", "/data");

    svc.network((n) => {
      n.handle(mlNetwork);
    });

    svc.healthcheck({
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"],
      interval: "30s",
      timeout: "10s",
      retries: 3,
    });
  });

  // MLflow Tracking Server
  const [mlflow] = s.service((svc) => {
    svc.name("mlflow");
    svc.image("ghcr.io/mlflow/mlflow:v2.10.0");
    svc.restart("unless-stopped");
    svc.command([
      "mlflow",
      "server",
      "--host",
      "0.0.0.0",
      "--port",
      "5000",
      "--backend-store-uri",
      "sqlite:///mlflow/mlflow.db",
      "--default-artifact-root",
      "s3://mlflow-artifacts",
    ]);

    svc.environment("MLFLOW_S3_ENDPOINT_URL", "http://minio:9000");
    svc.environment("AWS_ACCESS_KEY_ID", "minioadmin");
    svc.environment("AWS_SECRET_ACCESS_KEY", "minioadmin");

    svc.ports(5000, 5000);

    svc.volumes("mlflow-data", "/mlflow");

    svc.network((n) => {
      n.handle(mlNetwork);
    });

    svc.depends(minio, "service_healthy");
  });

  // TensorBoard
  s.service((svc) => {
    svc.name("tensorboard");
    svc.image("tensorflow/tensorflow:latest");
    svc.restart("unless-stopped");
    svc.command("tensorboard --logdir=/logs --host=0.0.0.0");

    svc.ports(6006, 6006);

    svc.volumes("./logs", "/logs", "ro");

    svc.network((n) => {
      n.handle(mlNetwork);
    });
  });

  // PyTorch Training Container with GPU
  s.service((svc) => {
    svc.name("trainer");
    svc.build((b) => {
      b.context("./trainer");
      b.dockerfile("Dockerfile.gpu");
    });
    svc.runtime("nvidia");

    // Request all GPUs
    svc.gpus((g) => {
      g.all();
    });

    svc.environment("MLFLOW_TRACKING_URI", "http://mlflow:5000");
    svc.environment("MLFLOW_S3_ENDPOINT_URL", "http://minio:9000");
    svc.environment("AWS_ACCESS_KEY_ID", "minioadmin");
    svc.environment("AWS_SECRET_ACCESS_KEY", "minioadmin");
    svc.environment("CUDA_VISIBLE_DEVICES", "0,1");

    svc.volumes("training-data", "/data");
    svc.volumes("model-artifacts", "/models");
    svc.volumes("./src", "/app/src");
    svc.volumes("./logs", "/app/logs");

    svc.network((n) => {
      n.handle(mlNetwork);
    });

    svc.depends(mlflow);
    svc.depends(minio);

    // Increase shared memory for PyTorch DataLoader
    svc.shmSize("8gb");

    // Set resource limits
    svc.memLimit("32g");

    svc.ulimits("memlock", -1, -1); // Unlimited
    svc.ulimits("stack", 67108864, 67108864);
  });
});

console.log(compose.toYAML());
