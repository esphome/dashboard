const preload = () => import("./validate-dialog");

const startValidate = async (filename: string) => {
  preload();
  const dialog = document.createElement("esphome-validate-dialog");
  dialog.filename = filename;
  document.body.append(dialog);
};

export const attachValidate = () => {
  document.querySelectorAll("[data-action='validate']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      startValidate((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
