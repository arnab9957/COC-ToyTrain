---
name: High-Altitude Tactical Resilience
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#434655'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#a73a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd651e'
  on-secondary-container: '#571a00'
  tertiary: '#006329'
  on-tertiary: '#ffffff'
  tertiary-container: '#007f36'
  on-tertiary-container: '#c7ffca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb599'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#7f2b00'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: spaceGrotesk
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: spaceGrotesk
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: spaceGrotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: spaceGrotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: spaceGrotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: spaceGrotesk
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: jetbrainsMono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: jetbrainsMono
    fontSize: 10px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 3.5rem
  stroke-sm: 2px
  stroke-lg: 3px
  offset-sm: 3px
  offset-lg: 4px
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  gap-compact: 0.5rem
  gap-default: 1rem
  gap-expanded: 1.5rem
---

## Brand & Style

This design system delivers tactical-grade interface resilience tailored for high-altitude emergency operations, offline peer-to-peer telemetry, and transit safety under extreme field conditions. The aesthetic bridges Neo-Brutalism with mission-critical instrumentation: uncompromising solid borders, raw mechanical layouts, and intense contrast calibrated for sunlight glare, heavy precipitation, and turbulent transit.

### Personality & Tone
- **Unyielding & Fault-Tolerant:** Visual components convey physical permanence and operational readiness. Every element feels machined, distinct, and immovable until acted upon.
- **Immediate Legibility:** Eliminates subtle gradients, blurred shadows, and decorative noise in favor of raw semantic colors, hard edges, and tabular clarity.
- **Hardware-Inspired:** Mimics ruggedized handheld field gear, emergency transceivers, and industrial avionics rather than generic consumer software.

### Target Field Environment
Optimized for operators, transit drivers, and disaster response teams working across high-altitude corridors where low connectivity, blinding direct UV glare, sudden rainfall, and thick fog prevail. Interface targets are intentionally oversized to ensure zero miss-clicks with rain-slicked screens or gloved hands.

## Colors

The palette is engineered around high luminance contrast ratios exceeding WCAG AAA standards across all functional states. The pure white primary background maximizes display output against mountain ambient glare, while dense black strokes define absolute component boundaries.

### Core Semantic Mapping
- **Primary / Telemetry (`#2563EB`):** Mission links, mesh sync vectors, Bluetooth peer-to-peer signals, and primary functional triggers.
- **Alert Critical (`#EA580C`):** Landslide warnings, road blockages, structural collapses, and immediate emergency dispatches. High-visibility safety orange.
- **Alert Warning (`#EAB308`):** Incipient weather hazards, single-lane alternating transit, battery conservation thresholds, and pending sync buffers.
- **Alert Safe (`#16A34A`):** Verified open corridors, confirmed SOS delivery, nominal operational states.
- **Structural Neutral (`#000000`):** Outer perimeter strokes, solid hard drop shadows, icon vectors, and high-impact typographic anchors.
- **Canvas Base (`#FFFFFF`):** Base application viewport ensuring maximum backlight reflectivity under outdoor lighting.
- **Substrate Surface (`#F3F4F6`):** Secondary card canvas, container wells, and inactive mechanical bays providing structural separation without reducing overall lightness.

## Typography

The typographic hierarchy combines the aggressive, architectural geometry of `Space Grotesk` for headlines with the disciplined, data-dense precision of `JetBrains Mono` for body, metadata, and telemetry.

### Typographic Principles
- **Display & Headlines:** Space Grotesk is deployed at tight line-heights with negative letter spacing to lock titles into unified, high-density blocks that mimic stamped technical markings.
- **Tabular & Telemetry Data:** JetBrains Mono is strictly enforced for numerical metrics, transit timestamps, GPS coordinates, and payload counts. Monospace sizing guarantees fixed horizontal widths, eliminating layout jitter during live sensor and packet refreshes.
- **Micro-Labels & Metadata:** All operational statuses, sub-tags, and mode indicators are rendered in full uppercase with expanded tracking (`0.05em` to `0.1em`) and bold weights to ensure scanning speed under physical stress.

## Layout & Spacing

The layout model is governed by a strict tactical grid designed for rapid tactical execution. The design explicitly avoids micro-paddings, prioritizing clear separation and unyielding hit areas.

### Touch Target Standard
All interactive elements adhere to a mandatory **56px (`3.5rem`) minimum touch target height and width**. This accommodates gloved hands, cold fingers, vehicle vibration along unpaved ridge passes, and single-handed thumb navigation.

### Grid & Breakpoints
- **Mobile (< 640px):** 4-column layout. Single stacked modules with `1rem` screen margins. Full-width sticky action bars.
- **Tablet (640px - 1024px):** 8-column layout with `1.5rem` margins. Split-pane layout with map/telemetry telemetry pinning on the right and incident feeds on the left.
- **Desktop / Command Station (> 1024px):** 12-column layout with `2rem` margins. Max-width constraint of `1440px` with persistent top hardware diagnostics bar and side-by-side situational panels.

### Structural Flow
Elements do not collapse into each other. Every card, status bar, and segmented control utilizes explicit borders and spacing gaps to prevent overlapping interactions under touch displacement.

## Elevation & Depth

Visual hierarchy is established using hard-edged Neo-Brutalist structural projections rather than ambient or diffused shadows. This maintains complete contrast independence from display brightness, screen dirt, or direct sunlight.

### Shadow Architecture
- **Flat Surface (Level 0):** Unraised elements, inline inputs, and canvas containers. Staged with a solid `2px` or `3px` solid `#000000` perimeter border and no offset.
- **Interactive Mechanical (Level 1):** Actionable cards, badges, and secondary buttons. Staged with `box-shadow: 3px 3px 0px #000000`.
- **Raised Priority Action (Level 2):** Primary execution buttons, critical alert banners, modal viewports. Staged with `box-shadow: 4px 4px 0px #000000`.
- **Active / Depressed State (Level 0 Press):** On touch down or active click, the element translates down and right by `3px` or `4px` (`transform: translate(3px, 3px)` or `translate(4px, 4px)`) while `box-shadow` collapses to `0px 0px 0px #000000`. This provides unambiguous physical feedback of state engagement.

## Shapes

The interface embraces a micro-rounded industrial shape profile (Value `1` = `0.25rem` / `4px`). This slight softening of absolute sharp vertices replicates stamped sheet metal, die-cast plastic field radios, and military-grade screen guards while preserving the crisp geometry of Neo-Brutalist design.

### Shape Guidelines
- **Base Geometry:** Buttons, alert cards, inputs, and chips share a consistent `0.25rem` border-radius.
- **Containers & Drawers:** Viewport panels, emergency modals, and bottom action sheets employ `rounded-lg` (`0.5rem` / `8px`) only on exposed exterior edges.
- **No Circular Shapes:** Avoid fully round pill shapes or circular icon buttons. All badges and indicators are rectangular or square tiles with micro-rounded corners to reinforce industrial rigidity.

## Components

### Buttons & Triggers
- **Hit Area:** Minimum `56px` vertical height.
- **Primary / Telemetry Button:** Background `#2563EB`, text `#FFFFFF`, border `3px solid #000000`, shadow `4px 4px 0px #000000`. Text in `Space Grotesk` 700 uppercase.
- **Critical Alert Trigger:** Background `#EA580C`, text `#FFFFFF`, border `3px solid #000000`, shadow `4px 4px 0px #000000`.
- **Secondary Action:** Background `#FFFFFF`, text `#000000`, border `2px solid #000000`, shadow `3px 3px 0px #000000`.
- **Press State:** All buttons translate down-right matching their shadow offset on `:active` with zeroed shadow.

### Status Chips & Tags
- **Structure:** `2px solid #000000` border, `0.25rem` radius, bold JetBrains Mono typography, uppercase, `0.08em` tracking.
- **Critical Status:** Background `#EA580C`, text `#FFFFFF`.
- **Caution Status:** Background `#EAB308`, text `#000000`.
- **Nominal / Safe Status:** Background `#16A34A`, text `#FFFFFF`.
- **Sync / Mesh Status:** Background `#2563EB`, text `#FFFFFF`.

### Cards & Telemetry Panels
- **Background:** `#F3F4F6` substrate for standard data modules, `#FFFFFF` for primary user input or focal data.
- **Border:** `2px` or `3px solid #000000`.
- **Shadow:** `3px 3px 0px #000000` (static) or `4px 4px 0px #000000` (interactive).
- **Internal Padding:** `1rem` mobile, `1.5rem` desktop.
- **Header Strip:** Cards incorporate a distinct top-band or border-bottom divider separating the title metadata (with monospaced tag) from the operational payload.

### Form Inputs & Checkboxes
- **Input Fields:** Minimum `56px` height. Background `#FFFFFF`, border `2px solid #000000`, text `#000000`, placeholder text `#4B5563`. JetBrains Mono typography. On focus, outline changes to `3px solid #2563EB` with `2px 2px 0px #000000` offset shadow.
- **Checkboxes & Radios:** Rigid `24px x 24px` squares with `2px solid #000000` border. Checked state uses solid `#000000` or `#2563EB` fill with a stark white inner glyph. Minimum bounding hit container of `56px`.

### Lists & Transit Feeds
- **List Items:** Structured as separated discrete card modules or connected via heavy `2px solid #000000` dividers without subtle hairpins.
- **Telemetry Indicators:** Each list row includes monospaced micro-timestamps (e.g., `14:02:18 NPT`), elevation markers (`2,042M`), and peer-hop packet counts to provide real-time status during degraded mesh connectivity.