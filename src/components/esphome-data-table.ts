import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";

export interface DataTableColumnContainer {
  [key: string]: DataTableColumnData;
}

export interface DataTableColumnData {
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: "numeric" | "icon" | "flex";
  hidden?: boolean;
  width?: string;
  template?: (data: any, row: any) => TemplateResult | string;
}

export interface DataTableRowData {
  [key: string]: any;
}

export interface SortingDirection {
  column?: string;
  direction: "asc" | "desc" | null;
}

@customElement("esphome-data-table")
export class ESPHomeDataTable extends LitElement {
  @property({ attribute: false }) public columns: DataTableColumnContainer = {};

  @property({ attribute: false }) public data: DataTableRowData[] = [];

  @property({ type: Boolean }) public selectable = false;

  @property({ attribute: false }) public sortColumn?: string;

  @property({ attribute: false }) public sortDirection: "asc" | "desc" | null =
    null;

  @property() public filter = "";

  @property({ type: Boolean }) public noDataText = "No data to display";

  @state() private _selection = new Set<number>();

  @state() private _filteredData: DataTableRowData[] = [];

  private _getFilteredSortedData(): DataTableRowData[] {
    let data = [...this.data];

    // Apply filtering
    if (this.filter) {
      const filterLower = this.filter.toLowerCase();
      data = data.filter((row) => {
        return Object.entries(this.columns).some(([key, col]) => {
          if (!col.filterable) return false;
          const value = row[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(filterLower);
        });
      });
    }

    // Apply sorting
    if (this.sortColumn && this.sortDirection) {
      const sortColumn = this.columns[this.sortColumn];
      if (sortColumn?.sortable) {
        data.sort((a, b) => {
          const aVal = a[this.sortColumn!];
          const bVal = b[this.sortColumn!];

          let result = 0;
          if (sortColumn.type === "numeric") {
            result = Number(aVal || 0) - Number(bVal || 0);
          } else if (this.sortColumn === "status") {
            // Special sorting for status: Online first, then Offline, then Discovered
            const statusOrder: { [key: string]: number } = {
              "Online": 0,
              "Offline": 1,
              "Discovered": 2
            };
            const aOrder = statusOrder[aVal] ?? 3;
            const bOrder = statusOrder[bVal] ?? 3;
            result = aOrder - bOrder;
          } else {
            result = String(aVal || "").localeCompare(String(bVal || ""));
          }

          return this.sortDirection === "desc" ? -result : result;
        });
      }
    }

    return data;
  }

  private _handleHeaderClick(columnKey: string) {
    const column = this.columns[columnKey];
    if (!column?.sortable) return;

    let newDirection: "asc" | "desc" | null = "asc";

    if (this.sortColumn === columnKey) {
      if (this.sortDirection === "asc") {
        newDirection = "desc";
      } else if (this.sortDirection === "desc") {
        newDirection = null;
      }
    }

    this.sortColumn = newDirection ? columnKey : undefined;
    this.sortDirection = newDirection;

    this._fireEvent("sorting-changed", {
      column: this.sortColumn,
      direction: this.sortDirection,
    });
  }

  private _handleRowClick(rowIndex: number) {
    this._fireEvent("row-click", {
      index: rowIndex,
      data: this._filteredData[rowIndex],
    });
  }

  private _handleSelectionChange(rowIndex: number, selected: boolean) {
    if (selected) {
      this._selection.add(rowIndex);
    } else {
      this._selection.delete(rowIndex);
    }
    this._selection = new Set(this._selection);

    this._fireEvent("selection-changed", {
      selection: Array.from(this._selection),
      selectedRows: Array.from(this._selection).map(
        (i) => this._filteredData[i],
      ),
    });
  }

  private _fireEvent(type: string, detail: any) {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }

  public clearSelection() {
    this._selection.clear();
    this._selection = new Set();
  }

  public selectAll() {
    this._selection = new Set(this._filteredData.map((_, index) => index));
    this._fireEvent("selection-changed", {
      selection: Array.from(this._selection),
      selectedRows: Array.from(this._selection).map(
        (i) => this._filteredData[i],
      ),
    });
  }

  protected willUpdate() {
    this._filteredData = this._getFilteredSortedData();
  }

  protected render() {
    if (this._filteredData.length === 0) {
      return html` <div class="no-data">${this.noDataText}</div> `;
    }

    const columnKeys = Object.keys(this.columns).filter(
      (key) => !this.columns[key].hidden,
    );

    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              ${this.selectable
                ? html`
                    <th class="checkbox-column">
                      <input
                        type="checkbox"
                        .checked=${this._selection.size ===
                          this._filteredData.length &&
                        this._filteredData.length > 0}
                        .indeterminate=${this._selection.size > 0 &&
                        this._selection.size < this._filteredData.length}
                        @change=${(e: Event) => {
                          const target = e.target as HTMLInputElement;
                          if (target.checked) {
                            this.selectAll();
                          } else {
                            this.clearSelection();
                          }
                        }}
                      />
                    </th>
                  `
                : ""}
              ${columnKeys.map((key) => {
                const column = this.columns[key];
                const isSorted = this.sortColumn === key;
                return html`
                  <th
                    class=${classMap({
                      sortable: !!column.sortable,
                      sorted: isSorted,
                      [`sort-${this.sortDirection}`]:
                        isSorted && !!this.sortDirection,
                    })}
                    style=${column.width ? `width: ${column.width}` : ""}
                    @click=${() => this._handleHeaderClick(key)}
                  >
                    <div class="header-content">
                      <span>${column.title}</span>
                      ${column.sortable
                        ? html`
                            <span class="sort-indicator">
                              ${isSorted
                                ? this.sortDirection === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          `
                        : ""}
                    </div>
                  </th>
                `;
              })}
            </tr>
          </thead>
          <tbody>
            ${repeat(
              this._filteredData,
              (row, index) => index,
              (row, index) => html`
                <tr
                  class=${classMap({
                    selected: this._selection.has(index),
                  })}
                  @click=${() => this._handleRowClick(index)}
                >
                  ${this.selectable
                    ? html`
                        <td class="checkbox-column">
                          <input
                            type="checkbox"
                            .checked=${this._selection.has(index)}
                            @change=${(e: Event) => {
                              e.stopPropagation();
                              const target = e.target as HTMLInputElement;
                              this._handleSelectionChange(
                                index,
                                target.checked,
                              );
                            }}
                            @click=${(e: Event) => e.stopPropagation()}
                          />
                        </td>
                      `
                    : ""}
                  ${columnKeys.map((key) => {
                    const column = this.columns[key];
                    const cellData = row[key];
                    const cellContent = column.template
                      ? column.template(cellData, row)
                      : cellData;

                    return html`
                      <td
                        class=${classMap({
                          [`type-${column.type}`]: !!column.type,
                        })}
                      >
                        ${cellContent}
                      </td>
                    `;
                  })}
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .table-container {
      overflow-x: auto;
      background: var(--card-background-color, white);
      border-radius: 4px;
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2)
      );
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
    }

    thead {
      background-color: var(
        --data-table-header-background-color,
        var(--secondary-background-color, rgba(0, 0, 0, 0.03))
      );
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    }

    th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 500;
      font-size: 14px;
      color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      position: relative;
      user-select: none;
    }

    th.sortable {
      cursor: pointer;
    }

    th.sortable:hover {
      background-color: var(
        --data-table-header-background-color-hover,
        rgba(0, 0, 0, 0.04)
      );
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sort-indicator {
      margin-left: 8px;
      opacity: 0.5;
      font-size: 12px;
    }

    th.sorted .sort-indicator {
      opacity: 1;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      color: var(--primary-text-color, rgba(0, 0, 0, 0.87));
      font-size: 14px;
    }

    tbody tr {
      background-color: var(--card-background-color, white);
      transition: background-color 0.2s ease;
    }

    tbody tr:nth-child(even) {
      background-color: var(
        --table-row-alternative-background-color,
        var(--secondary-background-color, rgba(0, 0, 0, 0.02))
      );
    }

    tbody tr:hover {
      background-color: var(
        --table-row-background-color-hover,
        rgba(0, 0, 0, 0.04)
      );
      cursor: pointer;
    }

    tbody tr.selected {
      background-color: var(--primary-color, #03a9f4) !important;
      color: var(--text-primary-color, white);
    }

    tbody tr.selected td {
      color: var(--text-primary-color, white);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    /* Status indicator styles */
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      background-color: var(--status-color);
      position: relative;
      z-index: 10;
    }
    
    /* Status badge styles */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1;
      color: var(--status-color);
    }
    
    .status-badge.online {
      --status-color: var(--alert-success-color, #4caf50);
    }
    
    .status-badge.offline {
      --status-color: var(--alert-error-color, #d93025);
    }
    
    .status-badge.discovered {
      --status-color: var(--alert-info-color, #00539f);
    }
    
    /* First column (status indicators) should be on top */
    td:first-child {
      position: relative;
      z-index: 5;
    }
    
    /* Actions container styles */
    .actions-container {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .actions-container mwc-button {
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-button-horizontal-padding: 8px;
      font-size: 14px;
    }
    
    .actions-container mwc-button[unelevated] {
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-theme-on-primary: var(--card-background-color);
    }
    
    /* Icon color fixes for action menus */
    esphome-button-menu {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
      position: relative;
      z-index: 1;
    }
    
    esphome-button-menu mwc-list-item {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
      --mdc-list-item-graphic-color: var(--primary-text-color);
    }
    
    esphome-button-menu esphome-svg-icon {
      fill: var(--primary-text-color) !important;
      color: var(--primary-text-color) !important;
    }
    
    esphome-button-menu mwc-list-item [slot="graphic"] {
      color: var(--primary-text-color) !important;
    }
    
    .warning {
      color: var(--alert-error-color);
    }
    
    .warning mwc-icon,
    .warning esphome-svg-icon {
      color: var(--alert-error-color) !important;
      fill: var(--alert-error-color) !important;
    }

    .checkbox-column {
      width: 40px;
      padding: 8px 16px;
    }

    .checkbox-column input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }

    .type-numeric {
      text-align: right;
    }

    .type-flex {
      width: 100%;
    }

    .no-data {
      text-align: center;
      padding: 32px;
      color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
      font-style: italic;
      background: var(--card-background-color, white);
      border-radius: 4px;
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2)
      );
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      thead {
        background-color: var(
          --data-table-header-background-color,
          rgba(255, 255, 255, 0.05)
        );
      }

      th {
        color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
        border-bottom-color: var(--divider-color, rgba(255, 255, 255, 0.12));
      }

      th.sortable:hover {
        background-color: var(
          --data-table-header-background-color-hover,
          rgba(255, 255, 255, 0.08)
        );
      }

      td {
        color: var(--primary-text-color, rgba(255, 255, 255, 0.87));
        border-bottom-color: var(--divider-color, rgba(255, 255, 255, 0.12));
      }

      tbody tr:nth-child(even) {
        background-color: var(
          --table-row-alternative-background-color,
          rgba(255, 255, 255, 0.02)
        );
      }

      tbody tr:hover {
        background-color: var(
          --table-row-background-color-hover,
          rgba(255, 255, 255, 0.04)
        );
      }
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      th,
      td {
        padding: 8px 12px;
        font-size: 13px;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-data-table": ESPHomeDataTable;
  }
}
