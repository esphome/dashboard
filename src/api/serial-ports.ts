import { fetchApiJson } from ".";

export interface ServerSerialPort {
  desc: string;
  port: string;
}

export const getSerialPorts = () =>
  fetchApiJson<ServerSerialPort[]>("./serial-ports")
    // We don't care about OTA but can't remove yet
    // until all legacy JS is gone
    .then((ports) => ports.filter((port) => port.port !== "OTA"));
