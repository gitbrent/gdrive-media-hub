# Development Guidelines for GDrive Media Hub

This document outlines coding standards and best practices for contributions to the GDrive Media Hub project.

## Layout & Styling Philosophy

### Use Bootstrap Classes, Not Inline Styles

- **Always** use Bootstrap utility classes for layout, spacing, and basic styling
- **Never** use inline `style={{}}` props for layout-related CSS (flexbox, grid, padding, margin, etc.)
- Inline styles are acceptable **only** for:
  - Dynamic values based on props or state
  - One-off custom styling not covered by Bootstrap or project CSS
  - Font sizes or custom measurements that change programmatically

**Good:**

```tsx
<div className="hstack gap-3 p-4 mb-3">
  <div className="flex-grow-1">Content</div>
</div>
```

**Bad:**

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
  {/* Avoid - use Bootstrap instead */}
</div>
```

### Bootstrap Layout Utilities (Preferred)

- `hstack` / `vstack` - horizontal/vertical flexbox stacks with built-in gap
- `d-flex` - when you need `justify-content-between` or special flex properties
- `row` / `col` - responsive grid layouts
- Spacing: `mb-3`, `p-4`, `px-2`, `gap-2`, etc.
- Text: `text-center`, `text-white-50`, `fw-bold`, `small`, `text-uppercase`
- Sizing: `w-100`, `h-100`, `flex-grow-1`, `flex-shrink-0`

## Color System

### Use CSS Variables from style.scss

All colors should come from the root CSS variables defined in `src/css/style.scss`. **Do not hardcode color values.**

**Available Color Palettes:**

**Chart Colors** (Tailwind 400/500 mix):

```css
--color-chart-1: #60a5fa    /* Blue 400 */
--color-chart-2: #a78bfa    /* Violet 400 */
--color-chart-3: #f472b6    /* Pink 400 */
--color-chart-4: #fb923c    /* Orange 400 */
--color-chart-5: #2dd4bf    /* Teal 400 */
--color-chart-6: #facc15    /* Yellow 400 */
--color-chart-7: #f87171    /* Red 400 */
--color-chart-8: #818cf8    /* Indigo 400 */
--color-chart-9: #34d399    /* Emerald 400 */
--color-chart-10: #22d3ee   /* Cyan 400 */
```

**KPI Card Gradients:**

```css
--gradient-purple: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
--gradient-red: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
--gradient-blue: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
--gradient-green: linear-gradient(135deg, #10b981 0%, #047857 100%);
```

**Shadow Colors** (for hover effects):

```css
--shadow-purple: rgba(139, 92, 246, 0.25);
--shadow-red: rgba(239, 68, 68, 0.25);
--shadow-blue: rgba(59, 130, 246, 0.25);
--shadow-green: rgba(16, 185, 129, 0.25);
```

**Border Colors:**

```css
--border-purple: rgba(139, 92, 246, 0.3);
--border-red: rgba(239, 68, 68, 0.3);
--border-blue: rgba(96, 165, 250, 0.3);
--border-green: rgba(16, 185, 129, 0.3);
```

**Using Colors in TSX:**

```tsx
// In inline styles (ONLY when necessary):
style={{ color: 'var(--color-chart-1)' }}

// Better - use CSS classes and import colors:
// Define in .css file and use className
```

## Component Patterns

### Card Components

KPI cards use the following pattern:

- Class `kpi-card` for base styles
- Color variant: `kpi-card-purple`, `kpi-card-blue`, `kpi-card-green`, `kpi-card-red`
- Border: `border-0` (no border)
- Shadow: `shadow-lg` for elevation
- Inside use `card-body` and `kpi-card-body`

**Example:**

```tsx
<div className="card border-0 shadow-lg kpi-card kpi-card-purple">
  <div className="card-body kpi-card-body">
    <div className="hstack gap-2">
      {/* icon and label */}
    </div>
  </div>
</div>
```

### Icon + Text Combinations

Use `hstack gap-2` for horizontal alignment of icons with text:

```tsx
<div className="hstack gap-2">
  <i className="bi-folder-fill"></i>
  <div>Label text</div>
</div>
```

## Typography

### Bootstrap Text Classes

- `text-white-50` - muted white text
- `text-uppercase` - uppercase styling
- `small` - smaller font size
- `fw-bold` - bold weight
- `text-center` - center alignment

**⚠️ Deprecated:** `.text-muted` will be replaced by `.text-body-secondary` in Bootstrap v6. Use `text-body-secondary` for new code.

**Custom Typography:**

- Use Bootstrap classes whenever possible
- For font-size adjustments: `style={{ fontSize: '0.75rem' }}` is acceptable
- Letter spacing: `style={{ letterSpacing: '0.5px' }}` is acceptable for semantic adjustments

## Spacing

Use Bootstrap spacing scale (0-5, where each unit = 0.25rem):

- `p-1` to `p-5` - padding
- `m-1` to `m-5` - margin
- `px-2`, `py-3` - directional padding/margin
- `gap-1` to `gap-5` - gaps in flexbox layouts
- `mb-0` - remove bottom margin (common Bootstrap reset)

## Animations & Effects

### Hover Effects

Use box-shadow with CSS variables for consistency:

```tsx
className="kpi-card-purple:hover"
// In CSS: box-shadow: 0 8px 24px var(--shadow-purple);
```

### Transitions

Keep consistent animation timing:

```css
transition: transform 0.2s, box-shadow 0.2s;
```

## TypeScript Practices

### React Components

- Always use `React.FC<Props>` for functional components
- Define prop interfaces above components
- Use exhaustive dependency arrays in `useEffect`

### Naming

- Components: PascalCase (e.g., `FileBrowser`, `AlertLoading`)
- Files: PascalCase for components, lowercase for utilities
- Type names: PascalCase with descriptive prefixes (`IGapiFile`, `BreadcrumbSegment`)
- Constants: UPPER_SNAKE_CASE for DEBUG flags

## CSS File Organization

### File Structure

- Component CSS in adjacent `.css` files (e.g., `Component.tsx` → `Component.css`)
- Shared styles in `style.scss`
- Use CSS variables from `style.scss` root instead of hardcoding

### CSS Class Naming

- Use semantic names (`.kpi-card`, `.loading-container`)
- Avoid element-based names (`.div`, `.button`)
- Use kebab-case for multi-word classes

## Accessibility

- Use semantic HTML: `<section>`, `<nav>`, `<button>` instead of generic divs
- Include `aria-label` on interactive elements
- Include `role` attributes where needed
- Use `title` attributes for tooltips

**Example:**

```tsx
<button
  type="button"
  aria-label="Sort by name"
  title="Sort by name"
  onClick={() => toggleSort('name')}
>
  <i className="bi-sort-alpha-down" />
</button>
```

## Icons

- Use Bootstrap Icons (class names like `bi-images`, `bi-folder-fill`)
- Apply sizing and color with classes: `text-white`, or inline color if dynamic

## Avoiding Common Mistakes

### ❌ Don't

- Hardcode color hex values
- Use `style={{}}` for layout properties
- Forget `gap` when using flexbox
- Mix inline styles and CSS classes inconsistently
- Create utility classes that duplicate Bootstrap
- Forget responsive utility prefixes (`d-none`, `d-md-block`)

### ✅ Do

- Use CSS variables for colors
- Use Bootstrap utility classes for layout
- Prefer `hstack`/`vstack` over `d-flex`
- Keep styling consistent with design system
- Use semantic HTML and proper ARIA labels
- Test responsive behavior

## Resources

- [Bootstrap 5 Utilities](https://getbootstrap.com/docs/5.3/utilities/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Tailwind Color Reference](https://tailwindcss.com/docs/customizing-colors) (for understanding our palette)
- Local: `src/css/style.scss` - CSS variable definitions
- Local: `src/css/HomeMetrics.css` - KPI card styling examples
