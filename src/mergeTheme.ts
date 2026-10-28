import type { Config, EmbedOptions } from "vega-embed";

/** Embed options a theme can carry. Config lives in its own `config` key. */
export type VegaThemeOptions = Omit<EmbedOptions, "config">;

export type VegaThemeLayer = {
  /** Vega / Vega-Lite config to merge into every chart under this provider. */
  config?: Config;
  /** Other embed options (renderer, tooltip, loader, expressionFunctions, actions...). */
  options?: VegaThemeOptions;
};

export type VegaTheme = VegaThemeLayer & {
  /** Named variants, e.g. `{ dark: {...}, print: {...} }`, layered on top of the base. */
  variants?: Record<string, VegaThemeLayer>;
};

/** A theme, or a list of themes merged left to right. Falsy entries are skipped. */
export type VegaThemeInput =
  | VegaTheme
  | ReadonlyArray<VegaTheme | null | undefined | false>;

/** The theme in effect at one point in the tree. */
export type ResolvedVegaTheme = {
  config: Config;
  options: VegaThemeOptions;
  /** The active variant. `"auto"` has already been resolved to `"dark"` or `"light"`. */
  variant: string | undefined;
};

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function mergeValue(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (!isPlainObject(override)) return override;
  const result: PlainObject = isPlainObject(base) ? { ...base } : {};
  for (const key of Object.keys(override)) {
    if (key === "__proto__") continue;
    result[key] = mergeValue(result[key], override[key]);
  }
  return result;
}

/**
 * Deep-merges `sources` from left to right into a new object. Plain objects
 * are merged key by key. Arrays and all other values replace what came before.
 * `undefined` never overwrites a defined value. Inputs are never mutated, and
 * every plain object in the result is a fresh copy.
 */
export function deepMerge<T>(...sources: ReadonlyArray<T | undefined>): T {
  let result: unknown = {};
  for (const source of sources) {
    result = mergeValue(result, source);
  }
  return result as T;
}

/**
 * Embed options that are objects with behavior rather than settings. A vega
 * `Loader` or `Logger` is a plain object, so it must be replaced as a whole.
 */
const REPLACED_OPTIONS = ["loader", "logger"] as const;

function mergeOptions(
  ...layers: ReadonlyArray<VegaThemeOptions | undefined>
): VegaThemeOptions {
  const result = deepMerge<VegaThemeOptions>(...layers);
  for (const key of REPLACED_OPTIONS) {
    let value: unknown;
    for (const layer of layers) {
      if (layer?.[key] !== undefined) value = layer[key];
    }
    if (value !== undefined) (result as PlainObject)[key] = value;
  }
  return result;
}

function getVariant(
  theme: VegaTheme,
  variant: string,
): VegaThemeLayer | undefined {
  const { variants } = theme;
  return variants && Object.prototype.hasOwnProperty.call(variants, variant)
    ? variants[variant]
    : undefined;
}

/** Normalizes a `theme` prop to a list of themes, skipping falsy entries. */
export function toThemeList(theme: VegaThemeInput | undefined): VegaTheme[] {
  const list = (Array.isArray(theme) ? theme : [theme]) as ReadonlyArray<
    VegaTheme | null | undefined | false
  >;
  return list.filter((entry): entry is VegaTheme => !!entry);
}

/**
 * Resolves a stack of providers' themes, outermost first, for one variant.
 * Within each provider, the base layers of its themes are applied in array
 * order, then the variant layer of each theme in the same order, so the
 * variant beats every base layer of that provider.
 */
export function mergeTheme(
  stack: ReadonlyArray<ReadonlyArray<VegaTheme>>,
  variant: string | undefined,
): ResolvedVegaTheme {
  const layers: Array<VegaThemeLayer | undefined> = [];
  for (const themes of stack) {
    layers.push(...themes);
    if (variant !== undefined) {
      layers.push(...themes.map((theme) => getVariant(theme, variant)));
    }
  }

  return {
    config: deepMerge<Config>(...layers.map((layer) => layer?.config)),
    options: mergeOptions(...layers.map((layer) => layer?.options)),
    variant,
  };
}

/**
 * Applies a resolved theme to one chart's own embed options. The chart wins:
 * its `config` is deep-merged over the theme's config and its other options
 * override the theme's options. A `config` URL string replaces the theme config.
 */
export function applyTheme(
  theme: ResolvedVegaTheme,
  options: EmbedOptions = {},
): EmbedOptions {
  const { config, ...rest } = options;
  return {
    ...mergeOptions(theme.options, rest),
    config: deepMerge<string | Config>(theme.config, config),
  };
}
