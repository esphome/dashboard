export type HostDeviceLike = {
  target_platform?: string | null;
  loaded_integrations?: string[] | null;
};

export function is_host_device(device: HostDeviceLike): boolean {
  return (
    device.target_platform?.toUpperCase() === "HOST" ||
    (device.loaded_integrations?.includes("host") ?? false)
  );
}
