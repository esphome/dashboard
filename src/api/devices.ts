import { fetchApiJson } from ".";
import { SupportedPlatforms } from "../const";
import { createPollingCollection } from "../util/polling-collection";

export interface ConfiguredDevice {
  name: string;
  friendly_name: string;
  configuration: string;
  loaded_integrations: string[];
  deployed_version: string;
  current_version: string;
  path: string;
  comment: string;
  address: string;
  web_port: number;
  target_platform: SupportedPlatforms;
}

export interface ImportableDevice {
  name: string;
  friendly_name: string;
  package_import_url: string;
  project_name: string;
  project_version: string;
  network: "ethernet" | "wifi";
}

export interface ListDevicesResult {
  configured: ConfiguredDevice[];
  importable: ImportableDevice[];
}

export const getDevices = () => fetchApiJson<ListDevicesResult>("./devices");

export const importDevice = (params: ImportableDevice) =>
  fetchApiJson<{ configuration: string }>("./import", {
    method: "post",
    body: JSON.stringify(params),
  });

export const subscribeDevices = createPollingCollection(getDevices, 5000);

export const refreshDevices = () => {
  const unsub = subscribeDevices(() => undefined);
  unsub.refresh();
  unsub();
};

export const canUpdateDevice = (device: ConfiguredDevice) =>
  device.current_version !== device.deployed_version;
