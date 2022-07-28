const preload = () => import("./show-api-key-dialog");

export const openShowApiKeyDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-show-api-key-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
