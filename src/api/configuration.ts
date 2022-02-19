import { fetchApiJson, fetchApiText, streamLogs } from ".";

export interface CreateConfigParams {
  name: string;
  ssid: string;
  psk: string;
  board: string;
  platform: "ESP8266" | "ESP32" | "ESP32S2" | "ESP32C3";
}

export interface Configuration {
  storage_version: number;
  name: string;
  comment: string | null;
  esphome_version: string;
  src_version: number;
  arduino_version: string;
  address: string;
  esp_platform:
    | "ESP8266"
    | "ESP32"
    | "ESP32S2"
    | "ESP32S3"
    | "ESP32C3"
    | "ESP32H2";
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

export const compileConfiguration = (
  configuration: string,
  abortController?: AbortController
) => streamLogs("compile", { configuration }, undefined, abortController);

export const getConfigurationManifest = (configuration: string) =>
  fetchApiJson<Manifest>(`./manifest.json?configuration=${configuration}`);

export const getDownloadUrl = (
  configuration: string,
  factoryFirmware: boolean
) => {
  let url = `./download.bin?configuration=${encodeURIComponent(configuration)}`;
  if (factoryFirmware) {
    url += "&type=firmware-factory.bin";
  }
  return url;
};
