const preload = () => import("./confirmation-dialog");

export interface ConfirmationDialogParams {
  text?: string;
  title?: string;
  confirmText?: string;
  dismissText?: string;
  confirm?: () => void;
  cancel?: () => void;
  destructive?: boolean;
}

export const showConfirmationDialog = (
  dialogParams: ConfirmationDialogParams
): Promise<boolean> =>
  new Promise((resolve) => {
    const origCancel = dialogParams.cancel;
    const origConfirm = dialogParams.confirm;

    preload().then(() => {
      const dialog = document.createElement("esphome-confirmation-dialog");
      document.body.append(dialog);

      const dp = {
        ...dialogParams,
        cancel: () => {
          resolve(false);
          if (origCancel) {
            origCancel();
          }
        },
        confirm: () => {
          resolve(true);
          if (origConfirm) {
            origConfirm();
          }
        },
      };

      dialog.showDialog(dp);
    });
  });
