import React from "react";
import deepEqual from "fast-deep-equal";
import {
  VegaThemeContext,
  type VegaThemeContextValue,
} from "./VegaThemeContext";
import {
  mergeTheme,
  toThemeList,
  type ResolvedVegaTheme,
  type VegaThemeInput,
} from "./mergeTheme";

export type {
  ResolvedVegaTheme,
  VegaTheme,
  VegaThemeInput,
  VegaThemeLayer,
  VegaThemeOptions,
} from "./mergeTheme";

export type VegaThemeProviderProps = {
  /**
   * A theme, or an array of themes merged left to right. Falsy entries are
   * skipped. Omit it to only change the variant for part of the tree.
   */
  theme?: VegaThemeInput;
  /**
   * The variant to apply, e.g. `"dark"`. It applies to the themes of this
   * provider and of every enclosing provider. `"auto"` resolves to `"dark"`
   * or `"light"` from `prefers-color-scheme` and follows changes. When
   * omitted, the parent provider's variant is used.
   */
  variant?: "auto" | (string & {});
  /**
   * Merge on top of the enclosing provider's themes. Defaults to `true`.
   * With `false`, the parent's themes are ignored, but its variant still
   * applies unless `variant` is set.
   */
  inherit?: boolean;
  children: React.ReactNode;
};

const DARK_QUERY = "(prefers-color-scheme: dark)";

function getDarkQuery(): MediaQueryList | null {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY)
    : null;
}

/** Whether the OS prefers a dark color scheme. Only subscribes while `enabled`. */
function usePrefersDark(enabled: boolean): boolean {
  const queryRef = React.useRef<MediaQueryList | null>(null);
  if (enabled && !queryRef.current) {
    queryRef.current = getDarkQuery();
  }
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    const query = queryRef.current;
    if (!enabled || !query) return;
    query.addEventListener("change", rerender);
    return () => query.removeEventListener("change", rerender);
  }, [enabled]);

  return enabled && queryRef.current?.matches === true;
}

/** Returns the previous value while the new one is deep-equal to it. */
function useDeepStable<T>(value: T): T {
  const ref = React.useRef(value);
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Applies a Vega / Vega-Lite theme to every `<VegaEmbed>` and `useVegaEmbed`
 * below it. Providers can be nested: an inner provider merges on top of the
 * outer one unless `inherit` is `false`.
 */
export function VegaThemeProvider(props: VegaThemeProviderProps) {
  const { theme, variant, inherit = true, children } = props;

  const parent = React.useContext(VegaThemeContext);

  const prefersDark = usePrefersDark(variant === "auto");
  const resolvedVariant =
    variant === "auto"
      ? prefersDark
        ? "dark"
        : "light"
      : (variant ?? parent?.theme.variant);

  const themes = useDeepStable(toThemeList(theme));
  const parentStack = inherit ? parent?.stack : undefined;

  const value = React.useMemo<VegaThemeContextValue>(() => {
    const stack = parentStack ? [...parentStack, themes] : [themes];
    return { stack, theme: mergeTheme(stack, resolvedVariant) };
  }, [parentStack, themes, resolvedVariant]);

  return (
    <VegaThemeContext.Provider value={value}>
      {children}
    </VegaThemeContext.Provider>
  );
}

const NO_THEME: ResolvedVegaTheme = Object.freeze({
  config: Object.freeze({}),
  options: Object.freeze({}),
  variant: undefined,
});

/**
 * The theme in effect at this point in the tree: the merged `config` and
 * `options` of all enclosing providers, and the resolved `variant`.
 */
export function useVegaTheme(): ResolvedVegaTheme {
  return React.useContext(VegaThemeContext)?.theme ?? NO_THEME;
}
