const preload = () => import("./editor-dialog");

export const openEditorDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-editor-dialog");
  dialog.fileName = configuration;

  document.body.append(dialog);
};
