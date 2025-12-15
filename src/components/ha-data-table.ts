// Import the HA data table component from the homeassistant-frontend submodule
// This follows the HACS pattern of directly importing from the submodule
import "../../homeassistant-frontend/src/components/data-table/ha-data-table";

// Re-export the types from the HA data table
export type {
  DataTableColumnContainer,
  DataTableRowData,
  DataTableColumnData,
  SortingDirection,
} from "../../homeassistant-frontend/src/components/data-table/ha-data-table";
