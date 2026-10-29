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

Wrap part of your app in a `VegaThemeProvider` to give every `<VegaEmbed>` and `useVegaEmbed` below it the same config and embed options.

```tsx
import { VegaEmbed, VegaThemeProvider, type VegaTheme } from "react-vega";

const brand: VegaTheme = {
  config: { font: "Inter", axis: { labelColor: "#4b5563" } },
  options: { actions: false },
  variants: {
    dark: { config: { background: "#111827", axis: { labelColor: "#d1d5db" } } },
  },
};

<VegaThemeProvider theme={brand} variant={isDark ? "dark" : "light"}>
  <VegaEmbed spec={spec} />
</VegaThemeProvider>;
```

### `<VegaThemeProvider />`

| Prop      | Type                       | Default            | Notes                                                                                                                |
| --------- | -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `theme`   | `VegaTheme \| VegaTheme[]` | —                  | A theme, or themes merged left to right. Falsy entries are skipped.                                                  |
| `variant` | `string`                   | parent's `variant` | The variant to apply, e.g. `"dark"`. `"auto"` follows `prefers-color-scheme`. Also applies to enclosing providers' themes. |
| `inherit` | `boolean`                  | `true`             | Merge on top of enclosing providers' themes. `false` ignores their themes, but not their variant.                   |

```ts
type VegaThemeLayer = {
  config?: Config; // Vega or Vega-Lite config
  options?: Omit<EmbedOptions, "config">; // renderer, actions, tooltip...
};

type VegaTheme = VegaThemeLayer & { variants?: Record<string, VegaThemeLayer> };
```

### `useVegaTheme()`

Returns the resolved `{ config, options, variant }` at that point in the tree. `"auto"` comes back as `"dark"` or `"light"`. Outside a provider it returns `{ config: {}, options: {}, variant: undefined }`.

### Merge order

From lowest to highest priority: each provider's themes followed by their active variants, outermost provider first; the chart's own `options` (its `config` is merged in); the spec's own `config`. Plain objects are deep-merged, arrays and other values replace, and `undefined` never overwrites. `options.loader` and `options.logger` are replaced whole. `options.theme` names a [vega-themes](https://github.com/vega/vega-themes) theme, which vega-embed applies underneath everything else.

Changing the theme or variant re-embeds every chart below the provider. A deep-equal theme does not re-embed, so define themes outside components, or memoize them, when they contain functions. Config values must be concrete: Vega can't resolve CSS `var()`. With server rendering, `"auto"` resolves to `"light"` on the server.

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
