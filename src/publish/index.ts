const preload = () => import("./publish-dialog");

export const openPublishDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-publish-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
