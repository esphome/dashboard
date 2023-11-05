const preload = () => import("./rename-dialog");

export const openRenameDialog = (
  configuration: string,
  suggestedName: string,
) => {
  preload();
  const dialog = document.createElement("esphome-rename-dialog");
  dialog.configuration = configuration;
  dialog.suggestedName = suggestedName;
  document.body.append(dialog);
};
