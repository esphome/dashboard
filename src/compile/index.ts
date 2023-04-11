const preload = () => import("./compile-dialog");

export const openCompileDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-compile-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};
