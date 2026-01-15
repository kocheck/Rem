# Example Preset Configurations

This directory contains example preset configurations that you can import into the Rem plugin.

## How to Use

1. Open the Rem plugin in Figma
2. Go to the "Presets" tab
3. Click "Import" (or use copy/paste)
4. Select one of these JSON files
5. The preset will be added to your custom presets

## Available Presets

### Material Design (`material-design.json`)
Google's Material Design type scale with base 16px and a comprehensive range of sizes suitable for modern UI design.

**Best for:** Web applications, Material UI components, modern interfaces

### iOS Human Interface (`ios-human-interface.json`)
Apple's dynamic type scale with base 17px, designed for accessibility and readability across devices.

**Best for:** Mobile apps, iOS designs, accessible interfaces

### Tailwind CSS (`tailwind-css.json`)
The default Tailwind CSS type scale with extended sizes, perfect for utility-first design systems.

**Best for:** Utility-based designs, web applications, Tailwind users

### Major Third Scale (`major-third.json`)
A musical scale based on the major third interval (1.25 ratio), creating harmonious size relationships.

**Best for:** Editorial designs, marketing materials, sophisticated layouts

### Golden Ratio (`golden-ratio.json`)
Based on the golden ratio (1.618), this scale creates naturally pleasing proportions found in nature and classical design.

**Best for:** Premium designs, elegant layouts, classical proportions

## Creating Your Own Presets

You can create custom presets by following this JSON structure:

```json
{
  "name": "My Custom Scale",
  "description": "A brief description of your type scale",
  "baseFontSize": 16,
  "customRemValues": [
    0.75,
    1,
    1.5,
    2,
    3
  ]
}
```

### Fields

- **name** (required): Display name for your preset
- **description** (optional): Brief description of the scale's purpose or characteristics
- **baseFontSize** (required): Base font size in pixels (8-32)
- **customRemValues** (required): Array of rem multipliers

### Tips for Creating Scales

1. **Start with a base**: Choose 14-18px for most designs
2. **Maintain ratios**: Use consistent multipliers (1.2, 1.5, 2, etc.)
3. **Consider use cases**:
   - Tight scales (1.125 ratio) for dense interfaces
   - Wide scales (1.5+ ratio) for dramatic hierarchy
4. **Test readability**: Ensure enough contrast between sizes
5. **Limit options**: 5-8 sizes is usually enough

## Musical Scales

Musical intervals create harmonious scales:

- **Minor Second**: 1.067 (subtle differences)
- **Major Second**: 1.125 (comfortable reading)
- **Minor Third**: 1.2 (balanced hierarchy)
- **Major Third**: 1.25 (clear distinction)
- **Perfect Fourth**: 1.333 (strong hierarchy)
- **Perfect Fifth**: 1.5 (dramatic contrast)

## Modular Scales

Some popular modular scales:

1. **Perfect Fifth (1.5)**: 1, 1.5, 2.25, 3.375, 5.063
2. **Perfect Fourth (1.333)**: 1, 1.333, 1.777, 2.369, 3.157
3. **Major Third (1.25)**: 1, 1.25, 1.563, 1.953, 2.441
4. **Minor Third (1.2)**: 1, 1.2, 1.44, 1.728, 2.074

## Resources

- [Type Scale Generator](https://type-scale.com/)
- [Modular Scale Calculator](https://www.modularscale.com/)
- [Material Design Type System](https://material.io/design/typography/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Tailwind Typography](https://tailwindcss.com/docs/font-size)
