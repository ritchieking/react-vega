/** A plain number, optionally in px, as `getPropertyValue` returns it. */
const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)(?:px)?$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Index of the `)` that closes the `(` at `open`, or -1. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/** Index of the first comma outside parentheses, or -1. */
function topLevelComma(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) return i;
  }
  return -1;
}

function substitute(text: string, style: CSSStyleDeclaration): string {
  let result = "";
  let index = 0;
  while (index < text.length) {
    const start = text.indexOf("var(", index);
    const close = start < 0 ? -1 : closingParen(text, start + 3);
    if (close < 0) return result + text.slice(index);

    const inner = text.slice(start + 4, close);
    const comma = topLevelComma(inner);
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
    const fallback = comma < 0 ? "" : inner.slice(comma + 1).trim();
    const value = name.startsWith("--")
      ? style.getPropertyValue(name).trim()
      : "";

    result += text.slice(index, start);
    if (value) result += value;
    else if (fallback) result += substitute(fallback, style);
    else result += text.slice(start, close + 1);
    index = close + 1;
  }
  return result;
}

function resolveString(text: string, style: CSSStyleDeclaration) {
  if (!text.includes("var(")) return text;
  const resolved = substitute(text, style);
  const trimmed = text.trim();
  const isSingleVar =
    trimmed.startsWith("var(") &&
    closingParen(trimmed, 3) === trimmed.length - 1;
  return isSingleVar && NUMBER.test(resolved.trim())
    ? parseFloat(resolved)
    : resolved;
}

function walk(value: unknown, style: CSSStyleDeclaration): unknown {
  if (typeof value === "string") return resolveString(value, style);
  if (Array.isArray(value)) return value.map((item) => walk(item, style));
  if (!isPlainObject(value)) return value;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (key !== "__proto__") result[key] = walk(value[key], style);
  }
  return result;
}

/**
 * Replaces CSS custom property references such as `"var(--brand)"` or
 * `"var(--brand, #333)"` in a theme or config with their computed values.
 * Vega draws to canvas or SVG attributes, where `var()` doesn't resolve, so
 * design tokens have to be turned into concrete values first.
 *
 * Values are read from `getComputedStyle(element ?? document.documentElement)`.
 * A string that is a single `var()` resolving to a number (optionally in px)
 * becomes a number, so `fontSize: "var(--chart-font-size)"` works. An unset
 * property falls back to the `var()` fallback, and without one the reference
 * is left as it is. Plain objects and arrays are copied, never mutated.
 * Without a DOM (server rendering), the input is returned unchanged.
 */
export function resolveCssVariables<T>(value: T, element?: Element): T {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function")
    return value;
  const style = getComputedStyle(element ?? document.documentElement);
  return walk(value, style) as T;
}
