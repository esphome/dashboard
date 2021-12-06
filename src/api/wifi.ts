import { appendSecrets, getSecretKeys } from "./secrets";

export const SECRET_WIFI_SSID = "wifi_ssid";
export const SECRET_WIFI_PASSWORD = "wifi_password";

export const checkHasWifiSecrets = async () => {
  const secrets = await getSecretKeys();
  return (
    secrets.includes(SECRET_WIFI_SSID) && secrets.includes(SECRET_WIFI_PASSWORD)
  );
};

export const storeWifiSecrets = async (ssid: string, password: string) =>
  appendSecrets(
    {
      [SECRET_WIFI_SSID]: ssid,
      [SECRET_WIFI_PASSWORD]: password,
    },
    "Your Wi-Fi SSID and password"
  );
