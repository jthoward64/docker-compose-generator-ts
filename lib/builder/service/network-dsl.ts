import type { NetworkDsl, NetworkFn } from "../../dsl/builders.ts";
import type { NetworkHandle, ServiceNetworkAttachment } from "../../types.ts";

export const runNetworkDsl = <R>(
  fn: NetworkFn<R>,
  addAttachment: (
    network: NetworkHandle,
    attachment?: ServiceNetworkAttachment
  ) => void
): R => {
  let currentNetwork: NetworkHandle | null = null;
  let currentAttachment: ServiceNetworkAttachment | null = null;

  const flush = () => {
    if (!currentNetwork) return;
    const attachmentToSave =
      currentAttachment && Object.keys(currentAttachment).length > 0
        ? currentAttachment
        : undefined;
    addAttachment(currentNetwork, attachmentToSave);
    currentNetwork = null;
    currentAttachment = null;
  };

  const ensureAttachment = (): ServiceNetworkAttachment => {
    if (!currentNetwork) {
      throw new Error("Call handle(network) before configuring it");
    }
    if (!currentAttachment) {
      currentAttachment = {};
    }
    return currentAttachment;
  };

  const dsl: NetworkDsl = {
    handle: (network) => {
      flush();
      currentNetwork = network;
    },
    alias: (alias) => {
      const attachment = ensureAttachment();
      if (!attachment.aliases) attachment.aliases = [];
      attachment.aliases.push(alias);
    },
    ipv4Address: (address) => {
      const attachment = ensureAttachment();
      attachment.ipv4Address = address;
    },
    ipv6Address: (address) => {
      const attachment = ensureAttachment();
      attachment.ipv6Address = address;
    },
    interfaceName: (name) => {
      const attachment = ensureAttachment();
      attachment.interfaceName = name;
    },
    linkLocalIp: (ip) => {
      const attachment = ensureAttachment();
      if (!attachment.linkLocalIps) attachment.linkLocalIps = [];
      attachment.linkLocalIps.push(ip);
    },
    macAddress: (address) => {
      const attachment = ensureAttachment();
      attachment.macAddress = address;
    },
    driverOpt: (key, value) => {
      const attachment = ensureAttachment();
      if (!attachment.driverOpts) attachment.driverOpts = {};
      attachment.driverOpts[key] = value;
    },
    priority: (value) => {
      const attachment = ensureAttachment();
      attachment.priority = value;
    },
    gwPriority: (value) => {
      const attachment = ensureAttachment();
      attachment.gwPriority = value;
    },
  };

  const result = fn(dsl);
  flush();
  return result;
};
