export const preloadInstallPicoDialog = () => import("./install-pico-dialog");

export const openInstallPicoDialog = (
  portSelectedCallback: (port: SerialPort) => void
) => {
  preloadInstallPicoDialog();
  const dialog = document.createElement("esphome-install-pico-dialog");
  dialog.portSelectedCallback = portSelectedCallback;
  document.body.append(dialog);
};
