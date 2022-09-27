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
) =>
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
      // const dialog = document.createElement("esphome-confirmation-dialog");
      // dialog.addEventListener("dialog-closed", (ev) => {
      //   if (ev.detail.dialog === "confirm") {
      //     origConfirm && origConfirm();
      //   } else if (ev.detail.dialog === "cancel") {
      //     origCancel && origCancel();
      //   }
      //   resolve();
      // });
      // document.body.appendChild(dialog);
      // dialog.showDialog({
      //   ...dialogParams,
      //   ...extra,
      // });
    });
  }) as Promise<boolean>;
