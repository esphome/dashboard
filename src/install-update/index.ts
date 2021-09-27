const preload = () => import("./install-dialog");

export const openInstallDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-install-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
