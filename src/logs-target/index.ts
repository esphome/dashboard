const preload = () => import("./logs-target-dialog");

export const openLogsTargetDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-logs-target-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachLogsTargetDialog = () => {
  document.querySelectorAll("[data-action='logs']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openLogsTargetDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
