const preload = () => import("./clean-all-dialog");
const preloadChoose = () => import("./clean-all-choose-dialog");

export const openCleanAllDialog = (cleanBuildDir: boolean = true) => {
  preload();
  const dialog = document.createElement("esphome-clean-all-dialog");
  dialog.cleanBuildDir = cleanBuildDir;
  document.body.append(dialog);
};

export const openCleanAllChooseDialog = () => {
  preloadChoose();
  document.body.append(
    document.createElement("esphome-clean-all-choose-dialog"),
  );
};
