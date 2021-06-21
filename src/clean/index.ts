const preload = () => import("./clean-dialog");

export const openCleanDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-clean-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachCleanDialog = () => {
  document.querySelectorAll("[data-action='clean']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openCleanDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
