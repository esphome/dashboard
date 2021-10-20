const preload = () => import("./delete-device-dialog");

export const openDeleteDeviceDialog = (
  name: string,
  configuration: string,
  onDelete?: () => unknown
) => {
  preload();
  const dialog = document.createElement("esphome-delete-device-dialog");
  dialog.name = name;
  dialog.configuration = configuration;
  if (onDelete) {
    dialog.addEventListener("deleted", onDelete);
  }
  document.body.append(dialog);
};
