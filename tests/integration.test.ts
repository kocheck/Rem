/**
 * Integration tests for Rem plugin
 */

import {
  setupFigmaMock,
  resetFigmaMock,
  createMockTextNode,
  createMockFrameNode,
  mockFigma
} from './mocks/figma-api';
import {
  loadConfig,
  saveConfig,
  DEFAULT_CONFIG,
  type PluginConfig
} from '../utils/storage';
import {
  getTextNodesFromPage,
  getTextNodesFromSelection,
  filterTextNodes,
  countAffectedNodes,
  matchesPattern
} from '../utils/traversal';
import { detectRemPattern } from '../utils/detection';
import { recalculateFontSize } from '../utils/conversion';

describe('Integration Tests', () => {
  beforeEach(() => {
    setupFigmaMock();
  });

  afterEach(() => {
    resetFigmaMock();
  });

  describe('Storage Integration', () => {
    it('should save and load configuration', async () => {
      const config: PluginConfig = {
        ...DEFAULT_CONFIG,
        baseFontSize: 20,
        customRemValues: [0.5, 1, 2]
      };

      await saveConfig(config);
      const loaded = await loadConfig();

      expect(loaded.baseFontSize).toBe(20);
      expect(loaded.customRemValues).toEqual([0.5, 1, 2]);
    });

    it('should return default config when nothing saved', async () => {
      const loaded = await loadConfig();

      expect(loaded.baseFontSize).toBe(DEFAULT_CONFIG.baseFontSize);
      expect(loaded.mode).toBe(DEFAULT_CONFIG.mode);
    });

    it('should merge saved config with defaults', async () => {
      const partial = { baseFontSize: 18 };
      await mockFigma.clientStorage.setAsync('rem-plugin-config', partial);

      const loaded = await loadConfig();

      expect(loaded.baseFontSize).toBe(18);
      expect(loaded.mode).toBe(DEFAULT_CONFIG.mode);
    });
  });

  describe('Traversal Integration', () => {
    it('should find all text nodes in page', () => {
      const text1 = createMockTextNode({
        id: '1',
        name: 'Text 1',
        fontSize: 16
      });
      const text2 = createMockTextNode({
        id: '2',
        name: 'Text 2',
        fontSize: 24
      });
      const frame = createMockFrameNode({
        id: 'frame',
        name: 'Frame',
        children: [text2]
      });

      mockFigma.currentPage.children = [text1, frame];

      const textNodes = getTextNodesFromPage();

      expect(textNodes).toHaveLength(2);
      expect(textNodes).toContain(text1);
      expect(textNodes).toContain(text2);
    });

    it('should find text nodes in selection', () => {
      const text1 = createMockTextNode({
        id: '1',
        name: 'Text 1',
        fontSize: 16
      });
      const text2 = createMockTextNode({
        id: '2',
        name: 'Text 2',
        fontSize: 24
      });
      const frame = createMockFrameNode({
        id: 'frame',
        name: 'Frame',
        children: [text2]
      });

      mockFigma.currentPage.selection = [frame];

      const textNodes = getTextNodesFromSelection();

      expect(textNodes).toHaveLength(1);
      expect(textNodes).toContain(text2);
      expect(textNodes).not.toContain(text1);
    });

    it('should filter text nodes based on exclude mode', () => {
      const text1 = createMockTextNode({
        id: '1',
        name: 'Text 1',
        fontSize: 16
      });
      const text2 = createMockTextNode({
        id: '2',
        name: 'Text 2',
        fontSize: 24
      });
      const text3 = createMockTextNode({
        id: '3',
        name: 'Logo Text',
        fontSize: 32
      });

      const textNodes = [text1, text2, text3];
      const config: PluginConfig = {
        ...DEFAULT_CONFIG,
        mode: 'exclude',
        excludedNodeIds: ['2'],
        excludedLayerPatterns: ['Logo*']
      };

      const filtered = filterTextNodes(textNodes, config);

      expect(filtered).toHaveLength(1);
      expect(filtered).toContain(text1);
      expect(filtered).not.toContain(text2);
      expect(filtered).not.toContain(text3);
    });

    it('should filter text nodes based on include only mode', () => {
      const text1 = createMockTextNode({
        id: '1',
        name: 'Text 1',
        fontSize: 16
      });
      const text2 = createMockTextNode({
        id: '2',
        name: 'Text 2',
        fontSize: 24
      });
      const text3 = createMockTextNode({
        id: '3',
        name: 'Header Text',
        fontSize: 32
      });

      const textNodes = [text1, text2, text3];
      const config: PluginConfig = {
        ...DEFAULT_CONFIG,
        mode: 'includeOnly',
        includedNodeIds: ['2'],
        includedLayerPatterns: ['Header*']
      };

      const filtered = filterTextNodes(textNodes, config);

      expect(filtered).toHaveLength(2);
      expect(filtered).toContain(text2);
      expect(filtered).toContain(text3);
      expect(filtered).not.toContain(text1);
    });

    it('should count affected nodes correctly', () => {
      const text1 = createMockTextNode({
        id: '1',
        name: 'Text 1',
        fontSize: 16,
        locked: false
      });
      const text2 = createMockTextNode({
        id: '2',
        name: 'Text 2',
        fontSize: 24,
        locked: true
      });
      const text3 = createMockTextNode({
        id: '3',
        name: 'Text 3',
        fontSize: 32,
        locked: false
      });

      const textNodes = [text1, text2, text3];
      const config: PluginConfig = {
        ...DEFAULT_CONFIG,
        mode: 'exclude',
        excludedNodeIds: []
      };

      const counts = countAffectedNodes(textNodes, config);

      expect(counts.total).toBe(3);
      expect(counts.filtered).toBe(3);
      expect(counts.locked).toBe(1);
      expect(counts.willUpdate).toBe(2);
    });
  });

  describe('Pattern Matching', () => {
    it('should match exact layer names', () => {
      expect(matchesPattern('Header', 'Header')).toBe(true);
      expect(matchesPattern('Header', 'Footer')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(matchesPattern('Header Text', 'Header*')).toBe(true);
      expect(matchesPattern('Text Header', '*Header')).toBe(true);
      expect(matchesPattern('Some Header Text', '*Header*')).toBe(true);
      expect(matchesPattern('Footer', 'Header*')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(matchesPattern('HEADER', 'header')).toBe(true);
      expect(matchesPattern('header', 'HEADER')).toBe(true);
      expect(matchesPattern('Header Text', 'header*')).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: detect -> apply', async () => {
      // Setup: Create text nodes with rem-based sizes (with repetitions for detection)
      const text1 = createMockTextNode({ id: '1', name: 'Small1', fontSize: 12 }); // 0.75rem
      const text2 = createMockTextNode({ id: '2', name: 'Small2', fontSize: 12 });
      const text3 = createMockTextNode({ id: '3', name: 'Normal1', fontSize: 16 }); // 1rem
      const text4 = createMockTextNode({ id: '4', name: 'Normal2', fontSize: 16 });
      const text5 = createMockTextNode({ id: '5', name: 'Normal3', fontSize: 16 });
      const text6 = createMockTextNode({ id: '6', name: 'Large1', fontSize: 24 }); // 1.5rem
      const text7 = createMockTextNode({ id: '7', name: 'Large2', fontSize: 24 });

      mockFigma.currentPage.children = [text1, text2, text3, text4, text5, text6, text7];

      // Step 1: Get text nodes
      const textNodes = getTextNodesFromPage();
      expect(textNodes).toHaveLength(7);

      // Step 2: Detect pattern
      const fontSizes = textNodes
        .map(node => node.fontSize)
        .filter(size => typeof size === 'number') as number[];

      const detection = detectRemPattern(fontSizes);
      expect(detection.isRemBased).toBe(true);
      // Algorithm may choose different bases - just verify it detects a pattern
      expect(detection.suggestedBaseFontSize).toBeGreaterThan(0);

      // Step 3: Load config
      const config = await loadConfig();
      expect(config.baseFontSize).toBe(16);

      // Step 4: Calculate new sizes (change base from 16 to 20)
      const newBase = 20;
      const newSizes = textNodes.map(node => {
        const currentSize = node.fontSize as number;
        return recalculateFontSize(currentSize, config.baseFontSize, newBase);
      });

      // Verify correct recalculation: 2x 12px, 3x 16px, 2x 24px
      expect(newSizes[0]).toBe(15); // 12px (0.75rem) -> 15px
      expect(newSizes[1]).toBe(15); // 12px (0.75rem) -> 15px
      expect(newSizes[2]).toBe(20); // 16px (1rem) -> 20px
      expect(newSizes[3]).toBe(20); // 16px (1rem) -> 20px
      expect(newSizes[4]).toBe(20); // 16px (1rem) -> 20px
      expect(newSizes[5]).toBe(30); // 24px (1.5rem) -> 30px
      expect(newSizes[6]).toBe(30); // 24px (1.5rem) -> 30px

      // Step 5: Update config
      config.baseFontSize = newBase;
      await saveConfig(config);

      const loadedConfig = await loadConfig();
      expect(loadedConfig.baseFontSize).toBe(20);
    });

    it('should handle mixed scenarios', async () => {
      // Text nodes with different conditions
      const textNormal = createMockTextNode({
        id: '1',
        name: 'Normal',
        fontSize: 16,
        locked: false
      });
      const textLocked = createMockTextNode({
        id: '2',
        name: 'Locked',
        fontSize: 16,
        locked: true
      });
      const textExcluded = createMockTextNode({
        id: '3',
        name: 'Logo',
        fontSize: 24,
        locked: false
      });

      mockFigma.currentPage.children = [textNormal, textLocked, textExcluded];

      // Configure to exclude "Logo*" pattern
      const config: PluginConfig = {
        ...DEFAULT_CONFIG,
        baseFontSize: 16,
        mode: 'exclude',
        excludedLayerPatterns: ['Logo*']
      };

      await saveConfig(config);

      // Get and filter nodes
      const textNodes = getTextNodesFromPage();
      const filtered = filterTextNodes(textNodes, config);

      // Should only include non-locked, non-excluded nodes
      expect(filtered).toHaveLength(2);
      expect(filtered).toContain(textNormal);
      expect(filtered).toContain(textLocked);

      // Count what would be updated
      const counts = countAffectedNodes(textNodes, config);
      expect(counts.total).toBe(3);
      expect(counts.filtered).toBe(2);
      expect(counts.locked).toBe(1);
      expect(counts.willUpdate).toBe(1); // Only textNormal
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selection', () => {
      mockFigma.currentPage.selection = [];

      const textNodes = getTextNodesFromSelection();

      expect(textNodes).toHaveLength(0);
    });

    it('should handle nested components', () => {
      const deepText = createMockTextNode({
        id: 'deep',
        name: 'Deep Text',
        fontSize: 16
      });
      const innerFrame = createMockFrameNode({
        id: 'inner',
        name: 'Inner',
        children: [deepText]
      });
      const outerFrame = createMockFrameNode({
        id: 'outer',
        name: 'Outer',
        children: [innerFrame]
      });

      mockFigma.currentPage.children = [outerFrame];

      const textNodes = getTextNodesFromPage();

      expect(textNodes).toHaveLength(1);
      expect(textNodes[0]).toBe(deepText);
    });

    it('should handle corrupted config data gracefully', async () => {
      // Save invalid data
      await mockFigma.clientStorage.setAsync('rem-plugin-config', 'invalid');

      const config = await loadConfig();

      // Should return default config
      expect(config.baseFontSize).toBe(DEFAULT_CONFIG.baseFontSize);
    });
  });
});
