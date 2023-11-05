const preload = () => import("./no-port-picked-dialog");

export const openNoPortPickedDialog = async (
  doTryAgain?: () => void,
): Promise<boolean> => {
  preload();

  const dialog = document.createElement("esphome-no-port-picked-dialog");
  dialog.doTryAgain = doTryAgain;
  document.body.append(dialog);
  return true;
};
