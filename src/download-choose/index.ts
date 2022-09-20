const preload = () => import("./download-choose-dialog");

export const openDownloadChooseDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-download-choose-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
