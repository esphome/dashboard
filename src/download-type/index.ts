const preload = () => import("./download-type-dialog");

export const openDownloadTypeDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-download-type-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
