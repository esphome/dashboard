const preload = () => import("./install-server");

export const openInstallServerDialog = (
  configuration: string,
  target: string
) => {
  preload();
  const dialog = document.createElement("esphome-install-server-dialog");
  dialog.configuration = configuration;
  dialog.target = target;
  document.body.append(dialog);
};
