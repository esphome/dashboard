const preload = () => import("./compile-dialog");

export const openCompileDialog = (
  configuration: string,
  downloadFactoryFirmware: boolean
) => {
  preload();
  const dialog = document.createElement("esphome-compile-dialog");
  dialog.configuration = configuration;
  dialog.downloadFactoryFirmware = downloadFactoryFirmware;
  document.body.append(dialog);
};
