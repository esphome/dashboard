import { ESPLoader } from "esptool-js";
import { getDownloadUrl } from "../api/configuration";

export interface FileToFlash {
  data: string;
  address: number;
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

  const reader = new FileReader();
  const blob = await resp.blob();

  const data = await new Promise<string>((resolve) => {
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.readAsBinaryString(blob);
  });

  return [
    {
      data,
      address: 0,
    },
  ];
};

export const flashFiles = async (
  esploader: ESPLoader,
  fileArray: FileToFlash[],
  erase: boolean,
  writeProgress: (pct: number) => void
) => {
  if (erase) {
    await esploader.erase_flash();
  }

  let totalSize = 0;
  for (const file of fileArray) {
    totalSize += file.data.length;
  }
  let totalWritten = 0;
  writeProgress(0);

  await esploader.write_flash({
    fileArray,
    flashSize: "keep",
    flashMode: "keep",
    flashFreq: "keep",
    eraseAll: false,
    compress: true,
    // report progress
    reportProgress: (fileIndex: number, written: number, total: number) => {
      const uncompressedWritten =
        (written / total) * fileArray[fileIndex].data.length;

      const newPct = Math.floor(
        ((totalWritten + uncompressedWritten) / totalSize) * 100
      );

      // we're done with this file
      if (written === total) {
        totalWritten += uncompressedWritten;
        return;
      }

      writeProgress(newPct);
    },
  });

  writeProgress(100);
};
