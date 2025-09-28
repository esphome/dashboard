import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import memoizeOne from "memoize-one";

export interface DataTableColumnContainer {
  [key: string]: DataTableColumnData;
}

export interface DataTableColumnData {
  title: TemplateResult | string;
  sortable?: boolean;
  filterable?: boolean;
  minWidth?: string;
  maxWidth?: string;
  flex?: number;
  template?: (row: any) => TemplateResult | string | typeof nothing;
  hidden?: boolean;
}

export interface DataTableRowData {
  [key: string]: any;
}

export type SortingDirection = "asc" | "desc" | null;

@customElement("ha-data-table")
export class HaDataTable extends LitElement {
  @property({ attribute: false }) public columns: DataTableColumnContainer = {};

  @property({ attribute: false }) public data: DataTableRowData[] = [];

  @property() public filter = "";

  @property() public sortColumn?: string;

  @property() public sortDirection: SortingDirection = null;

  @property() public noDataText = "No data";

  @state() private _filteredData: DataTableRowData[] = [];

  private _sortData = memoizeOne(
    (data: DataTableRowData[], sortColumn?: string, sortDirection?: SortingDirection) => {
      if (!sortColumn || !sortDirection) {
        return data;
      }

      const sorted = [...data];
      sorted.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        let result = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          result = aVal - bVal;
        } else {
          result = String(aVal || "").localeCompare(String(bVal || ""));
        }

        return sortDirection === "desc" ? -result : result;
      });

      return sorted;
    }
  );

  private _filterData = memoizeOne(
    (data: DataTableRowData[], filter: string, columns: DataTableColumnContainer) => {
      if (!filter) {
        return data;
      }

      const filterLower = filter.toLowerCase();
      return data.filter((row) => {
        return Object.entries(columns).some(([key, col]) => {
          if (!col.filterable) return false;
          const value = row[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(filterLower);
        });
      });
    }
  );

  protected willUpdate() {
    const filtered = this._filterData(this.data, this.filter, this.columns);
    this._filteredData = this._sortData(filtered, this.sortColumn, this.sortDirection);
  }

  private _handleHeaderClick(columnKey: string) {
    const column = this.columns[columnKey];
    if (!column?.sortable) return;

    let newDirection: SortingDirection = "asc";

    if (this.sortColumn === columnKey) {
      if (this.sortDirection === "asc") {
        newDirection = "desc";
      } else if (this.sortDirection === "desc") {
        newDirection = null;
      }
    }

    this.sortColumn = newDirection ? columnKey : undefined;
    this.sortDirection = newDirection;

    this.dispatchEvent(
      new CustomEvent("sorting-changed", {
        detail: { column: this.sortColumn, direction: this.sortDirection },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleRowClick(index: number) {
    this.dispatchEvent(
      new CustomEvent("row-click", {
        detail: { index, data: this._filteredData[index] },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    if (this._filteredData.length === 0) {
      return html`<div class="no-data">${this.noDataText}</div>`;
    }

    const columnKeys = Object.keys(this.columns).filter(
      (key) => !this.columns[key].hidden
    );

    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
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
                    style=${styleMap({
                      minWidth: column.minWidth || "auto",
                      maxWidth: column.maxWidth || "none",
                    })}
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
            ${this._filteredData.map((row, index) => html`
              <tr @click=${() => this._handleRowClick(index)}>
                ${columnKeys.map((key) => {
                  const column = this.columns[key];
                  const cellContent = column.template
                    ? column.template(row)
                    : row[key];

                  return html`<td>${cellContent}</td>`;
                })}
              </tr>
            `)}
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

    tbody tr:last-child td {
      border-bottom: none;
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

    .status-badge.online,
    .status-indicator.online {
      --status-color: var(--alert-success-color, #4caf50);
    }

    .status-badge.offline,
    .status-indicator.offline {
      --status-color: var(--alert-error-color, #d93025);
    }

    .status-badge.discovered,
    .status-indicator.discovered {
      --status-color: var(--alert-info-color, #00539f);
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
    "ha-data-table": HaDataTable;
  }
}