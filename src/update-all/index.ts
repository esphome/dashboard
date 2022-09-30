const preload = () => import("./update-all-dialog");

export const openUpdateAllDialog = () => {
  preload().then(() => {
    document.body.append(document.createElement("esphome-update-all-dialog"));
  });
};
