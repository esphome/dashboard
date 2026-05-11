const preload = () => import("./install-choose-dialog");

export const openInstallChooseDialog = async (configuration: string, isQueued: boolean = false) => {
  await import("./install-choose-dialog");  
  const dialog = document.createElement("esphome-install-choose-dialog") as any;
  dialog.configuration = configuration;
  dialog.isQueued = isQueued; 
  document.body.appendChild(dialog);
};
