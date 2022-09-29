const preload = () => import("./confirmation-dialog");

export interface ConfirmationDialogParams {
  text?: string;
  title?: string;
  confirmText?: string;
  dismissText?: string;
  destructive?: boolean;
}

export const showConfirmationDialog = (
  dialogParams: ConfirmationDialogParams
): Promise<boolean> =>
  new Promise((resolve) => {
    preload().then(() => {
      const dialog = document.createElement("esphome-confirmation-dialog");
      document.body.append(dialog);
      dialog.showDialog(dialogParams, resolve);
    });
  });
