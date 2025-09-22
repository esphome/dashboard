const preload = () => import("./clean-dialog");

export const openCleanDialog = (configuration: string, type: string) => {
  preload();
  const dialog = document.createElement("esphome-clean-dialog");
  dialog.configuration = configuration;
  dialog.type = type;
  document.body.append(dialog);
};
