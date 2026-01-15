/**
 * Main plugin code for Rem - Font Size Manager
 */

import { recalculateFontSize, generateRemScale } from './utils/conversion';
import {
  loadConfig,
  saveConfig,
  loadPresets,
  savePresets,
  loadHistory,
  addHistoryEntry,
  BUILT_IN_PRESETS,
  type PluginConfig,
  type PresetConfig,
  type HistoryEntry
} from './utils/storage';
import {
  getTextNodesFromPage,
  getTextNodesFromSelection,
  filterTextNodes,
  countAffectedNodes,
  getUniqueFontSizes,
  updateTextNodeFontSize,
  updateMixedTextNodeFontSize
} from './utils/traversal';
import { detectRemPattern, suggestRemScale } from './utils/detection';

// Show the plugin UI
figma.showUI(__html__, { width: 480, height: 720, themeColors: true });

// Store current configuration
let currentConfig: PluginConfig;

/**
 * Initialize the plugin
 */
async function initialize() {
  try {
    currentConfig = await loadConfig();

    // Send initial data to UI
    const presets = await loadPresets();
    const history = await loadHistory();

    figma.ui.postMessage({
      type: 'init',
      config: currentConfig,
      presets,
      builtInPresets: BUILT_IN_PRESETS,
      history
    });

    // Send selection update
    sendSelectionUpdate();
  } catch (error) {
    console.error('Failed to initialize:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to initialize plugin'
    });
  }
}

/**
 * Sends selection update to UI
 */
function sendSelectionUpdate() {
  const textNodes =
    currentConfig.selectionMode === 'selection'
      ? getTextNodesFromSelection()
      : getTextNodesFromPage();

  const counts = countAffectedNodes(textNodes, currentConfig);

  figma.ui.postMessage({
    type: 'selection-update',
    counts
  });
}

/**
 * Handles apply changes action
 */
async function handleApplyChanges(newBaseFontSize: number) {
  try {
    const oldBaseFontSize = currentConfig.baseFontSize;

    // Get text nodes based on mode
    const textNodes =
      currentConfig.selectionMode === 'selection'
        ? getTextNodesFromSelection()
        : getTextNodesFromPage();

    // Filter based on include/exclude rules
    const filteredNodes = filterTextNodes(textNodes, currentConfig);

    // Track changes for history
    const changes: HistoryEntry['changes'] = [];
    let successCount = 0;
    let variablesUpdated = 0;

    // Update text nodes
    for (const node of filteredNodes) {
      // Skip locked nodes and nodes using variables
      if (node.locked) continue;

      try {
        const oldSize = node.fontSize;

        if (oldSize !== figma.mixed) {
          // Simple case: uniform font size
          const newSize = recalculateFontSize(
            oldSize,
            oldBaseFontSize,
            newBaseFontSize
          );

          const success = await updateTextNodeFontSize(node, newSize);
          if (success) {
            successCount++;
            changes.push({
              nodeId: node.id,
              nodeName: node.name,
              oldSize,
              newSize
            });
          }
        } else {
          // Mixed font sizes
          const success = await updateMixedTextNodeFontSize(
            node,
            oldBaseFontSize,
            newBaseFontSize
          );
          if (success) {
            successCount++;
            changes.push({
              nodeId: node.id,
              nodeName: node.name,
              oldSize: 0, // Mixed
              newSize: 0 // Mixed
            });
          }
        }
      } catch (error) {
        console.error(`Failed to update node ${node.id}:`, error);
      }
    }

    // Update variables (if any exist)
    // Note: This is a placeholder for variable updates
    // In a real implementation, you would iterate through variables
    // and update their values based on the new base font size

    // Update config
    currentConfig.baseFontSize = newBaseFontSize;
    await saveConfig(currentConfig);

    // Add to history
    const historyEntry: HistoryEntry = {
      timestamp: Date.now(),
      baseFontSize: {
        old: oldBaseFontSize,
        new: newBaseFontSize
      },
      textNodesUpdated: successCount,
      variablesUpdated,
      changes
    };

    await addHistoryEntry(historyEntry);

    // Send success message
    figma.ui.postMessage({
      type: 'apply-success',
      result: {
        textNodesUpdated: successCount,
        variablesUpdated,
        changes
      },
      historyEntry
    });

    // Update selection counts
    sendSelectionUpdate();
  } catch (error) {
    console.error('Failed to apply changes:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to apply changes: ' + (error as Error).message
    });
  }
}

/**
 * Handles smart detect action
 */
async function handleSmartDetect() {
  try {
    // Get text nodes based on mode
    const textNodes =
      currentConfig.selectionMode === 'selection'
        ? getTextNodesFromSelection()
        : getTextNodesFromPage();

    if (textNodes.length === 0) {
      figma.ui.postMessage({
        type: 'error',
        message: 'No text nodes found to analyze'
      });
      return;
    }

    // Get all unique font sizes
    const fontSizes = getUniqueFontSizes(textNodes);

    // Detect pattern
    const detectionResult = detectRemPattern(fontSizes);

    // Suggest rem scale
    const suggestedScale = suggestRemScale(detectionResult);

    figma.ui.postMessage({
      type: 'detect-result',
      result: {
        ...detectionResult,
        suggestedScale
      }
    });
  } catch (error) {
    console.error('Failed to detect pattern:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to detect pattern: ' + (error as Error).message
    });
  }
}

/**
 * Handles config update from UI
 */
async function handleConfigUpdate(config: Partial<PluginConfig>) {
  try {
    currentConfig = { ...currentConfig, ...config };
    await saveConfig(currentConfig);

    figma.ui.postMessage({
      type: 'config-updated',
      config: currentConfig
    });

    // Update selection counts if selection mode changed
    if ('selectionMode' in config) {
      sendSelectionUpdate();
    }
  } catch (error) {
    console.error('Failed to update config:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to update configuration'
    });
  }
}

/**
 * Handles preset save action
 */
async function handleSavePreset(preset: PresetConfig) {
  try {
    const presets = await loadPresets();
    presets.push(preset);
    await savePresets(presets);

    figma.ui.postMessage({
      type: 'presets-updated',
      presets
    });
  } catch (error) {
    console.error('Failed to save preset:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to save preset'
    });
  }
}

/**
 * Handles preset delete action
 */
async function handleDeletePreset(presetName: string) {
  try {
    const presets = await loadPresets();
    const filtered = presets.filter(p => p.name !== presetName);
    await savePresets(filtered);

    figma.ui.postMessage({
      type: 'presets-updated',
      presets: filtered
    });
  } catch (error) {
    console.error('Failed to delete preset:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to delete preset'
    });
  }
}

/**
 * Handles preset load action
 */
async function handleLoadPreset(preset: PresetConfig) {
  try {
    currentConfig.baseFontSize = preset.baseFontSize;
    currentConfig.customRemValues = preset.customRemValues;
    await saveConfig(currentConfig);

    figma.ui.postMessage({
      type: 'preset-loaded',
      config: currentConfig
    });

    sendSelectionUpdate();
  } catch (error) {
    console.error('Failed to load preset:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to load preset'
    });
  }
}

/**
 * Handles add to protected list action
 */
async function handleAddToProtectedList(nodeIds: string[]) {
  try {
    if (currentConfig.mode === 'exclude') {
      // Add to excluded list
      currentConfig.excludedNodeIds = [
        ...new Set([...currentConfig.excludedNodeIds, ...nodeIds])
      ];
    } else {
      // Add to included list
      currentConfig.includedNodeIds = [
        ...new Set([...currentConfig.includedNodeIds, ...nodeIds])
      ];
    }

    await saveConfig(currentConfig);

    figma.ui.postMessage({
      type: 'config-updated',
      config: currentConfig
    });

    sendSelectionUpdate();
  } catch (error) {
    console.error('Failed to add to protected list:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to update protected list'
    });
  }
}

/**
 * Handles remove from protected list action
 */
async function handleRemoveFromProtectedList(nodeId: string) {
  try {
    currentConfig.excludedNodeIds = currentConfig.excludedNodeIds.filter(
      id => id !== nodeId
    );
    currentConfig.includedNodeIds = currentConfig.includedNodeIds.filter(
      id => id !== nodeId
    );

    await saveConfig(currentConfig);

    figma.ui.postMessage({
      type: 'config-updated',
      config: currentConfig
    });

    sendSelectionUpdate();
  } catch (error) {
    console.error('Failed to remove from protected list:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'Failed to update protected list'
    });
  }
}

/**
 * Handles messages from UI
 */
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'apply-changes':
      await handleApplyChanges(msg.baseFontSize);
      break;

    case 'smart-detect':
      await handleSmartDetect();
      break;

    case 'update-config':
      await handleConfigUpdate(msg.config);
      break;

    case 'save-preset':
      await handleSavePreset(msg.preset);
      break;

    case 'delete-preset':
      await handleDeletePreset(msg.presetName);
      break;

    case 'load-preset':
      await handleLoadPreset(msg.preset);
      break;

    case 'add-to-protected':
      await handleAddToProtectedList(msg.nodeIds);
      break;

    case 'remove-from-protected':
      await handleRemoveFromProtectedList(msg.nodeId);
      break;

    case 'get-selection':
      sendSelectionUpdate();
      break;

    case 'close':
      figma.closePlugin();
      break;

    default:
      console.warn('Unknown message type:', msg.type);
  }
};

/**
 * Listen for selection changes
 */
figma.on('selectionchange', () => {
  if (currentConfig && currentConfig.selectionMode === 'selection') {
    sendSelectionUpdate();
  }
});

// Initialize the plugin
initialize();
