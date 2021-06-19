const preload = () => import("./wizard-dialog");

export const openWizardDialog = async () => {
  preload();
  document.body.append(document.createElement("esphome-wizard-dialog"));
};

export const attachWizardDialog = () => {
  document.querySelectorAll("[data-action='wizard']").forEach((btn) => {
    btn.addEventListener("click", openWizardDialog);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
