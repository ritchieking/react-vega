import React from "react";
import type { ResolvedVegaTheme, VegaTheme } from "./mergeTheme";

export type VegaThemeContextValue = {
  /** The merged theme at this point in the tree. */
  theme: ResolvedVegaTheme;
  /**
   * The themes of every enclosing provider, outermost first, back to the
   * nearest `inherit={false}`. Kept so a nested provider can re-resolve all
   * of them with its own variant.
   */
  stack: ReadonlyArray<ReadonlyArray<VegaTheme>>;
};

/** The nearest provider's theme, or `null` outside any provider. */
export const VegaThemeContext =
  React.createContext<VegaThemeContextValue | null>(null);

VegaThemeContext.displayName = "VegaThemeContext";
