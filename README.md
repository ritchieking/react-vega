# `react-vega`

[![npm version](https://img.shields.io/npm/v/react-vega.svg)](https://www.npmjs.com/package/react-vega)

A lightweight React wrapper around [`vega-embed`](https://github.com/vega/vega-embed)

## Installation

```bash
npm i react-vega vega-embed vega-lite
```

If you only need to use Vega (not Vega-Lite), you can install `vega`.

```bash
npm i react-vega vega-embed vega
```

## Migrating to v8

In v8, the `data` prop was removed. Additionally, you can no longer update data by changing `spec.data` without the view being re-embedded. Instead use the [View API](https://vega.github.io/vega/docs/api/view) to update data. See the [Dynamic data](#1-dynamic-data) recipe for an example.

The `height` and `width` props were removed. Additionally, you can no longer resize the view by changing `spec.width` or `spec.height` without the view being re-embedded. Instead use the [View API](https://vega.github.io/vega/docs/api/view) to resize the view. See the [Programmatically changing width & height](#2-programmatically-changing-width--height) recipe for an example.

The `signalListeners` prop was removed. Instead use the [View API](https://vega.github.io/vega/docs/api/view) to subscribe to signal events. See the [Subscribe to signal events](#3-subscribe-to-signal-events) recipe for an example.

Vega embed options are passed directly via the `options` prop, they are no longer flattened props on the `VegaEmbed` component.

## Quick start

```tsx
import { VegaEmbed } from "react-vega";

function Component() {
  return <VegaEmbed spec={spec} options={options} />;
}
```

or

```tsx
import { useVegaEmbed } from "react-vega";

function Component() {
  const ref = React.useRef<HTMLDivElement>(null);
  const result = useVegaEmbed({ ref, spec, options });
  return <div ref={ref} />;
}
```

## API

### `<VegaEmbed />`

| Prop                  | Type                                   | Default | Notes                                                     |
| --------------------- | -------------------------------------- | ------- | --------------------------------------------------------- |
| `spec` **(required)** | `VisualizationSpec \| string`          | —       | Inline spec or URL. Accepts both Vega & Vega-Lite.        |
| `options`             | [`EmbedOptions`](https://vega.github.io/vega-embed/interfaces/EmbedOptions.html)                         | `{}`    | Passed directly to [`embed()`](https://vega.github.io/vega-embed/functions/default.html).                         |
| `onEmbed`             | `(result: Result) => void`             | —       | Called once [`embed()`](https://vega.github.io/vega-embed/functions/default.html) resolves. See [`Result`](https://vega.github.io/vega-embed/interfaces/Result.html) for details.                            |
| `onError`             | `(err: unknown) => void`               | —       | Called if [`embed()`](https://vega.github.io/vega-embed/functions/default.html) rejects.                          |
| `...divProps`         | `React.HTMLAttributes<HTMLDivElement>` | —       | Forwarded to the `<div>` element used for embedding.                        |
| **ref**               | `React.Ref<HTMLDivElement>`            | —       | Forwarded to the `<div>` element used for embedding. |

### `useVegaEmbed(params)`

```ts
type UseVegaEmbedParams = {
  ref: React.RefObject<HTMLDivElement>;
  spec: VisualizationSpec | string;
  options?: EmbedOptions;
  onEmbed?: (r: Result) => void;
  onError?: (e: unknown) => void;
};

const result: Result | null = useVegaEmbed(params);
```

Returns the current [`Result`](https://vega.github.io/vega-embed/interfaces/Result.html) (or `null` while loading).

## Theming with `VegaThemeProvider`

Wrap any part of your app in a `VegaThemeProvider` to give every `<VegaEmbed>` and `useVegaEmbed` below it the same Vega / Vega-Lite config and embed options. A theme can define named variants such as `dark`, and providers can be nested to override part of a theme for one section of the page.

```tsx
import { VegaEmbed, VegaThemeProvider, type VegaTheme } from "react-vega";

const brand: VegaTheme = {
  config: {
    font: "Inter, sans-serif",
    background: "#ffffff",
    axis: { labelColor: "#4b5563", gridColor: "#e5e7eb" },
    range: { category: ["#2563eb", "#f97316", "#10b981"] },
  },
  options: { actions: false },
  variants: {
    dark: {
      config: {
        background: "#111827",
        axis: { labelColor: "#d1d5db", gridColor: "#374151" },
      },
    },
  },
};

function Dashboard({ isDark }: { isDark: boolean }) {
  return (
    <VegaThemeProvider theme={brand} variant={isDark ? "dark" : "light"}>
      <VegaEmbed spec={revenueChart} /> {/* gets brand + dark */}
      <VegaThemeProvider theme={compactTheme}> {/* nested override */}
        <VegaEmbed spec={sparkline} />
      </VegaThemeProvider>
    </VegaThemeProvider>
  );
}
```

### `<VegaThemeProvider />`

| Prop       | Type                        | Default            | Notes                                                                                                                                    |
| ---------- | --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `theme`    | `VegaTheme \| VegaTheme[]`  | —                  | A theme, or an array of themes merged left to right. Falsy entries are skipped, so `[brand, isCompact && compact]` works.                |
| `variant`  | `string`                    | parent's `variant` | The variant to apply, e.g. `"dark"`. `"auto"` picks `"dark"` or `"light"` from `prefers-color-scheme` and follows changes.               |
| `inherit`  | `boolean`                   | `true`             | Merge on top of the enclosing providers' themes. With `false`, their themes are ignored, but their variant still applies unless you set one. |
| `children` | `React.ReactNode`           | —                  |                                                                                                                                          |

A variant applies to the themes of every enclosing provider, not just the provider that sets it. That makes a provider with only a `variant` an easy way to flip one section of the page:

```tsx
<VegaThemeProvider theme={brand} variant="light">
  <VegaEmbed spec={revenueChart} /> {/* brand + light */}
  <VegaThemeProvider variant="dark">
    <VegaEmbed spec={heroChart} /> {/* brand + dark */}
  </VegaThemeProvider>
</VegaThemeProvider>
```

```ts
type VegaThemeLayer = {
  config?: Config; // Vega or Vega-Lite config
  options?: Omit<EmbedOptions, "config">; // renderer, actions, tooltip, loader, expressionFunctions...
};

type VegaTheme = VegaThemeLayer & {
  variants?: Record<string, VegaThemeLayer>; // e.g. { dark: {...}, print: {...} }
};
```

### `useVegaTheme()`

Returns the theme in effect at that point in the tree as `{ config, options, variant }`. `variant` is the resolved name, so `"auto"` comes back as `"dark"` or `"light"`. Outside a provider it returns `{ config: {}, options: {}, variant: undefined }`. Use it to style the UI around a chart to match, or to pass the same config to `embed()` yourself.

### Merge order

From lowest to highest priority:

1. The outermost provider's themes, in array order, followed by the active variant of each of those themes.
2. Each nested provider's themes, followed by the active variant of each of them. `inherit={false}` starts over at this provider.
3. The chart's own `options` prop. `options.config` is merged into the config, and the other options override the theme's.
4. The spec's own `config`, which vega-embed applies last.

Rules:

- Plain objects are deep-merged. Arrays and all other values replace what came before, so a nested theme's `range.category` replaces the parent's palette instead of extending it.
- `undefined` never overwrites a defined value.
- `options.loader` and `options.logger` are replaced as a whole, never merged.
- The active variant is the one in effect where the chart is rendered. A provider without a `variant` prop uses its parent's.
- A theme can set `options.theme` to a [vega-themes](https://github.com/vega/vega-themes) name such as `"dark"`. vega-embed applies that named theme underneath all other config, so provider, chart and spec config all win over it. For example, `variants: { dark: { options: { theme: "dark" } } }` uses vega-themes' dark theme as the base of your dark variant.
- If a chart passes `options.config` as a URL string, it replaces the provider config.
- Themes work the same with the SVG and canvas renderers, because Vega applies config before anything is drawn. A theme can set `options.renderer` to switch every chart under it, and a chart's own `options.renderer` still wins.
- Config values must be concrete. Vega can't resolve CSS custom properties such as `var(--brand)`. With the SVG renderer a `var()` color can look right on the page, because the browser resolves it in the SVG, but it is ignored on canvas, lost in PNG exports, left unresolved in SVG exports, and breaks numeric values such as font sizes. Resolve design tokens to values (for example with `getComputedStyle`) before putting them in a theme.
- Canvas draws text once. If a theme names a web font, make sure it has loaded before charts render (for example with `await document.fonts.ready`), or canvas charts keep the fallback font until they are re-embedded.

Changing the theme or the variant re-embeds every chart under the provider, just like changing `options` on a single chart. Re-rendering with a deep-equal theme does not re-embed. Define themes outside your components, or memoize them, when they contain functions such as `expressionFunctions` or a tooltip handler: functions are compared by reference, so a new function on every render re-embeds every chart on every render.

### Building on vega-themes

[vega-themes](https://github.com/vega/vega-themes) ships ready-made configs such as `fivethirtyeight`, `quartz`, `dark` and IBM's Carbon set. There are two ways to build on them.

**Different themes for light and dark:** name them in your variants with vega-embed's `theme` option. vega-embed applies a named theme underneath all other config, so the rest of your theme still wins whichever one is active:

```tsx
const carbon: VegaTheme = {
  config: { axis: { labelFontSize: 13 } }, // applied on top of either theme
  variants: {
    light: { options: { theme: "carbonwhite" } },
    dark: { options: { theme: "carbong100" } },
  },
};

<VegaThemeProvider theme={carbon} variant="auto">{/* charts */}</VegaThemeProvider>;
```

**Extending one theme:** import its config and list your changes after it. It then goes through the provider's deep merge, so `useVegaTheme()` returns it and nested providers can adjust it:

```tsx
import { fivethirtyeight } from "vega-themes";

const smallLabels: VegaTheme = { config: { axis: { labelFontSize: 9 } } };

<VegaThemeProvider theme={[{ config: fivethirtyeight }, smallLabels]}>{/* charts */}</VegaThemeProvider>;
```

Imported themes are complete configs, so keep them out of variants. A variant is applied after every base layer of its provider, so an imported theme there would override your own changes, and switching between an imported base theme and an imported variant theme leaves the base theme's extra settings in place. When you override a theme, set the same property it sets. Some themes, such as `fivethirtyeight`, set `fill` or `stroke` on marks, and in Vega-Lite those take precedence over `color`. vega-themes is already installed with vega-embed, but add it to your own dependencies if you import it.

## Important
Any changes to `spec` or `options`, or to the theme from an enclosing [`VegaThemeProvider`](#theming-with-vegathemeprovider), will cause the view to be torn down and re-embedded. If you need to update the view without re-embedding, use the [View API](https://vega.github.io/vega/docs/api/view). Refer to the [Recipes](#recipes) section for common use cases.

## Recipes

See [storybook](https://vega.github.io/react-vega) for live examples.

### 1. Dynamic data

```tsx
const ref = React.useRef<HTMLDivElement>(null);
const embed = useVegaEmbed({ ref, spec, options: { mode: "vega-lite" } });

useEffect(() => {
  embed?.view.data("values", data).runAsync();
}, [embed, data]);
```

### 2. Programmatically changing width & height

```tsx
const embed = useVegaEmbed({
  ref,
  spec,
});

const changeDimensions = (width: number, height: number) => {
  embed?.view.width(width).height(height).runAsync();
};
```
### 3. Subscribe to signal events

```tsx
const embed = useVegaEmbed({
  ref,
  spec,
});

useEffect(() => {
  const listener = (signal, data) => console.log(signal, data);

  embed?.view.addSignalListener("signal", listener);

  return () => {
    embed?.view.removeSignalListener("signal", listener);
  };
}, [embed]);

```

For more information see the documentation for [vega-embed](https://vega.github.io/vega-embed/) and the [vega View API](https://vega.github.io/vega/docs/api/view).

## Contributing

1. `npm i`
2. `npm run dev` – run the storybook
3. `npm run test` – run the test suite.
