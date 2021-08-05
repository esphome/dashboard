import { fetchApiJson } from ".";

export interface SerialPort {
  desc: string;
  port: string;
}

export const getSerialPorts = () =>
  fetchApiJson<SerialPort[]>("./serial-ports")
    // We don't care about OTA but can't remove yet
    // until all legacy JS is gone
    .then((ports) => ports.filter((port) => port.port !== "OTA"));
