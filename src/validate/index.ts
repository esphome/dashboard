const preload = () => import("./validate-dialog");

export const openValidateDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-validate-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
