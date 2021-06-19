import { uploadModal } from "../legacy";

const preload = () => import("./install-dialog");

export const openInstallDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-install-dialog");
  dialog.configuration = configuration;

  // Close any old modal that might be open.
  uploadModal.close();

  document.body.append(dialog);
};

export const attachInstallDialog = () => {
  document.querySelectorAll("[data-action='upload']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openInstallDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
