import { APIError, fetchApiJson, fetchApiText, streamLogs } from ".";
import { SupportedPlatforms } from "../const";

export interface CreateEmptyConfigParams {
  type: "empty";
  name: string;
}

export interface CreateBasicConfigParams {
  type: "basic";
  name: string;
  ssid: string;
  psk: string;
  board: string;
  platform: SupportedPlatforms;
}

export type CreateConfigParams = CreateEmptyConfigParams | CreateBasicConfigParams;

export interface Configuration {
  storage_version: number;
  name: string;
  comment: string | null;
  esphome_version: string;
  src_version: number;
  arduino_version: string;
  address: string;
  esp_platform: SupportedPlatforms;
  board: string;
  build_path: string;
  firmware_bin_path: string;
  loaded_integrations: string[];
}

export const createConfiguration = (params: CreateConfigParams) =>
  fetchApiJson<{ configuration: string }>("./wizard", {
    method: "post",
    body: JSON.stringify(params),
  });

export const getConfiguration = (configuration: string) => {
  const urlSearchParams = new URLSearchParams({
    configuration: configuration,
  });
  return fetchApiJson<Configuration>(`./info?${urlSearchParams.toString()}`);
};

export const deleteConfiguration = (configuration: string) => {
  const urlSearchParams = new URLSearchParams({
    configuration: configuration,
  });
  return fetchApiText(`./delete?${urlSearchParams.toString()}`, {
    method: "post",
  });
};

export const compileConfiguration = (
  configuration: string,
  abortController?: AbortController,
) => streamLogs("compile", { configuration }, undefined, abortController);

export const compileConfigurationMetadata = (
  configuration: string,
  abortController?: AbortController,
) =>
  streamLogs(
    "compile",
    { configuration, only_generate: true },
    undefined,
    abortController,
  );

// null if file not found.
// status 404 = file not found
// status 422 = invalid config
// status 500 = json serialization failed
export const getJsonConfig = async (
  filename: string,
): Promise<Record<string, any> | null> => {
  try {
    const urlSearchParams = new URLSearchParams({
      configuration: filename,
    });
    return fetchApiJson(`./json-config?${urlSearchParams.toString()}`);
  } catch (err) {
    if (err instanceof APIError && err.status === 404) {
      return null;
    }
    throw err;
  }
};

export const getConfigurationApiKey = async (
  configuration: string,
): Promise<string | null> => {
  try {
    const config = await getJsonConfig(configuration);
    return config?.api?.encryption?.key ?? null;
  } catch {
    // invalid config or config not found.
    return null;
  }
};
