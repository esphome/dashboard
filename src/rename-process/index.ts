export const preloadRenameProcessDialog = () =>
  import("./rename-process-dialog");

export const openRenameProcessDialog = (
  configuration: string,
  newName: string
) => {
  preloadRenameProcessDialog();
  const dialog = document.createElement("esphome-rename-process-dialog");
  dialog.configuration = configuration;
  dialog.newName = newName;
  document.body.append(dialog);
};
