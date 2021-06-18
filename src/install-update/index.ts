import { uploadModal } from "../legacy";

const preload = () => import("./install-update-dialog");

const startInstallUpdate = async (ev: Event) => {
  preload();
  const dialog = document.createElement("esphome-install-dialog");
  dialog.filename = (ev.target as HTMLElement).dataset.filename!;

  // Close any old modal that might be open.
  uploadModal.close();

  document.body.append(dialog);
};

export const attachInstallUpdate = () => {
  document.querySelectorAll("[data-action='upload']").forEach((btn) => {
    btn.addEventListener("click", startInstallUpdate);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
