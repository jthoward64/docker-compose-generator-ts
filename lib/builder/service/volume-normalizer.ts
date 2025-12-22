import type {
  ComposeServiceVolume,
  ComposeVolumeBindOptions,
  ComposeVolumeConfig,
  ServiceVolumeInput,
} from "../../types.ts";

export const normalizeVolumeInput = (
  input: ServiceVolumeInput
): ComposeServiceVolume => {
  const config: ComposeVolumeConfig = { type: input.type };

  if (input.source) config.source = input.source;
  if (input.target) config.target = input.target;
  if (input.consistency) config.consistency = input.consistency;
  if (input.readOnly !== undefined) config.read_only = input.readOnly;

  if (input.bind) {
    const { createHostPath, ...rest } = input.bind;
    const bind: ComposeVolumeBindOptions = { ...rest };
    if (createHostPath !== undefined) bind.create_host_path = createHostPath;
    config.bind = bind;
  }

  if (input.volume) config.volume = { ...input.volume };
  if (input.tmpfs) config.tmpfs = { ...input.tmpfs };
  if (input.image) config.image = { ...input.image };

  return config;
};
