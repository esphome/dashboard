const preload = () => import("./install-adoptable-dialog");

export const openInstallAdoptableDialog = (port: SerialPort) => {
  preload();
  const dialog = document.createElement("esphome-install-adoptable-dialog");
  dialog.port = port;
  document.body.append(dialog);
};
