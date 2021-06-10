import { fetchApi } from ".";

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

export const getConfiguration = (filename: string) =>
  fetchApi<Configuration>(`./info?configuration=${filename}`);

export const deleteConfiguration = (filename: string) =>
  fetchApi(`./delete?configuration=${filename}`, {
    method: "post",
  });

export const compileConfiguration = (filename: string) => {
  const url = new URL("./compile", location.href);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  const socket = new WebSocket(url.toString());

  return new Promise((resolve, reject) => {
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.event !== "exit") {
        return;
      }

      if (data.code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`Error compiling configuration (${data.code})`));
      }
    });

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          configuration: filename,
          port: "OTA",
          type: "spawn",
        })
      );
    });

    socket.addEventListener("close", () => {
      reject(new Error("Unexecpted socket closure"));
    });
  });
};
