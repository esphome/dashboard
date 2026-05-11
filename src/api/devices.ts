import { fetchApiJson } from ".";
import { SupportedPlatforms } from "../const";
import { createWebSocketCollection } from "../util/websocket-collection";
import { ServerEvent } from "./dashboard-events";
import type { InitialStateData, QueuedChangedData } from "./websocket"; //

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
  is_queued: boolean; //
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

export const cancelQueuedUpdate = (configuration: string) =>
  fetchApiJson<{}>("./cancel-queue", {
    method: "post",
    body: JSON.stringify({ configuration }),
  });

// Use WebSocket for real-time device updates
const devicesCollection = createWebSocketCollection<ListDevicesResult>({
  [ServerEvent.INITIAL_STATE]: (_, data: InitialStateData) => {
    // Map initial queue status from the backend to the device objects
    const configuredWithQueue = data.devices.configured.map((device) => ({
      ...device,
      is_queued: data.queued && data.queued[device.configuration] === true,
    }));

    return {
      ...data.devices,
      configured: configuredWithQueue,
    };
  },
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
  // Handle real-time updates when a device is added to or removed from the queue
  [ServerEvent.QUEUED_STATE_CHANGED]: (current, data: QueuedChangedData) => ({
    ...current,
    configured: current.configured.map((d) =>
      d.configuration === data.filename ? { ...d, is_queued: data.state } : d,
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
