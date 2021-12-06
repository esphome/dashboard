import { fetchApiJson, fetchApiText, streamLogs } from ".";

export interface CreateConfigParams {
  name: string;
  board: string;
  platform: "ESP8266" | "ESP32";
}

export interface Configuration {
  storage_version: number;
  name: string;
  comment: string | null;
  esphome_version: string;
  src_version: number;
  arduino_version: string;
  address: string;
  esp_platform: "esp8266" | "esp32";
  board: string;
  build_path: string;
  firmware_bin_path: string;
  loaded_integrations: string[];
}

export type Manifest = { path: string; offset: number }[];

export const createConfiguration = (params: CreateConfigParams) =>
  fetchApiText("./wizard", {
    method: "post",
    body: JSON.stringify(params),
  });

export const getConfiguration = (configuration: string) =>
  fetchApiJson<Configuration>(`./info?configuration=${configuration}`);

export const deleteConfiguration = (configuration: string) =>
  fetchApiText(`./delete?configuration=${configuration}`, {
    method: "post",
  });

export const compileConfiguration = (configuration: string) =>
  streamLogs("compile", { configuration });

export const getConfigurationManifest = (configuration: string) =>
  fetchApiJson<Manifest>(`./manifest.json?configuration=${configuration}`);
