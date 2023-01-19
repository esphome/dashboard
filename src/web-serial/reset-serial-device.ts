import { Transport } from "esptool-js";
import { sleep } from "../util/sleep";

export const resetSerialDevice = async (transport: Transport) => {
  await transport.setRTS(true); // EN->LOW
  await sleep(100);
  await transport.setRTS(false);
};
