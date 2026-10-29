import { type VisualizationSpec } from "vega-embed";

export const BasicSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  data: {
    values: [
      { a: "A", b: 28 },
      { a: "B", b: 55 },
      { a: "C", b: 43 },
      { a: "D", b: 91 },
      { a: "E", b: 81 },
      { a: "F", b: 53 },
      { a: "G", b: 19 },
      { a: "H", b: 87 },
      { a: "I", b: 52 },
    ],
  },
  params: [{ name: "selection", select: { type: "point", fields: ["a"] } }],
  mark: "bar",
  encoding: {
    x: { field: "a", type: "ordinal" },
    y: { field: "b", type: "quantitative" },
    tooltip: { field: "b", type: "quantitative" },
    color: {
      condition: { param: "selection", value: "steelblue" },
      value: "grey",
    },
  },
};

/** BasicSpec without hard-coded colors, so the theme's mark color shows. */
export const ThemeableBarSpec: VisualizationSpec = {
  ...BasicSpec,
  title: "Revenue by region",
  encoding: {
    x: { field: "a", type: "ordinal", title: "Region" },
    y: { field: "b", type: "quantitative", title: "Revenue ($k)" },
    tooltip: { field: "b", type: "quantitative" },
    opacity: {
      condition: { param: "selection", value: 1 },
      value: 0.35,
    },
  },
} as VisualizationSpec;

export const LineSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  title: "Weekly active users",
  width: 220,
  height: 140,
  data: {
    values: [
      { week: 1, users: 120, plan: "Free" },
      { week: 2, users: 150, plan: "Free" },
      { week: 3, users: 140, plan: "Free" },
      { week: 4, users: 190, plan: "Free" },
      { week: 5, users: 230, plan: "Free" },
      { week: 6, users: 270, plan: "Free" },
      { week: 1, users: 40, plan: "Pro" },
      { week: 2, users: 55, plan: "Pro" },
      { week: 3, users: 80, plan: "Pro" },
      { week: 4, users: 85, plan: "Pro" },
      { week: 5, users: 120, plan: "Pro" },
      { week: 6, users: 160, plan: "Pro" },
    ],
  },
  mark: { type: "line", point: true },
  encoding: {
    x: { field: "week", type: "quantitative", title: "Week" },
    y: { field: "users", type: "quantitative", title: "Users" },
    color: { field: "plan", type: "nominal", title: "Plan" },
  },
};

export const ScatterSpec: VisualizationSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v6.json",
  title: "Price vs. rating",
  width: 220,
  height: 140,
  data: {
    values: [
      { price: 12, rating: 3.1, kind: "A" },
      { price: 18, rating: 3.6, kind: "A" },
      { price: 25, rating: 3.9, kind: "A" },
      { price: 31, rating: 4.2, kind: "A" },
      { price: 15, rating: 2.8, kind: "B" },
      { price: 22, rating: 3.3, kind: "B" },
      { price: 35, rating: 3.5, kind: "B" },
      { price: 42, rating: 4.4, kind: "B" },
      { price: 28, rating: 4.7, kind: "C" },
      { price: 38, rating: 4.1, kind: "C" },
      { price: 45, rating: 4.8, kind: "C" },
      { price: 20, rating: 4.0, kind: "C" },
    ],
  },
  mark: { type: "point", filled: true, size: 70 },
  encoding: {
    x: { field: "price", type: "quantitative", title: "Price ($)" },
    y: {
      field: "rating",
      type: "quantitative",
      title: "Rating",
      scale: { zero: false },
    },
    color: { field: "kind", type: "nominal", title: "Kind" },
  },
};
