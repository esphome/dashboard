import { getUploadPort } from "../legacy";

const preload = () => import("./logs-dialog");

export const openLogsDialog = (configuration: string, target: string) => {
  preload();
  const dialog = document.createElement("esphome-logs-dialog");
  dialog.configuration = configuration;
  dialog.target = target;
  document.body.append(dialog);
};

export const attachLogsDialog = () => {
  document.querySelectorAll("[data-action='logs']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openLogsDialog(
        (ev.target as HTMLElement).dataset.filename!,
        getUploadPort()
      )
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
