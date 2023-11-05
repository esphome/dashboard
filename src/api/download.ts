import { fetchApiJson } from ".";

export type DownloadType = {
  title: string;
  description: string;
  file: string;
  download: string;
};

export const getDownloadTypes = (configuration: string) =>
  fetchApiJson<DownloadType[]>(
    `./downloads?configuration=${encodeURIComponent(configuration)}`,
  );

export const getDownloadUrl = (configuration: string, type: DownloadType) =>
  `./download.bin?configuration=${encodeURIComponent(
    configuration,
  )}&file=${encodeURIComponent(type.file)}&download=${encodeURIComponent(
    type.download,
  )}`;

export const getFactoryDownloadUrl = (configuration: string) =>
  `./download.bin?configuration=${encodeURIComponent(
    configuration,
  )}&file=firmware-factory.bin`;
