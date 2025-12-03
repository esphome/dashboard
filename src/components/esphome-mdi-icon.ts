import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  mdiChip,
  mdiLightbulb,
  mdiThermometer,
  mdiMotionSensor,
  mdiMicrophone,
  mdiFan,
  mdiPowerPlug,
  mdiLedStrip,
  mdiSpeaker,
  mdiGauge,
  mdiWater,
  mdiAirFilter,
} from "@mdi/js";

// Cache for loaded icon paths
const iconCache: Record<string, string> = {};

// Pre-bundled common icons
const BUNDLED_ICONS: Record<string, string> = {
  chip: mdiChip,
  lightbulb: mdiLightbulb,
  thermometer: mdiThermometer,
  "motion-sensor": mdiMotionSensor,
  microphone: mdiMicrophone,
  fan: mdiFan,
  "power-plug": mdiPowerPlug,
  "led-strip": mdiLedStrip,
  speaker: mdiSpeaker,
  gauge: mdiGauge,
  water: mdiWater,
  "air-filter": mdiAirFilter,
};

@customElement("esphome-mdi-icon")
export class ESPHomeMdiIcon extends LitElement {
  @property() public icon?: string;

  @state() private _path?: string;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("icon")) {
      this._loadIcon();
    }
  }

  private async _loadIcon() {
    if (!this.icon) {
      this._path = undefined;
      return;
    }

    // Parse the icon name (remove mdi: prefix if present)
    const iconName = this.icon.startsWith("mdi:")
      ? this.icon.slice(4)
      : this.icon;

    // Check cache first
    if (iconCache[iconName]) {
      this._path = iconCache[iconName];
      return;
    }

    // Check bundled icons
    if (BUNDLED_ICONS[iconName]) {
      this._path = BUNDLED_ICONS[iconName];
      iconCache[iconName] = this._path;
      return;
    }

    // Fetch from CDN for non-bundled icons
    try {
      const response = await fetch(
        `https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/${iconName}.svg`
      );

      if (!response.ok) {
        throw new Error(`Icon not found: ${iconName}`);
      }

      const svgText = await response.text();
      const pathMatch = svgText.match(/d="([^"]+)"/);

      if (pathMatch && pathMatch[1]) {
        iconCache[iconName] = pathMatch[1];
        this._path = pathMatch[1];
      } else {
        throw new Error(`Could not parse SVG for icon: ${iconName}`);
      }
    } catch (err) {
      console.warn(`Failed to load icon: ${iconName}`, err);
      this._path = mdiChip;
    }
  }

  protected render() {
    if (!this._path) {
      return nothing;
    }

    return html`
      <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        <path d=${this._path}></path>
      </svg>
    `;
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--mdc-icon-size, 24px);
      height: var(--mdc-icon-size, 24px);
      fill: currentColor;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-mdi-icon": ESPHomeMdiIcon;
  }
}
