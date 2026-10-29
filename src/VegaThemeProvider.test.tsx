import React from "react";
import { cleanup, render } from "vitest-browser-react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useVegaEmbed, VegaEmbed } from "./VegaEmbed";
import {
  VegaThemeProvider,
  useVegaTheme,
  type ResolvedVegaTheme,
  type VegaTheme,
} from "./VegaThemeProvider";
import embed, { EmbedOptions } from "vega-embed";

vi.mock("vega-embed", () => {
  return { default: vi.fn() }; // mark as ESM + provide default
});

const mkResult = (finalize: () => void = vi.fn()) => ({ finalize });

/** The options passed to the nth call of `embed()`. */
const optionsOfCall = (n: number) => vi.mocked(embed).mock.calls[n][2];

/** The options passed to `embed()` for the given spec. */
const optionsForSpec = (spec: string) =>
  vi.mocked(embed).mock.calls.find((call) => call[1] === spec)?.[2];

/** Flushes pending effects so "was not called again" assertions are meaningful. */
const flush = () => act(async () => {});

const brand: VegaTheme = {
  config: { background: "#fff", axis: { labelColor: "#333" } },
  options: { renderer: "svg" },
  variants: {
    light: { config: { axis: { gridColor: "#ddd" } } },
    dark: { config: { background: "#111", axis: { labelColor: "#eee" } } },
  },
};

function mockPrefersDark(initial: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: initial,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.delete(listener);
    }),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );
  return {
    query,
    setDark(dark: boolean) {
      query.matches = dark;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("VegaThemeProvider", () => {
  beforeEach(() => {
    vi.mocked(embed).mockResolvedValue(mkResult() as any);
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("passes `options` to embed untouched when there is no provider", async () => {
    const options: EmbedOptions = {
      renderer: "canvas",
      config: { background: "red" },
    };
    render(<VegaEmbed spec="x" options={options} />);
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toBe(options);
  });

  it("passes `{}` to embed when there is no provider and no options", async () => {
    render(<VegaEmbed spec="x" />);
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toEqual({});
  });

  it("passes the provider's config and options to embed", async () => {
    render(
      <VegaThemeProvider theme={brand}>
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toEqual({
      renderer: "svg",
      config: { background: "#fff", axis: { labelColor: "#333" } },
    });
  });

  it("applies the theme through `useVegaEmbed` as well as `<VegaEmbed>`", async () => {
    function Chart() {
      const ref = React.useRef<HTMLDivElement>(null);
      useVegaEmbed({ ref, spec: "x", options: { actions: false } });
      return <div ref={ref} />;
    }
    render(
      <VegaThemeProvider theme={brand}>
        <Chart />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toEqual({
      renderer: "svg",
      actions: false,
      config: { background: "#fff", axis: { labelColor: "#333" } },
    });
  });

  it("lets the chart's own options and `options.config` beat the provider", async () => {
    render(
      <VegaThemeProvider theme={brand}>
        <VegaEmbed
          spec="x"
          options={{ renderer: "canvas", config: { background: "pink" } }}
        />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toEqual({
      renderer: "canvas",
      config: { background: "pink", axis: { labelColor: "#333" } },
    });
  });

  it("merges a nested provider over its parent, and `inherit={false}` resets", async () => {
    const compact: VegaTheme = {
      config: { background: "#fafafa", axis: { labelFontSize: 9 } },
      variants: { dark: { config: { axis: { labelFontSize: 8 } } } },
    };
    render(
      <VegaThemeProvider theme={brand} variant="dark">
        <VegaThemeProvider theme={compact}>
          <VegaEmbed spec="nested" />
        </VegaThemeProvider>
        <VegaThemeProvider theme={compact} inherit={false}>
          <VegaEmbed spec="isolated" />
        </VegaThemeProvider>
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(2));

    // Inherits the parent's theme and its "dark" variant.
    expect(optionsForSpec("nested")).toEqual({
      renderer: "svg",
      config: {
        background: "#fafafa",
        axis: { labelColor: "#eee", labelFontSize: 8 },
      },
    });
    // Ignores the parent's theme, but still follows its variant.
    expect(optionsForSpec("isolated")).toEqual({
      config: { background: "#fafafa", axis: { labelFontSize: 8 } },
    });
  });

  it("applies a nested provider's variant to the outer themes too", async () => {
    render(
      <VegaThemeProvider theme={brand} variant="light">
        <VegaEmbed spec="page" />
        <VegaThemeProvider variant="dark">
          <VegaEmbed spec="dark-section" />
        </VegaThemeProvider>
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(2));

    expect(optionsForSpec("page")?.config).toEqual({
      background: "#fff",
      axis: { labelColor: "#333", gridColor: "#ddd" },
    });
    // brand + dark, with nothing left over from the light variant.
    expect(optionsForSpec("dark-section")?.config).toEqual({
      background: "#111",
      axis: { labelColor: "#eee" },
    });
  });

  it("merges a theme array from left to right, replacing arrays", async () => {
    const base: VegaTheme = {
      config: {
        background: "white",
        range: { category: ["red", "green", "blue"] },
      },
    };
    const mono: VegaTheme = { config: { range: { category: ["black"] } } };
    render(
      <VegaThemeProvider theme={[base, mono]}>
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)).toEqual({
      config: { background: "white", range: { category: ["black"] } },
    });
  });

  it("re-embeds with the variant's config and finalizes the old view when `variant` changes", async () => {
    const finalizeLight = vi.fn();
    vi.mocked(embed)
      .mockResolvedValueOnce(mkResult(finalizeLight) as any)
      .mockResolvedValueOnce(mkResult() as any);

    const { rerender } = render(
      <VegaThemeProvider theme={brand} variant="light">
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(optionsOfCall(0)?.config).toEqual({
      background: "#fff",
      axis: { labelColor: "#333", gridColor: "#ddd" },
    });

    rerender(
      <VegaThemeProvider theme={brand} variant="dark">
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => {
      expect(embed).toHaveBeenCalledTimes(2);
      expect(finalizeLight).toHaveBeenCalledTimes(1);
    });
    expect(optionsOfCall(1)?.config).toEqual({
      background: "#111",
      axis: { labelColor: "#eee" },
    });
  });

  it('follows the OS color scheme with `variant="auto"`', async () => {
    const media = mockPrefersDark(false);
    const finalizeLight = vi.fn();
    vi.mocked(embed)
      .mockResolvedValueOnce(mkResult(finalizeLight) as any)
      .mockResolvedValueOnce(mkResult() as any);

    let seen: ResolvedVegaTheme | undefined;
    function Probe() {
      seen = useVegaTheme();
      return null;
    }

    const { unmount } = render(
      <VegaThemeProvider theme={brand} variant="auto">
        <VegaEmbed spec="x" />
        <Probe />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(seen?.variant).toBe("light");
    expect(optionsOfCall(0)?.config).toEqual({
      background: "#fff",
      axis: { labelColor: "#333", gridColor: "#ddd" },
    });
    expect(media.query.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    act(() => media.setDark(true));

    await waitFor(() => {
      expect(embed).toHaveBeenCalledTimes(2);
      expect(finalizeLight).toHaveBeenCalledTimes(1);
    });
    expect(seen?.variant).toBe("dark");
    expect(optionsOfCall(1)?.config).toEqual({
      background: "#111",
      axis: { labelColor: "#eee" },
    });

    unmount();
    expect(media.query.removeEventListener).toHaveBeenCalledWith(
      "change",
      media.query.addEventListener.mock.calls[0][1],
    );
  });

  it('does not subscribe to the OS color scheme unless `variant` is "auto"', async () => {
    const media = mockPrefersDark(true);
    render(
      <VegaThemeProvider theme={brand} variant="light">
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));
    expect(window.matchMedia).not.toHaveBeenCalled();
    expect(media.query.addEventListener).not.toHaveBeenCalled();
    expect(optionsOfCall(0)?.config).toMatchObject({ background: "#fff" });
  });

  it("does not re-embed when re-rendered with a deep-equal theme", async () => {
    const seen: ResolvedVegaTheme[] = [];
    function Probe() {
      seen.push(useVegaTheme());
      return null;
    }
    const tree = () => (
      <VegaThemeProvider
        theme={{ config: { background: "red", axis: { grid: false } } }}
        variant="dark"
      >
        <VegaEmbed spec="x" />
        <Probe />
      </VegaThemeProvider>
    );

    const { rerender } = render(tree());
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));

    rerender(tree());
    await flush();

    expect(embed).toHaveBeenCalledTimes(1);
    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1); // the context value is stable
  });

  it("re-embeds when the theme changes", async () => {
    const finalizeA = vi.fn();
    vi.mocked(embed)
      .mockResolvedValueOnce(mkResult(finalizeA) as any)
      .mockResolvedValueOnce(mkResult() as any);

    const { rerender } = render(
      <VegaThemeProvider theme={{ config: { background: "red" } }}>
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => expect(embed).toHaveBeenCalledTimes(1));

    rerender(
      <VegaThemeProvider theme={{ config: { background: "blue" } }}>
        <VegaEmbed spec="x" />
      </VegaThemeProvider>,
    );
    await waitFor(() => {
      expect(embed).toHaveBeenCalledTimes(2);
      expect(finalizeA).toHaveBeenCalledTimes(1);
    });
    expect(optionsOfCall(1)).toEqual({ config: { background: "blue" } });
  });
});

describe("useVegaTheme", () => {
  afterEach(() => {
    cleanup();
  });

  it("returns an empty theme outside a provider", () => {
    let seen: ResolvedVegaTheme | undefined;
    function Probe() {
      seen = useVegaTheme();
      return null;
    }
    render(<Probe />);
    expect(seen).toEqual({ config: {}, options: {}, variant: undefined });
  });

  it("returns the merged theme and variant of all enclosing providers", () => {
    let seen: ResolvedVegaTheme | undefined;
    function Probe() {
      seen = useVegaTheme();
      return null;
    }
    render(
      <VegaThemeProvider theme={brand} variant="dark">
        <VegaThemeProvider theme={{ config: { font: "Inter" } }}>
          <Probe />
        </VegaThemeProvider>
      </VegaThemeProvider>,
    );
    expect(seen).toEqual({
      config: {
        background: "#111",
        font: "Inter",
        axis: { labelColor: "#eee" },
      },
      options: { renderer: "svg" },
      variant: "dark",
    });
  });
});
