/**
 * English translations for ESPHome Dashboard
 */
export const en = {
  // Common buttons
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  delete: "Delete",
  install: "Install",
  edit: "Edit",
  retry: "Retry",
  back: "Back",
  skip: "Skip",
  yes: "Yes",
  download: "Download",
  rename: "Rename",

  // Editor
  editor: {
    saveFile: "Save file",
    saved: "Saved {fileName}",
    saveError: "An error occurred saving {fileName}",
  },

  // Device Card
  device: {
    update: "Update",
    visit: "Visit",
    logs: "Logs",
    validate: "Validate",
    showApiKey: "Show API Key",
    downloadYaml: "Download YAML",
    renameHostname: "Rename hostname",
    cleanBuildFiles: "Clean Build Files",
    downloadElf: "Download ELF file",
    cleanMqtt: "Clean MQTT",
    fullPath: "Full Path:",
    updateAvailable: "Update Available: {deployed} to {current}",
  },

  // Device Status
  status: {
    new: "NEW",
    online: "ONLINE",
    offline: "OFFLINE",
    discovered: "DISCOVERED",
    ignoredDiscovery: "IGNORED DISCOVERY",
  },

  // Adopt Dialog
  adopt: {
    takeControl: "Take Control",
    configurationCreated: "Configuration created",
    installationSkipped: "Installation skipped",
    takeControlDescription:
      "Taking control of {name} will create a local ESPHome configuration for this device. This gives you full control over the configuration. You will lose access to vendor-provided firmware updates and will have to manually compile and update the device in the ESPHome Device Builder. You can always revert to vendor-provided updates, but this will require re-installing the device.",
    finishTakingControl:
      "To finish taking control of {name}, the new configuration needs to be installed on the device.",
    installLater:
      "You will be able to install the configuration at a later point from the three-dot menu on the device card.",
    encryptionKeyInfo:
      "Each ESPHome device has a unique encryption key to talk to other devices. You will need this key to include your device in Home Assistant. You can find the key later in the device menu.",
    encryptionKey: "Encryption key",
    copied: "Copied!",
    takingControl: "Taking control...",
    newName: "New Name",
    networkName: "Network name",
    password: "Password",
    leaveBlankIfNoPassword: "Leave blank if no password",
    wifiSecretsStored:
      "This device will be configured to connect to the Wi-Fi network stored in your secrets.",
    enterWifiCredentials:
      "Enter the credentials of the Wi-Fi network that you want your device to connect to.",
    wifiCredentialsStoredInfo:
      "This information will be stored in your secrets and used for this and future devices. You can edit the information later by editing your secrets at the top of the page.",
    failedToStoreWifi: "Failed to store Wi-Fi credentials",
    failedToImport: "Failed to import device",
  },

  // Install Choose Dialog
  installChoose: {
    howToInstall: "How do you want to install {configuration} on your device?",
    wirelessly: "Wirelessly",
    viaNetwork: "Via the network",
    requiresOnline: "Requires the device to be online",
    plugIntoThisComputer: "Plug into this computer",
    forDevicesConnectedViaUsb: "For devices connected via USB to this computer",
    webInstallNotSupported:
      "Installing this via the web is not supported yet for this device",
    plugIntoServer: "Plug into the computer running ESPHome Device Builder",
    forDevicesConnectedToServer:
      "For devices connected via USB to the server{picoNote}",
    andRunningEsphome: " and running ESPHome",
    manualDownload: "Manual download",
    installYourself: "Install it yourself",
    byUsingEsphomeWeb: "using ESPHome Web or other tools",
    byCopyingToPico: "by copying it to the Pico USB drive",
    pickServerPort: "Pick Server Port",
    loadingSerialDevices: "Loading serial devices",
    noSerialDevicesFound: "No serial devices found.",
    autoRefreshNote: "This list automatically refreshes if you plug one in.",
    picoRequiresEsphome:
      "Installation via the server requires the Pico to already run ESPHome.",
    downloadInstructions: {
      installViaUsb: "Install ESPHome via the USB drive",
      installViaBrowser: "Install ESPHome via the browser",
      picoInstructions:
        "You can install your ESPHome project {configuration} on your device via your file explorer by following these steps:",
      browserInstructions:
        "ESPHome can install {configuration} on your device via the browser if certain requirements are met:",
      browserRequirements: {
        https: "ESPHome is visited over HTTPS",
        webSerial: "Your browser supports WebSerial",
      },
      requirementsNotMet:
        "Not all requirements are currently met. The easiest solution is to download your project and do the installation with ESPHome Web. ESPHome Web works 100% in your browser and no data will be shared with the ESPHome project.",
      picoSteps: {
        disconnect: "Disconnect your Raspberry Pi Pico from your computer",
        holdBootsel:
          "Hold the BOOTSEL button and connect the Pico to your computer. The Pico will show up as a USB drive named RPI-RP2",
        downloadProject: "Download project",
        dragToUsb:
          "Drag the downloaded file to the USB drive. The installation is complete when the drive disappears",
        complete: "Your Pico now runs your ESPHome project",
      },
      openEsphomeWeb: "Open ESPHome Web",
      preparingDownload: "preparing download...",
      preparationFailed: "preparation failed:",
      seeWhatWentWrong: "see what went wrong",
    },
  },

  // Delete Dialog
  deleteDevice: {
    deleteTitle: "Delete {name}",
    confirmDelete: "Are you sure you want to delete {name}?",
  },

  // Rename Dialog
  renameDialog: {
    renameTitle: "Rename {configuration}",
    newName: "New Name",
    helperText: "Lowercase letters (a-z), numbers (0-9) or dash (-)",
  },

  // Compile Dialog
  compile: {
    downloadTitle: "Download {configuration}",
  },

  // Logs Dialog
  logs: {
    logsTitle: "Logs {configuration}",
  },

  // Header Menu
  header: {
    updateAll: "Update All",
    cleanAll: "Clean All",
    secrets: "Secrets",
    secretsEditor: "Secrets Editor",
    search: "Search",
    showDiscoveredDevices: "Show discovered devices",
    hideDiscoveredDevices: "Hide discovered devices",
    logOut: "Log Out",
    updateAllConfirm: "Do you want to update all devices?",
    cleanAllConfirm:
      "Do you want to clean all build and platform files? This will remove all cached files and dependencies, which may take a while to download again and reinstall.",
  },

  // Importable Device Card
  importable: {
    takeControl: "Take Control",
    ignore: "Ignore",
    unignore: "Unignore",
  },

  // Footer
  footer: {
    fundDevelopment: "Fund development",
    documentation: "Documentation",
  },

  // Validation
  validate: {
    validateTitle: "Validate {configuration}",
  },

  // Clean Dialog
  clean: {
    cleanTitle: "Clean {configuration}",
  },

  // Update All Dialog
  updateAll: {
    title: "Update All Devices",
  },

  // Clean All Dialog
  cleanAllDialog: {
    title: "Clean All Devices",
  },

  // Show API Key Dialog
  showApiKey: {
    title: "API Key for {configuration}",
    apiKey: "API Key",
    copyToClipboard: "Copy to clipboard",
  },

  // Logs Target Dialog
  logsTarget: {
    title: "Select logs target for {configuration}",
    ota: "OTA (Over-The-Air)",
    selectPort: "Select a serial port",
  },

  // Install Server Dialog
  installServer: {
    title: "Install {configuration}",
    installingTo: "Installing to {target}...",
  },

  // Install Web Dialog
  installWeb: {
    title: "Install {configuration} via browser",
    connecting: "Connecting...",
    selectPort: "Select Port",
    installFirmware: "Install Firmware",
  },

  // Alerts and Messages
  alerts: {
    warning: "Warning",
    error: "Error",
    success: "Success",
    info: "Info",
  },

  // Language
  language: {
    selectLanguage: "Select Language",
    english: "English",
    turkish: "Turkish",
  },
} as const;

export type TranslationKeys = typeof en;
