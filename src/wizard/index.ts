const preload = () => import("./wizard-dialog");

const startWizard = async () => {
  preload();
  document.body.append(document.createElement("esphome-wizard-dialog"));
};

export const attachWizard = () => {
  document.querySelectorAll("[data-action='wizard']").forEach((btn) => {
    btn.addEventListener("click", startWizard);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
