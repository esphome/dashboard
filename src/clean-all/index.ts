import { showConfirmationDialog } from "../dialogs";

const preload = () => import("./clean-all-dialog");

export const openCleanAllDialog = async () => {
  if (
    !(await showConfirmationDialog({
      title: "Clean All Files",
      text:
        "Do you want to clean all build and platform files? " +
        "This will remove all cached files and dependencies, " +
        "which may take a while to download again and reinstall.",
      confirmText: "Clean All Files",
      dismissText: "Cancel",
      destructive: true,
    }))
  ) {
    return;
  }
  preload();
  const dialog = document.createElement("esphome-clean-all-dialog");
  document.body.append(dialog);
};
