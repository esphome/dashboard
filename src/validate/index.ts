const preload = () => import("./validate-dialog");

const startValidate = async (ev: Event) => {
  preload();
  const dialog = document.createElement("esphome-validate-dialog");
  dialog.filename = (ev.target as HTMLElement).dataset.filename!;

  document.body.append(dialog);
};

export const attachValidate = () => {
  document.querySelectorAll("[data-action='validate']").forEach((btn) => {
    btn.addEventListener("click", startValidate);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
