# ESPHome Dashboard (Legacy)

> ## :warning: This project is no longer actively developed
>
> The ESPHome dashboard in this repository has been replaced by
> [**ESPHome Device Builder**](https://github.com/esphome/device-builder),
> which is where all new development is happening.
>
> ### What this means
>
> - **No new features** will be accepted here. Please open feature
>   pull requests against [esphome/device-builder](https://github.com/esphome/device-builder).
> - **Bug fixes**: small fixes may still be considered, but check whether the
>   same issue exists in Device Builder first; that's where the fix will have
>   a longer life.
> - **Security fixes only** will continue to ship from this repository while
>   it remains embedded in ESPHome releases. Please report security issues
>   privately via
>   [GitHub security advisories](https://github.com/esphome/dashboard/security/advisories/new)
>   rather than opening a public issue or pull request.
> - **Pull requests** that add functionality here will most likely be closed
>   with a pointer to Device Builder. We appreciate the contribution and
>   apologize for the friction; this notice is here so your time isn't spent
>   on a change that won't land.

---

The ESPHome Device Builder is a user facing dashboard embedded in ESPHome. It allows users to easily create and manage their configurations.

This repository contains the JavaScript frontend and is embedded in ESPHome releases.

## Development

Check out this repository, run `npm install` and then run

```
npm run develop
```

It will start the dev server and will automatically re-bundle updated JavaScript (except for the `static` folder).

Then run ESPHome in dashboard dev mode by defining the relative path from the ESPHome repository to this dashboard repository as the environment variable `ESPHOME_DASHBOARD_DEV`.

```
ESPHOME_DASHBOARD_DEV=../dashboard esphome dashboard ./
```
