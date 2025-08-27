import { fetchApiJson } from ".";

export type DownloadType = {
  title: string;
  description: string;
  file: string;
  download: string;
};

export const getDownloadTypes = (configuration: string) => {
  const urlSearchParams = new URLSearchParams({
    configuration: configuration,
  });
  return fetchApiJson<DownloadType[]>(
    `./downloads?${urlSearchParams.toString()}`,
  );
};

export const getDownloadUrl = (configuration: string, type: DownloadType) => {
  const urlSearchParams = new URLSearchParams({
    configuration: configuration,
    file: type.file,
    download: type.download,
  });
  return `./download.bin?${urlSearchParams.toString()}`;
};

export const getFactoryDownloadUrl = (configuration: string) => {
  const urlSearchParams = new URLSearchParams({
    configuration: configuration,
    file: "firmware.factory.bin",
  });
  return `./download.bin?${urlSearchParams.toString()}`;
};
