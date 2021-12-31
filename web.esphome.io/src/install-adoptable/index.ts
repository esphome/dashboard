export const preloadInstallAdoptableDialog = () =>
  import("./install-adoptable-dialog");

export const openInstallAdoptableDialog = (port: SerialPort) => {
  preloadInstallAdoptableDialog();
  const dialog = document.createElement("esphome-install-adoptable-dialog");
  dialog.port = port;
  document.body.append(dialog);
};
