const preload = () => import("./install-choose-dialog");

export const openInstallChooseDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-install-choose-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachInstallChooseDialog = () => {
  document.querySelectorAll("[data-action='upload']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openInstallChooseDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
