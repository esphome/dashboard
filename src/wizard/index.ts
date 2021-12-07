const preload = () => import("./wizard-dialog");

export const openWizardDialog = () => {
  preload();
  document.body.append(document.createElement("esphome-wizard-dialog"));
};
