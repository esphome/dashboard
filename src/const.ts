import { CHIP_FAMILY_ESP32, CHIP_FAMILY_ESP8266 } from "esp-web-flasher";
import { svg } from "lit";

export const supportsWebSerial = "serial" in navigator;
export const allowsWebSerial = window.isSecureContext;

// Platforms supported by ESPHome
export const chipFamilyToPlatform = {
  [CHIP_FAMILY_ESP32]: "ESP32",
  [CHIP_FAMILY_ESP8266]: "ESP8266",
};

export const metaChevronRight = svg`
  <svg width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
  </svg>
`;
