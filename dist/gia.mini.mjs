var j = Object.defineProperty;
var B = (o, e, t) => e in o ? j(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var G = (o, e, t) => B(o, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (o) => {
  if (typeof o != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", o);
    return;
  }
  const e = o.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = o;
});
class T {
  constructor() {
    G(this, "n", {
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
    this.n[e] = t;
  }
  get(e) {
    return this.n[e];
  }
}
const u = new T();
function z(o, e, t, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const i = new t(o, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), i;
  } catch (i) {
    return console.error(`Failed to create component "${e}".`, i), null;
  }
}
function ae(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function W(o, e = document) {
  return typeof o != "string" ? o : e.querySelector(o);
}
function y(o, e = document) {
  return typeof o != "string" ? o : e.querySelectorAll(o);
}
function q(o, e, t = null) {
  t === null ? o.classList.toggle(e) : o.classList.toggle(e, !!t);
}
function x(o, e, t) {
  if (!o) return o;
  if (o.length !== void 0 && o.nodeType === void 0)
    for (let n = 0; n < o.length; n++)
      o[n].classList[t](e);
  else
    o.classList[t](e);
  return o;
}
function D(o, e) {
  return x(o, e, "remove");
}
function F(o, e) {
  return x(o, e, "add");
}
function H(o, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const i = new CustomEvent(e, n);
  o.dispatchEvent(i);
}
function Y(o, e) {
  let t, n = null, i = null;
  const s = () => {
    if (clearTimeout(t), n) {
      const l = i, a = n;
      i = null, n = null, o.apply(l, a);
    }
  }, r = function() {
    n = arguments, i = this, clearTimeout(t), t = setTimeout(s, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null, i = null;
  }, r;
}
const ce = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: F,
  debounce: Y,
  query: W,
  queryAll: y,
  removeClass: D,
  toggleClass: q,
  triggerEvent: H
}, Symbol.toStringTag, { value: "Module" }));
function fe(o = {}, e = document.documentElement) {
  if (!o) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in o) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], i = `${u.get("attrPrefix")}-component`, s = y(`[${i}]`, e), r = s.length;
  for (let l = 0; l < r; l++) {
    const a = s[l];
    if (!a.__gia_component__) {
      const h = a.getAttribute(i);
      typeof o[h] == "function" ? n.push(z(a, h, o[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(i) && !e.__gia_component__) {
    const a = e.getAttribute(i);
    typeof o[a] == "function" ? n.push(z(e, a, o[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l].d();
}
function K(o) {
  if (!o) return;
  let e = o.__gia_component__;
  if (!e && typeof o == "string") {
    const t = document.getElementById(o);
    t && (e = t.__gia_component__, o = t);
  }
  if (e) {
    const t = e.s || "Unknown";
    try {
      typeof e._ == "function" ? e._() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    o.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ue(o = document.documentElement) {
  const e = y(`[${u.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    K(e[t]);
}
let g = !1, p = !1;
const m = /* @__PURE__ */ new Set(), U = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), P = U ? "orientationchange" : "resize", A = /* @__PURE__ */ new Set();
let f = null;
const N = { scroll: 0, velocity: 0 }, O = { width: 0, height: 0 }, E = [null], J = (o) => o(N), Q = (o) => o(O), k = (o) => o(E), V = function(o, e) {
  this.unobserveResize(e);
}, Z = function(o, e) {
  this.unobserveIntersection(e);
}, X = (o) => o.h();
let I = !1;
const S = /* @__PURE__ */ new Set();
function ee() {
  I = !1, S.forEach(X), S.clear();
}
function te() {
  m.forEach(J);
}
function w(o) {
  let e, t;
  f ? (e = f.scroll, t = f.velocity) : o && typeof o.scroll == "number" ? (e = o.scroll, t = o.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), N.scroll = e, N.velocity = t, te();
}
function ne() {
  A.forEach(Q);
}
function M(o) {
  O.width = window.innerWidth, O.height = window.innerHeight, ne();
}
let _ = null;
const d = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map(), oe = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), R = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new Map();
function ie(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, i = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${i}`;
}
let se = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this.s = this.constructor.name, this.o = {}, this.n = t || {}, this.f = {}, this.h = this.h.bind(this), this.w();
  }
  get ref() {
    return this.o;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = y(`[${t}]`, this.element), i = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const l = n[r], a = l.getAttribute(t);
      let c = i[a];
      c === void 0 && (c = [], i[a] = c), c.push(l);
    }
    let s = !0;
    for (const r in e) {
      s = !1;
      break;
    }
    if (s)
      for (const r in i) {
        const l = r.indexOf(":");
        if (l !== -1) {
          const a = r.substring(0, l), c = r.substring(l + 1);
          a === this.s && !this.o[c] && (this.o[c] = i[r]);
        } else
          this.o[r] || (this.o[r] = i[r]);
      }
    else {
      this.o = {};
      for (const r in e) {
        if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
        const l = Array.isArray(e[r]);
        if (e[r] !== null && l && e[r].length > 0) {
          this.o[r] = e[r];
          continue;
        }
        const a = `${this.s}:${r}`;
        let c = i[a] || [];
        c.length === 0 && (c = i[r] || []), this.o[r] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.n;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.n = { ...this.n, ...e };
      return;
    }
    const t = this.element.getAttribute(`${u.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const i = t.trim();
      if (i.startsWith("{") || i.startsWith("["))
        try {
          n = JSON.parse(i);
        } catch (s) {
          console.error(`Failed to parse options for component "${this.s}": ${s.message}`);
        }
    }
    this.n = {
      ...this.n,
      ...e,
      ...n
    };
  }
  get state() {
    return this.f;
  }
  set state(e) {
    console.warn("Use setState instead."), this.f = e;
  }
  d() {
    this.mount();
  }
  _() {
    this.unmount(), !(typeof __GIA_NANO__ < "u" && __GIA_NANO__) && (this.r && this.r.forEach(this.unobserveScroll, this), this.l && this.l.forEach(this.unobserveWindowResize, this), this.i && this.i.forEach(V, this), this.e && this.e.forEach(Z, this));
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (g || (g = !0, window.lenis ? (f = window.lenis, f.on("scroll", w)) : window.addEventListener("scroll", w, { passive: !0 })), this.r || (this.r = /* @__PURE__ */ new Set()), this.r.add(e), m.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.r && this.r.delete(e), m.delete(e), m.size === 0 && g && (g = !1, f ? (f.off("scroll", w), f = null) : window.removeEventListener("scroll", w)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (p || (p = !0, window.addEventListener(P, M, { passive: !0 })), this.l || (this.l = /* @__PURE__ */ new Set()), this.l.add(e), A.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.l && this.l.delete(e), A.delete(e), A.size === 0 && p && (p = !1, window.removeEventListener(P, M)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    _ || (_ = new ResizeObserver((s) => {
      for (let r = 0; r < s.length; r++) {
        const l = s[r], a = d.get(l.target);
        a && (E[0] = l, a.forEach(k));
      }
    }));
    let n = d.get(e);
    n || (n = /* @__PURE__ */ new Set(), d.set(e, n), _.observe(e)), n.add(t), this.i || (this.i = /* @__PURE__ */ new Map());
    let i = this.i.get(e);
    i || (i = /* @__PURE__ */ new Set(), this.i.set(e, i)), i.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.i) return;
    const n = this.i.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const s = d.get(e);
      s && s.delete(t);
    } else {
      const s = d.get(e);
      s && n.forEach(Set.prototype.delete, s), n.clear();
    }
    n.size === 0 && this.i.delete(e);
    const i = d.get(e);
    i && i.size === 0 && (d.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const i = ie(n);
    let s = b.get(i);
    s || (s = { observer: new IntersectionObserver((h) => {
      for (let v = 0; v < h.length; v++) {
        const C = h[v], $ = s.callbacks.get(C.target);
        $ && (E[0] = C, $.forEach(k));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, b.set(i, s));
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e)), r.add(t), this.e || (this.e = /* @__PURE__ */ new Map());
    let l = this.e.get(e);
    l || (l = /* @__PURE__ */ new Map(), this.e.set(e, l));
    let a = l.get(i);
    a || (a = /* @__PURE__ */ new Set(), l.set(i, a)), a.add(t);
  }
  b(e, t) {
    const n = b.get(t), i = this.g, s = this.p;
    if (s)
      e.has(s) && (e.delete(s), n && n.callbacks.has(i) && n.callbacks.get(i).delete(s));
    else {
      if (n && n.callbacks.has(i)) {
        const r = n.callbacks.get(i);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.e.get(i).delete(t), n) {
      const r = n.callbacks.get(i);
      r && r.size === 0 && (n.callbacks.delete(i), n.observer.unobserve(i)), n.callbacks.size === 0 && (n.observer.disconnect(), b.delete(t));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.e) return;
    const n = this.e.get(e);
    n && (this.g = e, this.p = t, n.forEach(this.b, this), this.g = null, this.p = null, n.size === 0 && this.e.delete(e));
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
    return n ? n instanceof HTMLScriptElement ? n.t ? n.t : (n.t = new Promise((i, s) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), i(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n.t, s(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), s(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.t) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
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
    return t ? t instanceof HTMLLinkElement ? t.t ? t.t : (t.t = new Promise((n, i) => {
      const s = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        s(), n(!0);
      }, t.onerror = () => {
        s(), delete t.t, i(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        s(), i(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let r = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
            r = !0;
            break;
          }
        r && (s(), n(!0));
      }
    }), t.t) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${u.get("attrPrefix")}-ref="${t ? `${this.s}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.f[t] !== n && (this.f[t] = n, this.u || (this.u = {}, this.a = {}, S.add(this), I || (I = !0, requestAnimationFrame(ee))), this.u[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const i = typeof n;
          if (i === "boolean" || i === "string") {
            let s = L.get(t);
            s || (s = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, L.set(t, s)), this.a[s] = i === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  h() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.a) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.a) {
          if (!Object.prototype.hasOwnProperty.call(this.a, t)) continue;
          const n = this.a[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.u), this.u = null, this.a = null;
  }
  stateChange(e) {
    return e;
  }
  w() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = R.get(e);
    if (!t) {
      t = [];
      const i = Object.getOwnPropertyNames(e);
      for (let s = 0; s < i.length; s++) {
        const r = i[s];
        !oe.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, r)) == null ? void 0 : n.value) == "function" && t.push(r);
      }
      R.set(e, t);
    }
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      this[s] = this[s].bind(this);
    }
  }
  A() {
  }
};
class de extends se {
  async require() {
  }
  d() {
    this.require().then(this.mount.bind(this));
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
    const i = { ...t, s: e }, s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](i);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let i = t;
    n && (i = (s) => {
      this.off(e, i), t(s);
    }, t.c || (t.c = /* @__PURE__ */ Object.create(null)), t.c[e] = i), this.listeners[e].push(i);
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
    let i = t;
    t.c && t.c[e] ? (i = t.c[e], delete t.c[e]) : t.m && (i = t.m);
    const s = n.indexOf(i);
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
