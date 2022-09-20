const preload = () => import("./install-choose-dialog");

export const openInstallChooseDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-install-choose-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
