import { fetchApiJson } from ".";
import { SupportedPlatforms } from "../const";
import { createWebSocketCollection } from "../util/websocket-collection";
import { ServerEvent } from "./dashboard-events";

export interface ConfiguredDevice {
  name: string;
  friendly_name?: string;
  configuration: string;
  loaded_integrations?: string[];
  deployed_version?: string;
  current_version?: string;
  path: string;
  comment?: string;
  address?: string;
  web_port?: number;
  target_platform: SupportedPlatforms;
}

export interface ImportableDevice {
  name: string;
  friendly_name?: string;
  package_import_url: string;
  project_name: string;
  project_version: string;
  network: "ethernet" | "wifi";
  ignored: boolean;
}

export interface ListDevicesResult {
  configured: ConfiguredDevice[];
  importable: ImportableDevice[];
}

export const getDevices = () => fetchApiJson<ListDevicesResult>("./devices");

export const importDevice = (params: ImportableDevice) =>
  fetchApiJson<{ configuration: string }>("./import", {
    method: "post",
    body: JSON.stringify({ ...params, encryption: true }),
  });

// Use WebSocket for real-time device updates
const devicesCollection = createWebSocketCollection<ListDevicesResult>({
  [ServerEvent.INITIAL_STATE]: (_, data) => data.devices,
  [ServerEvent.ENTRY_ADDED]: (current, data) => ({
    ...current,
    configured: [...current.configured, data.device],
    // Remove from importable if it exists there
    importable: current.importable.filter((d) => d.name !== data.device.name),
  }),
  [ServerEvent.ENTRY_REMOVED]: (current, data) => ({
    ...current,
    configured: current.configured.filter((d) => d.name !== data.device.name),
  }),
  [ServerEvent.ENTRY_UPDATED]: (current, data) => ({
    ...current,
    configured: current.configured.map((d) =>
      d.name === data.device.name ? data.device : d,
    ),
  }),
  [ServerEvent.IMPORTABLE_DEVICE_ADDED]: (current, data) => {
    // Don't add to importable if already in configured
    const isConfigured = current.configured.some(
      (d) => d.name === data.device.name,
    );
    if (isConfigured) {
      return current;
    }
    return {
      ...current,
      importable: [
        ...current.importable.filter((d) => d.name !== data.device.name),
        data.device,
      ],
    };
  },
  [ServerEvent.IMPORTABLE_DEVICE_REMOVED]: (current, data) => ({
    ...current,
    importable: current.importable.filter((d) => d.name !== data.name),
  }),
});

export const subscribeDevices = (
  onChange: (data: ListDevicesResult) => void,
) => {
  return devicesCollection.subscribe(onChange);
};

export const refreshDevices = () => {
  devicesCollection.refresh();
};

export const canUpdateDevice = (device: ConfiguredDevice) =>
  device.current_version !== device.deployed_version;
