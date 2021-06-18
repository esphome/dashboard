import "./legacy";
import { attachOnlineStatus } from "./online_status";
import { attachInstallUpdate } from "./install-update";
import { attachWizard } from "./wizard";
import { attachValidate } from "./validate";
import { attachCleanDialog } from "./clean";

attachWizard();
attachOnlineStatus();
attachInstallUpdate();
attachValidate();
attachCleanDialog();
