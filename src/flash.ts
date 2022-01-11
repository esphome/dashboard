import { ESPLoader } from "esp-web-flasher";
import { getConfigurationManifest, Manifest } from "./api/configuration";

export interface FileToFlash {
  data: ArrayBuffer;
  offset: number;
}

export const getConfigurationFiles = async (
  filename: string
): Promise<FileToFlash[]> => {
  let toFlash: Manifest;

  try {
    toFlash = await getConfigurationManifest(filename);
  } catch (err) {
    throw new Error(`Error fetching manifest.json for ${filename}: ${err}`);
  }

  const filePromises = toFlash.map(async (part) => {
    const url = new URL(part.path, location.href).toString();
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(
        `Downloading firmware ${part.path} failed: ${resp.status}`
      );
    }
    return resp.arrayBuffer();
  });

  const files: FileToFlash[] = [];

  for (const part of toFlash) {
    const data = await filePromises.shift()!;
    files.push({ data, offset: part.offset });
  }

  return files;
};

export const flashFiles = async (
  esploader: ESPLoader,
  files: FileToFlash[],
  erase: boolean,
  writeProgress: (pct: number) => void
) => {
  const espStub = await esploader.runStub();

  if (erase) {
    await espStub.eraseFlash();
  }

  let totalSize = 0;
  for (const file of files) {
    totalSize += file.data.byteLength;
  }
  let lastPct = 0;
  let totalWritten = 0;
  writeProgress(0);

  for (const file of files) {
    await espStub.flashData(
      file.data,
      (bytesWritten: number) => {
        const newPct = Math.floor(
          ((totalWritten + bytesWritten) / totalSize) * 100
        );
        if (newPct === lastPct) {
          return;
        }
        lastPct = newPct;
        writeProgress(newPct);
      },
      file.offset,
      true
    );
    totalWritten += file.data.byteLength;
  }

  writeProgress(100);
};
