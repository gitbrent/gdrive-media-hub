# Bootstrap to Tailwind + daisyUI Migration Guide

This guide provides quick reference mappings for migrating from Bootstrap 5 to Tailwind CSS + daisyUI.

## Common Class Conversions

### Layout & Flexbox

| Bootstrap | Tailwind | Notes |
|-----------|----------|-------|
| `d-flex` | `flex` | Basic flex container |
| `d-inline-flex` | `inline-flex` | Inline flex |
| `hstack` | `flex flex-row items-center` | Horizontal stack |
| `vstack` | `flex flex-col` | Vertical stack |
| `flex-row` | `flex-row` | Same |
| `flex-column` | `flex-col` | Different suffix |
| `justify-content-start` | `justify-start` | Shorter |
| `justify-content-end` | `justify-end` | Shorter |
| `justify-content-center` | `justify-center` | Shorter |
| `justify-content-between` | `justify-between` | Shorter |
| `align-items-start` | `items-start` | Shorter |
| `align-items-center` | `items-center` | Shorter |
| `align-items-end` | `items-end` | Shorter |
| `flex-grow-1` | `flex-grow` | No number |
| `flex-shrink-0` | `flex-shrink-0` | Same |
| `flex-wrap` | `flex-wrap` | Same |

### Grid

| Bootstrap | Tailwind |
|-----------|----------|
| `row` | `grid grid-cols-12` or `flex flex-wrap` |
| `col` | `col-span-*` |
| `col-6` | `col-span-6` or `w-1/2` |
| `col-md-6` | `md:col-span-6` or `md:w-1/2` |

### Spacing

| Bootstrap | Tailwind | Notes |
|-----------|----------|-------|
| `m-0` | `m-0` | Same |
| `m-1` | `m-1` (0.25rem) | Same scale |
| `m-3` | `m-3` (0.75rem) | Same scale |
| `m-5` | `m-5` (1.25rem) | Same scale |
| `mt-3` | `mt-3` | Same |
| `mb-3` | `mb-3` | Same |
| `mx-auto` | `mx-auto` | Same |
| `p-4` | `p-4` | Same |
| `px-3` | `px-3` | Same |
| `py-2` | `py-2` | Same |
| `gap-2` | `gap-2` | Same |
| `gap-3` | `gap-3` | Same |

### Display & Visibility

| Bootstrap | Tailwind |
|-----------|----------|
| `d-none` | `hidden` |
| `d-block` | `block` |
| `d-inline` | `inline` |
| `d-inline-block` | `inline-block` |
| `d-md-none` | `md:hidden` |
| `d-md-block` | `md:block` |

### Sizing

| Bootstrap | Tailwind |
|-----------|----------|
| `w-100` | `w-full` |
| `w-50` | `w-1/2` |
| `w-25` | `w-1/4` |
| `h-100` | `h-full` |
| `mw-100` | `max-w-full` |
| `mh-100` | `max-h-full` |

### Text

| Bootstrap | Tailwind |
|-----------|----------|
| `text-start` | `text-left` |
| `text-center` | `text-center` |
| `text-end` | `text-right` |
| `text-uppercase` | `uppercase` |
| `text-lowercase` | `lowercase` |
| `text-capitalize` | `capitalize` |
| `fw-bold` | `font-bold` |
| `fw-normal` | `font-normal` |
| `fw-light` | `font-light` |
| `small` | `text-sm` |
| `fs-1` to `fs-6` | `text-5xl` to `text-base` |
| `display-1` | `text-7xl font-bold` |
| `display-6` | `text-4xl font-bold` |
| `text-muted` | `text-gray-500` or `text-white/50` |
| `text-white-50` | `text-white/50` |

### Colors

| Bootstrap | Tailwind | daisyUI |
|-----------|----------|---------|
| `text-primary` | `text-primary` | `text-primary` (daisyUI) |
| `text-success` | `text-success` | `text-success` (daisyUI) |
| `text-danger` | `text-error` | `text-error` (daisyUI) |
| `text-warning` | `text-warning` | `text-warning` (daisyUI) |
| `text-white` | `text-white` | `text-white` |
| `bg-primary` | `bg-primary` | `bg-primary` (daisyUI) |
| `bg-success` | `bg-success` | `bg-success` (daisyUI) |
| `bg-dark` | `bg-gray-900` | `bg-base-300` (daisyUI) |
| `bg-black` | `bg-black` | `bg-black` |

### Borders

| Bootstrap | Tailwind |
|-----------|----------|
| `border` | `border` |
| `border-0` | `border-0` |
| `border-top` | `border-t` |
| `border-bottom` | `border-b` |
| `border-start` | `border-l` |
| `border-end` | `border-r` |
| `rounded` | `rounded` |
| `rounded-circle` | `rounded-full` |
| `rounded-pill` | `rounded-full` |

### Shadow

| Bootstrap | Tailwind |
|-----------|----------|
| `shadow` | `shadow` |
| `shadow-sm` | `shadow-sm` |
| `shadow-lg` | `shadow-lg` |
| `shadow-none` | `shadow-none` |

### Position

| Bootstrap | Tailwind |
|-----------|----------|
| `position-relative` | `relative` |
| `position-absolute` | `absolute` |
| `position-fixed` | `fixed` |
| `position-sticky` | `sticky` |
| `top-0` | `top-0` |
| `bottom-0` | `bottom-0` |
| `start-0` | `left-0` |
| `end-0` | `right-0` |

## daisyUI Components

### Buttons

```tsx
// Bootstrap
<button className="btn btn-primary">Click Me</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-lg">Large</button>
<button className="btn btn-outline-primary">Outline</button>

// daisyUI
<button className="btn btn-primary">Click Me</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-lg">Large</button>
<button className="btn btn-outline btn-primary">Outline</button>
```

### Cards

```tsx
// Bootstrap
<div className="card">
  <div className="card-body">
    <h5 className="card-title">Title</h5>
    <p className="card-text">Content</p>
  </div>
</div>

// daisyUI
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
  </div>
</div>
```

### Navbar

```tsx
// Bootstrap
<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
  <div className="container-fluid">
    <a className="navbar-brand" href="#">Brand</a>
  </div>
</nav>

// daisyUI
<div className="navbar bg-base-100">
  <div className="flex-1">
    <a className="btn btn-ghost text-xl">Brand</a>
  </div>
</div>
```

### Alerts

```tsx
// Bootstrap
<div className="alert alert-success" role="alert">
  Success message
</div>

// daisyUI
<div className="alert alert-success">
  <span>Success message</span>
</div>
```

### Form Controls

```tsx
// Bootstrap
<input type="text" className="form-control" placeholder="Enter text" />
<select className="form-select">
  <option>Option 1</option>
</select>

// daisyUI
<input type="text" className="input input-bordered w-full" placeholder="Enter text" />
<select className="select select-bordered w-full">
  <option>Option 1</option>
</select>
```

## Migration Tips

1. **Start with Layout**: Update `hstack`/`vstack` to `flex` with appropriate modifiers
2. **Update Spacing**: Most spacing classes are the same, just verify
3. **Text Classes**: Change `fw-*` to `font-*`, `text-white-50` to `text-white/50`
4. **Components**: Replace Bootstrap components with daisyUI equivalents
5. **Colors**: Use daisyUI theme colors (`primary`, `success`, etc.) or Tailwind colors
6. **Responsive**: Change `d-md-*` to `md:*` prefix pattern
7. **Test Incrementally**: Update one component at a time and test

## Custom Colors

The project's custom colors from `style.scss` are available in Tailwind:

```tsx
// Gradient backgrounds
<div className="bg-gradient-purple">
<div className="bg-gradient-blue">
<div className="bg-gradient-green">

// Chart colors
<div className="text-chart-1">
<div className="bg-chart-2">

// Custom shadows
<div className="shadow-purple">
<div className="shadow-blue">
```

## Important Changes

1. **No more Bootstrap JavaScript**: Tailwind is CSS-only. Use React state for interactivity.
2. **daisyUI themes**: Theme is set in `tailwind.config.js` and applied via `data-theme="dark"` in HTML.
3. **Responsive prefixes**: Use `md:`, `lg:`, `xl:` instead of `d-md-*`, `d-lg-*`.
4. **Flex grow**: `flex-grow-1` becomes just `flex-grow`.
5. **Width percentages**: `w-100` → `w-full`, `w-50` → `w-1/2`.
6. **Text color with opacity**: `text-white-50` → `text-white/50`.
