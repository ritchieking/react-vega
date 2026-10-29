// These tests use the real vega-embed (no mock) and the canvas renderer, and
// read pixels back to check that themes reach charts drawn on canvas.
import React from "react";
import { cleanup, render } from "vitest-browser-react";
import { describe, it, afterEach, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { type VisualizationSpec } from "vega-embed";
import { VegaEmbed } from "./VegaEmbed";
import { VegaThemeProvider, type VegaTheme } from "./VegaThemeProvider";

const RED: RGB = [255, 0, 0];
const BLUE: RGB = [0, 0, 255];
const GREEN: RGB = [0, 255, 0];

type RGB = [number, number, number];

const barSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  data: {
    values: [
      { a: "A", b: 3 },
      { a: "B", b: 5 },
    ],
  },
  mark: "bar",
  encoding: {
    x: { field: "a", type: "nominal" },
    y: { field: "b", type: "quantitative" },
  },
};

const theme: VegaTheme = {
  config: { background: "rgb(0, 0, 255)", mark: { color: "rgb(255, 0, 0)" } },
  options: { actions: false },
  variants: { dark: { config: { background: "rgb(0, 255, 0)" } } },
};

const canvasTheme: VegaTheme = { options: { renderer: "canvas" } };

/** Number of pixels in the chart's canvas close to `color`. */
function countPixels(container: Element, [r, g, b]: RGB): number {
  const canvas = container.querySelector("canvas");
  if (!canvas) return 0;
  const context = canvas.getContext("2d");
  if (!context) return 0;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (
      Math.abs(data[i] - r) < 40 &&
      Math.abs(data[i + 1] - g) < 40 &&
      Math.abs(data[i + 2] - b) < 40 &&
      data[i + 3] > 200
    ) {
      count++;
    }
  }
  return count;
}

describe("VegaThemeProvider with the canvas renderer", () => {
  afterEach(() => {
    cleanup();
  });

  it("draws the theme's colors on canvas", async () => {
    const { container } = render(
      <VegaThemeProvider theme={theme}>
        <VegaEmbed spec={barSpec} options={{ renderer: "canvas" }} />
      </VegaThemeProvider>,
    );
    await waitFor(() => {
      expect(countPixels(container, RED)).toBeGreaterThan(100);
      expect(countPixels(container, BLUE)).toBeGreaterThan(100);
    });
  });

  it("lets a theme switch every chart under it to canvas", async () => {
    const { container } = render(
      <VegaThemeProvider theme={[theme, canvasTheme]}>
        <VegaEmbed spec={barSpec} data-testid="one" />
        <VegaEmbed spec={barSpec} data-testid="two" />
      </VegaThemeProvider>,
    );
    await waitFor(() => {
      expect(container.querySelectorAll("canvas")).toHaveLength(2);
    });
    expect(container.querySelector("svg.marks")).toBeNull();
  });

  it("lets a chart's own `renderer` beat the theme's", async () => {
    const { container } = render(
      <VegaThemeProvider theme={[theme, canvasTheme]}>
        <VegaEmbed spec={barSpec} options={{ renderer: "svg" }} />
      </VegaThemeProvider>,
    );
    await waitFor(() => {
      expect(container.querySelector("svg.marks")).not.toBeNull();
    });
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("redraws the canvas when the variant changes", async () => {
    const tree = (variant: string) => (
      <VegaThemeProvider theme={[theme, canvasTheme]} variant={variant}>
        <VegaEmbed spec={barSpec} />
      </VegaThemeProvider>
    );
    const { container, rerender } = render(tree("light"));
    await waitFor(() => {
      expect(countPixels(container, BLUE)).toBeGreaterThan(100);
    });

    rerender(tree("dark"));
    await waitFor(() => {
      expect(countPixels(container, GREEN)).toBeGreaterThan(100);
    });
    expect(countPixels(container, BLUE)).toBe(0);
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
  });
});
