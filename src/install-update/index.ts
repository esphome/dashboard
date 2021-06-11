const preload = () => import("./install-update-dialog");

const startInstallUpdate = async (ev: Event) => {
  preload();
  // extract filename.
  const dialog = document.createElement("esphome-install-dialog");
  dialog.filename = (ev.target as HTMLElement).dataset.filename!;
  document.body.append(dialog);
};

export const attachInstallUpdate = () => {
  document.querySelectorAll("[data-action='upload']").forEach((btn) => {
    btn.addEventListener("click", startInstallUpdate);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
