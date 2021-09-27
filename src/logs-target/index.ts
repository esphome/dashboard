const preload = () => import("./logs-target-dialog");

export const openLogsTargetDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-logs-target-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
