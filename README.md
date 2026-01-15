# Rem - Font Size Manager for Figma

A powerful Figma plugin that manages font sizes across your designs using a rem-based system, making it easy to maintain consistent typography and quickly adapt your designs to different base font sizes.

## Features

### 🎯 Core Functionality

- **Base Font Size Configuration**: Set and adjust a base font size (8-32px) with persistent storage
- **Automatic Recalculation**: When you change the base, all text elements are automatically recalculated while maintaining their relative rem values
- **Dual Update Modes**:
  - **Current Page Mode**: Update all text on the current page
  - **Selection Mode**: Update only selected frames/groups
- **Smart Variable Support**: Automatically detects and preserves text using Figma variables

### 🤖 Smart Detection

The plugin can analyze your existing designs and automatically:
- Detect if your font sizes follow a rem-based pattern
- Suggest the optimal base font size
- Show confidence score for detection accuracy
- Display detected rem values with usage counts
- Recommend a type scale based on your current sizes

### 🛡️ Protected Elements System

Two operational modes to control which elements get updated:

- **Exclude Mode**: Update everything except protected elements
- **Include Only Mode**: Only update specifically marked elements

Protection supports:
- Individual node IDs
- Layer name patterns with wildcards (e.g., `Logo*`, `*Header*`)
- Easy management through the UI

### 📦 Preset Management

- **Built-in Presets**: Material Design, iOS Human Interface, Bootstrap, Tailwind CSS, Perfect Fourth
- **Custom Presets**: Save your own type scale configurations
- **Import/Export**: Share presets as JSON
- **One-Click Loading**: Quickly switch between different type scales

### 📊 History & Reporting

- Track all changes made during your session
- View detailed before/after comparisons
- See which elements were updated
- Export history as Markdown reports
- Expandable entries for detailed inspection

### 🎨 Polished UI

- Native Figma theme support (light/dark)
- Tabbed interface for organized access to features
- Real-time preview of affected elements
- Clear visual feedback for all operations
- Keyboard navigation and ARIA labels for accessibility

## Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Rem
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the plugin**:
   ```bash
   npm run build
   ```

4. **Load in Figma**:
   - Open Figma Desktop
   - Go to Plugins → Development → Import plugin from manifest
   - Select the `manifest.json` file from this directory

### For Users

Once published to the Figma Community:
1. Search for "Rem Font Size Manager" in the Figma Community
2. Click "Install"
3. Access via Plugins → Rem

## Usage

### Basic Workflow

1. **Open the plugin**: Plugins → Rem
2. **Choose your mode**:
   - "Current Page" to update all text on the page
   - "Selection Only" to update only selected elements
3. **Set your base font size**: Enter a value between 8-32px
4. **Preview**: Check how many elements will be affected
5. **Apply**: Click "Apply Changes" to update all font sizes

### Smart Detection Workflow

1. Open the plugin on a page with existing text
2. Click "Smart Detect"
3. Review the confidence score and detected rem values
4. If confidence is high, click "Use Suggested Base"
5. Review the preview and apply changes

### Working with Protected Elements

**Exclude Mode** (default):
1. Select elements you want to protect (e.g., logos)
2. Go to the "Protected" tab
3. Click "Add Current Selection"
4. These elements will now be skipped during updates

**Include Only Mode**:
1. Go to Settings tab
2. Switch to "Include Only Mode"
3. Go to Protected tab
4. Add only the elements you want to update
5. All other elements will be ignored

### Using Presets

**Load a preset**:
1. Go to the "Presets" tab
2. Browse built-in or custom presets
3. Click "Load" on your chosen preset
4. Return to Main tab and apply

**Save a preset**:
1. Configure your base font size and custom rem values
2. Go to the "Presets" tab
3. Click "Save Current as Preset"
4. Enter a name and optional description
5. Your preset is now saved for future use

### Exporting Configuration

From the Presets tab, you can export any preset as JSON:
```json
{
  "name": "My Type Scale",
  "description": "Custom type scale for our design system",
  "baseFontSize": 16,
  "customRemValues": [0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4]
}
```

## Configuration

### Custom Rem Values

In the Settings tab, you can define your own rem scale. Enter comma-separated values:

```
0.75, 0.875, 1, 1.125, 1.25, 1.5, 2, 2.5, 3, 4
```

### Layer Name Patterns

Protect (or target) elements by layer name using wildcards:

- `Logo*` - Matches "Logo", "Logo Text", "Logo Icon"
- `*Header*` - Matches "Page Header", "Header", "Mobile Header"
- `Footer` - Matches exactly "Footer"

## Development

### Project Structure

```
rem-plugin/
├── manifest.json          # Plugin manifest
├── ui.html               # Plugin UI
├── ui.ts                 # UI logic
├── code.ts               # Main plugin logic
├── utils/
│   ├── conversion.ts     # Rem/pixel conversion utilities
│   ├── detection.ts      # Smart detection algorithm
│   ├── storage.ts        # Persistent storage helpers
│   └── traversal.ts      # Node traversal utilities
├── tests/
│   ├── conversion.test.ts
│   ├── detection.test.ts
│   ├── integration.test.ts
│   └── mocks/
│       └── figma-api.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Scripts

- `npm run build` - Build the plugin for production
- `npm run watch` - Watch for changes and rebuild
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Testing

The plugin has comprehensive test coverage (80%+):

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

Test categories:
- **Unit tests**: Test individual functions and utilities
- **Integration tests**: Test complete workflows
- **Mock tests**: Test Figma API interactions

## API Reference

### Conversion Utilities

```typescript
// Convert pixels to rem
pixelsToRem(pixels: number, baseFontSize: number): number

// Convert rem to pixels
remToPixels(rem: number, baseFontSize: number): number

// Validate base font size
isValidBaseFontSize(size: number, min?: number, max?: number): boolean

// Recalculate font size when base changes
recalculateFontSize(currentSize: number, oldBase: number, newBase: number): number
```

### Detection

```typescript
// Detect rem pattern in font sizes
detectRemPattern(fontSizes: number[], minOccurrences?: number): DetectionResult

// Suggest optimal rem scale
suggestRemScale(detectionResult: DetectionResult): number[]

// Analyze font size distribution
analyzeFontSizeDistribution(fontSizes: number[]): Statistics
```

### Storage

```typescript
// Load plugin configuration
loadConfig(): Promise<PluginConfig>

// Save plugin configuration
saveConfig(config: PluginConfig): Promise<void>

// Load/save presets
loadPresets(): Promise<PresetConfig[]>
savePresets(presets: PresetConfig[]): Promise<void>

// History management
loadHistory(): Promise<HistoryEntry[]>
addHistoryEntry(entry: HistoryEntry): Promise<void>
```

## Built-in Presets

### Material Design
- Base: 16px
- Scale: 0.75, 0.875, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5

### iOS Human Interface
- Base: 17px
- Dynamic type scale: 0.706, 0.824, 0.941, 1, 1.118, 1.294, 1.412, 1.647, 1.882

### Bootstrap
- Base: 16px
- Scale: 0.875, 1, 1.25, 1.5, 2, 2.5

### Tailwind CSS
- Base: 16px
- Scale: 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5

### Perfect Fourth
- Base: 16px
- Musical scale (1.333 ratio): 0.563, 0.75, 1, 1.333, 1.777, 2.369, 3.157

## Troubleshooting

### Plugin doesn't update some text elements

**Possible causes:**
1. Elements are locked - Unlock them first
2. Elements use variables - These are intentionally preserved
3. Elements are in the protected list - Check the Protected tab
4. Layer name matches an excluded pattern - Review patterns in Settings

### Smart detection shows low confidence

**Possible causes:**
1. Font sizes don't follow a rem pattern
2. Too much variation in font sizes
3. Not enough text elements to analyze
4. Try manually setting a base and see if results look good

### Changes look wrong after applying

**Solution:**
1. The plugin maintains rem ratios, so if your original sizes weren't rem-based, results may look unexpected
2. Use Smart Detect first to verify your design follows a rem pattern
3. Check the history to see exactly what changed
4. Undo in Figma (Cmd/Ctrl+Z) and try a different base

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass and coverage is maintained
5. Submit a pull request

### Code Style

- Use TypeScript with strict type checking
- Follow existing code structure and naming conventions
- Add JSDoc comments for public functions
- Write tests for new features

## License

MIT License - see LICENSE file for details

## Credits

Created with ❤️ for the Figma community

## Support

- Report issues: [GitHub Issues](https://github.com/your-repo/issues)
- Ask questions: [Discussions](https://github.com/your-repo/discussions)

## Changelog

### Version 1.0.0 (Initial Release)

- Base font size configuration with validation
- Rem-based font size recalculation
- Smart detection algorithm
- Include/Exclude list system
- Preset management with built-in presets
- History tracking and reporting
- Selection and page modes
- Comprehensive test suite (80%+ coverage)
- Polished UI with theme support
