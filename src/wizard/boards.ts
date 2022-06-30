import { html } from "lit";

export const boardSelectOptions = html`
  <optgroup label="ESP32">
    <option value="esp-wrover-kit">Generic ESP32 (WROVER Module)</option>
    <option value="nodemcu-32s">NodeMCU-32S</option>
    <option value="lolin_d32">Wemos Lolin D32</option>
    <option value="lolin_d32_pro">Wemos Lolin D32 Pro</option>
    <option value="featheresp32">Adafruit ESP32 Feather</option>
    <option value="m5stack-core-esp32">M5Stack Core ESP32</option>
  </optgroup>
  <optgroup label="ESP8266">
    <option value="esp01_1m">Generic ESP8266 (for example Sonoff)</option>
    <option value="nodemcuv2">NodeMCU</option>
    <option value="d1_mini">Wemos D1 and Wemos D1 mini</option>
    <option value="d1_mini_lite">Wemos D1 mini Lite</option>
    <option value="d1_mini_pro">Wemos D1 mini Pro</option>
    <option value="huzzah">Adafruit HUZZAH ESP8266</option>
    <option value="oak">DigiStump Oak</option>
    <option value="thing">Sparkfun ESP8266 Thing</option>
    <option value="thingdev">Sparkfun ESP8266 Thing - Dev Board</option>
  </optgroup>
  <optgroup label="Other ESP8266s">
    <option value="gen4iod">4D Systems gen4 IoD Range</option>
    <option value="wifi_slot">Amperka WiFi Slot</option>
    <option value="espduino">Doit ESPDuino</option>
    <option value="espectro">DycodeX ESPectro Core</option>
    <option value="espino">ESPino</option>
    <option value="esp_wroom_02">Espressif ESP-WROOM-02 module</option>
    <option value="esp12e">Espressif ESP-12E module</option>
    <option value="esp01">Espressif ESP-01 512k module</option>
    <option value="esp07">Espressif ESP-07 module</option>
    <option value="esp8285">Generic ESP8285 module</option>
    <option value="espresso_lite_v1">ESPert ESPresso Lite 1.0</option>
    <option value="espresso_lite_v2">ESPert ESPresso Lite 2.0</option>
    <option value="phoenix_v1">ESPert Phoenix 1.0</option>
    <option value="wifinfo">WiFInfo</option>
    <option value="espmxdevkit">ESP-Mx DevKit</option>
    <option value="heltec_wifi_kit_8">Heltec WiFi kit 8</option>
    <option value="nodemcu">NodeMCU 0.9</option>
    <option value="modwifi">Olimex MOD-WIFI</option>
    <option value="wio_link">SeedStudio Wio Link</option>
    <option value="wio_node">SeedStudio Wio Node</option>
    <option value="sonoff_basic">Sonoff Basic</option>
    <option value="sonoff_s20">Sonoff S20</option>
    <option value="sonoff_sv">Sonoff SV</option>
    <option value="sonoff_th">Sonoff TH</option>
    <option value="sparkfunBlynk">Sparkfun Blynk Board</option>
    <option value="esp210">SweetPea ESP-210</option>
    <option value="espinotee">ThaiEasyElec ESPino</option>
    <option value="d1">Wemos D1 Revision 1</option>
    <option value="wifiduino">WiFiDuino</option>
    <option value="xinabox_cw01">XinaBox CW01</option>
  </optgroup>
  <optgroup label="Other ESP32s">
    <option value="lolin32">Wemos Lolin 32</option>
    <option value="m5stack-fire">M5Stack FIRE</option>
    <option value="wemosbat">Wemos WiFi &amp; Bluetooth Battery</option>
    <option value="node32s">Node32s</option>
    <option value="alksesp32">ALKS ESP32</option>
    <option value="az-delivery-devkit-v4">
      AZ-Delivery ESP-32 Dev Kit C V4
    </option>
    <option value="bpi-bit">BPI-Bit</option>
    <option value="briki_abc_esp32">Briki ABC</option>
    <option value="briki_mbc-wb_esp32">Briki MBC-WB</option>
    <option value="d-duino-32">D-duino-32</option>
    <option value="esp32-devkitlipo">OLIMEX ESP32-DevKit-LiPo</option>
    <option value="esp32-evb">OLIMEX ESP32-EVB</option>
    <option value="esp32-gateway">OLIMEX ESP32-GATEWAY</option>
    <option value="esp32-poe-iso">OLIMEX ESP32-PoE-ISO</option>
    <option value="esp32-poe">OLIMEX ESP32-PoE</option>
    <option value="esp32-pro">OLIMEX ESP32-PRO</option>
    <option value="esp320">Electronic SweetPeas ESP320</option>
    <option value="esp32cam">AI Thinker ESP32-CAM</option>
    <option value="esp32dev">Espressif ESP32 Dev Module</option>
    <option value="esp32doit-devkit-v1">DOIT ESP32 DEVKIT V1</option>
    <option value="esp32doit-espduino">DOIT ESPduino32</option>
    <option value="esp32thing">SparkFun ESP32 Thing</option>
    <option value="esp32thing_plus">SparkFun ESP32 Thing Plus</option>
    <option value="esp32vn-iot-uno">ESP32vn IoT Uno</option>
    <option value="espea32">April Brother ESPea32</option>
    <option value="espectro32">ESPectro32</option>
    <option value="espino32">ESPino32</option>
    <option value="etboard">ETBoard</option>
    <option value="firebeetle32">FireBeetle-ESP32</option>
    <option value="fm-devkit">ESP32 FM DevKit</option>
    <option value="frogboard">Frog Board ESP32</option>
    <option value="healthypi4">ProtoCentral HealthyPi 4</option>
    <option value="heltec_wifi_kit_32">Heltec WiFi Kit 32</option>
    <option value="heltec_wifi_kit_32_v2">Heltec WiFi Kit 32 V2</option>
    <option value="heltec_wifi_lora_32">Heltec WiFi LoRa 32</option>
    <option value="heltec_wifi_lora_32_V2">Heltec WiFi LoRa 32 (V2)</option>
    <option value="heltec_wireless_stick">Heltec Wireless Stick</option>
    <option value="heltec_wireless_stick_lite">
      Heltec Wireless Stick Lite
    </option>
    <option value="honeylemon">HONEYLemon</option>
    <option value="hornbill32dev">Hornbill ESP32 Dev</option>
    <option value="hornbill32minima">Hornbill ESP32 Minima</option>
    <option value="imbrios-logsens-v1p1">Imbrios LogSens V1P1</option>
    <option value="inex_openkb">INEX OpenKB</option>
    <option value="intorobot">IntoRobot Fig</option>
    <option value="iotaap_magnolia">IoTaaP Magnolia</option>
    <option value="iotbusio">oddWires IoT-Bus Io</option>
    <option value="iotbusproteus">oddWires IoT-Bus Proteus</option>
    <option value="kits-edu">KITS ESP32 EDU</option>
    <option value="labplus_mpython">Labplus mPython</option>
    <option value="lopy">Pycom LoPy</option>
    <option value="lopy4">Pycom LoPy4</option>
    <option value="m5stack-atom">M5Stack-ATOM</option>
    <option value="m5stack-grey">M5Stack GREY ESP32</option>
    <option value="m5stack-core2">M5Stack Core2</option>
    <option value="m5stack-coreink">M5Stack-Core Ink</option>
    <option value="m5stack-timer-cam">M5Stack Timer CAM</option>
    <option value="m5stick-c">M5Stick-C</option>
    <option value="magicbit">MagicBit</option>
    <option value="mgbot-iotik32a">MGBOT IOTIK 32A</option>
    <option value="mgbot-iotik32b">MGBOT IOTIK 32B</option>
    <option value="mhetesp32devkit">MH ET LIVE ESP32DevKIT</option>
    <option value="mhetesp32minikit">MH ET LIVE ESP32MiniKit</option>
    <option value="microduino-core-esp32">Microduino Core ESP32</option>
    <option value="nano32">MakerAsia Nano32</option>
    <option value="nina_w10">u-blox NINA-W10 series</option>
    <option value="nscreen-32">YeaCreate NSCREEN-12</option>
    <option value="odroid_esp32">ODROID-GO</option>
    <option value="onehorse32dev">Onehorse ESP32 Dev Module</option>
    <option value="oroca_edubot">OROCA EduBot</option>
    <option value="pico32">ESP32 Pico Kit</option>
    <option value="piranha_esp32">Fishino Piranha ESP-32</option>
    <option value="pocket_32">Dongsen Tech Pocket 32</option>
    <option value="pycom_gpy">Pycom GPy</option>
    <option value="qchip">Qchip</option>
    <option value="quantum">Noduino Quantum</option>
    <option value="s_odi_ultra">S.ODI Ultra v1</option>
    <option value="sensesiot_weizen">LOGISENSES Senses Weizen</option>
    <option value="sg-o_airMon">SG-O AirMon</option>
    <option value="sparkfun_lora_gateway_1-channel">
      SparkFun LoRa Gateway 1-Channel
    </option>
    <option value="tinypico">TinyPICO</option>
    <option value="ttgo-lora32-v1">TTGO LoRa32-OLED V1</option>
    <option value="ttgo-lora32-v2">TTGO LoRa32-OLED V2</option>
    <option value="ttgo-lora32-v21">TTGO LoRa32-OLED v2.1.6</option>
    <option value="ttgo-t-beam">TTGO T-Beam</option>
    <option value="ttgo-t-watch">TTGO T-Watch</option>
    <option value="ttgo-t1">TTGO T1</option>
    <option value="turta_iot_node">Turta IoT Node</option>
    <option value="vintlabs-devkit-v1">VintLabs ESP32 Devkit</option>
    <option value="wemos_d1_mini32">WeMos D1 MINI ESP32</option>
    <option value="wesp32">Silicognition wESP32</option>
    <option value="widora-air">Widora AIR</option>
    <option value="wifiduino32">Blinker WiFiduino32</option>
    <option value="xinabox_cw02">XinaBox CW02</option>
  </optgroup>
`;
