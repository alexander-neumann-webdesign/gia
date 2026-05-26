var N = Object.defineProperty;
var B = (r, e, t) => e in r ? N(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var $ = (r, e, t) => B(r, typeof e != "symbol" ? e + "" : e, t);
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
class W {
  constructor() {
    $(this, "_options", {
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
const u = new W();
function z(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const s = new t(r, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function K(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function p(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function j(r = {}, e = document.documentElement) {
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
  const n = [], s = `${u.get("attrPrefix")}-component`, i = p(`[${s}]`, e), o = i.length;
  for (let a = 0; a < o; a++) {
    const l = i[a];
    if (!l.__gia_component__) {
      const d = l.getAttribute(s);
      typeof r[d] == "function" ? n.push(z(l, d, r[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !e.__gia_component__) {
    const l = e.getAttribute(s);
    typeof r[l] == "function" ? n.push(z(e, l, r[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function S(r) {
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
function Y(r = document.documentElement) {
  const e = p(`[${u.get("attrPrefix")}-component]`, r);
  for (let t = 0; t < e.length; t++)
    S(e[t]);
}
let m = !1, w = !1;
const E = /* @__PURE__ */ new Set(), C = /* @__PURE__ */ new Set();
let h = null;
function v(r) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : r && typeof r.scroll == "number" ? (e = r.scroll, t = r.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0);
  const n = { scroll: e, velocity: t };
  for (const s of E)
    s(n);
}
function R(r) {
  const e = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  for (const t of C)
    t(e);
}
let _ = null;
const g = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map(), P = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), O = /* @__PURE__ */ new WeakMap(), M = /* @__PURE__ */ new Map();
function H(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let D = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = p(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < n.length; o++) {
      const a = n[o], l = a.getAttribute(t);
      let c = s[l];
      c === void 0 && (c = [], s[l] = c), c.push(a);
    }
    let i = !0;
    for (const o in e) {
      i = !1;
      break;
    }
    if (i) {
      const o = Object.keys(s);
      for (let a = 0; a < o.length; a++) {
        const l = o[a], c = l.indexOf(":");
        if (c !== -1) {
          const d = l.substring(0, c), f = l.substring(c + 1);
          d === this._name && !this._ref[f] && (this._ref[f] = s[l]);
        } else
          this._ref[l] || (this._ref[l] = s[l]);
      }
    } else {
      this._ref = {};
      const o = e ? Object.keys(e) : [];
      for (let a = 0; a < o.length; a++) {
        const l = o[a], c = Array.isArray(e[l]);
        if (e[l] !== null && c && e[l].length > 0) {
          this._ref[l] = e[l];
          continue;
        }
        const d = `${this._name}:${l}`;
        let f = s[d] || [];
        f.length === 0 && (f = s[l] || []), this._ref[l] = c ? f : f[0] ?? null;
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
      const s = t.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
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
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), E.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), E.delete(e), E.size === 0 && m && (m = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener("resize", R, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, window.removeEventListener("resize", R));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    _ || (_ = new ResizeObserver((i) => {
      for (let o = 0; o < i.length; o++) {
        const a = i[o], l = g.get(a.target);
        if (l) {
          const c = [a];
          for (const d of l)
            d(c);
        }
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), _.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let s = this._observedResizeElements.get(e);
    s || (s = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, s)), s.add(t);
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
        for (const o of n)
          i.delete(o);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = g.get(e);
    s && s.size === 0 && (g.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = H(n);
    let i = y.get(s);
    i || (i = { observer: new IntersectionObserver((d) => {
      for (let f = 0; f < d.length; f++) {
        const k = d[f], A = i.callbacks.get(k.target);
        if (A) {
          const L = [k];
          for (const x of A)
            x(L);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, y.set(s, i));
    let o = i.callbacks.get(e);
    o || (o = /* @__PURE__ */ new Set(), i.callbacks.set(e, o), i.observer.observe(e)), o.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let l = a.get(s);
    l || (l = /* @__PURE__ */ new Set(), a.set(s, l)), l.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, i] of n) {
        const o = y.get(s);
        if (t)
          i.has(t) && (i.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
        else {
          if (o && o.callbacks.has(e)) {
            const a = o.callbacks.get(e);
            for (const l of i)
              a.delete(l);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(s), o) {
          const a = o.callbacks.get(e);
          a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), y.delete(s));
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
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((s, i) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (o(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
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
    return t ? t instanceof HTMLLinkElement ? (t._loadPromise || (t._loadPromise = new Promise((n, s) => {
      const i = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        i(), n(!0);
      }, t.onerror = () => {
        i(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        i(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let o = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            o = !0;
            break;
          }
        o && (i(), n(!0));
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
      const s = t[n], i = e[s];
      if (this._state[s] !== i) {
        this._state[s] = i, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[s] = i;
        const o = typeof i;
        if (o === "boolean" || o === "string") {
          let a = M.get(s);
          a || (a = `data-${s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, M.set(s, a)), this._pendingAttributeChanges[a] = o === "boolean" ? i ? "true" : "false" : i;
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
        const s = t[n], i = this._pendingAttributeChanges[s];
        this.element.getAttribute(s) !== i && this.element.setAttribute(s, i);
      }
    }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = O.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !P.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), O.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = p("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], i = s.getAttribute("data-action");
      if (!i) continue;
      let o = 0;
      for (; o < i.length; ) {
        let a = i.indexOf(" ", o);
        if (a === -1 && (a = i.length), a > o) {
          const l = i.substring(o, a), c = l.indexOf("->");
          let d, f;
          c !== -1 ? (d = l.substring(0, c), f = l.substring(c + 2)) : (d = l, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !P.has(f) ? s.addEventListener(d, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        o = a + 1;
      }
    }
  }
};
class J extends D {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class T extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, n = !1) {
    let s = t._wrappedHandlers;
    s || (s = /* @__PURE__ */ new Map(), t._wrappedHandlers = s);
    let i = s.get(e);
    i || (i = (o) => {
      o.detail && o.detail._name === o._name ? t(o.detail) : t({ ...o.detail, _name: o._name });
    }, s.set(e, i)), this.addEventListener(e, i, { once: n });
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
const V = new T();
let b = null;
function F(r) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < r.length; s++) {
    const i = r[s];
    for (let o = 0; o < i.removedNodes.length; o++) {
      const a = i.removedNodes[o];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && S(a);
        const l = p(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          S(l[c]);
      }
    }
    for (let o = 0; o < i.addedNodes.length; o++) {
      const a = i.addedNodes[o];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  for (const s of n)
    s.isConnected && j(t, s);
}
function I() {
  typeof document > "u" || (u.get("autoMountComponents") && !b ? (b = new MutationObserver(F), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const q = u.set;
u.set = function(r, e) {
  q.call(this, r, e), r === "autoMountComponents" && I();
};
typeof window < "u" && setTimeout(I, 0);
export {
  D as BaseComponent,
  J as Component,
  u as config,
  z as createInstance,
  Y as destroyInstance,
  V as eventbus,
  K as getComponentFromElement,
  j as loadComponents,
  Y as removeComponents
};
