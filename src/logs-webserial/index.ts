const preload = () => import("./logs-webserial-dialog");

export const openLogsWebSerialDialog = (
  port: SerialPort,
  configuration?: string
) => {
  preload();
  const dialog = document.createElement("esphome-logs-webserial-dialog");
  dialog.configuration = configuration;
  dialog.port = port;
  document.body.append(dialog);
};
