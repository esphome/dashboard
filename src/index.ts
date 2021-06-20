import "./legacy";
import { attachOnlineStatus } from "./online_status";
import { attachInstallDialog } from "./install-update";
import { attachWizardDialog } from "./wizard";
import { attachValidateDialog } from "./validate";
import { attachCleanDialog } from "./clean";
import { attachCleanMQTTDialog } from "./clean-mqtt";
import { attachUpdateAllDialog } from "./update-all";
import { attachLogsDialog } from "./logs";

attachWizardDialog();
attachOnlineStatus();
attachInstallDialog();
attachValidateDialog();
attachCleanDialog();
attachCleanMQTTDialog();
attachUpdateAllDialog();
attachLogsDialog();
