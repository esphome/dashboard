// Mock Home Assistant object for components that expect it
export interface MockHass {
  localize: (key: string, ...args: any[]) => string;
  language: string;
  locale: {
    language: string;
    number_format: string;
    time_format: string;
    date_format: string;
    first_weekday: number;
    time_zone: string;
  };
  config: {
    components: string[];
  };
}

export const createMockHass = (): MockHass => ({
  localize: (key: string, ...args: any[]) => {
    // Basic localization - just return the key or a simple translation with parameter support
    const params = args[0] || {};
    const translations: Record<string, string> = {
      // Main subpage-data-table translations
      "ui.components.subpage-data-table.filters": "Filters",
      "ui.components.subpage-data-table.sort_by": "Sort by",
      "ui.components.subpage-data-table.group_by": "Group by",
      "ui.components.subpage-data-table.dont_group_by": "Don't group by",
      "ui.components.subpage-data-table.collapse_all_groups": "Collapse all groups",
      "ui.components.subpage-data-table.expand_all_groups": "Expand all groups",
      "ui.components.subpage-data-table.settings": "Settings",
      "ui.components.subpage-data-table.enter_selection_mode": "Enter selection mode",
      "ui.components.subpage-data-table.exit_selection_mode": "Exit selection mode",
      "ui.components.subpage-data-table.select": "Select",
      "ui.components.subpage-data-table.select_all": "Select all",
      "ui.components.subpage-data-table.select_none": "Select none",
      "ui.components.subpage-data-table.selected": "Selected",
      "ui.components.subpage-data-table.clear_filter": "Clear filter",
      "ui.components.subpage-data-table.close_filter": "Close filter",
      "ui.components.subpage-data-table.show_results": "Show results",
      // Data table component translations
      "ui.components.data-table.search": "Search",
      "ui.components.data-table.no-data": "No data",
      "ui.components.data-table.select-all": "Select all",
      "ui.components.data-table.select-none": "Select none",
      "ui.components.data-table.rows-per-page": "Rows per page",
      "ui.components.data-table.show_columns": "Show columns",
      "ui.components.data-table.hidden_columns": "Hidden columns",
      "ui.components.data-table.manage_columns": "Manage columns",
      "ui.components.data-table.reset_columns": "Reset columns",
      // Common translations
      "ui.common.search": "Search",
      "ui.common.clear": "Clear",
      "ui.common.cancel": "Cancel",
      "ui.common.close": "Close",
      "ui.common.none": "None",
      "ui.common.settings": "Settings",
      // Panel specific translations
      "ui.panel.config.devices.data_table.filter": "Filter",
      "ui.panel.config.devices.data_table.clear_filter": "Clear filter",
      "ui.panel.config.devices.data_table.sort_by": "Sort by",
      "ui.panel.config.devices.data_table.no_data": "No data",
      "ui.panel.config.devices.data_table.group_by": "Group by",
      // Add more translations as needed
    };

    let translation = translations[key] || key;

    // Handle parameter substitution for dynamic translations
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{${param}}`, params[param]);
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }

    return translation;
  },
  language: "en",
  locale: {
    language: "en",
    number_format: "language",
    time_format: "language",
    date_format: "language",
    first_weekday: 1,
    time_zone: "UTC",
  },
  config: {
    components: [],
  },
});

export const mockHass = createMockHass();