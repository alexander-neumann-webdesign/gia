var Y = Object.defineProperty;
var K = (t, e, n) => e in t ? Y(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var S = (t, e, n) => K(t, typeof e != "symbol" ? e + "" : e, n);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (t, e = {}) => {
  if (typeof t != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", t);
    return;
  }
  const n = t.name;
  if (!n) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  e.priority !== void 0 && (t.O = e.priority), window.gia.components[n] = t;
});
class U {
  constructor() {
    S(this, "f", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(e, n) {
    this.f[e] = n;
  }
  get(e) {
    return this.f[e];
  }
}
const m = new U(), _ = /* @__PURE__ */ new WeakMap();
function G(t, e, n, r) {
  if (_.has(t))
    return console.warn(`Component "${e}" already exists.`), _.get(t);
  try {
    const o = new n(t, r);
    return m.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function Ie(t) {
  return typeof t == "string" && (t = document.getElementById(t), !t) ? null : _.get(t) || null;
}
function J(t, e = document) {
  return typeof t != "string" ? t : e.querySelector(t);
}
function E(t, e = document) {
  return typeof t != "string" ? t : e.querySelectorAll(t);
}
function Q(t, e, n = null) {
  n === null ? t.classList.toggle(e) : t.classList.toggle(e, !!n);
}
function L(t, e, n) {
  if (!t) return t;
  if (t.length !== void 0 && t.nodeType === void 0)
    for (let r = 0; r < t.length; r++)
      t[r].classList[n](e);
  else
    t.classList[n](e);
  return t;
}
function V(t, e) {
  return L(t, e, "remove");
}
function Z(t, e) {
  return L(t, e, "add");
}
function X(t, e, n = null, r = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  r.detail = n;
  const o = new CustomEvent(e, r);
  t.dispatchEvent(o);
}
function D(t, e) {
  let n, r = null, o = null;
  const s = () => {
    if (clearTimeout(n), r) {
      const f = o, u = r;
      o = null, r = null, t.apply(f, u);
    }
  }, i = function() {
    r = arguments, o = this, clearTimeout(n), n = setTimeout(s, e);
  };
  return i.cancel = function() {
    clearTimeout(n), r = null, o = null;
  }, i;
}
const Ee = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: Z,
  debounce: D,
  query: J,
  queryAll: E,
  removeClass: V,
  toggleClass: Q,
  triggerEvent: X
}, Symbol.toStringTag, { value: "Module" }));
function Ce(t = {}, e = document.documentElement) {
  if (!t) {
    console.warn("App has no components");
    return;
  }
  let n = !1;
  for (const f in t) {
    n = !0;
    break;
  }
  if (!n) {
    console.warn("App has no components");
    return;
  }
  const r = [], o = `${m.get("attrPrefix")}-component`, s = E(`[${o}]`, e), i = s.length;
  for (let f = 0; f < i; f++) {
    const u = s[f];
    if (!_.get(u)) {
      const c = u.getAttribute(o);
      typeof t[c] == "function" ? r.push(G(u, c, t[c])) : console.warn(`Constructor "${c}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !_.get(e)) {
    const u = e.getAttribute(o);
    typeof t[u] == "function" ? r.push(G(e, u, t[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  r.length > 1 && r.sort((f, u) => {
    if (!f) return 1;
    if (!u) return -1;
    const h = f.constructor.O ?? f.constructor.priority ?? 0;
    return (u.constructor.O ?? u.constructor.priority ?? 0) - h;
  });
  for (let f = 0; f < r.length; f++) {
    const u = r[f];
    u && u.x();
  }
}
function ee(t) {
  if (!t) return;
  let e = _.get(t);
  if (!e && typeof t == "string") {
    const n = document.getElementById(t);
    n && (e = _.get(n), t = n);
  }
  if (e) {
    const n = e.o || "Unknown";
    try {
      typeof e.N == "function" ? e.N() : e.unmount();
    } catch (r) {
      console.error(`Gia: Error unmounting component "${n}".`, r);
    }
    _.delete(t), e.element && (e.element = null), m.get("log") && console.info(`Removed component "${n}".`);
  }
}
function Pe(t = document.documentElement) {
  const e = E(`[${m.get("attrPrefix")}-component]`, t);
  for (let n = 0; n < e.length; n++)
    ee(e[n]);
}
const l = (typeof window < "u" ? window.v : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
l.tempReads || (l.tempReads = []);
l.tempWrites || (l.tempWrites = []);
l.wrapperPool || (l.wrapperPool = []);
typeof window < "u" && !window.v && (window.v = l);
function B(t, e) {
  let n = l.wrapperPool.pop();
  return n || (n = function() {
    n.fn.call(n.ctx);
  }, n.n = !0), n.fn = t, n.ctx = e, n;
}
function te() {
  l.scheduled = !1;
  const t = l.reads;
  l.currentReads = t, l.reads = l.tempReads;
  for (let n = 0; n < t.length; n++) {
    const r = t[n];
    if (r) {
      try {
        r();
      } catch (o) {
        console.error(o);
      }
      r.n && (r.fn = null, r.ctx = null, l.wrapperPool.push(r));
    }
  }
  t.length = 0, l.tempReads = t, l.currentReads = null;
  const e = l.writes;
  l.currentWrites = e, l.writes = l.tempWrites;
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (r) {
      try {
        r();
      } catch (o) {
        console.error(o);
      }
      r.n && (r.fn = null, r.ctx = null, l.wrapperPool.push(r));
    }
  }
  e.length = 0, l.tempWrites = e, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && R();
}
function R() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(te));
}
function Me(t, e) {
  const n = e ? B(t, e) : t;
  return l.reads.push(n), R(), n;
}
function ne(t, e) {
  const n = e ? B(t, e) : t;
  return l.writes.push(n), R(), n;
}
function Re(t) {
  let e = l.reads.indexOf(t);
  if (e > -1) {
    const n = l.reads[e];
    return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.reads[e] = null, !0;
  }
  for (let n = 0; n < l.reads.length; n++) {
    const r = l.reads[n];
    if (r && r.n && r.fn === t)
      return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.reads[n] = null, !0;
  }
  if (e = l.writes.indexOf(t), e > -1) {
    const n = l.writes[e];
    return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.writes[e] = null, !0;
  }
  for (let n = 0; n < l.writes.length; n++) {
    const r = l.writes[n];
    if (r && r.n && r.fn === t)
      return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.writes[n] = null, !0;
  }
  if (l.currentReads) {
    let n = l.currentReads.indexOf(t);
    if (n > -1) {
      const r = l.currentReads[n];
      return r && r.n && (r.fn = null, r.ctx = null, l.wrapperPool.push(r)), l.currentReads[n] = null, !0;
    }
    for (let r = 0; r < l.currentReads.length; r++) {
      const o = l.currentReads[r];
      if (o && o.n && o.fn === t)
        return o.fn = null, o.ctx = null, l.wrapperPool.push(o), l.currentReads[r] = null, !0;
    }
  }
  if (l.currentWrites) {
    let n = l.currentWrites.indexOf(t);
    if (n > -1) {
      const r = l.currentWrites[n];
      return r && r.n && (r.fn = null, r.ctx = null, l.wrapperPool.push(r)), l.currentWrites[n] = null, !0;
    }
    for (let r = 0; r < l.currentWrites.length; r++) {
      const o = l.currentWrites[r];
      if (o && o.n && o.fn === t)
        return o.fn = null, o.ctx = null, l.wrapperPool.push(o), l.currentWrites[r] = null, !0;
    }
  }
  return !1;
}
let C = !1;
const O = [], $ = /* @__PURE__ */ new Map();
function re() {
  C = !1;
  for (let t = 0; t < O.length; t++)
    O[t].b();
  O.length = 0;
}
function oe(t, e) {
  if (!(!t.element || !t.d || t.a) && e)
    for (const n in e) {
      if (!Object.prototype.hasOwnProperty.call(e, n)) continue;
      const r = e[n];
      if (t.m[n] !== r && (t.m[n] = r, t.p || (t.p = t.A || {}, t.u = t.y || {}, O.push(t), C || (C = !0, ne(re))), t.p[n] = r, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
        const o = typeof r;
        if (o === "boolean" || o === "string") {
          let s = $.get(n);
          s || (s = `data-${n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(n, s)), t.u[s] = o === "boolean" ? r ? "true" : "false" : r;
        }
      }
    }
}
function ie(t) {
  if (t.element) {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const n in t.u) {
        e = !0;
        break;
      }
      if (e)
        for (const n in t.u) {
          if (!Object.prototype.hasOwnProperty.call(t.u, n)) continue;
          const r = t.u[n];
          t.element.getAttribute(n) !== r && t.element.setAttribute(n, r);
        }
    }
    t.stateChange(t.p), t.A = t.p, t.y = t.u;
    for (const e in t.A)
      delete t.A[e];
    if (t.y)
      for (const e in t.y)
        delete t.y[e];
    t.p = null, t.u = null;
  }
}
function se(t) {
  t.p = null, t.u = null;
}
function le(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
  if (e && window[e] && !(window[e] instanceof Node) && !(window[e] instanceof HTMLCollection) && !(window[e] instanceof Window))
    return Promise.resolve(window[e]);
  const n = document.getElementById(t);
  return n ? n instanceof HTMLScriptElement ? n.i ? n.i : (n.i = new Promise((r, o) => {
    const s = () => {
      n.onload = null, n.onerror = null;
    };
    n.onload = () => {
      s(), r(e ? window[e] : !0);
    }, n.onerror = () => {
      s(), delete n.i, o(new Error(`Failed to load script: ${t}`));
    }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), o(new Error(`Script tag '${t}' has no src or data-src.`)));
  }), n.i) : Promise.reject(new Error(`Element with ID '${t}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${t}' not found.`));
}
function fe(t) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
  const e = document.getElementById(t);
  return e ? e instanceof HTMLLinkElement ? e.i ? e.i : (e.i = new Promise((n, r) => {
    const o = () => {
      e.onload = null, e.onerror = null;
    };
    if (e.onload = () => {
      o(), n(!0);
    }, e.onerror = () => {
      o(), delete e.i, r(new Error(`Failed to load style: ${t}`));
    }, !e.href && e.hasAttribute("data-href"))
      e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
    else if (!e.href && !e.hasAttribute("data-href"))
      o(), r(new Error(`Link tag '${t}' has no href or data-href.`));
    else if (e.href && !e.hasAttribute("data-href")) {
      let s = !1;
      for (let i = 0; i < document.styleSheets.length; i++)
        if (document.styleSheets[i].href === e.href) {
          s = !0;
          break;
        }
      s && (o(), n(!0));
    }
  }), e.i) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
}
let x = !1, N = !1;
const g = [], ue = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), j = ue ? "orientationchange" : "resize", w = [];
let y = null;
const P = { scroll: 0, velocity: 0 }, M = { width: 0, height: 0 }, v = [null], ce = function(t, e) {
  F(this, e);
}, he = function(t, e) {
  H(this, e);
};
function de() {
  for (let t = g.length - 1; t >= 0; t--)
    g[t](P);
}
function I(t) {
  let e, n;
  y ? (e = y.scroll, n = y.velocity) : t && typeof t.scroll == "number" ? (e = t.scroll, n = t.velocity || 0) : (e = window.scrollY || window.pageYOffset, n = 0), P.scroll = e, P.velocity = n, de();
}
function ae() {
  for (let t = w.length - 1; t >= 0; t--)
    w[t](M);
}
function k() {
  M.width = window.innerWidth, M.height = window.innerHeight, ae();
}
let A = null;
const b = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new Map();
function pe(t) {
  const e = t.root || null, n = t.rootMargin || "0px 0px 0px 0px", r = t.threshold || 0;
  let o = W.get(e);
  o || (o = /* @__PURE__ */ new Map(), W.set(e, o));
  let s = o.get(n);
  s || (s = /* @__PURE__ */ new Map(), o.set(n, s));
  let i = s;
  if (Array.isArray(r)) {
    let u = i.get("array");
    u || (u = /* @__PURE__ */ new Map(), i.set("array", u)), i = u;
    for (let h = 0; h < r.length; h++) {
      const c = r[h];
      let d = i.get(c);
      d || (d = /* @__PURE__ */ new Map(), i.set(c, d)), i = d;
    }
  } else {
    let u = i.get("number");
    u || (u = /* @__PURE__ */ new Map(), i.set("number", u)), i = u;
    let h = i.get(r);
    h || (h = /* @__PURE__ */ new Map(), i.set(r, h)), i = h;
  }
  let f = i.get("data");
  return f || (f = {
    observer: new IntersectionObserver((h) => {
      for (let c = 0; c < h.length; c++) {
        const d = h[c], p = f.callbacks.get(d.target);
        if (p) {
          v[0] = d;
          for (let a = p.length - 1; a >= 0; a--)
            p[a](v);
        }
      }
    }, t),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: i,
    elementsCount: 0
  }, i.set("data", f)), f;
}
function ge(t, e) {
  typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.lenis ? (y = window.lenis, y.on("scroll", I)) : window.addEventListener("scroll", I, { passive: !0 })), t.e || (t.e = []), t.e.indexOf(e) === -1 && t.e.push(e), g.indexOf(e) === -1 && g.push(e));
}
function q(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
  if (t && t.e) {
    const r = t.e.indexOf(e);
    r !== -1 && (t.e[r] = t.e[t.e.length - 1], t.e.pop());
  }
  const n = g.indexOf(e);
  n !== -1 && (g[n] = g[g.length - 1], g.pop()), g.length === 0 && x && (x = !1, y ? (y.off("scroll", I), y = null) : window.removeEventListener("scroll", I));
}
function we(t, e) {
  typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (N || (N = !0, window.addEventListener(j, k, { passive: !0 })), t.t || (t.t = []), t.t.indexOf(e) === -1 && t.t.push(e), w.indexOf(e) === -1 && w.push(e));
}
function T(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
  if (t && t.t) {
    const r = t.t.indexOf(e);
    r !== -1 && (t.t[r] = t.t[t.t.length - 1], t.t.pop());
  }
  const n = w.indexOf(e);
  n !== -1 && (w[n] = w[w.length - 1], w.pop()), w.length === 0 && N && (N = !1, window.removeEventListener(j, k));
}
function _e(t, e, n) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
  A || (A = new ResizeObserver((s) => {
    for (let i = 0; i < s.length; i++) {
      const f = s[i], u = b.get(f.target);
      if (u) {
        v[0] = f;
        for (let h = u.length - 1; h >= 0; h--)
          u[h](v);
      }
    }
  }));
  let r = b.get(e);
  r || (r = [], b.set(e, r), A.observe(e)), r.indexOf(n) === -1 && r.push(n), t.s || (t.s = /* @__PURE__ */ new Map());
  let o = t.s.get(e);
  o || (o = [], t.s.set(e, o)), o.indexOf(n) === -1 && o.push(n);
}
function F(t, e, n = null) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !t.s) return;
  const r = t.s.get(e);
  if (!r) return;
  if (n) {
    const s = r.indexOf(n);
    s !== -1 && (r[s] = r[r.length - 1], r.pop());
    const i = b.get(e);
    if (i) {
      const f = i.indexOf(n);
      f !== -1 && (i[f] = i[i.length - 1], i.pop());
    }
  } else {
    const s = b.get(e);
    if (s)
      for (let i = 0; i < r.length; i++) {
        const f = r[i], u = s.indexOf(f);
        u !== -1 && (s[u] = s[s.length - 1], s.pop());
      }
    r.length = 0;
  }
  r.length === 0 && t.s.delete(e);
  const o = b.get(e);
  o && o.length === 0 && (b.delete(e), A && A.unobserve(e));
}
function me(t, e, n, r = {}) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
  const o = pe(r);
  let s = o.callbacks.get(e);
  s || (s = [], o.callbacks.set(e, s), o.observer.observe(e), o.elementsCount++), s.indexOf(n) === -1 && s.push(n), t.r || (t.r = /* @__PURE__ */ new Map());
  let i = t.r.get(e);
  i || (i = /* @__PURE__ */ new Map(), t.r.set(e, i));
  let f = i.get(o);
  f || (f = [], i.set(o, f)), f.indexOf(n) === -1 && f.push(n);
}
function ye(t, e, n, r, o) {
  if (n) {
    const s = r.indexOf(n);
    if (s !== -1 && (r[s] = r[r.length - 1], r.pop(), o && o.callbacks.has(e))) {
      const i = o.callbacks.get(e), f = i.indexOf(n);
      f !== -1 && (i[f] = i[i.length - 1], i.pop());
    }
  } else {
    if (o && o.callbacks.has(e)) {
      const s = o.callbacks.get(e);
      for (let i = 0; i < r.length; i++) {
        const f = r[i], u = s.indexOf(f);
        u !== -1 && (s[u] = s[s.length - 1], s.pop());
      }
    }
    r.length = 0;
  }
  if (r.length === 0 && t.r.get(e).delete(o), o) {
    const s = o.callbacks.get(e);
    s && s.length === 0 && (o.callbacks.delete(e), o.observer.unobserve(e), o.elementsCount--), o.elementsCount === 0 && (o.observer.disconnect(), o.nodeMap && o.nodeMap.delete("data"));
  }
}
function H(t, e, n = null) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !t.r) return;
  const r = t.r.get(e);
  r && (r.forEach((o, s) => {
    ye(t, e, n, o, s);
  }), r.size === 0 && t.r.delete(e));
}
function be(t) {
  if (!(typeof __GIA_NANO__ < "u" && __GIA_NANO__)) {
    if (t.e) {
      for (let e = t.e.length - 1; e >= 0; e--)
        q(t, t.e[e]);
      t.e = null;
    }
    if (t.t) {
      for (let e = t.t.length - 1; e >= 0; e--)
        T(t, t.t[e]);
      t.t = null;
    }
    t.s && (t.s.forEach(ce, t), t.s = null), t.r && (t.r.forEach(he, t), t.r = null);
  }
}
const Ae = /* @__PURE__ */ new Set([
  "constructor",
  "require",
  "mount",
  "unmount",
  "getRef",
  "setState",
  "stateChange",
  "loadScript",
  "loadStyle",
  "signal",
  "isMounted",
  "observeScroll",
  "unobserveScroll",
  "observeWindowResize",
  "unobserveWindowResize",
  "observeResize",
  "unobserveResize",
  "observeIntersection",
  "unobserveIntersection"
]), z = /* @__PURE__ */ new WeakMap();
class Oe {
  constructor(e, n) {
    this.element = e, _.set(this.element, this), this.o = this.constructor.name, this.l = {}, this.f = n || {}, this.m = {}, this.d = !1, this.a = !1, this.h = null, this.g = null, this.b = this.b.bind(this), this.I();
  }
  get isMounted() {
    return this.d;
  }
  get signal() {
    if (!this.h) {
      const e = typeof window < "u" && window.AbortController || (typeof AbortController < "u" ? AbortController : null);
      e && (this.h = new e(), this.a && this.h.abort());
    }
    return this.h ? this.h.signal : null;
  }
  get ref() {
    return this.l;
  }
  set ref(e) {
    const n = m.get("attrPrefix"), r = `${n}-ref`, o = `${n}-component`, s = E(`[${r}]`, this.element), i = /* @__PURE__ */ Object.create(null), f = this.element.querySelector(`[${o}]`) !== null, u = `${this.o}:`;
    for (let c = 0; c < s.length; c++) {
      const d = s[c], p = d.getAttribute(r);
      if (!p || f && d.closest(`[${o}]`) !== this.element && !p.startsWith(u))
        continue;
      let a = i[p];
      a === void 0 && (a = [], i[p] = a), a.push(d);
    }
    let h = !0;
    for (const c in e) {
      h = !1;
      break;
    }
    if (h)
      for (const c in i) {
        const d = c.indexOf(":");
        if (d !== -1) {
          const p = c.substring(0, d), a = c.substring(d + 1);
          p === this.o && !this.l[a] && (this.l[a] = i[c]);
        } else
          this.l[c] || (this.l[c] = i[c]);
      }
    else {
      this.l = {};
      for (const c in e) {
        if (!Object.prototype.hasOwnProperty.call(e, c)) continue;
        const d = Array.isArray(e[c]);
        if (e[c] !== null && d && e[c].length > 0) {
          this.l[c] = e[c];
          continue;
        }
        const p = `${this.o}:${c}`;
        let a = i[p] || [];
        a.length === 0 && (a = i[c] || []), this.l[c] = d ? a : a[0] ?? null;
      }
    }
  }
  get options() {
    return this.f;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.f = { ...this.f, ...e };
      return;
    }
    const n = this.element.getAttribute(`${m.get("attrPrefix")}-options`);
    let r = {};
    if (n) {
      const o = n.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          r = JSON.parse(o);
        } catch (s) {
          console.error(`Failed to parse options for component "${this.o}": ${s.message}`);
        }
    }
    this.f = {
      ...this.f,
      ...e,
      ...r
    };
  }
  get state() {
    return this.m;
  }
  set state(e) {
    console.warn("Use setState instead."), this.m = e;
  }
  x() {
    this.element && !this.a && (this.d = !0, this.g = this.mount());
  }
  N() {
    if (this.d = !1, this.a = !0, this.h && this.h.abort(), typeof this.g == "function") {
      try {
        this.g();
      } catch (e) {
        console.error(`Gia: Error in mount cleanup for "${this.o}".`, e);
      }
      this.g = null;
    }
    try {
      this.unmount();
    } catch (e) {
      console.error(`Gia: Error in unmount for "${this.o}".`, e);
    }
    if (se(this), be(this), this._) {
      for (let e = 0; e < this._.length; e += 3)
        this._[e].removeEventListener(
          this._[e + 1],
          this[this._[e + 2]]
        );
      this._ = null;
    }
    this.l = null, this.element && (_.delete(this.element), this.element = null);
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, n = !1) {
    return `[${m.get("attrPrefix")}-ref="${n ? `${this.o}:` : ""}${e}"]`;
  }
  setState(e) {
    oe(this, e);
  }
  b() {
    ie(this);
  }
  stateChange(e) {
    return e;
  }
  observeScroll(e) {
    ge(this, e);
  }
  unobserveScroll(e) {
    q(this, e);
  }
  observeWindowResize(e) {
    we(this, e);
  }
  unobserveWindowResize(e) {
    T(this, e);
  }
  observeResize(e, n) {
    _e(this, e, n);
  }
  unobserveResize(e, n = null) {
    F(this, e, n);
  }
  observeIntersection(e, n, r = {}) {
    me(this, e, n, r);
  }
  unobserveIntersection(e, n = null) {
    H(this, e, n);
  }
  loadScript(e, n) {
    return le(e, n);
  }
  loadStyle(e) {
    return fe(e);
  }
  I() {
    var r;
    const e = Object.getPrototypeOf(this);
    let n = z.get(e);
    if (!n) {
      n = [];
      const o = Object.getOwnPropertyNames(e);
      for (let s = 0; s < o.length; s++) {
        const i = o[s];
        !Ae.has(i) && !i.startsWith("_") && typeof ((r = Object.getOwnPropertyDescriptor(e, i)) == null ? void 0 : r.value) == "function" && n.push(i);
      }
      z.set(e, n);
    }
    for (let o = 0; o < n.length; o++) {
      const s = n[o];
      this[s] = this[s].bind(this);
    }
  }
}
class Se extends Oe {
  async require() {
  }
  x() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => {
      this.element && !this.a && (this.d = !0, this.g = this.mount());
    }) : this.element && !this.a && (this.d = !0, this.g = this.mount());
  }
}
class xe {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null), this.c = /* @__PURE__ */ Object.create(null);
  }
  emit(e, n = {}) {
    m.get("log") && console.info(`Emitting event '${e}'`);
    const r = this.listeners[e];
    if (!r || r.length === 0) return;
    n && typeof n == "object" && (n.o = e), this.c[e] = (this.c[e] || 0) + 1;
    const o = r.length;
    try {
      for (let s = 0; s < o; s++) {
        const i = r[s];
        i && i(n);
      }
    } finally {
      if (this.c[e]--, this.c[e] === 0) {
        let s = 0;
        for (let i = 0; i < r.length; i++)
          r[i] !== null && (r[s++] = r[i]);
        r.length = s;
      }
    }
  }
  on(e, n, r = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let o = n;
    r && (o = (s) => {
      this.off(e, o), n(s);
    }, n.w || (n.w = /* @__PURE__ */ Object.create(null)), n.w[e] = o), this.listeners[e].push(o);
  }
  once(e, n) {
    this.on(e, n, !0);
  }
  off(e, n) {
    if (!n) {
      const i = this.listeners[e];
      if (i)
        if (this.c && this.c[e] > 0)
          for (let f = 0; f < i.length; f++)
            i[f] = null;
        else
          i.length = 0;
      return;
    }
    const r = this.listeners[e];
    if (!r) return;
    let o = n;
    n.w && n.w[e] ? (o = n.w[e], delete n.w[e]) : n.E && (o = n.E);
    const s = r.indexOf(o);
    s !== -1 && (this.c && this.c[e] > 0 ? r[s] = null : r.splice(s, 1));
  }
}
const Ge = new xe();
export {
  Oe as BaseComponent,
  Se as Component,
  Re as clear,
  m as config,
  G as createInstance,
  ee as destroyInstance,
  Ge as eventbus,
  Ie as getComponentFromElement,
  Ce as loadComponents,
  Me as measure,
  ne as mutate,
  Pe as removeComponents,
  Ee as utils
};
