import { uploadModal } from "../legacy";

const preload = () => import("./install-update-dialog");

export const openInstallDialog = async (filename: string) => {
  preload();
  const dialog = document.createElement("esphome-install-dialog");
  dialog.filename = filename;

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
