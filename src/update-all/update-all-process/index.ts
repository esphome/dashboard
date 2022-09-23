const preload = () => import("./update-all-process-dialog");

export const openUpdateAllProcessDialog = () => {
  preload();
  document.body.append(document.createElement("esphome-update-all-process-dialog"));
};
