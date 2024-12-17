export const picoPortFilters: SerialPortRequestOptions["filters"] = [
  {
    // Pico (RP2040)
    usbProductId: 0x000a,
    usbVendorId: 0x2e8a,
  },
  {
    // Pico W (RP2040)
    usbProductId: 0xf00a,
    usbVendorId: 0x2e8a,
  },
];
