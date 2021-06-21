import "./legacy";
import { attachOnlineStatus } from "./online_status";
import { attachInstallDialog } from "./install-update";
import { attachWizardDialog } from "./wizard";
import { attachValidateDialog } from "./validate";
import { attachCleanDialog } from "./clean";
import { attachCleanMQTTDialog } from "./clean-mqtt";
import { attachUpdateAllDialog } from "./update-all";
import { attachLogsTargetDialog } from "./logs-target";

attachWizardDialog();
attachOnlineStatus();
attachInstallDialog();
attachValidateDialog();
attachCleanDialog();
attachCleanMQTTDialog();
attachUpdateAllDialog();
attachLogsTargetDialog();
