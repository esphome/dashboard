const preload = () => import("./download-type-dialog");

export const openDownloadTypeDialog = (
  configuration: string,
  platformSupportsWebSerial: boolean
) => {
  preload();
  const dialog = document.createElement("esphome-download-type-dialog");
  dialog.configuration = configuration;
  dialog.platformSupportsWebSerial = platformSupportsWebSerial;
  document.body.append(dialog);
};
