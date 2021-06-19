const preload = () => import("./update-all-dialog");

export const openUpdateAllDialog = () => {
  preload();
  document.body.append(document.createElement("esphome-update-all-dialog"));
};

export const attachCleanDialog = () => {
  document.querySelectorAll("[data-action='update-all']").forEach((btn) => {
    btn.addEventListener("click", openUpdateAllDialog);
    btn.addEventListener("mouseover", preload, { once: true });
  });
};
