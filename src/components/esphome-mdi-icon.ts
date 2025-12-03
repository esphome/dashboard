import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { mdiChip } from "@mdi/js";

// Cache for loaded icon paths
const iconCache: Record<string, string> = {};

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

    // Check cache
    if (iconCache[iconName]) {
      this._path = iconCache[iconName];
      return;
    }

    try {
      // Convert icon name to @mdi/js export name (e.g., "lightbulb" -> "mdiLightbulb")
      const mdiName =
        "mdi" +
        iconName
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("");

      // Dynamic import from @mdi/js
      const mdiModule = await import("@mdi/js");
      const path = mdiModule[mdiName as keyof typeof mdiModule] as string;

      if (path && typeof path === "string") {
        iconCache[iconName] = path;
        this._path = path;
      } else {
        throw new Error(`Icon not found: ${iconName}`);
      }
    } catch (err) {
      console.warn(`Failed to load icon: ${iconName}`, err);
      // Fallback to chip icon
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
