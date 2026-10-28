import { describe, it, expect } from "vitest";
import {
  applyTheme,
  deepMerge,
  mergeTheme,
  type ResolvedVegaTheme,
  type VegaTheme,
} from "./mergeTheme";

describe("deepMerge", () => {
  it("deep merges plain objects from left to right", () => {
    expect(
      deepMerge<Record<string, unknown>>(
        { axis: { labelColor: "black", grid: true }, background: "white" },
        { axis: { labelColor: "gray" }, font: "Inter" },
      ),
    ).toEqual({
      axis: { labelColor: "gray", grid: true },
      background: "white",
      font: "Inter",
    });
  });

  it("replaces arrays instead of concatenating them", () => {
    expect(
      deepMerge<Record<string, unknown>>(
        { range: { category: ["red", "green", "blue"] } },
        { range: { category: ["black"] } },
      ),
    ).toEqual({ range: { category: ["black"] } });
  });

  it("never lets `undefined` overwrite a defined value", () => {
    expect(
      deepMerge<Record<string, unknown>>(
        { background: "white", axis: { grid: true } },
        { background: undefined, axis: { grid: undefined } },
        undefined,
      ),
    ).toEqual({ background: "white", axis: { grid: true } });
  });

  it("lets `null` overwrite, since it is a defined value", () => {
    expect(deepMerge<Record<string, unknown>>({ a: 1 }, { a: null })).toEqual({
      a: null,
    });
  });

  it("replaces non-plain values and keeps them by reference", () => {
    class Custom {}
    const instance = new Custom();
    const fn = () => 1;
    const result = deepMerge<Record<string, unknown>>(
      { value: { nested: true }, fn: () => 0 },
      { value: instance, fn },
    );
    expect(result.value).toBe(instance);
    expect(result.fn).toBe(fn);
  });

  it("does not mutate its inputs and returns fresh plain objects", () => {
    const a = { axis: { labelColor: "black" } };
    const b = { axis: { grid: false } };
    const result = deepMerge<Record<string, Record<string, unknown>>>(a, b);
    expect(a).toEqual({ axis: { labelColor: "black" } });
    expect(b).toEqual({ axis: { grid: false } });

    const single = deepMerge<typeof a>(a);
    expect(single).toEqual(a);
    expect(single).not.toBe(a);
    expect(single.axis).not.toBe(a.axis);
    expect(result.axis).not.toBe(a.axis);
  });

  it("ignores `__proto__` keys", () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
    const result = deepMerge<Record<string, unknown>>({}, malicious);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(result.polluted).toBeUndefined();
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});

describe("mergeTheme", () => {
  const brand: VegaTheme = {
    config: { background: "white", axis: { labelColor: "black" } },
    options: { renderer: "svg" },
    variants: {
      dark: { config: { background: "black", axis: { labelColor: "white" } } },
    },
  };

  it("resolves a single theme without a variant", () => {
    expect(mergeTheme(null, brand, undefined)).toEqual({
      config: { background: "white", axis: { labelColor: "black" } },
      options: { renderer: "svg" },
      variant: undefined,
    });
  });

  it("layers the active variant on top of the base", () => {
    expect(mergeTheme(null, brand, "dark")).toEqual({
      config: { background: "black", axis: { labelColor: "white" } },
      options: { renderer: "svg" },
      variant: "dark",
    });
  });

  it("ignores a variant the theme doesn't define", () => {
    const resolved = mergeTheme(null, brand, "print");
    expect(resolved.config).toEqual(brand.config);
    expect(resolved.variant).toBe("print");
  });

  it("only looks up variants the theme defines itself", () => {
    expect(mergeTheme(null, brand, "toString").config).toEqual(brand.config);
    expect(mergeTheme(null, brand, "__proto__").config).toEqual(brand.config);
  });

  it("merges an array of themes from left to right", () => {
    const compact: VegaTheme = {
      config: { axis: { labelFontSize: 9 }, background: "#fafafa" },
    };
    expect(mergeTheme(null, [brand, compact], undefined).config).toEqual({
      background: "#fafafa",
      axis: { labelColor: "black", labelFontSize: 9 },
    });
  });

  it("skips falsy entries in a theme array", () => {
    expect(
      mergeTheme(null, [false, brand, null, undefined], undefined).config,
    ).toEqual(brand.config);
  });

  it("applies every theme's base before any theme's variant", () => {
    const highContrast: VegaTheme = {
      config: { axis: { labelColor: "#000000", labelFontWeight: "bold" } },
    };
    // The dark variant of `brand` must beat the base of a later theme, or
    // dark mode would end up with black labels.
    expect(mergeTheme(null, [brand, highContrast], "dark").config).toEqual({
      background: "black",
      axis: { labelColor: "white", labelFontWeight: "bold" },
    });
  });

  it("merges on top of a parent theme", () => {
    const parent = mergeTheme(null, brand, "dark");
    const child = mergeTheme(
      parent,
      { config: { axis: { labelFontSize: 9 } } },
      "dark",
    );
    expect(child.config).toEqual({
      background: "black",
      axis: { labelColor: "white", labelFontSize: 9 },
    });
    expect(child.options).toEqual({ renderer: "svg" });
  });

  it("deep merges embed options", () => {
    const resolved = mergeTheme(
      null,
      [
        { options: { actions: { export: true, source: false } } },
        { options: { actions: { editor: false }, renderer: "canvas" } },
      ],
      undefined,
    );
    expect(resolved.options).toEqual({
      actions: { export: true, source: false, editor: false },
      renderer: "canvas",
    });
  });

  it("replaces `loader` and `logger` as a whole", () => {
    const loaderA = { load: () => "a", options: { baseURL: "/a/" } };
    const loaderB = { baseURL: "/b/" };
    const resolved = mergeTheme(
      null,
      [
        { options: { loader: loaderA as never } },
        { options: { loader: loaderB } },
      ],
      undefined,
    );
    expect(resolved.options.loader).toBe(loaderB);

    const inherited = mergeTheme(
      null,
      { options: { loader: loaderA as never } },
      undefined,
    );
    expect(inherited.options.loader).toBe(loaderA);
  });
});

describe("applyTheme", () => {
  const theme: ResolvedVegaTheme = {
    config: { background: "white", axis: { labelColor: "black" } },
    options: { renderer: "svg", actions: false },
    variant: undefined,
  };

  it("returns the theme's config and options when the chart has none", () => {
    expect(applyTheme(theme)).toEqual({
      renderer: "svg",
      actions: false,
      config: { background: "white", axis: { labelColor: "black" } },
    });
  });

  it("lets the chart's own config and options win", () => {
    expect(
      applyTheme(theme, {
        renderer: "canvas",
        config: { axis: { labelColor: "red" } },
      }),
    ).toEqual({
      renderer: "canvas",
      actions: false,
      config: { background: "white", axis: { labelColor: "red" } },
    });
  });

  it("lets a config URL replace the theme config", () => {
    expect(applyTheme(theme, { config: "theme.json" }).config).toBe(
      "theme.json",
    );
  });

  it("does not mutate the theme or the chart options", () => {
    const options = { config: { axis: { grid: false } } };
    applyTheme(theme, options);
    expect(options).toEqual({ config: { axis: { grid: false } } });
    expect(theme.config).toEqual({
      background: "white",
      axis: { labelColor: "black" },
    });
  });
});
