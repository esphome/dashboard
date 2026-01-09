const preload = () => import("./clean-dialog");

export const openCleanDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-clean-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
