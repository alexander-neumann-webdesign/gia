var H = Object.defineProperty;
var Y = (i, e, t) => e in i ? H(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var P = (i, e, t) => Y(i, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (i, e = {}) => {
  if (typeof i != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", i);
    return;
  }
  const t = i.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  e.priority !== void 0 && (i.p = e.priority), window.gia.components[t] = i;
});
class K {
  constructor() {
    P(this, "o", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(e, t) {
    this.o[e] = t;
  }
  get(e) {
    return this.o[e];
  }
}
const d = new K(), h = /* @__PURE__ */ new WeakMap();
function z(i, e, t, n) {
  if (h.has(i))
    return console.warn(`Component "${e}" already exists.`), h.get(i);
  try {
    const o = new t(i, n);
    return d.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function pe(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : h.get(i) || null;
}
function U(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function w(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function J(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function j(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function Q(i, e) {
  return j(i, e, "remove");
}
function V(i, e) {
  return j(i, e, "add");
}
function Z(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const o = new CustomEvent(e, n);
  i.dispatchEvent(o);
}
function X(i, e) {
  let t, n = null, o = null;
  const r = () => {
    if (clearTimeout(t), n) {
      const l = o, f = n;
      o = null, n = null, i.apply(l, f);
    }
  }, s = function() {
    n = arguments, o = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return s.cancel = function() {
    clearTimeout(t), n = null, o = null;
  }, s;
}
const _e = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: V,
  debounce: X,
  query: U,
  queryAll: w,
  removeClass: Q,
  toggleClass: J,
  triggerEvent: Z
}, Symbol.toStringTag, { value: "Module" }));
function D(i = {}, e = document.documentElement) {
  if (!i) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in i) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${d.get("attrPrefix")}-component`, r = w(`[${o}]`, e), s = r.length;
  for (let l = 0; l < s; l++) {
    const f = r[l];
    if (!h.get(f)) {
      const a = f.getAttribute(o);
      typeof i[a] == "function" ? n.push(z(f, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !h.get(e)) {
    const f = e.getAttribute(o);
    typeof i[f] == "function" ? n.push(z(e, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
  }
  n.length > 1 && n.sort((l, f) => {
    if (!l) return 1;
    if (!f) return -1;
    const c = l.constructor.p ?? l.constructor.priority ?? 0;
    return (f.constructor.p ?? f.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f._();
  }
}
function v(i) {
  if (!i) return;
  let e = h.get(i);
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = h.get(t), i = t);
  }
  if (e) {
    const t = e.f || "Unknown";
    try {
      typeof e.w == "function" ? e.w() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    h.delete(i), e.element && (e.element = null), d.get("log") && console.info(`Removed component "${t}".`);
  }
}
function we(i = document.documentElement) {
  const e = w(`[${d.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    v(e[t]);
}
let b = !1, y = !1;
const N = /* @__PURE__ */ new Set(), ee = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), L = ee ? "orientationchange" : "resize", E = /* @__PURE__ */ new Set();
let g = null;
const C = { scroll: 0, velocity: 0 }, M = { width: 0, height: 0 }, $ = [null], te = (i) => i(C), ne = (i) => i(M), q = (i) => i($), ie = function(i, e) {
  this.unobserveResize(e);
}, oe = function(i, e) {
  this.unobserveIntersection(e);
}, se = (i) => i.h();
let I = !1;
const S = /* @__PURE__ */ new Set();
function re() {
  I = !1, S.forEach(se), S.clear();
}
function le() {
  N.forEach(te);
}
function A(i) {
  let e, t;
  g ? (e = g.scroll, t = g.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), C.scroll = e, C.velocity = t, le();
}
function fe() {
  E.forEach(ne);
}
function x(i) {
  M.width = window.innerWidth, M.height = window.innerHeight, fe();
}
let m = null;
const p = /* @__PURE__ */ new WeakMap(), R = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), B = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new Map();
function ce(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = R.get(e);
  o || (o = /* @__PURE__ */ new Map(), R.set(e, o));
  let r = o.get(t);
  r || (r = /* @__PURE__ */ new Map(), o.set(t, r));
  let s = r;
  if (Array.isArray(n)) {
    let f = s.get("array");
    f || (f = /* @__PURE__ */ new Map(), s.set("array", f)), s = f;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let u = s.get(a);
      u || (u = /* @__PURE__ */ new Map(), s.set(a, u)), s = u;
    }
  } else {
    let f = s.get("number");
    f || (f = /* @__PURE__ */ new Map(), s.set("number", f)), s = f;
    let c = s.get(n);
    c || (c = /* @__PURE__ */ new Map(), s.set(n, c)), s = c;
  }
  let l = s.get("data");
  return l || (l = {
    observer: new IntersectionObserver((c) => {
      for (let a = 0; a < c.length; a++) {
        const u = c[a], k = l.callbacks.get(u.target);
        k && ($[0] = u, k.forEach(q));
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: s,
    elementsCount: 0
  }, s.set("data", l)), l;
}
let ae = class {
  constructor(e, t) {
    this.element = e, h.set(this.element, this), this.f = this.constructor.name, this.e = {}, this.o = t || {}, this.u = {}, this.h = this.h.bind(this), this.y(), d.get("autoBindActions") && this.A();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${d.get("attrPrefix")}-ref`, n = w(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const l = n[s], f = l.getAttribute(t);
      let c = o[f];
      c === void 0 && (c = [], o[f] = c), c.push(l);
    }
    let r = !0;
    for (const s in e) {
      r = !1;
      break;
    }
    if (r)
      for (const s in o) {
        const l = s.indexOf(":");
        if (l !== -1) {
          const f = s.substring(0, l), c = s.substring(l + 1);
          f === this.f && !this.e[c] && (this.e[c] = o[s]);
        } else
          this.e[s] || (this.e[s] = o[s]);
      }
    else {
      this.e = {};
      for (const s in e) {
        if (!Object.prototype.hasOwnProperty.call(e, s)) continue;
        const l = Array.isArray(e[s]);
        if (e[s] !== null && l && e[s].length > 0) {
          this.e[s] = e[s];
          continue;
        }
        const f = `${this.f}:${s}`;
        let c = o[f] || [];
        c.length === 0 && (c = o[s] || []), this.e[s] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.o;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.o = { ...this.o, ...e };
      return;
    }
    const t = this.element.getAttribute(`${d.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const o = t.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
        } catch (r) {
          console.error(`Failed to parse options for component "${this.f}": ${r.message}`);
        }
    }
    this.o = {
      ...this.o,
      ...e,
      ...n
    };
  }
  get state() {
    return this.u;
  }
  set state(e) {
    console.warn("Use setState instead."), this.u = e;
  }
  _() {
    this.mount();
  }
  w() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.e = null, this.element && (h.delete(this.element), this.element = null);
      return;
    }
    this.s && (this.s.forEach(this.unobserveScroll, this), this.s = null), this.r && (this.r.forEach(this.unobserveWindowResize, this), this.r = null), this.n && (this.n.forEach(ie, this), this.n = null), this.t && (this.t.forEach(oe, this), this.t = null), this.e = null, this.element && (h.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.lenis ? (g = window.lenis, g.on("scroll", A)) : window.addEventListener("scroll", A, { passive: !0 })), this.s || (this.s = /* @__PURE__ */ new Set()), this.s.add(e), N.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.s && this.s.delete(e), N.delete(e), N.size === 0 && b && (b = !1, g ? (g.off("scroll", A), g = null) : window.removeEventListener("scroll", A)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (y || (y = !0, window.addEventListener(L, x, { passive: !0 })), this.r || (this.r = /* @__PURE__ */ new Set()), this.r.add(e), E.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.r && this.r.delete(e), E.delete(e), E.size === 0 && y && (y = !1, window.removeEventListener(L, x)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    m || (m = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], f = p.get(l.target);
        f && ($[0] = l, f.forEach(q));
      }
    }));
    let n = p.get(e);
    n || (n = /* @__PURE__ */ new Set(), p.set(e, n), m.observe(e)), n.add(t), this.n || (this.n = /* @__PURE__ */ new Map());
    let o = this.n.get(e);
    o || (o = /* @__PURE__ */ new Set(), this.n.set(e, o)), o.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.n) return;
    const n = this.n.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const r = p.get(e);
      r && r.delete(t);
    } else {
      const r = p.get(e);
      r && n.forEach(Set.prototype.delete, r), n.clear();
    }
    n.size === 0 && this.n.delete(e);
    const o = p.get(e);
    o && o.size === 0 && (p.delete(e), m && m.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const o = ce(n);
    let r = o.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), o.callbacks.set(e, r), o.observer.observe(e), o.elementsCount++), r.add(t), this.t || (this.t = /* @__PURE__ */ new Map());
    let s = this.t.get(e);
    s || (s = /* @__PURE__ */ new Map(), this.t.set(e, s));
    let l = s.get(o);
    l || (l = /* @__PURE__ */ new Set(), s.set(o, l)), l.add(t);
  }
  N(e, t) {
    const n = this.m, o = this.b;
    if (o)
      e.has(o) && (e.delete(o), t && t.callbacks.has(n) && t.callbacks.get(n).delete(o));
    else {
      if (t && t.callbacks.has(n)) {
        const r = t.callbacks.get(n);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.t.get(n).delete(t), t) {
      const r = t.callbacks.get(n);
      r && r.size === 0 && (t.callbacks.delete(n), t.observer.unobserve(n), t.elementsCount--), t.elementsCount === 0 && (t.observer.disconnect(), t.nodeMap && t.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.t) return;
    const n = this.t.get(e);
    n && (this.m = e, this.b = t, n.forEach(this.N, this), this.m = null, this.b = null, n.size === 0 && this.t.delete(e));
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    if (t && window[t] && !(window[t] instanceof Node) && !(window[t] instanceof HTMLCollection) && !(window[t] instanceof Window))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? n.i ? n.i : (n.i = new Promise((o, r) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n.i, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.i) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    const t = document.getElementById(e);
    return t ? t instanceof HTMLLinkElement ? t.i ? t.i : (t.i = new Promise((n, o) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t.i, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let s = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
            s = !0;
            break;
          }
        s && (r(), n(!0));
      }
    }), t.i) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${d.get("attrPrefix")}-ref="${t ? `${this.f}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.u[t] !== n && (this.u[t] = n, this.a || (this.a = this.g || {}, this.l = this.d || {}, S.add(this), I || (I = !0, requestAnimationFrame(re))), this.a[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = W.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, W.set(t, r)), this.l[r] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  h() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.l) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.l) {
          if (!Object.prototype.hasOwnProperty.call(this.l, t)) continue;
          const n = this.l[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.a), this.g = this.a, this.d = this.l;
    for (const e in this.g)
      delete this.g[e];
    if (this.d)
      for (const e in this.d)
        delete this.d[e];
    this.a = null, this.l = null;
  }
  stateChange(e) {
    return e;
  }
  y() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = B.get(e);
    if (!t) {
      t = [];
      const o = Object.getOwnPropertyNames(e);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !T.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, s)) == null ? void 0 : n.value) == "function" && t.push(s);
      }
      B.set(e, t);
    }
    for (let o = 0; o < t.length; o++) {
      const r = t[o];
      this[r] = this[r].bind(this);
    }
  }
  A() {
    const e = w("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], r = o.getAttribute("data-action");
      if (!r) continue;
      let s = 0;
      for (; s < r.length; ) {
        let l = r.indexOf(" ", s);
        if (l === -1 && (l = r.length), l > s) {
          const f = r.substring(s, l), c = f.indexOf("->");
          let a, u;
          c !== -1 ? (a = f.substring(0, c), u = f.substring(c + 2)) : (a = f, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !T.has(u) ? o.addEventListener(a, this[u]) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        s = l + 1;
      }
    }
  }
};
class be extends ae {
  async require() {
  }
  _() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => this.mount()) : this.mount();
  }
}
class ue {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    d.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    t && typeof t == "object" && (t.f = e);
    const o = n.slice();
    for (let r = 0; r < o.length; r++)
      o[r](t);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let o = t;
    n && (o = (r) => {
      this.off(e, o), t(r);
    }, t.c || (t.c = /* @__PURE__ */ Object.create(null)), t.c[e] = o), this.listeners[e].push(o);
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    if (!t) {
      this.listeners[e] = [];
      return;
    }
    const n = this.listeners[e];
    if (!n) return;
    let o = t;
    t.c && t.c[e] ? (o = t.c[e], delete t.c[e]) : t.E && (o = t.E);
    const r = n.indexOf(o);
    r !== -1 && (r === n.length - 1 || (n[r] = n[n.length - 1]), n.pop());
  }
}
const ye = new ue();
let _ = null, G = null;
const O = /* @__PURE__ */ new Set(), de = (i) => {
  i.isConnected && D(G, i);
};
function he(i) {
  const e = `${d.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  O.clear();
  for (let n = 0; n < i.length; n++) {
    const o = i[n];
    for (let r = 0; r < o.removedNodes.length; r++) {
      const s = o.removedNodes[r];
      if (s.nodeType === Node.ELEMENT_NODE) {
        s.hasAttribute(e) && v(s);
        const l = w(`[${e}]`, s);
        for (let f = 0; f < l.length; f++)
          v(l[f]);
      }
    }
    o.addedNodes.length > 0 && o.target.nodeType === Node.ELEMENT_NODE && O.add(o.target);
  }
  G = t, O.forEach(de), G = null;
}
function F() {
  typeof document > "u" || (d.get("autoMountComponents") && !_ ? (_ = new MutationObserver(he), _.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !d.get("autoMountComponents") && _ && (_.disconnect(), _ = null));
}
{
  const i = d.set;
  d.set = function(e, t) {
    i.call(this, e, t), e === "autoMountComponents" && F();
  };
}
typeof window < "u" && setTimeout(F, 0);
export {
  ae as BaseComponent,
  be as Component,
  d as config,
  z as createInstance,
  v as destroyInstance,
  ye as eventbus,
  pe as getComponentFromElement,
  D as loadComponents,
  we as removeComponents,
  _e as utils
};
