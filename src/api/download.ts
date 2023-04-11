import { fetchApiJson } from ".";

export type DownloadType = {
  title: string;
  description: string;
  file: string;
  download: string;
};

export const getDownloadTypes = (configuration: string) =>
  fetchApiJson<DownloadType[]>(
    `./download.bin?configuration=${encodeURIComponent(configuration)}&list=1`
  );

export const getDownloadUrl = (configuration: string, type: DownloadType) =>
  `./download.bin?configuration=${encodeURIComponent(
    configuration
  )}&file=${encodeURIComponent(type.file)}&download=${encodeURIComponent(
    type.download
  )}`;

export const getFactoryDownloadUrl = (configuration: string) =>
  `./download.bin?configuration=${encodeURIComponent(
    configuration
  )}&file=firmware-factory.bin`;
