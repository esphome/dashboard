import { fetchApiJson } from "./index";

export interface DeviceIPsResponse {
  device_ips: Record<string, string | null>;
}

export const getDeviceIPs = async (): Promise<
  Record<string, string | null>
> => {
  const response = await fetchApiJson<DeviceIPsResponse>("/resolve-device-ips");
  return response.device_ips;
};
