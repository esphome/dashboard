const preload = () => import("./validate-dialog");

const openValidateDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-validate-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachValidateDialog = () => {
  document.querySelectorAll("[data-action='validate']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openValidateDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
