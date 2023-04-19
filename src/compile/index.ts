const preload = () => import("./compile-dialog");

export const openCompileDialog = (
  configuration: string,
  platformSupportsWebSerial: boolean
) => {
  preload();
  const dialog = document.createElement("esphome-compile-dialog");
  dialog.configuration = configuration;
  dialog.platformSupportsWebSerial = platformSupportsWebSerial;
  document.body.append(dialog);
};
