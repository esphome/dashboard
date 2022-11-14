# ESPHome Dashboard

The ESPHome dashboard is a user facing dashboard embedded in ESPHome. It allows users to easily create and manage their configurations.

This repository contains the JavaScript frontend and is embedded in ESPHome releases.

## Development

Check out this repository, run `npm install --legacy-peer-deps` and then run

```
script/develop
```

if you are developing on Windows machine using VS Code, you must set bash as a default shell.
You can do that by creating `.npmrc` file in the root of the project with the following content:

```
script-shell=C:\Program Files\git\bin\bash.exe
```

It will start the dev server and will automatically re-bundle updated JavaScript (except for the `static` folder).

Then run ESPHome in dashboard dev mode by defining the relative path from the ESPHome repository to this dashboard repository as the environment variable `ESPHOME_DASHBOARD_DEV`.

```
ESPHOME_DASHBOARD_DEV=../dashboard esphome dashboard ./
```
