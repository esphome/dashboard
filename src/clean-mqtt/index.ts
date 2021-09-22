const preload = () => import("./clean-mqtt-dialog");

export const openCleanMQTTDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-clean-mqtt-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
