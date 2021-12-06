import { appendSecrets, getSecretKeys } from "./secrets";

const SECRET_SSID = "wifi_ssid";
const SECRET_PASSWORD = "wifi_password";

export const checkHasWifiSecrets = async () => {
  const secrets = await getSecretKeys();
  return secrets.includes(SECRET_SSID) && secrets.includes(SECRET_PASSWORD);
};

export const storeWifiSecrets = async (ssid: string, password: string) =>
  appendSecrets(
    {
      [SECRET_SSID]: ssid,
      [SECRET_PASSWORD]: password,
    },
    "Your Wi-Fi SSID and password"
  );
