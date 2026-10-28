import React from "react";
import { VegaEmbed } from "./VegaEmbed";
import { useVegaTheme, VegaThemeProvider } from "./VegaThemeProvider";
import { LineSpec, ScatterSpec, ThemeableBarSpec } from "./stories/specs";
import { brandTheme, compactTheme } from "./stories/themes";

const PAGE: Record<string, { background: string; color: string }> = {
  light: { background: "#fbfaf7", color: "#1f2a44" },
  dark: { background: "#161b2b", color: "#eef1f8" },
};

function pageStyle(variant: string | undefined): React.CSSProperties {
  return {
    ...PAGE[variant ?? "light"],
    padding: 16,
    fontFamily: "Georgia, serif",
  };
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #8884",
  borderRadius: 6,
  padding: 12,
  marginBottom: 12,
};

export const Themed = () => {
  return (
    <div style={pageStyle("light")}>
      <VegaThemeProvider theme={brandTheme} variant="light">
        <VegaEmbed spec={ThemeableBarSpec} />
      </VegaThemeProvider>
    </div>
  );
};

export const DarkModeToggle = () => {
  const [isDark, setIsDark] = React.useState(false);
  const variant = isDark ? "dark" : "light";

  return (
    <div style={pageStyle(variant)}>
      <p>
        <button onClick={() => setIsDark((value) => !value)}>
          Switch to {isDark ? "light" : "dark"}
        </button>
      </p>
      <VegaThemeProvider theme={brandTheme} variant={variant}>
        <VegaEmbed spec={ThemeableBarSpec} />
      </VegaThemeProvider>
    </div>
  );
};

const ResolvedVariant = () => {
  const { variant } = useVegaTheme();
  return (
    <p>
      Resolved variant: <strong data-testid="variant">{variant}</strong>
    </p>
  );
};

const AutoVariantPage = () => {
  const { variant } = useVegaTheme();
  return (
    <div style={pageStyle(variant)}>
      <p>
        Switch your OS appearance between light and dark to see this change.
      </p>
      <ResolvedVariant />
      <VegaEmbed spec={ThemeableBarSpec} />
    </div>
  );
};

export const AutoVariant = () => {
  return (
    <VegaThemeProvider theme={brandTheme} variant="auto">
      <AutoVariantPage />
    </VegaThemeProvider>
  );
};

export const Nested = () => {
  return (
    <div style={pageStyle("light")}>
      <VegaThemeProvider theme={brandTheme} variant="light">
        <div style={panelStyle}>
          <h4>Outer provider: brandTheme</h4>
          <VegaEmbed spec={LineSpec} />
        </div>
        <VegaThemeProvider theme={compactTheme}>
          <div style={panelStyle}>
            <h4>Inner provider: compactTheme merged over brandTheme</h4>
            <VegaEmbed spec={LineSpec} />
          </div>
        </VegaThemeProvider>
        <VegaThemeProvider theme={compactTheme} inherit={false}>
          <div style={panelStyle}>
            <h4>inherit={"{false}"}: compactTheme alone, brand reset</h4>
            <VegaEmbed spec={LineSpec} />
          </div>
        </VegaThemeProvider>
        <VegaThemeProvider variant="dark">
          <div style={{ ...panelStyle, ...PAGE.dark }}>
            <h4>
              variant=&quot;dark&quot; only: brandTheme in dark for this section
            </h4>
            <VegaEmbed spec={LineSpec} />
          </div>
        </VegaThemeProvider>
      </VegaThemeProvider>
    </div>
  );
};

export const MultipleCharts = () => {
  return (
    <div style={pageStyle("light")}>
      <VegaThemeProvider theme={brandTheme} variant="light">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <VegaEmbed spec={ThemeableBarSpec} />
          <VegaEmbed spec={LineSpec} />
          <VegaEmbed spec={ScatterSpec} />
        </div>
      </VegaThemeProvider>
    </div>
  );
};
