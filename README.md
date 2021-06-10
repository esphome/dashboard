# ESPHome Dashboard

The ESPHome dashboard is a user facing dashboard embedded in ESPHome. It allows users to easily create and manage their configurations.

This repository contains the JavaScript frontend and is embedded in ESPHome releases.

## Development

Check out this repository, run `npm install` and then run

```
script/develop
````

It will start the dev server and will automatically re-bundle updated JavaScript (except for the `static` folder).

Then run ESPHome in frontend dev mode:

```
ESPHOME_FRONTEND_DEV=1 esphome dashboard ./
```
