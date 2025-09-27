import { svg } from "lit";

export const supportsWebSerial = "serial" in navigator;
export const allowsWebSerial = window.isSecureContext;

export type SupportedPlatforms =
  | "ESP8266"
  | "ESP32"
  | "ESP32S2"
  | "ESP32S3"
  | "ESP32C2"
  | "ESP32C3"
  | "ESP32C5"
  | "ESP32C6"
  | "ESP32C61"
  | "ESP32H2"
  | "ESP32P4"
  | "RP2040"
  | "BK72XX"
  | "LN882X"
  | "RTL87XX";

export type PlatformData = {
  label: string;
  showInPickerTitle: boolean;
  showInDeviceTypePicker: boolean;
  defaultBoard: string | null;
};

// Platforms supported by ESPHome
export const supportedPlatforms = {
  ESP32: {
    label: "ESP32",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp32dev",
  },
  ESP32S2: {
    label: "ESP32-S2",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp32-s2-saola-1",
  },
  ESP32S3: {
    label: "ESP32-S3",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp32-s3-devkitc-1",
  },
  ESP32C2: {
    label: "ESP32-C2",
    showInPickerTitle: true,
    showInDeviceTypePicker: false,
    defaultBoard: "esp32-c2-devkitm-1",
  },
  ESP32C3: {
    label: "ESP32-C3",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp32-c3-devkitm-1",
  },
  ESP32C5: {
    label: "ESP32-C5",
    showInPickerTitle: true,
    showInDeviceTypePicker: false,
    defaultBoard: "esp32-c5-devkitc-1",
  },
  ESP32C6: {
    label: "ESP32-C6",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp32-c6-devkitc-1",
  },
  ESP32C61: {
    label: "ESP32-C61",
    showInPickerTitle: true,
    showInDeviceTypePicker: false,
    defaultBoard: "esp32-c61-devkitc-1",
  },
  ESP32H2: {
    label: "ESP32-H2",
    showInPickerTitle: true,
    showInDeviceTypePicker: false,
    defaultBoard: "esp32-h2-devkitm-1",
  },
  ESP32P4: {
    label: "ESP32-P4",
    showInPickerTitle: true,
    showInDeviceTypePicker: false,
    defaultBoard: "esp32-p4-function-ev-board",
  },
  ESP8266: {
    label: "ESP8266",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: "esp01_1m",
  },
  RP2040: {
    label: "Raspberry Pi Pico W",
    showInPickerTitle: false,
    showInDeviceTypePicker: true,
    defaultBoard: "rpipicow",
  },
  BK72XX: {
    label: "BK72xx",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: null,
  },
  LN882X: {
    label: "LN882x",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: null,
  },
  RTL87XX: {
    label: "RTL87xx",
    showInPickerTitle: true,
    showInDeviceTypePicker: true,
    defaultBoard: null,
  },
} as const satisfies { [key in SupportedPlatforms]: PlatformData };

// esploader.chip.CHIP_NAME mapped to ESPHome platform names
export const chipFamilyToPlatform = {
  ESP32: "ESP32",
  "ESP32-S2": "ESP32S2",
  "ESP32-S3": "ESP32S3",
  "ESP32-C2": "ESP32C2",
  "ESP32-C3": "ESP32C3",
  "ESP32-C5": "ESP32C5",
  "ESP32-C6": "ESP32C6",
  "ESP32-C61": "ESP32C61",
  "ESP32-H2": "ESP32H2",
  "ESP32-P4": "ESP32P4",
  ESP8266: "ESP8266",
} as const satisfies { [key: string]: SupportedPlatforms };

export type ChipFamily = keyof typeof chipFamilyToPlatform;

export const metaChevronRight = svg`
  <svg class="svg-fill-primary" width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
  </svg>
`;

export const metaHelp = svg`
  <svg class="svg-fill-primary" width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" />
  </svg>
`;

export interface Logger {
  log(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
}

export type ManifestBuild = {
  chipFamily: ChipFamily;
  ota?: {
    path: string;
    md5: string;
    summary: string;
    release_url: string;
  };
  parts: Array<{
    path: string;
    offset: number;
  }>;
};
