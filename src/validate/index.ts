const preload = () => import("./validate-dialog");

const openValidateDialog = async (filename: string) => {
  preload();
  const dialog = document.createElement("esphome-validate-dialog");
  dialog.filename = filename;
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
