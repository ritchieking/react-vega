import React from "react";
import type { ResolvedVegaTheme } from "./mergeTheme";

/** The resolved theme of the nearest provider, or `null` outside any provider. */
export const VegaThemeContext = React.createContext<ResolvedVegaTheme | null>(
  null,
);

VegaThemeContext.displayName = "VegaThemeContext";
