import { Config } from 'vega-embed';
import { default as default_2 } from 'react';
import { EmbedOptions } from 'vega-embed';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { Result } from 'vega-embed';
import { VisualizationSpec } from 'vega-embed';

/** The theme in effect at one point in the tree. */
export declare type ResolvedVegaTheme = {
    config: Config;
    options: VegaThemeOptions;
    /** The active variant. `"auto"` has already been resolved to `"dark"` or `"light"`. */
    variant: string | undefined;
};

export declare function useVegaEmbed(params: UseVegaEmbedParams): Result | null;

export declare type UseVegaEmbedParams = {
    ref: default_2.RefObject<HTMLDivElement | null>;
    spec: VisualizationSpec | string;
    options?: EmbedOptions;
    onEmbed?: (result: Result) => void;
    onError?: (error: unknown) => void;
};

/**
 * The theme in effect at this point in the tree: the merged `config` and
 * `options` of all enclosing providers, and the resolved `variant`.
 */
export declare function useVegaTheme(): ResolvedVegaTheme;

export declare const VegaEmbed: default_2.ForwardRefExoticComponent<Omit<UseVegaEmbedParams, "ref"> & default_2.HTMLAttributes<HTMLDivElement> & default_2.RefAttributes<HTMLDivElement>>;

export declare type VegaEmbedProps = Omit<UseVegaEmbedParams, "ref"> & default_2.HTMLAttributes<HTMLDivElement>;

export declare type VegaTheme = VegaThemeLayer & {
    /** Named variants, e.g. `{ dark: {...}, print: {...} }`, layered on top of the base. */
    variants?: Record<string, VegaThemeLayer>;
};

/** A theme, or a list of themes merged left to right. Falsy entries are skipped. */
export declare type VegaThemeInput = VegaTheme | ReadonlyArray<VegaTheme | null | undefined | false>;

export declare type VegaThemeLayer = {
    /** Vega / Vega-Lite config to merge into every chart under this provider. */
    config?: Config;
    /** Other embed options (renderer, tooltip, loader, expressionFunctions, actions...). */
    options?: VegaThemeOptions;
};

/** Embed options a theme can carry. Config lives in its own `config` key. */
export declare type VegaThemeOptions = Omit<EmbedOptions, "config">;

/**
 * Applies a Vega / Vega-Lite theme to every `<VegaEmbed>` and `useVegaEmbed`
 * below it. Providers can be nested: an inner provider merges on top of the
 * outer one unless `inherit` is `false`.
 */
export declare function VegaThemeProvider(props: VegaThemeProviderProps): JSX_2.Element;

export declare type VegaThemeProviderProps = {
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
    children: default_2.ReactNode;
};

export { }
