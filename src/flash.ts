import { ESPLoader } from "esp-web-flasher";
import { getDownloadUrl } from "./api/configuration";

export interface FileToFlash {
  data: ArrayBuffer;
  offset: number;
}

export const getConfigurationFiles = async (
  filename: string
): Promise<FileToFlash[]> => {
  let resp: Response;
  try {
    resp = await fetch(getDownloadUrl(filename, true));
  } catch (err) {
    throw new Error(`Downloading firmware failed: ${err}`);
  }

  if (!resp.ok) {
    throw new Error(`Downloading firmware failed: ${resp.status}`);
  }

  return [
    {
      data: await resp.arrayBuffer(),
      offset: 0,
    },
  ];
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
