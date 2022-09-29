const preload = () => import("./update-all-dialog");

export const openUpdateAllProcessDialog = () => {
  preload();
  document.body.append(document.createElement("esphome-update-all-dialog"));
};
