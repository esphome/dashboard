const preload = () => import("./clean-mqtt-dialog");

export const openCleanMQTTDialog = (configuration: string) => {
  preload();
  const dialog = document.createElement("esphome-clean-mqtt-dialog");
  dialog.configuration = configuration;
  document.body.append(dialog);
};

export const attachCleanMQTTDialog = () => {
  document.querySelectorAll("[data-action='clean-mqtt']").forEach((btn) => {
    btn.addEventListener("click", (ev) =>
      openCleanMQTTDialog((ev.target as HTMLElement).dataset.filename!)
    );
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
