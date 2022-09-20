const preload = () => import("./download-choose-dialog");

export const openDownloadChooseDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-download-choose-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachDownloadChooseDialog = () => {
  document.querySelectorAll("[data-action='upload']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openDownloadChooseDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
