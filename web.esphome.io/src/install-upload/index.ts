export const preloadInstallUploadDialog = () =>
  import("./install-upload-dialog");

export const openInstallUploadDialog = (port: SerialPort) => {
  preloadInstallUploadDialog();
  const dialog = document.createElement("esphome-install-upload-dialog");
  dialog.port = port;
  document.body.append(dialog);
};
