import { fetchApi, streamLogs } from ".";

export interface CreateConfigParams {
  name: string;
  ssid: string;
  psk: string;
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
  esp_platform: "ESP8266" | "ESP32";
  board: string;
  build_path: string;
  firmware_bin_path: string;
  loaded_integrations: string[];
}

export const createConfiguration = (params: CreateConfigParams) =>
  fetchApi("./wizard.html", {
    method: "post",
    body: new URLSearchParams(params as any),
  });

export const getConfiguration = (configuration: string) =>
  fetchApi<Configuration>(`./info?configuration=${configuration}`);

export const deleteConfiguration = (configuration: string) =>
  fetchApi(`./delete?configuration=${configuration}`, {
    method: "post",
  });

export const compileConfiguration = (configuration: string) =>
  streamLogs("compile", { configuration });
