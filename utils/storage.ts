/**
 * Storage utilities for persistent plugin data
 */

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  baseFontSize: number;
  customRemValues: number[];
  mode: 'exclude' | 'includeOnly';
  excludedNodeIds: string[];
  includedNodeIds: string[];
  excludedLayerPatterns: string[];
  includedLayerPatterns: string[];
  selectionMode: 'page' | 'selection';
}

/**
 * Preset configuration interface
 */
export interface PresetConfig {
  name: string;
  description: string;
  baseFontSize: number;
  customRemValues: number[];
}

/**
 * History entry interface
 */
export interface HistoryEntry {
  timestamp: number;
  baseFontSize: {
    old: number;
    new: number;
  };
  textNodesUpdated: number;
  variablesUpdated: number;
  changes: Array<{
    nodeId: string;
    nodeName: string;
    oldSize: number;
    newSize: number;
  }>;
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  CONFIG: 'rem-plugin-config',
  PRESETS: 'rem-plugin-presets',
  HISTORY: 'rem-plugin-history'
};

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PluginConfig = {
  baseFontSize: 16,
  customRemValues: [0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4],
  mode: 'exclude',
  excludedNodeIds: [],
  includedNodeIds: [],
  excludedLayerPatterns: [],
  includedLayerPatterns: [],
  selectionMode: 'page'
};

/**
 * Built-in presets
 */
export const BUILT_IN_PRESETS: PresetConfig[] = [
  {
    name: 'Material Design',
    description: 'Material Design type scale',
    baseFontSize: 16,
    customRemValues: [0.75, 0.875, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]
  },
  {
    name: 'iOS Human Interface',
    description: 'iOS dynamic type scale',
    baseFontSize: 17,
    customRemValues: [0.706, 0.824, 0.941, 1, 1.118, 1.294, 1.412, 1.647, 1.882]
  },
  {
    name: 'Bootstrap',
    description: 'Bootstrap 5 typography scale',
    baseFontSize: 16,
    customRemValues: [0.875, 1, 1.25, 1.5, 2, 2.5]
  },
  {
    name: 'Tailwind CSS',
    description: 'Tailwind default type scale',
    baseFontSize: 16,
    customRemValues: [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5]
  },
  {
    name: 'Perfect Fourth',
    description: 'Musical scale (1.333 ratio)',
    baseFontSize: 16,
    customRemValues: [0.563, 0.75, 1, 1.333, 1.777, 2.369, 3.157]
  }
];

/**
 * Loads configuration from storage
 * @returns Promise that resolves to the configuration
 */
export async function loadConfig(): Promise<PluginConfig> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEYS.CONFIG);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...stored };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return DEFAULT_CONFIG;
}

/**
 * Saves configuration to storage
 * @param config - The configuration to save
 */
export async function saveConfig(config: PluginConfig): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEYS.CONFIG, config);
  } catch (error) {
    console.error('Failed to save config:', error);
    throw new Error('Failed to save configuration');
  }
}

/**
 * Loads presets from storage
 * @returns Promise that resolves to array of presets
 */
export async function loadPresets(): Promise<PresetConfig[]> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEYS.PRESETS);
    return stored || [];
  } catch (error) {
    console.error('Failed to load presets:', error);
    return [];
  }
}

/**
 * Saves presets to storage
 * @param presets - The presets to save
 */
export async function savePresets(presets: PresetConfig[]): Promise<void> {
  try {
    await figma.clientStorage.setAsync(STORAGE_KEYS.PRESETS, presets);
  } catch (error) {
    console.error('Failed to save presets:', error);
    throw new Error('Failed to save presets');
  }
}

/**
 * Loads history from storage
 * @returns Promise that resolves to array of history entries
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEYS.HISTORY);
    return stored || [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

/**
 * Saves history to storage
 * @param history - The history to save
 * @param maxEntries - Maximum number of entries to keep (default: 50)
 */
export async function saveHistory(
  history: HistoryEntry[],
  maxEntries: number = 50
): Promise<void> {
  try {
    // Keep only the most recent entries
    const trimmed = history.slice(0, maxEntries);
    await figma.clientStorage.setAsync(STORAGE_KEYS.HISTORY, trimmed);
  } catch (error) {
    console.error('Failed to save history:', error);
    throw new Error('Failed to save history');
  }
}

/**
 * Adds a history entry
 * @param entry - The history entry to add
 */
export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  history.unshift(entry);
  await saveHistory(history);
}

/**
 * Exports configuration as JSON string
 * @param config - The configuration to export
 * @returns JSON string
 */
export function exportConfigToJSON(config: PresetConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Imports configuration from JSON string
 * @param json - The JSON string to parse
 * @returns The parsed configuration
 * @throws Error if JSON is invalid
 */
export function importConfigFromJSON(json: string): PresetConfig {
  try {
    const config = JSON.parse(json);

    // Validate required fields
    if (
      typeof config.name !== 'string' ||
      typeof config.baseFontSize !== 'number' ||
      !Array.isArray(config.customRemValues)
    ) {
      throw new Error('Invalid configuration format');
    }

    return config;
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Clears all plugin data from storage
 */
export async function clearAllData(): Promise<void> {
  try {
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.CONFIG);
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.PRESETS);
    await figma.clientStorage.deleteAsync(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw new Error('Failed to clear plugin data');
  }
}
