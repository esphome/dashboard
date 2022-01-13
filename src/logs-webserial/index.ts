export const preloadLogsWebSerialDialog = () =>
  import("./logs-webserial-dialog");

export const openLogsWebSerialDialog = (
  port: SerialPort,
  closePortOnClose: boolean,
  configuration?: string
) => {
  preloadLogsWebSerialDialog();
  const dialog = document.createElement("esphome-logs-webserial-dialog");
  dialog.configuration = configuration;
  dialog.port = port;
  dialog.closePortOnClose = closePortOnClose;
  document.body.append(dialog);
};
