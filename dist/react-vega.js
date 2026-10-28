import { jsx as O } from "react/jsx-runtime";
import u from "react";
import w from "vega-embed";
function V(r) {
  return r && r.__esModule && Object.prototype.hasOwnProperty.call(r, "default") ? r.default : r;
}
var d, h;
function D() {
  return h || (h = 1, d = function r(e, t) {
    if (e === t) return !0;
    if (e && t && typeof e == "object" && typeof t == "object") {
      if (e.constructor !== t.constructor) return !1;
      var n, o, c;
      if (Array.isArray(e)) {
        if (n = e.length, n != t.length) return !1;
        for (o = n; o-- !== 0; )
          if (!r(e[o], t[o])) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
      if (e.valueOf !== Object.prototype.valueOf) return e.valueOf() === t.valueOf();
      if (e.toString !== Object.prototype.toString) return e.toString() === t.toString();
      if (c = Object.keys(e), n = c.length, n !== Object.keys(t).length) return !1;
      for (o = n; o-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(t, c[o])) return !1;
      for (o = n; o-- !== 0; ) {
        var f = c[o];
        if (!r(e[f], t[f])) return !1;
      }
      return !0;
    }
    return e !== e && t !== t;
  }), d;
}
var P = D();
const v = /* @__PURE__ */ V(P), p = u.createContext(null);
p.displayName = "VegaThemeContext";
function E(r) {
  if (r === null || typeof r != "object") return !1;
  const e = Object.getPrototypeOf(r);
  return e === Object.prototype || e === null;
}
function j(r, e) {
  if (e === void 0) return r;
  if (!E(e)) return e;
  const t = E(r) ? { ...r } : {};
  for (const n of Object.keys(e))
    n !== "__proto__" && (t[n] = j(t[n], e[n]));
  return t;
}
function g(...r) {
  let e = {};
  for (const t of r)
    e = j(e, t);
  return e;
}
const q = ["loader", "logger"];
function R(...r) {
  const e = g(...r);
  for (const t of q) {
    let n;
    for (const o of r)
      o?.[t] !== void 0 && (n = o[t]);
    n !== void 0 && (e[t] = n);
  }
  return e;
}
function k(r, e) {
  const { variants: t } = r;
  return t && Object.prototype.hasOwnProperty.call(t, e) ? t[e] : void 0;
}
function T(r) {
  return (Array.isArray(r) ? r : [r]).filter((t) => !!t);
}
function _(r, e) {
  const t = [];
  for (const n of r)
    t.push(...n), e !== void 0 && t.push(...n.map((o) => k(o, e)));
  return {
    config: g(...t.map((n) => n?.config)),
    options: R(...t.map((n) => n?.options)),
    variant: e
  };
}
function C(r, e = {}) {
  const { config: t, ...n } = e;
  return {
    ...R(r.options, n),
    config: g(r.config, t)
  };
}
function S(r) {
  const [e, t] = u.useState(null), { ref: n, spec: o, onEmbed: c, onError: f } = r, s = u.useContext(p)?.theme, l = u.useMemo(
    () => s ? C(s, r.options) : r.options ?? {},
    [s, r.options]
  );
  return x(() => {
    let i = !1, a = null;
    return (async () => {
      if (!(!n.current || i))
        try {
          if (a = await w(n.current, o, l), i) {
            a.finalize();
            return;
          }
          t(a), c?.(a);
        } catch (y) {
          console.error(`[react-vega] Error creating view: ${y}`), f?.(y);
        }
    })(), () => {
      i = !0, a?.finalize();
    };
  }, [o, l]), e;
}
function x(r, e) {
  const t = u.useRef(null), n = u.useRef(0);
  (!t.current || !v(e, t.current)) && (n.current += 1), t.current = e, u.useEffect(r, [n.current]);
}
const M = u.forwardRef(
  (r, e) => {
    const { spec: t, options: n, onEmbed: o, onError: c, ...f } = r, s = u.useRef(null);
    return u.useImperativeHandle(e, () => {
      if (!s.current)
        throw new Error("VegaEmbed: ref is not attached to a div element");
      return s.current;
    }, []), S({
      ref: s,
      spec: t,
      onEmbed: o,
      onError: c,
      options: n
    }), /* @__PURE__ */ O("div", { ref: s, ...f });
  }
);
M.displayName = "VegaEmbed";
const b = "(prefers-color-scheme: dark)";
function A() {
  return typeof window < "u" && typeof window.matchMedia == "function" ? window.matchMedia(b) : null;
}
function z(r) {
  const e = u.useRef(null);
  r && !e.current && (e.current = A());
  const [, t] = u.useReducer((n) => n + 1, 0);
  return u.useEffect(() => {
    const n = e.current;
    if (!(!r || !n))
      return n.addEventListener("change", t), () => n.removeEventListener("change", t);
  }, [r]), r && e.current?.matches === !0;
}
function L(r) {
  const e = u.useRef(r);
  return v(e.current, r) || (e.current = r), e.current;
}
function Q(r) {
  const { theme: e, variant: t, inherit: n = !0, children: o } = r, c = u.useContext(p), f = z(t === "auto"), s = t === "auto" ? f ? "dark" : "light" : t ?? c?.theme.variant, l = L(T(e)), i = n ? c?.stack : void 0, a = u.useMemo(() => {
    const m = i ? [...i, l] : [l];
    return { stack: m, theme: _(m, s) };
  }, [i, l, s]);
  return /* @__PURE__ */ O(p.Provider, { value: a, children: o });
}
const N = Object.freeze({
  config: Object.freeze({}),
  options: Object.freeze({}),
  variant: void 0
});
function K() {
  return u.useContext(p)?.theme ?? N;
}
export {
  M as VegaEmbed,
  Q as VegaThemeProvider,
  S as useVegaEmbed,
  K as useVegaTheme
};
