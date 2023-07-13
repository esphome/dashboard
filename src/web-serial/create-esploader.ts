import { Transport, ESPLoader } from "esptool-js";

export const createESPLoader = (port: SerialPort) => {
  const transport = new Transport(port);
  return new ESPLoader({
    transport,
    baudrate: 115200,
    romBaudrate: 115200,
  });
};
