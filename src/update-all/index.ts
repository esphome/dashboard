const preload = () => import("./update-all-dialog");

export const openUpdateAllDialog = () => {
  preload();
  document.body.append(document.createElement("esphome-update-all-dialog"));
};
