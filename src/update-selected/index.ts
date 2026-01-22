const preload = () => import("./update-selected-dialog");

export const openUpdateSelectedDialog = (configurations: string[]) => {
  preload();
  const dialog = document.createElement("esphome-update-selected-dialog");
  (dialog as any).configurations = configurations;
  document.body.append(dialog);
};
