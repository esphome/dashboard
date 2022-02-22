import { fetchApiJson, fetchApiText } from ".";
import { createPollingCollection } from "../util/polling-collection";
import { SupportedPlatforms } from "./configuration";

export interface ConfiguredDevice {
  name: string;
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
  package_import_url: string;
  project_name: string;
  project_version: string;
}

export interface ListDevicesResult {
  configured: ConfiguredDevice[];
  importable: ImportableDevice[];
}

export const getDevices = () => fetchApiJson<ListDevicesResult>("./devices");

export const importDevice = (params: ImportableDevice) =>
  fetchApiText("./import", {
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
