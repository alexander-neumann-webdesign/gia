var D = Object.defineProperty;
var ee = (t, e, n) => e in t ? D(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var L = (t, e, n) => ee(t, typeof e != "symbol" ? e + "" : e, n);
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
class te {
  constructor() {
    L(this, "f", {
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
const g = new te(), b = /* @__PURE__ */ new WeakMap();
function B(t, e, n, o) {
  if (b.has(t))
    return console.warn(`Component "${e}" already exists.`), b.get(t);
  try {
    const r = new n(t, o);
    return g.get("log") && console.info(`Created instance of component "${e}".`), r;
  } catch (r) {
    return console.error(`Failed to create component "${e}".`, r), null;
  }
}
function We(t) {
  return typeof t == "string" && (t = document.getElementById(t), !t) ? null : b.get(t) || null;
}
function ne(t, e = document) {
  return typeof t != "string" ? t : e.querySelector(t);
}
function N(t, e = document) {
  return typeof t != "string" ? t : e.querySelectorAll(t);
}
function oe(t, e, n = null) {
  n === null ? t.classList.toggle(e) : t.classList.toggle(e, !!n);
}
function F(t, e, n) {
  if (!t) return t;
  if (t.length !== void 0 && t.nodeType === void 0)
    for (let o = 0; o < t.length; o++)
      t[o].classList[n](e);
  else
    t.classList[n](e);
  return t;
}
function re(t, e) {
  return F(t, e, "remove");
}
function ie(t, e) {
  return F(t, e, "add");
}
function se(t, e, n = null, o = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  o.detail = n;
  const r = new CustomEvent(e, o);
  t.dispatchEvent(r);
}
function le(t, e) {
  let n, o = null, r = null;
  const s = () => {
    if (clearTimeout(n), o) {
      const f = r, u = o;
      r = null, o = null, t.apply(f, u);
    }
  }, i = function() {
    o = arguments, r = this, clearTimeout(n), n = setTimeout(s, e);
  };
  return i.cancel = function() {
    clearTimeout(n), o = null, r = null;
  }, i;
}
const ze = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: ie,
  debounce: le,
  query: ne,
  queryAll: N,
  removeClass: re,
  toggleClass: oe,
  triggerEvent: se
}, Symbol.toStringTag, { value: "Module" }));
function fe(t = {}, e = document.documentElement) {
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
  const o = [], r = `${g.get("attrPrefix")}-component`, s = N(`[${r}]`, e), i = s.length;
  for (let f = 0; f < i; f++) {
    const u = s[f];
    if (!b.get(u)) {
      const c = u.getAttribute(r);
      typeof t[c] == "function" ? o.push(B(u, c, t[c])) : console.warn(`Constructor "${c}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(r) && !b.get(e)) {
    const u = e.getAttribute(r);
    typeof t[u] == "function" ? o.push(B(e, u, t[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  o.length > 1 && o.sort((f, u) => {
    if (!f) return 1;
    if (!u) return -1;
    const d = f.constructor.O ?? f.constructor.priority ?? 0;
    return (u.constructor.O ?? u.constructor.priority ?? 0) - d;
  });
  for (let f = 0; f < o.length; f++) {
    const u = o[f];
    u && u.N();
  }
}
function R(t) {
  if (!t) return;
  let e = b.get(t);
  if (!e && typeof t == "string") {
    const n = document.getElementById(t);
    n && (e = b.get(n), t = n);
  }
  if (e) {
    const n = e.r || "Unknown";
    try {
      typeof e.x == "function" ? e.x() : e.unmount();
    } catch (o) {
      console.error(`Gia: Error unmounting component "${n}".`, o);
    }
    b.delete(t), e.element && (e.element = null), g.get("log") && console.info(`Removed component "${n}".`);
  }
}
function Le(t = document.documentElement) {
  const e = N(`[${g.get("attrPrefix")}-component]`, t);
  for (let n = 0; n < e.length; n++)
    R(e[n]);
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
function H(t, e) {
  let n = l.wrapperPool.pop();
  return n || (n = function() {
    n.fn.call(n.ctx);
  }, n.n = !0), n.fn = t, n.ctx = e, n;
}
function ue() {
  l.scheduled = !1;
  const t = l.reads;
  l.currentReads = t, l.reads = l.tempReads;
  for (let n = 0; n < t.length; n++) {
    const o = t[n];
    if (o) {
      try {
        o();
      } catch (r) {
        console.error(r);
      }
      o.n && (o.fn = null, o.ctx = null, l.wrapperPool.push(o));
    }
  }
  t.length = 0, l.tempReads = t, l.currentReads = null;
  const e = l.writes;
  l.currentWrites = e, l.writes = l.tempWrites;
  for (let n = 0; n < e.length; n++) {
    const o = e[n];
    if (o) {
      try {
        o();
      } catch (r) {
        console.error(r);
      }
      o.n && (o.fn = null, o.ctx = null, l.wrapperPool.push(o));
    }
  }
  e.length = 0, l.tempWrites = e, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && z();
}
function z() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(ue));
}
function Be(t, e) {
  const n = e ? H(t, e) : t;
  return l.reads.push(n), z(), n;
}
function ce(t, e) {
  const n = e ? H(t, e) : t;
  return l.writes.push(n), z(), n;
}
function Te(t) {
  let e = l.reads.indexOf(t);
  if (e > -1) {
    const n = l.reads[e];
    return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.reads[e] = null, !0;
  }
  for (let n = 0; n < l.reads.length; n++) {
    const o = l.reads[n];
    if (o && o.n && o.fn === t)
      return o.fn = null, o.ctx = null, l.wrapperPool.push(o), l.reads[n] = null, !0;
  }
  if (e = l.writes.indexOf(t), e > -1) {
    const n = l.writes[e];
    return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.writes[e] = null, !0;
  }
  for (let n = 0; n < l.writes.length; n++) {
    const o = l.writes[n];
    if (o && o.n && o.fn === t)
      return o.fn = null, o.ctx = null, l.wrapperPool.push(o), l.writes[n] = null, !0;
  }
  if (l.currentReads) {
    let n = l.currentReads.indexOf(t);
    if (n > -1) {
      const o = l.currentReads[n];
      return o && o.n && (o.fn = null, o.ctx = null, l.wrapperPool.push(o)), l.currentReads[n] = null, !0;
    }
    for (let o = 0; o < l.currentReads.length; o++) {
      const r = l.currentReads[o];
      if (r && r.n && r.fn === t)
        return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.currentReads[o] = null, !0;
    }
  }
  if (l.currentWrites) {
    let n = l.currentWrites.indexOf(t);
    if (n > -1) {
      const o = l.currentWrites[n];
      return o && o.n && (o.fn = null, o.ctx = null, l.wrapperPool.push(o)), l.currentWrites[n] = null, !0;
    }
    for (let o = 0; o < l.currentWrites.length; o++) {
      const r = l.currentWrites[o];
      if (r && r.n && r.fn === t)
        return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.currentWrites[o] = null, !0;
    }
  }
  return !1;
}
let S = !1;
const E = [], T = /* @__PURE__ */ new Map();
function de() {
  S = !1;
  for (let t = 0; t < E.length; t++)
    E[t].y();
  E.length = 0;
}
function he(t, e) {
  if (!(!t.element || !t.a || t.p) && e)
    for (const n in e) {
      if (!Object.prototype.hasOwnProperty.call(e, n)) continue;
      const o = e[n];
      if (t.m[n] !== o && (t.m[n] = o, t.g || (t.g = t.A || {}, t.u = t.b || {}, E.push(t), S || (S = !0, ce(de))), t.g[n] = o, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
        const r = typeof o;
        if (r === "boolean" || r === "string") {
          let s = T.get(n);
          s || (s = `data-${n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, T.set(n, s)), t.u[s] = r === "boolean" ? o ? "true" : "false" : o;
        }
      }
    }
}
function ae(t) {
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
          const o = t.u[n];
          t.element.getAttribute(n) !== o && t.element.setAttribute(n, o);
        }
    }
    t.stateChange(t.g), t.A = t.g, t.b = t.u;
    for (const e in t.A)
      delete t.A[e];
    if (t.b)
      for (const e in t.b)
        delete t.b[e];
    t.g = null, t.u = null;
  }
}
function pe(t) {
  t.g = null, t.u = null;
}
function ge(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
  if (e && window[e] && !(window[e] instanceof Node) && !(window[e] instanceof HTMLCollection) && !(window[e] instanceof Window))
    return Promise.resolve(window[e]);
  const n = document.getElementById(t);
  return n ? n instanceof HTMLScriptElement ? n.i ? n.i : (n.i = new Promise((o, r) => {
    const s = () => {
      n.onload = null, n.onerror = null;
    };
    n.onload = () => {
      s(), o(e ? window[e] : !0);
    }, n.onerror = () => {
      s(), delete n.i, r(new Error(`Failed to load script: ${t}`));
    }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), r(new Error(`Script tag '${t}' has no src or data-src.`)));
  }), n.i) : Promise.reject(new Error(`Element with ID '${t}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${t}' not found.`));
}
function we(t) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
  const e = document.getElementById(t);
  return e ? e instanceof HTMLLinkElement ? e.i ? e.i : (e.i = new Promise((n, o) => {
    const r = () => {
      e.onload = null, e.onerror = null;
    };
    if (e.onload = () => {
      r(), n(!0);
    }, e.onerror = () => {
      r(), delete e.i, o(new Error(`Failed to load style: ${t}`));
    }, !e.href && e.hasAttribute("data-href"))
      e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
    else if (!e.href && !e.hasAttribute("data-href"))
      r(), o(new Error(`Link tag '${t}' has no href or data-href.`));
    else if (e.href && !e.hasAttribute("data-href")) {
      let s = !1;
      for (let i = 0; i < document.styleSheets.length; i++)
        if (document.styleSheets[i].href === e.href) {
          s = !0;
          break;
        }
      s && (r(), n(!0));
    }
  }), e.i) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
}
function _e(t, e) {
  const n = `${g.get("attrPrefix")}-component`, o = t.element.querySelector(`[${n}]`) !== null, r = N("[data-action]", t.element), s = r.length;
  for (let i = 0; i < s; i++) {
    const f = r[i];
    if (o && f.closest(`[${n}]`) !== t.element)
      continue;
    const u = f.getAttribute("data-action");
    if (!u) continue;
    let d = 0;
    for (; d < u.length; ) {
      let c = u.indexOf(" ", d);
      if (c === -1 && (c = u.length), c > d) {
        const h = u.substring(d, c), p = h.indexOf("->");
        let a, w;
        if (p !== -1 ? (a = h.substring(0, p), w = h.substring(p + 2)) : (a = h, w = void 0), t[w] && typeof t[w] == "function" && !w.startsWith("_") && !e.has(w)) {
          const X = t.signal ? { signal: t.signal } : void 0;
          f.addEventListener(a, t[w], X), t.c || (t.c = []), t.c.push(f, a, w);
        } else
          console.warn(`Method "${w}" not found, is restricted, or is not a function in component.`);
      }
      d = c + 1;
    }
  }
}
let I = !1, C = !1;
const _ = [], me = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), Y = me ? "orientationchange" : "resize", m = [];
let y = null;
const $ = { scroll: 0, velocity: 0 }, G = { width: 0, height: 0 }, M = [null], be = function(t, e) {
  Q(this, e);
}, ye = function(t, e) {
  V(this, e);
};
function Ae() {
  for (let t = _.length - 1; t >= 0; t--)
    _[t]($);
}
function P(t) {
  let e, n;
  y ? (e = y.scroll, n = y.velocity) : t && typeof t.scroll == "number" ? (e = t.scroll, n = t.velocity || 0) : (e = window.scrollY || window.pageYOffset, n = 0), $.scroll = e, $.velocity = n, Ae();
}
function Oe() {
  for (let t = m.length - 1; t >= 0; t--)
    m[t](G);
}
function K() {
  G.width = window.innerWidth, G.height = window.innerHeight, Oe();
}
let v = null;
const A = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new Map();
function Ne(t) {
  const e = t.root || null, n = t.rootMargin || "0px 0px 0px 0px", o = t.threshold || 0;
  let r = j.get(e);
  r || (r = /* @__PURE__ */ new Map(), j.set(e, r));
  let s = r.get(n);
  s || (s = /* @__PURE__ */ new Map(), r.set(n, s));
  let i = s;
  if (Array.isArray(o)) {
    let u = i.get("array");
    u || (u = /* @__PURE__ */ new Map(), i.set("array", u)), i = u;
    for (let d = 0; d < o.length; d++) {
      const c = o[d];
      let h = i.get(c);
      h || (h = /* @__PURE__ */ new Map(), i.set(c, h)), i = h;
    }
  } else {
    let u = i.get("number");
    u || (u = /* @__PURE__ */ new Map(), i.set("number", u)), i = u;
    let d = i.get(o);
    d || (d = /* @__PURE__ */ new Map(), i.set(o, d)), i = d;
  }
  let f = i.get("data");
  return f || (f = {
    observer: new IntersectionObserver((d) => {
      for (let c = 0; c < d.length; c++) {
        const h = d[c], p = f.callbacks.get(h.target);
        if (p) {
          M[0] = h;
          for (let a = p.length - 1; a >= 0; a--)
            p[a](M);
        }
      }
    }, t),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: i,
    elementsCount: 0
  }, i.set("data", f)), f;
}
function xe(t, e) {
  typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (I || (I = !0, window.lenis ? (y = window.lenis, y.on("scroll", P)) : window.addEventListener("scroll", P, { passive: !0 })), t.e || (t.e = []), t.e.indexOf(e) === -1 && t.e.push(e), _.indexOf(e) === -1 && _.push(e));
}
function U(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
  if (t && t.e) {
    const o = t.e.indexOf(e);
    o !== -1 && (t.e[o] = t.e[t.e.length - 1], t.e.pop());
  }
  const n = _.indexOf(e);
  n !== -1 && (_[n] = _[_.length - 1], _.pop()), _.length === 0 && I && (I = !1, y ? (y.off("scroll", P), y = null) : window.removeEventListener("scroll", P));
}
function ve(t, e) {
  typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (C || (C = !0, window.addEventListener(Y, K, { passive: !0 })), t.t || (t.t = []), t.t.indexOf(e) === -1 && t.t.push(e), m.indexOf(e) === -1 && m.push(e));
}
function J(t, e) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
  if (t && t.t) {
    const o = t.t.indexOf(e);
    o !== -1 && (t.t[o] = t.t[t.t.length - 1], t.t.pop());
  }
  const n = m.indexOf(e);
  n !== -1 && (m[n] = m[m.length - 1], m.pop()), m.length === 0 && C && (C = !1, window.removeEventListener(Y, K));
}
function Ee(t, e, n) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
  v || (v = new ResizeObserver((s) => {
    for (let i = 0; i < s.length; i++) {
      const f = s[i], u = A.get(f.target);
      if (u) {
        M[0] = f;
        for (let d = u.length - 1; d >= 0; d--)
          u[d](M);
      }
    }
  }));
  let o = A.get(e);
  o || (o = [], A.set(e, o), v.observe(e)), o.indexOf(n) === -1 && o.push(n), t.s || (t.s = /* @__PURE__ */ new Map());
  let r = t.s.get(e);
  r || (r = [], t.s.set(e, r)), r.indexOf(n) === -1 && r.push(n);
}
function Q(t, e, n = null) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !t.s) return;
  const o = t.s.get(e);
  if (!o) return;
  if (n) {
    const s = o.indexOf(n);
    s !== -1 && (o[s] = o[o.length - 1], o.pop());
    const i = A.get(e);
    if (i) {
      const f = i.indexOf(n);
      f !== -1 && (i[f] = i[i.length - 1], i.pop());
    }
  } else {
    const s = A.get(e);
    if (s)
      for (let i = 0; i < o.length; i++) {
        const f = o[i], u = s.indexOf(f);
        u !== -1 && (s[u] = s[s.length - 1], s.pop());
      }
    o.length = 0;
  }
  o.length === 0 && t.s.delete(e);
  const r = A.get(e);
  r && r.length === 0 && (A.delete(e), v && v.unobserve(e));
}
function Ie(t, e, n, o = {}) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
  const r = Ne(o);
  let s = r.callbacks.get(e);
  s || (s = [], r.callbacks.set(e, s), r.observer.observe(e), r.elementsCount++), s.indexOf(n) === -1 && s.push(n), t.o || (t.o = /* @__PURE__ */ new Map());
  let i = t.o.get(e);
  i || (i = /* @__PURE__ */ new Map(), t.o.set(e, i));
  let f = i.get(r);
  f || (f = [], i.set(r, f)), f.indexOf(n) === -1 && f.push(n);
}
function Ce(t, e, n, o, r) {
  if (n) {
    const s = o.indexOf(n);
    if (s !== -1 && (o[s] = o[o.length - 1], o.pop(), r && r.callbacks.has(e))) {
      const i = r.callbacks.get(e), f = i.indexOf(n);
      f !== -1 && (i[f] = i[i.length - 1], i.pop());
    }
  } else {
    if (r && r.callbacks.has(e)) {
      const s = r.callbacks.get(e);
      for (let i = 0; i < o.length; i++) {
        const f = o[i], u = s.indexOf(f);
        u !== -1 && (s[u] = s[s.length - 1], s.pop());
      }
    }
    o.length = 0;
  }
  if (o.length === 0 && t.o.get(e).delete(r), r) {
    const s = r.callbacks.get(e);
    s && s.length === 0 && (r.callbacks.delete(e), r.observer.unobserve(e), r.elementsCount--), r.elementsCount === 0 && (r.observer.disconnect(), r.nodeMap && r.nodeMap.delete("data"));
  }
}
function V(t, e, n = null) {
  if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !t.o) return;
  const o = t.o.get(e);
  o && (o.forEach((r, s) => {
    Ce(t, e, n, r, s);
  }), o.size === 0 && t.o.delete(e));
}
function Me(t) {
  if (!(typeof __GIA_NANO__ < "u" && __GIA_NANO__)) {
    if (t.e) {
      for (let e = t.e.length - 1; e >= 0; e--)
        U(t, t.e[e]);
      t.e = null;
    }
    if (t.t) {
      for (let e = t.t.length - 1; e >= 0; e--)
        J(t, t.t[e]);
      t.t = null;
    }
    t.s && (t.s.forEach(be, t), t.s = null), t.o && (t.o.forEach(ye, t), t.o = null);
  }
}
const q = /* @__PURE__ */ new Set([
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
]), k = /* @__PURE__ */ new WeakMap();
class Pe {
  constructor(e, n) {
    this.element = e, b.set(this.element, this), this.r = this.constructor.name, this.l = {}, this.f = n || {}, this.m = {}, this.a = !1, this.p = !1, this.h = null, this.w = null, this.y = this.y.bind(this), this.E(), g.get("autoBindActions") && _e(this, q);
  }
  get isMounted() {
    return this.a;
  }
  get signal() {
    if (!this.h) {
      const e = typeof window < "u" && window.AbortController || (typeof AbortController < "u" ? AbortController : null);
      e && (this.h = new e(), this.p && this.h.abort());
    }
    return this.h ? this.h.signal : null;
  }
  get ref() {
    return this.l;
  }
  set ref(e) {
    const n = g.get("attrPrefix"), o = `${n}-ref`, r = `${n}-component`, s = N(`[${o}]`, this.element), i = /* @__PURE__ */ Object.create(null), f = this.element.querySelector(`[${r}]`) !== null, u = `${this.r}:`;
    for (let c = 0; c < s.length; c++) {
      const h = s[c], p = h.getAttribute(o);
      if (!p || f && h.closest(`[${r}]`) !== this.element && !p.startsWith(u))
        continue;
      let a = i[p];
      a === void 0 && (a = [], i[p] = a), a.push(h);
    }
    let d = !0;
    for (const c in e) {
      d = !1;
      break;
    }
    if (d)
      for (const c in i) {
        const h = c.indexOf(":");
        if (h !== -1) {
          const p = c.substring(0, h), a = c.substring(h + 1);
          p === this.r && !this.l[a] && (this.l[a] = i[c]);
        } else
          this.l[c] || (this.l[c] = i[c]);
      }
    else {
      this.l = {};
      for (const c in e) {
        if (!Object.prototype.hasOwnProperty.call(e, c)) continue;
        const h = Array.isArray(e[c]);
        if (e[c] !== null && h && e[c].length > 0) {
          this.l[c] = e[c];
          continue;
        }
        const p = `${this.r}:${c}`;
        let a = i[p] || [];
        a.length === 0 && (a = i[c] || []), this.l[c] = h ? a : a[0] ?? null;
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
    const n = this.element.getAttribute(`${g.get("attrPrefix")}-options`);
    let o = {};
    if (n) {
      const r = n.trim();
      if (r.startsWith("{") || r.startsWith("["))
        try {
          o = JSON.parse(r);
        } catch (s) {
          console.error(`Failed to parse options for component "${this.r}": ${s.message}`);
        }
    }
    this.f = {
      ...this.f,
      ...e,
      ...o
    };
  }
  get state() {
    return this.m;
  }
  set state(e) {
    console.warn("Use setState instead."), this.m = e;
  }
  N() {
    this.element && !this.p && (this.a = !0, this.w = this.mount());
  }
  x() {
    if (this.a = !1, this.p = !0, this.h && this.h.abort(), typeof this.w == "function") {
      try {
        this.w();
      } catch (e) {
        console.error(`Gia: Error in mount cleanup for "${this.r}".`, e);
      }
      this.w = null;
    }
    try {
      this.unmount();
    } catch (e) {
      console.error(`Gia: Error in unmount for "${this.r}".`, e);
    }
    if (pe(this), Me(this), this.c) {
      for (let e = 0; e < this.c.length; e += 3)
        this.c[e].removeEventListener(
          this.c[e + 1],
          this[this.c[e + 2]]
        );
      this.c = null;
    }
    this.l = null, this.element && (b.delete(this.element), this.element = null);
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, n = !1) {
    return `[${g.get("attrPrefix")}-ref="${n ? `${this.r}:` : ""}${e}"]`;
  }
  setState(e) {
    he(this, e);
  }
  y() {
    ae(this);
  }
  stateChange(e) {
    return e;
  }
  observeScroll(e) {
    xe(this, e);
  }
  unobserveScroll(e) {
    U(this, e);
  }
  observeWindowResize(e) {
    ve(this, e);
  }
  unobserveWindowResize(e) {
    J(this, e);
  }
  observeResize(e, n) {
    Ee(this, e, n);
  }
  unobserveResize(e, n = null) {
    Q(this, e, n);
  }
  observeIntersection(e, n, o = {}) {
    Ie(this, e, n, o);
  }
  unobserveIntersection(e, n = null) {
    V(this, e, n);
  }
  loadScript(e, n) {
    return ge(e, n);
  }
  loadStyle(e) {
    return we(e);
  }
  E() {
    var o;
    const e = Object.getPrototypeOf(this);
    let n = k.get(e);
    if (!n) {
      n = [];
      const r = Object.getOwnPropertyNames(e);
      for (let s = 0; s < r.length; s++) {
        const i = r[s];
        !q.has(i) && !i.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, i)) == null ? void 0 : o.value) == "function" && n.push(i);
      }
      k.set(e, n);
    }
    for (let r = 0; r < n.length; r++) {
      const s = n[r];
      this[s] = this[s].bind(this);
    }
  }
}
class je extends Pe {
  async require() {
  }
  N() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => {
      this.element && !this.p && (this.a = !0, this.w = this.mount());
    }) : this.element && !this.p && (this.a = !0, this.w = this.mount());
  }
}
class Re {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null), this.d = /* @__PURE__ */ Object.create(null);
  }
  emit(e, n = {}) {
    g.get("log") && console.info(`Emitting event '${e}'`);
    const o = this.listeners[e];
    if (!o || o.length === 0) return;
    n && typeof n == "object" && (n.r = e), this.d[e] = (this.d[e] || 0) + 1;
    const r = o.length;
    try {
      for (let s = 0; s < r; s++) {
        const i = o[s];
        i && i(n);
      }
    } finally {
      if (this.d[e]--, this.d[e] === 0) {
        let s = 0;
        for (let i = 0; i < o.length; i++)
          o[i] !== null && (o[s++] = o[i]);
        o.length = s;
      }
    }
  }
  on(e, n, o = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let r = n;
    o && (r = (s) => {
      this.off(e, r), n(s);
    }, n._ || (n._ = /* @__PURE__ */ Object.create(null)), n._[e] = r), this.listeners[e].push(r);
  }
  once(e, n) {
    this.on(e, n, !0);
  }
  off(e, n) {
    if (!n) {
      const i = this.listeners[e];
      if (i)
        if (this.d && this.d[e] > 0)
          for (let f = 0; f < i.length; f++)
            i[f] = null;
        else
          i.length = 0;
      return;
    }
    const o = this.listeners[e];
    if (!o) return;
    let r = n;
    n._ && n._[e] ? (r = n._[e], delete n._[e]) : n.I && (r = n.I);
    const s = o.indexOf(r);
    s !== -1 && (this.d && this.d[e] > 0 ? o[s] = null : o.splice(s, 1));
  }
}
const qe = new Re();
let O = null, W = null;
const x = [], Se = (t) => {
  t.isConnected && fe(W, t);
};
function $e(t) {
  const e = `${g.get("attrPrefix")}-component`, n = typeof window < "u" && window.gia ? window.gia.components : {};
  x.length = 0;
  for (let o = 0; o < t.length; o++) {
    const r = t[o];
    for (let s = 0; s < r.removedNodes.length; s++) {
      const i = r.removedNodes[s];
      if (i.nodeType === Node.ELEMENT_NODE) {
        i.hasAttribute(e) && R(i);
        const f = N(`[${e}]`, i);
        for (let u = 0; u < f.length; u++)
          R(f[u]);
      }
    }
    if (r.addedNodes.length > 0)
      for (let s = 0; s < r.addedNodes.length; s++) {
        const i = r.addedNodes[s];
        i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) || i.querySelector(`[${e}]`)) && x.indexOf(i) === -1 && x.push(i);
      }
  }
  W = n;
  for (let o = 0; o < x.length; o++)
    Se(x[o]);
  W = null;
}
function Z() {
  typeof document > "u" || (g.get("autoMountComponents") && !O ? (O = new MutationObserver($e), O.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !g.get("autoMountComponents") && O && (O.disconnect(), O = null));
}
{
  const t = g.set;
  g.set = function(e, n) {
    t.call(this, e, n), e === "autoMountComponents" && Z();
  };
}
typeof window < "u" && setTimeout(Z, 0);
export {
  Pe as BaseComponent,
  je as Component,
  Te as clear,
  g as config,
  B as createInstance,
  R as destroyInstance,
  qe as eventbus,
  We as getComponentFromElement,
  fe as loadComponents,
  Be as measure,
  ce as mutate,
  Le as removeComponents,
  ze as utils
};
