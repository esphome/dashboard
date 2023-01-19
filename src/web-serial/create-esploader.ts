import { Transport, ESPLoader } from "esptool-js";

export const createESPLoader = (port: SerialPort) => {
  const transport = new Transport(port);
  return new ESPLoader(
    transport,
    115200,
    // Wrong type, fixed in https://github.com/espressif/esptool-js/pull/75/files
    undefined as any
  );
};
