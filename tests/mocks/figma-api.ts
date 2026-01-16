/**
 * Mock Figma API for testing
 */

export const mockFigma = {
  mixed: Symbol('mixed'),
  currentPage: {
    selection: [] as any[],
    children: [] as any[]
  },
  clientStorage: {
    data: new Map<string, any>(),
    async getAsync(key: string) {
      return this.data.get(key);
    },
    async setAsync(key: string, value: any) {
      this.data.set(key, value);
    },
    async deleteAsync(key: string) {
      this.data.delete(key);
    },
    clear() {
      this.data.clear();
    }
  },
  loadFontAsync: jest.fn().mockResolvedValue(undefined),
  closePlugin: jest.fn(),
  showUI: jest.fn(),
  ui: {
    postMessage: jest.fn(),
    onmessage: null as any
  },
  on: jest.fn()
};

/**
 * Creates a mock text node
 */
export function createMockTextNode(options: {
  id: string;
  name: string;
  fontSize: number | symbol;
  locked?: boolean;
  characters?: string;
  fontName?: FontName;
}): any {
  const node: any = {
    id: options.id,
    name: options.name,
    type: 'TEXT',
    fontSize: options.fontSize,
    locked: options.locked || false,
    characters: options.characters || 'Sample text',
    fontName: options.fontName || { family: 'Inter', style: 'Regular' },
    boundVariables: {},
    getRangeFontSize: jest.fn((_start: number, _end: number) => {
      return typeof options.fontSize === 'number' ? options.fontSize : 16;
    }),
    getRangeFontName: jest.fn((_start: number, _end: number) => {
      return options.fontName || { family: 'Inter', style: 'Regular' };
    }),
    setRangeFontSize: jest.fn()
  };

  return node;
}

/**
 * Creates a mock frame node
 */
export function createMockFrameNode(options: {
  id: string;
  name: string;
  children?: any[];
}): any {
  return {
    id: options.id,
    name: options.name,
    type: 'FRAME',
    children: options.children || [],
    locked: false
  };
}

/**
 * Creates a mock group node
 */
export function createMockGroupNode(options: {
  id: string;
  name: string;
  children?: any[];
}): any {
  return {
    id: options.id,
    name: options.name,
    type: 'GROUP',
    children: options.children || [],
    locked: false
  };
}

/**
 * Setup Figma mock for tests
 */
export function setupFigmaMock() {
  (global as any).figma = mockFigma;
  mockFigma.clientStorage.clear();
  mockFigma.currentPage.selection = [];
  mockFigma.currentPage.children = [];
  jest.clearAllMocks();
}

/**
 * Reset Figma mock
 */
export function resetFigmaMock() {
  mockFigma.clientStorage.clear();
  mockFigma.currentPage.selection = [];
  mockFigma.currentPage.children = [];
  jest.clearAllMocks();
}
