import { ESPLoader } from "esp-web-flasher";
import { getConfiguration } from "./api";
import { chipFamilyToPlatform } from "./const";

export const flashConfiguration = async (
  esploader: ESPLoader,
  filename: string,
  erase: boolean,
  writeProgress: (pct: number) => void
) => {
  const config = await getConfiguration(filename);

  if (chipFamilyToPlatform[esploader.chipFamily] !== config.esp_platform) {
    throw new Error(
      `Configuration does not match the platform of the connected device. Expected a ${config.esp_platform} device.`
    );
  }

  let toFlash: { path: string; offset: number }[];

  if (config.esp_platform === "ESP32") {
    toFlash = [
      { path: "./static/firmware/bootloader.bin", offset: 4096 },
      { path: "./static/firmware/partitions.bin", offset: 32768 },
      { path: "./static/firmware/ota.bin", offset: 57344 },
      { path: `./download.bin?configuration=${filename}`, offset: 65536 },
    ];
  } else {
    toFlash = [{ path: `./download.bin?configuration=${filename}`, offset: 0 }];
  }

  const filePromises = toFlash.map(async (part) => {
    const url = new URL(part.path, location.href).toString();
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(
        `Downlading firmware ${part.path} failed: ${resp.status}`
      );
    }
    return resp.arrayBuffer();
  });

  const files: ArrayBuffer[] = [];
  let totalSize = 0;

  for (const prom of filePromises) {
    const data = await prom;
    files.push(data);
    totalSize += data.byteLength;
  }

  const espStub = await esploader.runStub();

  if (erase) {
    await espStub.eraseFlash();
  }

  let lastPct = 0;
  let totalWritten = 0;
  writeProgress(0);

  for (const part of toFlash) {
    const file = files.shift()!;
    await espStub.flashData(
      file,
      (bytesWritten) => {
        const newPct = Math.floor(
          ((totalWritten + bytesWritten) / totalSize) * 100
        );
        if (newPct === lastPct) {
          return;
        }
        lastPct = newPct;
        writeProgress(newPct);
      },
      part.offset
    );
    totalWritten += file.byteLength;
  }

  writeProgress(100);
};
