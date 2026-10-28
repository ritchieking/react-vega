import type { VegaTheme } from "../VegaThemeProvider";

const FONT = "Georgia, 'Times New Roman', serif";

function palette(ink: string, muted: string, grid: string, bg: string) {
  return {
    background: bg,
    font: FONT,
    title: { color: ink, fontSize: 16, fontWeight: 600, anchor: "start" },
    axis: {
      labelColor: muted,
      titleColor: ink,
      domainColor: muted,
      tickColor: muted,
      gridColor: grid,
      labelFont: FONT,
      titleFont: FONT,
    },
    legend: {
      labelColor: muted,
      titleColor: ink,
      labelFont: FONT,
      titleFont: FONT,
    },
    view: { stroke: "transparent" },
  } as const;
}

/** A themed look with light and dark variants. */
export const brandTheme: VegaTheme = {
  config: {
    padding: 12,
    axis: { labelFontSize: 11, titleFontSize: 12, grid: true },
    bar: { cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3 },
    line: { strokeWidth: 2.5 },
    point: { strokeWidth: 2 },
  },
  variants: {
    light: {
      config: {
        ...palette("#1f2a44", "#5b6478", "#e4e7ee", "#fbfaf7"),
        mark: { color: "#2f6fdd" },
        range: {
          category: ["#2f6fdd", "#e8743b", "#19a186", "#9b59b6", "#c9a227"],
        },
      },
    },
    dark: {
      config: {
        ...palette("#eef1f8", "#a3acc2", "#2c3550", "#161b2b"),
        mark: { color: "#6ea2ff" },
        range: {
          category: ["#6ea2ff", "#ff9a62", "#4fd1b0", "#c792ea", "#f0cf65"],
        },
      },
    },
  },
};

/** Small and quiet: tight padding, small type, no grid. For nesting. */
export const compactTheme: VegaTheme = {
  config: {
    padding: 4,
    title: { fontSize: 12, fontWeight: 500 },
    axis: {
      grid: false,
      labelFontSize: 9,
      titleFontSize: 9,
      tickSize: 3,
      titlePadding: 4,
    },
    legend: { labelFontSize: 9, titleFontSize: 9, symbolSize: 40 },
    bar: { cornerRadius: 0 },
    line: { strokeWidth: 1.5 },
  },
};
