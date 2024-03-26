import { fetchApiJson } from ".";

export interface ServerSerialPort {
  desc: string;
  port: string;
}

export const getOTAPorts = () =>
  fetchApiJson<ServerSerialPort[]>("./ota-ports")
    // We don't care about OTA but can't remove yet
    // until all legacy JS is gone
    .then((ports) => ports.filter((port) => port.port === "OTA" || port.port.substr(0, 4) == "OTA-"));
