import { CHIP_FAMILY_ESP32, CHIP_FAMILY_ESP8266 } from "esp-web-flasher";

export const supportsWebSerial = "serial" in navigator;
export const allowsWebSerial =
  location.protocol === "https:" || location.hostname === "localhost";

// Platforms supported by ESPHome
export const chipFamilyToPlatform = {
  [CHIP_FAMILY_ESP32]: "ESP32",
  [CHIP_FAMILY_ESP8266]: "ESP8266",
};
