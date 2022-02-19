import {
  CHIP_FAMILY_ESP32,
  CHIP_FAMILY_ESP32S2,
  CHIP_FAMILY_ESP32C3,
  CHIP_FAMILY_ESP8266,
} from "esp-web-flasher";
import { svg } from "lit";

export const supportsWebSerial = "serial" in navigator;
export const allowsWebSerial = window.isSecureContext;

// Platforms supported by ESPHome
export const chipFamilyToPlatform = {
  [CHIP_FAMILY_ESP32]: "ESP32",
  [CHIP_FAMILY_ESP32S2]: "ESP32S2",
  [CHIP_FAMILY_ESP32C3]: "ESP32C3",
  [CHIP_FAMILY_ESP8266]: "ESP8266",
};

export const metaChevronRight = svg`
  <svg width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
  </svg>
`;

export const metaHelp = svg`
  <svg width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" />
  </svg>
`;

export interface Logger {
  log(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
}
