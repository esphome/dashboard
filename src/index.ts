import "./legacy";
import "./devices/devices-list";
import "./components/esphome-header-menu";
import { attachUpdateAllDialog } from "./update-all";
import { attachWizardDialog } from "./wizard";
import { attachInstallDialog } from "./install-update";

attachUpdateAllDialog();
attachWizardDialog();
attachInstallDialog();
