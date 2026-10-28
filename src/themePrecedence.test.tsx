// These tests use the real vega-embed (no mock). They pin the precedence that
// VegaThemeProvider relies on: options.theme < options.config < spec.config.
import React from "react";
import { cleanup, render } from "vitest-browser-react";
import { describe, it, afterEach, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import embed, {
  type EmbedOptions,
  type Result,
  type VisualizationSpec,
} from "vega-embed";
import { VegaEmbed } from "./VegaEmbed";
import {
  VegaThemeProvider,
  type VegaTheme,
  type VegaThemeProviderProps,
} from "./VegaThemeProvider";

const vegaLiteSpec = (config?: object): VisualizationSpec => ({
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  data: { values: [{ a: 1, b: 2 }] },
  mark: "point",
  encoding: {
    x: { field: "a", type: "quantitative" },
    y: { field: "b", type: "quantitative" },
  },
  ...(config ? { config } : {}),
});

const vegaSpec = (config?: object): VisualizationSpec => ({
  $schema: "https://vega.github.io/schema/vega/v6.json",
  width: 20,
  height: 20,
  ...(config ? { config } : {}),
});

const results: Result[] = [];

async function embedBackground(
  spec: VisualizationSpec,
  options: EmbedOptions,
): Promise<string> {
  const el = document.createElement("div");
  document.body.append(el);
  const result = await embed(el, spec, { actions: false, ...options });
  results.push(result);
  return result.view.background();
}

describe("vega-embed config precedence", () => {
  afterEach(() => {
    results.splice(0).forEach((result) => result.finalize());
    document.body.innerHTML = "";
  });

  // vega-themes "dark" sets `background: "#333"`.
  it("applies a named `options.theme` when nothing overrides it", async () => {
    expect(await embedBackground(vegaLiteSpec(), { theme: "dark" })).toBe(
      "#333",
    );
  });

  it("merges `options.config` over `options.theme` instead of replacing it", async () => {
    expect(
      await embedBackground(vegaLiteSpec(), {
        theme: "dark",
        config: { axis: { labelFontSize: 20 } },
      }),
    ).toBe("#333");
    expect(
      await embedBackground(vegaLiteSpec(), {
        theme: "dark",
        config: { background: "#010101" },
      }),
    ).toBe("#010101");
  });

  it("lets `spec.config` beat `options.config` for Vega-Lite and Vega", async () => {
    const options = { config: { background: "#010101" } };
    expect(
      await embedBackground(vegaLiteSpec({ background: "#020202" }), options),
    ).toBe("#020202");
    expect(
      await embedBackground(vegaSpec({ background: "#020202" }), options),
    ).toBe("#020202");
    expect(await embedBackground(vegaSpec(), options)).toBe("#010101");
  });
});

describe("VegaThemeProvider with the real vega-embed", () => {
  afterEach(() => {
    cleanup();
  });

  async function providerBackground(
    props: Omit<VegaThemeProviderProps, "children">,
    spec: VisualizationSpec = vegaLiteSpec(),
  ): Promise<string> {
    let view: Result["view"] | undefined;
    render(
      <VegaThemeProvider {...props}>
        <VegaEmbed
          spec={spec}
          options={{ actions: false }}
          onEmbed={(result) => {
            view = result.view;
          }}
        />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(view).toBeDefined());
    return view!.background();
  }

  const theme: VegaTheme = {
    config: { background: "#0a0a0a" },
    variants: { light: { config: { background: "#fafafa" } } },
  };

  it("styles a chart from the provider", async () => {
    expect(await providerBackground({ theme })).toBe("#0a0a0a");
  });

  it("applies the active variant", async () => {
    expect(await providerBackground({ theme, variant: "light" })).toBe(
      "#fafafa",
    );
  });

  it("applies provider config over a named `options.theme`", async () => {
    expect(
      await providerBackground({ theme: { options: { theme: "dark" } } }),
    ).toBe("#333");
    expect(
      await providerBackground({
        theme: [{ options: { theme: "dark" } }, theme],
      }),
    ).toBe("#0a0a0a");
  });

  it("switches named vega-themes per variant, with provider config on top", async () => {
    // Background values come from vega-themes' carbonwhite and carbong100.
    const carbon: VegaTheme = {
      config: { axis: { labelFontSize: 13 } },
      variants: {
        light: { options: { theme: "carbonwhite" } },
        dark: { options: { theme: "carbong100" } },
      },
    };
    for (const [variant, background] of [
      ["light", "#ffffff"],
      ["dark", "#161616"],
    ]) {
      let view: Result["view"] | undefined;
      const { container, unmount } = render(
        <VegaThemeProvider theme={carbon} variant={variant}>
          <VegaEmbed
            spec={vegaLiteSpec()}
            options={{ actions: false }}
            onEmbed={(result) => {
              view = result.view;
            }}
          />
        </VegaThemeProvider>,
      );
      await waitFor(() => expect(view).toBeDefined());
      expect(view!.background()).toBe(background);
      const label = container.querySelector(".role-axis-label text");
      expect(label?.getAttribute("font-size")).toBe("13px");
      unmount();
    }
  });

  it("lets the spec's own config win over the provider", async () => {
    expect(
      await providerBackground(
        { theme },
        vegaLiteSpec({ background: "#020202" }),
      ),
    ).toBe("#020202");
  });
});
