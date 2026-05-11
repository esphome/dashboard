const preload = () => import("./install-choose-dialog");

export const openInstallChooseDialog = (configuration: string, isQueued: boolean = false) => {
  const dialog = document.createElement("esphome-install-choose-dialog") as any;
  dialog.configuration = configuration;
  dialog.isQueued = isQueued; // <-- PASS THE STATE TO THE DIALOG
  document.body.appendChild(dialog);
};
