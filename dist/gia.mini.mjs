var j = Object.defineProperty;
var B = (i, e, t) => e in i ? j(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var G = (i, e, t) => B(i, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (i) => {
  if (typeof i != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", i);
    return;
  }
  const e = i.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = i;
});
class T {
  constructor() {
    G(this, "i", {
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
    this.i[e] = t;
  }
  get(e) {
    return this.i[e];
  }
}
const u = new T();
function z(i, e, t, n) {
  if (i.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), i.__gia_component__;
  try {
    const o = new t(i, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function ae(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
function q(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function y(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function W(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function x(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function D(i, e) {
  return x(i, e, "remove");
}
function F(i, e) {
  return x(i, e, "add");
}
function H(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const o = new CustomEvent(e, n);
  i.dispatchEvent(o);
}
function Y(i, e) {
  let t, n = null, o = null;
  const s = () => {
    if (clearTimeout(t), n) {
      const l = o, a = n;
      o = null, n = null, i.apply(l, a);
    }
  }, r = function() {
    n = arguments, o = this, clearTimeout(t), t = setTimeout(s, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null, o = null;
  }, r;
}
const ce = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: F,
  debounce: Y,
  query: q,
  queryAll: y,
  removeClass: D,
  toggleClass: W,
  triggerEvent: H
}, Symbol.toStringTag, { value: "Module" }));
function fe(i = {}, e = document.documentElement) {
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
  const n = [], o = `${u.get("attrPrefix")}-component`, s = y(`[${o}]`, e), r = s.length;
  for (let l = 0; l < r; l++) {
    const a = s[l];
    if (!a.__gia_component__) {
      const h = a.getAttribute(o);
      typeof i[h] == "function" ? n.push(z(a, h, i[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const a = e.getAttribute(o);
    typeof i[a] == "function" ? n.push(z(e, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l].g();
}
function K(i) {
  if (!i) return;
  let e = i.__gia_component__;
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = t.__gia_component__, i = t);
  }
  if (e) {
    const t = e.r || "Unknown";
    try {
      typeof e.p == "function" ? e.p() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    i.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ue(i = document.documentElement) {
  const e = y(`[${u.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    K(e[t]);
}
let g = !1, p = !1;
const m = /* @__PURE__ */ new Set(), U = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), k = U ? "orientationchange" : "resize", A = /* @__PURE__ */ new Set();
let f = null;
const N = { scroll: 0, velocity: 0 }, O = { width: 0, height: 0 }, E = [null], J = (i) => i(N), Q = (i) => i(O), P = (i) => i(E), V = function(i, e) {
  this.unobserveResize(e);
}, Z = function(i, e) {
  this.unobserveIntersection(e);
}, X = (i) => i.d();
let I = !1;
const S = /* @__PURE__ */ new Set();
function ee() {
  I = !1, S.forEach(X), S.clear();
}
function te() {
  m.forEach(J);
}
function w(i) {
  let e, t;
  f ? (e = f.scroll, t = f.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), N.scroll = e, N.velocity = t, te();
}
function ne() {
  A.forEach(Q);
}
function M(i) {
  O.width = window.innerWidth, O.height = window.innerHeight, ne();
}
let _ = null;
const d = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map(), ie = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), R = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new Map();
function oe(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let se = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this.r = this.constructor.name, this.e = {}, this.i = t || {}, this.u = {}, this.d = this.d.bind(this), this.m();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = y(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const l = n[r], a = l.getAttribute(t);
      let c = o[a];
      c === void 0 && (c = [], o[a] = c), c.push(l);
    }
    let s = !0;
    for (const r in e) {
      s = !1;
      break;
    }
    if (s)
      for (const r in o) {
        const l = r.indexOf(":");
        if (l !== -1) {
          const a = r.substring(0, l), c = r.substring(l + 1);
          a === this.r && !this.e[c] && (this.e[c] = o[r]);
        } else
          this.e[r] || (this.e[r] = o[r]);
      }
    else {
      this.e = {};
      for (const r in e) {
        if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
        const l = Array.isArray(e[r]);
        if (e[r] !== null && l && e[r].length > 0) {
          this.e[r] = e[r];
          continue;
        }
        const a = `${this.r}:${r}`;
        let c = o[a] || [];
        c.length === 0 && (c = o[r] || []), this.e[r] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.i;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.i = { ...this.i, ...e };
      return;
    }
    const t = this.element.getAttribute(`${u.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const o = t.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
        } catch (s) {
          console.error(`Failed to parse options for component "${this.r}": ${s.message}`);
        }
    }
    this.i = {
      ...this.i,
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
  g() {
    this.mount();
  }
  p() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.e = null, this.element && (this.element.__gia_component__ = null, this.element = null);
      return;
    }
    this.l && this.l.forEach(this.unobserveScroll, this), this.a && this.a.forEach(this.unobserveWindowResize, this), this.o && this.o.forEach(V, this), this.t && this.t.forEach(Z, this), this.e = null, this.element && (this.element.__gia_component__ = null, this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (g || (g = !0, window.lenis ? (f = window.lenis, f.on("scroll", w)) : window.addEventListener("scroll", w, { passive: !0 })), this.l || (this.l = /* @__PURE__ */ new Set()), this.l.add(e), m.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.l && this.l.delete(e), m.delete(e), m.size === 0 && g && (g = !1, f ? (f.off("scroll", w), f = null) : window.removeEventListener("scroll", w)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (p || (p = !0, window.addEventListener(k, M, { passive: !0 })), this.a || (this.a = /* @__PURE__ */ new Set()), this.a.add(e), A.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.a && this.a.delete(e), A.delete(e), A.size === 0 && p && (p = !1, window.removeEventListener(k, M)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    _ || (_ = new ResizeObserver((s) => {
      for (let r = 0; r < s.length; r++) {
        const l = s[r], a = d.get(l.target);
        a && (E[0] = l, a.forEach(P));
      }
    }));
    let n = d.get(e);
    n || (n = /* @__PURE__ */ new Set(), d.set(e, n), _.observe(e)), n.add(t), this.o || (this.o = /* @__PURE__ */ new Map());
    let o = this.o.get(e);
    o || (o = /* @__PURE__ */ new Set(), this.o.set(e, o)), o.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.o) return;
    const n = this.o.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const s = d.get(e);
      s && s.delete(t);
    } else {
      const s = d.get(e);
      s && n.forEach(Set.prototype.delete, s), n.clear();
    }
    n.size === 0 && this.o.delete(e);
    const o = d.get(e);
    o && o.size === 0 && (d.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const o = oe(n);
    let s = b.get(o);
    s || (s = { observer: new IntersectionObserver((h) => {
      for (let v = 0; v < h.length; v++) {
        const C = h[v], $ = s.callbacks.get(C.target);
        $ && (E[0] = C, $.forEach(P));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, b.set(o, s));
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e)), r.add(t), this.t || (this.t = /* @__PURE__ */ new Map());
    let l = this.t.get(e);
    l || (l = /* @__PURE__ */ new Map(), this.t.set(e, l));
    let a = l.get(o);
    a || (a = /* @__PURE__ */ new Set(), l.set(o, a)), a.add(t);
  }
  A(e, t) {
    const n = b.get(t), o = this.w, s = this.b;
    if (s)
      e.has(s) && (e.delete(s), n && n.callbacks.has(o) && n.callbacks.get(o).delete(s));
    else {
      if (n && n.callbacks.has(o)) {
        const r = n.callbacks.get(o);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.t.get(o).delete(t), n) {
      const r = n.callbacks.get(o);
      r && r.size === 0 && (n.callbacks.delete(o), n.observer.unobserve(o)), n.callbacks.size === 0 && (n.observer.disconnect(), b.delete(t));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.t) return;
    const n = this.t.get(e);
    n && (this.w = e, this.b = t, n.forEach(this.A, this), this.w = null, this.b = null, n.size === 0 && this.t.delete(e));
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
    return n ? n instanceof HTMLScriptElement ? n.n ? n.n : (n.n = new Promise((o, s) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n.n, s(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), s(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.n) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
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
    return t ? t instanceof HTMLLinkElement ? t.n ? t.n : (t.n = new Promise((n, o) => {
      const s = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        s(), n(!0);
      }, t.onerror = () => {
        s(), delete t.n, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        s(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let r = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
            r = !0;
            break;
          }
        r && (s(), n(!0));
      }
    }), t.n) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${u.get("attrPrefix")}-ref="${t ? `${this.r}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.u[t] !== n && (this.u[t] = n, this.f || (this.f = this._ || {}, this.s = this.h || {}, S.add(this), I || (I = !0, requestAnimationFrame(ee))), this.f[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let s = L.get(t);
            s || (s = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, L.set(t, s)), this.s[s] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  d() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.s) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.s) {
          if (!Object.prototype.hasOwnProperty.call(this.s, t)) continue;
          const n = this.s[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.f), this._ = this.f, this.h = this.s;
    for (const e in this._)
      delete this._[e];
    if (this.h)
      for (const e in this.h)
        delete this.h[e];
    this.f = null, this.s = null;
  }
  stateChange(e) {
    return e;
  }
  m() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = R.get(e);
    if (!t) {
      t = [];
      const o = Object.getOwnPropertyNames(e);
      for (let s = 0; s < o.length; s++) {
        const r = o[s];
        !ie.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, r)) == null ? void 0 : n.value) == "function" && t.push(r);
      }
      R.set(e, t);
    }
    for (let o = 0; o < t.length; o++) {
      const s = t[o];
      this[s] = this[s].bind(this);
    }
  }
  v() {
  }
};
class de extends se {
  async require() {
  }
  g() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => this.mount()) : this.mount();
  }
}
class re {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    const o = { ...t, r: e }, s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](o);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let o = t;
    n && (o = (s) => {
      this.off(e, o), t(s);
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
    t.c && t.c[e] ? (o = t.c[e], delete t.c[e]) : t.y && (o = t.y);
    const s = n.indexOf(o);
    s !== -1 && n.splice(s, 1);
  }
}
const _e = new re();
export {
  se as BaseComponent,
  de as Component,
  u as config,
  z as createInstance,
  K as destroyInstance,
  _e as eventbus,
  ae as getComponentFromElement,
  fe as loadComponents,
  ue as removeComponents,
  ce as utils
};
