import { Transport, ESPLoader, IEspLoaderTerminal } from "esptool-js";

export const createESPLoader = (
  port: SerialPort,
  terminal?: IEspLoaderTerminal,
) => {
  const transport = new Transport(port);
  return new ESPLoader({
    transport,
    baudrate: 115200,
    romBaudrate: 115200,
    enableTracing: false,
    terminal,
  });
};
