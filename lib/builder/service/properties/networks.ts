import type { ComposeServiceNetworkConfig, NetworkHandle, ServiceNetworkAttachment } from '../../../types.ts';
import type { ServiceState } from '../service-state.ts';

const toComposeNetworkAttachment = (
  attachment: ServiceNetworkAttachment,
): ComposeServiceNetworkConfig => {
  const output: ComposeServiceNetworkConfig = {};
  if (attachment.aliases) output.aliases = attachment.aliases;
  if (attachment.ipv4Address) output.ipv4_address = attachment.ipv4Address;
  if (attachment.ipv6Address) output.ipv6_address = attachment.ipv6Address;
  if (attachment.interfaceName) output.interface_name = attachment.interfaceName;
  if (attachment.linkLocalIps) output.link_local_ips = attachment.linkLocalIps;
  if (attachment.macAddress) output.mac_address = attachment.macAddress;
  if (attachment.driverOpts) output.driver_opts = attachment.driverOpts;
  if (attachment.priority !== undefined) output.priority = attachment.priority;
  if (attachment.gwPriority !== undefined) output.gw_priority = attachment.gwPriority;
  return output;
};

export class ServiceNetworksBuilder {
  private readonly state: ServiceState;

  constructor(state: ServiceState) {
    this.state = state;
  }

  add(network: NetworkHandle, attachment?: ServiceNetworkAttachment): void {
    const config = attachment ? toComposeNetworkAttachment(attachment) : {};
    this.state.setNetwork(network.name, config);
  }
}
