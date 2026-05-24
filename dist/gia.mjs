var j = Object.defineProperty;
var H = (r, e, t) => e in r ? j(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var P = (r, e, t) => H(r, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (r) => {
  if (typeof r != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", r);
    return;
  }
  const e = r.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = r;
});
class D {
  constructor() {
    P(this, "_options", {
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
    this._options[e] = t;
  }
  get(e) {
    return this._options[e];
  }
}
const u = new D();
function M(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const o = new t(r, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function V(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function p(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function T(r = {}, e = document.documentElement) {
  if (!r) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const a in r) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${u.get("attrPrefix")}-component`, i = p(`[${o}]`, e), s = i.length;
  for (let a = 0; a < s; a++) {
    const l = i[a];
    if (!l.__gia_component__) {
      const f = l.getAttribute(o);
      typeof r[f] == "function" ? n.push(M(l, f, r[f])) : console.warn(`Constructor "${f}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const l = e.getAttribute(o);
    typeof r[l] == "function" ? n.push(M(e, l, r[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function z(r) {
  if (!r) return;
  let e = r.__gia_component__;
  if (!e && typeof r == "string") {
    const t = document.getElementById(r);
    t && (e = t.__gia_component__, r = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    r.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function Z(r = document.documentElement) {
  const e = p(`[${u.get("attrPrefix")}-component]`, r);
  for (let t = 0; t < e.length; t++)
    z(e[t]);
}
let m = !1, w = !1;
const C = /* @__PURE__ */ new Set(), F = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), O = F ? "orientationchange" : "resize", S = /* @__PURE__ */ new Set();
let h = null;
const k = { scroll: 0, velocity: 0 }, A = { width: 0, height: 0 }, v = [null];
function y(r) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : r && typeof r.scroll == "number" ? (e = r.scroll, t = r.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), k.scroll = e, k.velocity = t;
  for (const n of C)
    n(k);
}
function I(r) {
  A.width = window.innerWidth, A.height = window.innerHeight;
  for (const e of S)
    e(A);
}
let _ = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), x = /* @__PURE__ */ new WeakMap(), N = /* @__PURE__ */ new Map();
function q(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let G = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = p(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const a = n[s], l = a.getAttribute(t);
      let c = o[l];
      c === void 0 && (c = [], o[l] = c), c.push(a);
    }
    let i = !0;
    for (const s in e) {
      i = !1;
      break;
    }
    if (i) {
      const s = Object.keys(o);
      for (let a = 0; a < s.length; a++) {
        const l = s[a], c = l.indexOf(":");
        if (c !== -1) {
          const f = l.substring(0, c), d = l.substring(c + 1);
          f === this._name && !this._ref[d] && (this._ref[d] = o[l]);
        } else
          this._ref[l] || (this._ref[l] = o[l]);
      }
    } else {
      this._ref = {};
      const s = e ? Object.keys(e) : [];
      for (let a = 0; a < s.length; a++) {
        const l = s[a], c = Array.isArray(e[l]);
        if (e[l] !== null && c && e[l].length > 0) {
          this._ref[l] = e[l];
          continue;
        }
        const f = `${this._name}:${l}`;
        let d = o[f] || [];
        d.length === 0 && (d = o[l] || []), this._ref[l] = c ? d : d[0] ?? null;
      }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${u.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const o = t.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
        } catch (i) {
          console.error(`Failed to parse options for component "${this._name}": ${i.message}`);
        }
    }
    this._options = {
      ...this._options,
      ...e,
      ...n
    };
  }
  get state() {
    return this._state;
  }
  set state(e) {
    console.warn("Use setState instead."), this._state = e;
  }
  _load() {
    this.mount();
  }
  _destroy() {
    if (this.unmount(), this._observedScrollCallbacks)
      for (const e of this._observedScrollCallbacks)
        this.unobserveScroll(e);
    if (this._observedWindowResizeCallbacks)
      for (const e of this._observedWindowResizeCallbacks)
        this.unobserveWindowResize(e);
    if (this._observedResizeElements)
      for (const e of this._observedResizeElements.keys())
        this.unobserveResize(e);
    if (this._observedIntersectionElements)
      for (const e of this._observedIntersectionElements.keys())
        this.unobserveIntersection(e);
  }
  observeScroll(e) {
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", y)) : window.addEventListener("scroll", y, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), C.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), C.delete(e), C.size === 0 && m && (m = !1, h ? (h.off("scroll", y), h = null) : window.removeEventListener("scroll", y));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(O, I, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), S.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), S.delete(e), S.size === 0 && w && (w = !1, window.removeEventListener(O, I));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    _ || (_ = new ResizeObserver((i) => {
      for (let s = 0; s < i.length; s++) {
        const a = i[s], l = g.get(a.target);
        if (l) {
          v[0] = a;
          for (const c of l)
            c(v);
        }
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), _.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let o = this._observedResizeElements.get(e);
    o || (o = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, o)), o.add(t);
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const i = g.get(e);
      i && i.delete(t);
    } else {
      const i = g.get(e);
      if (i)
        for (const s of n)
          i.delete(s);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = g.get(e);
    o && o.size === 0 && (g.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = q(n);
    let i = E.get(o);
    i || (i = { observer: new IntersectionObserver((f) => {
      for (let d = 0; d < f.length; d++) {
        const $ = f[d], R = i.callbacks.get($.target);
        if (R) {
          v[0] = $;
          for (const W of R)
            W(v);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(o, i));
    let s = i.callbacks.get(e);
    s || (s = /* @__PURE__ */ new Set(), i.callbacks.set(e, s), i.observer.observe(e)), s.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let l = a.get(o);
    l || (l = /* @__PURE__ */ new Set(), a.set(o, l)), l.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [o, i] of n) {
        const s = E.get(o);
        if (t)
          i.has(t) && (i.delete(t), s && s.callbacks.has(e) && s.callbacks.get(e).delete(t));
        else {
          if (s && s.callbacks.has(e)) {
            const a = s.callbacks.get(e);
            for (const l of i)
              a.delete(l);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(o), s) {
          const a = s.callbacks.get(e);
          a && a.size === 0 && (s.callbacks.delete(e), s.observer.unobserve(e)), s.callbacks.size === 0 && (s.observer.disconnect(), E.delete(o));
        }
      }
      n.size === 0 && this._observedIntersectionElements.delete(e);
    }
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (t && window[t] && !(window[t] instanceof Node))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((o, i) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    const t = document.getElementById(e);
    return t ? t instanceof HTMLLinkElement ? (t._loadPromise || (t._loadPromise = new Promise((n, o) => {
      const i = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        i(), n(!0);
      }, t.onerror = () => {
        i(), delete t._loadPromise, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        i(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let s = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            s = !0;
            break;
          }
        s && (i(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${u.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = e ? Object.keys(e) : [];
    for (let n = 0; n < t.length; n++) {
      const o = t[n], i = e[o];
      if (this._state[o] !== i) {
        this._state[o] = i, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[o] = i;
        const s = typeof i;
        if (s === "boolean" || s === "string") {
          let a = N.get(o);
          a || (a = `data-${o.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, N.set(o, a)), this._pendingAttributeChanges[a] = s === "boolean" ? i ? "true" : "false" : i;
        }
      }
    }
  }
  _flushStateChanges() {
    let e = !1;
    for (const t in this._pendingAttributeChanges) {
      e = !0;
      break;
    }
    if (e) {
      const t = Object.keys(this._pendingAttributeChanges);
      for (let n = 0; n < t.length; n++) {
        const o = t[n], i = this._pendingAttributeChanges[o];
        this.element.getAttribute(o) !== i && this.element.setAttribute(o, i);
      }
    }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = x.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var o;
      return !L.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), x.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    const e = p("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], i = o.getAttribute("data-action");
      if (!i) continue;
      let s = 0;
      for (; s < i.length; ) {
        let a = i.indexOf(" ", s);
        if (a === -1 && (a = i.length), a > s) {
          const l = i.substring(s, a), c = l.indexOf("->");
          let f, d;
          c !== -1 ? (f = l.substring(0, c), d = l.substring(c + 2)) : (f = l, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !L.has(d) ? o.addEventListener(f, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        s = a + 1;
      }
    }
  }
};
class X extends G {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class K extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, o = new CustomEvent(e, { detail: n });
    o._name = e, this.dispatchEvent(o);
  }
  on(e, t, n = !1) {
    let o = t._wrappedHandlers;
    o || (o = /* @__PURE__ */ new Map(), t._wrappedHandlers = o);
    let i = o.get(e);
    i || (i = (s) => {
      s.detail && s.detail._name === s._name ? t(s.detail) : t({ ...s.detail, _name: s._name });
    }, o.set(e, i)), this.addEventListener(e, i, { once: n });
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    if (t && t._wrappedHandlers) {
      const n = t._wrappedHandlers.get(e);
      n && this.removeEventListener(e, n);
    } else t && t._wrapped ? this.removeEventListener(e, t._wrapped) : t && this.removeEventListener(e, t);
    t || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const ee = new K();
let b = null;
function Y(r) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < r.length; o++) {
    const i = r[o];
    for (let s = 0; s < i.removedNodes.length; s++) {
      const a = i.removedNodes[s];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && z(a);
        const l = p(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          z(l[c]);
      }
    }
    for (let s = 0; s < i.addedNodes.length; s++) {
      const a = i.addedNodes[s];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  for (const o of n)
    o.isConnected && T(t, o);
}
function B() {
  typeof document > "u" || (u.get("autoMountComponents") && !b ? (b = new MutationObserver(Y), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const U = u.set;
u.set = function(r, e) {
  U.call(this, r, e), r === "autoMountComponents" && B();
};
typeof window < "u" && setTimeout(B, 0);
export {
  G as BaseComponent,
  X as Component,
  u as config,
  M as createInstance,
  Z as destroyInstance,
  ee as eventbus,
  V as getComponentFromElement,
  T as loadComponents,
  Z as removeComponents
};
