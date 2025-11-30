const preload = () => import("./clean-all-dialog");

export const openCleanAllDialog = () => {
  preload();
  const dialog = document.createElement("esphome-clean-all-dialog");
  document.body.append(dialog);
};
