/**
 * Node traversal utilities for navigating Figma's node tree
 */

import type { PluginConfig } from './storage';

/**
 * Interface for text node information
 */
export interface TextNodeInfo {
  node: TextNode;
  id: string;
  name: string;
  fontSize: number | typeof figma.mixed;
  locked: boolean;
}

/**
 * Recursively traverses a node and its children to find all text nodes
 * @param node - The node to traverse
 * @param textNodes - Array to collect text nodes
 */
export function traverseNode(node: BaseNode, textNodes: TextNode[] = []): TextNode[] {
  if (node.type === 'TEXT') {
    textNodes.push(node);
  }

  // Check if the node has children
  if ('children' in node) {
    for (const child of node.children) {
      traverseNode(child, textNodes);
    }
  }

  return textNodes;
}

/**
 * Gets all text nodes from the current page
 * @returns Array of text nodes
 */
export function getTextNodesFromPage(): TextNode[] {
  const page = figma.currentPage;
  return traverseNode(page);
}

/**
 * Gets all text nodes from the current selection
 * @returns Array of text nodes
 */
export function getTextNodesFromSelection(): TextNode[] {
  const selection = figma.currentPage.selection;
  const textNodes: TextNode[] = [];

  for (const node of selection) {
    traverseNode(node, textNodes);
  }

  return textNodes;
}

/**
 * Checks if a layer name matches a pattern (supports wildcards)
 * @param layerName - The layer name to check
 * @param pattern - The pattern to match (supports * wildcard)
 * @returns True if the name matches the pattern
 */
export function matchesPattern(layerName: string, pattern: string): boolean {
  // Escape special regex characters except *
  const escapedPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  const regex = new RegExp(`^${escapedPattern}$`, 'i');
  return regex.test(layerName);
}

/**
 * Checks if a node matches any pattern in a list
 * @param layerName - The layer name to check
 * @param patterns - Array of patterns to match against
 * @returns True if the name matches any pattern
 */
export function matchesAnyPattern(layerName: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesPattern(layerName, pattern));
}

/**
 * Filters text nodes based on include/exclude configuration
 * @param textNodes - Array of text nodes to filter
 * @param config - Plugin configuration
 * @returns Filtered array of text nodes
 */
export function filterTextNodes(
  textNodes: TextNode[],
  config: PluginConfig
): TextNode[] {
  return textNodes.filter(node => {
    const nodeId = node.id;
    const layerName = node.name;

    if (config.mode === 'exclude') {
      // Exclude mode: Include everything except excluded items
      // Check if node ID is in excluded list
      if (config.excludedNodeIds.includes(nodeId)) {
        return false;
      }

      // Check if layer name matches any excluded pattern
      if (matchesAnyPattern(layerName, config.excludedLayerPatterns)) {
        return false;
      }

      return true;
    } else {
      // Include Only mode: Only include explicitly included items
      // Check if node ID is in included list
      if (config.includedNodeIds.includes(nodeId)) {
        return true;
      }

      // Check if layer name matches any included pattern
      if (matchesAnyPattern(layerName, config.includedLayerPatterns)) {
        return true;
      }

      return false;
    }
  });
}

/**
 * Gets text node information including all font sizes
 * @param node - The text node
 * @returns Text node information
 */
export function getTextNodeInfo(node: TextNode): TextNodeInfo {
  return {
    node,
    id: node.id,
    name: node.name,
    fontSize: node.fontSize,
    locked: node.locked
  };
}

/**
 * Checks if a text node uses variables for font size
 * @param node - The text node to check
 * @returns True if the node uses font size variables
 */
export function usesVariableForFontSize(node: TextNode): boolean {
  try {
    // Check if the fontSize is bound to a variable
    const bindings = node.boundVariables;
    return bindings !== undefined && 'fontSize' in bindings;
  } catch (error) {
    return false;
  }
}

/**
 * Gets all unique font sizes from text nodes
 * @param textNodes - Array of text nodes
 * @returns Array of unique font sizes (excludes mixed sizes)
 */
export function getUniqueFontSizes(textNodes: TextNode[]): number[] {
  const sizes = new Set<number>();

  for (const node of textNodes) {
    if (node.fontSize !== figma.mixed) {
      sizes.add(node.fontSize);
    } else {
      // Handle mixed font sizes by checking each character range
      for (let i = 0; i < node.characters.length; i++) {
        const size = node.getRangeFontSize(i, i + 1);
        if (size !== figma.mixed) {
          sizes.add(size);
        }
      }
    }
  }

  return Array.from(sizes).sort((a, b) => a - b);
}

/**
 * Counts text nodes that would be affected by changes
 * @param textNodes - Array of text nodes
 * @param config - Plugin configuration
 * @returns Object with counts
 */
export function countAffectedNodes(
  textNodes: TextNode[],
  config: PluginConfig
): {
  total: number;
  filtered: number;
  locked: number;
  usingVariables: number;
  willUpdate: number;
} {
  const filtered = filterTextNodes(textNodes, config);
  const locked = filtered.filter(node => node.locked).length;
  const usingVariables = filtered.filter(node => usesVariableForFontSize(node)).length;
  const willUpdate = filtered.filter(
    node => !node.locked && !usesVariableForFontSize(node)
  ).length;

  return {
    total: textNodes.length,
    filtered: filtered.length,
    locked,
    usingVariables,
    willUpdate
  };
}

/**
 * Safely updates a text node's font size
 * @param node - The text node to update
 * @param newSize - The new font size
 * @returns True if successful, false otherwise
 */
export async function updateTextNodeFontSize(
  node: TextNode,
  newSize: number
): Promise<boolean> {
  try {
    // Skip locked nodes
    if (node.locked) {
      return false;
    }

    // Skip nodes using variables
    if (usesVariableForFontSize(node)) {
      return false;
    }

    // Load font before making changes
    if (node.fontSize !== figma.mixed) {
      await figma.loadFontAsync(node.fontName as FontName);
      node.fontSize = newSize;
    } else {
      // Handle mixed font sizes
      for (let i = 0; i < node.characters.length; i++) {
        const fontName = node.getRangeFontName(i, i + 1);
        if (fontName !== figma.mixed) {
          await figma.loadFontAsync(fontName);
        }
      }
      node.fontSize = newSize;
    }

    return true;
  } catch (error) {
    console.error(`Failed to update text node ${node.id}:`, error);
    return false;
  }
}

/**
 * Safely updates a text node's font size for mixed content
 * @param node - The text node to update
 * @param oldBase - Old base font size
 * @param newBase - New base font size
 * @returns True if successful, false otherwise
 */
export async function updateMixedTextNodeFontSize(
  node: TextNode,
  oldBase: number,
  newBase: number
): Promise<boolean> {
  try {
    // Skip locked nodes
    if (node.locked) {
      return false;
    }

    // Skip nodes using variables
    if (usesVariableForFontSize(node)) {
      return false;
    }

    if (node.fontSize === figma.mixed) {
      // Handle each character range separately
      let i = 0;
      while (i < node.characters.length) {
        const currentSize = node.getRangeFontSize(i, i + 1);
        if (currentSize !== figma.mixed) {
          // Calculate new size
          const remValue = currentSize / oldBase;
          const newSize = remValue * newBase;

          // Find the end of this range with the same size
          let j = i + 1;
          while (j < node.characters.length) {
            const nextSize = node.getRangeFontSize(j, j + 1);
            if (nextSize !== currentSize) break;
            j++;
          }

          // Load font and update range
          const fontName = node.getRangeFontName(i, j);
          if (fontName !== figma.mixed) {
            await figma.loadFontAsync(fontName);
            node.setRangeFontSize(i, j, newSize);
          }

          i = j;
        } else {
          i++;
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to update mixed text node ${node.id}:`, error);
    return false;
  }
}
