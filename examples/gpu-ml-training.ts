/**
 * GPU Machine Learning Training Example
 *
 * This example demonstrates a GPU-enabled ML training setup with:
 * - PyTorch training container with GPU access
 * - TensorBoard for visualization
 * - MLflow for experiment tracking
 * - MinIO for artifact storage
 */

import { stack } from '../lib/index.ts';

const [compose] = stack((s) => {
  s.name('ml-training');

  // Define volumes
  s.volumes((v) => {
    v.add({ name: 'mlflow-data' });
    v.add({ name: 'minio-data' });
    v.add({ name: 'training-data' });
    v.add({ name: 'model-artifacts' });
  });

  // Define network
  const mlNetwork = s.networks((n) => {
    const [handle] = n.add({ name: 'ml-network' });
    return handle;
  });

  // MinIO (S3-compatible storage)
  const [minio] = s.service((svc) => {
    svc.name('minio');
    svc.image('minio/minio');
    svc.restart('unless-stopped');
    svc.command('server /data --console-address ":9001"');

    svc.environment((env) => {
      env.add('MINIO_ROOT_USER', 'minioadmin');
      env.add('MINIO_ROOT_PASSWORD', 'minioadmin');
    });

    svc.ports((p) => {
      p.quick(9000, 9000); // API
      p.quick(9001, 9001); // Console
    });

    svc.volumes((v) => {
      v.quick('minio-data', '/data');
    });

    svc.networks((n) => {
      n.add(mlNetwork);
    });

    svc.healthcheck({
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live'],
      interval: '30s',
      timeout: '10s',
      retries: 3,
    });
  });

  // MLflow Tracking Server
  const [mlflow] = s.service((svc) => {
    svc.name('mlflow');
    svc.image('ghcr.io/mlflow/mlflow:v2.10.0');
    svc.restart('unless-stopped');
    svc.command([
      'mlflow', 'server',
      '--host', '0.0.0.0',
      '--port', '5000',
      '--backend-store-uri', 'sqlite:///mlflow/mlflow.db',
      '--default-artifact-root', 's3://mlflow-artifacts',
    ]);

    svc.environment((env) => {
      env.add('MLFLOW_S3_ENDPOINT_URL', 'http://minio:9000');
      env.add('AWS_ACCESS_KEY_ID', 'minioadmin');
      env.add('AWS_SECRET_ACCESS_KEY', 'minioadmin');
    });

    svc.ports((p) => {
      p.quick(5000, 5000);
    });

    svc.volumes((v) => {
      v.quick('mlflow-data', '/mlflow');
    });

    svc.networks((n) => {
      n.add(mlNetwork);
    });

    svc.depends((d) => {
      d.on(minio, 'service_healthy');
    });
  });

  // TensorBoard
  s.service((svc) => {
    svc.name('tensorboard');
    svc.image('tensorflow/tensorflow:latest');
    svc.restart('unless-stopped');
    svc.command('tensorboard --logdir=/logs --host=0.0.0.0');

    svc.ports((p) => {
      p.quick(6006, 6006);
    });

    svc.volumes((v) => {
      v.quick('./logs', '/logs', 'ro');
    });

    svc.networks((n) => {
      n.add(mlNetwork);
    });
  });

  // PyTorch Training Container with GPU
  s.service((svc) => {
    svc.name('trainer');
    svc.build({
      context: './trainer',
      dockerfile: 'Dockerfile.gpu',
    });
    svc.runtime('nvidia');

    // Request all GPUs
    svc.gpus((g) => {
      g.all();
    });

    svc.environment((env) => {
      env.add('MLFLOW_TRACKING_URI', 'http://mlflow:5000');
      env.add('MLFLOW_S3_ENDPOINT_URL', 'http://minio:9000');
      env.add('AWS_ACCESS_KEY_ID', 'minioadmin');
      env.add('AWS_SECRET_ACCESS_KEY', 'minioadmin');
      env.add('CUDA_VISIBLE_DEVICES', '0,1');
    });

    svc.volumes((v) => {
      v.quick('training-data', '/data');
      v.quick('model-artifacts', '/models');
      v.quick('./src', '/app/src');
      v.quick('./logs', '/app/logs');
    });

    svc.networks((n) => {
      n.add(mlNetwork);
    });

    svc.depends((d) => {
      d.add(mlflow);
      d.add(minio);
    });

    // Increase shared memory for PyTorch DataLoader
    svc.shmSize('8gb');

    // Set resource limits
    svc.memLimit('32g');

    svc.ulimits((u) => {
      u.add('memlock', -1, -1); // Unlimited
      u.add('stack', 67108864, 67108864);
    });
  });
});

console.log(compose.toYAML());
