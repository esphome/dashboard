const preload = () => import("./logs-dialog");

export const openLogsDialog = (configuration: string, target: string) => {
  preload();
  const dialog = document.createElement("esphome-logs-dialog");
  dialog.configuration = configuration;
  dialog.target = target;
  document.body.append(dialog);
};
