var j = Object.defineProperty;
var H = (i, e, t) => e in i ? j(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var R = (i, e, t) => H(i, typeof e != "symbol" ? e + "" : e, t);
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
class D {
  constructor() {
    R(this, "_options", {
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
const f = new D();
function O(i, e, t, n) {
  if (i.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), i.__gia_component__;
  try {
    const s = new t(i, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function V(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
function p(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function T(i = {}, e = document.documentElement) {
  if (!i) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const a in i) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${f.get("attrPrefix")}-component`, r = p(`[${s}]`, e), o = r.length;
  for (let a = 0; a < o; a++) {
    const l = r[a];
    if (!l.__gia_component__) {
      const u = l.getAttribute(s);
      typeof i[u] == "function" ? n.push(O(l, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !e.__gia_component__) {
    const l = e.getAttribute(s);
    typeof i[l] == "function" ? n.push(O(e, l, i[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function z(i) {
  if (!i) return;
  let e = i.__gia_component__;
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = t.__gia_component__, i = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    i.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function Z(i = document.documentElement) {
  const e = p(`[${f.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    z(e[t]);
}
let w = !1, m = !1;
const C = /* @__PURE__ */ new Set(), F = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), M = F ? "orientationchange" : "resize", S = /* @__PURE__ */ new Set();
let h = null;
const A = { scroll: 0, velocity: 0 }, k = { width: 0, height: 0 }, v = [null];
function y(i) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), A.scroll = e, A.velocity = t;
  for (const n of C)
    n(A);
}
function I(i) {
  k.width = window.innerWidth, k.height = window.innerHeight;
  for (const e of S)
    e(k);
}
let _ = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), x = /* @__PURE__ */ new WeakMap(), N = /* @__PURE__ */ new Map();
function q(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let G = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = p(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < n.length; o++) {
      const a = n[o], l = a.getAttribute(t);
      let c = s[l];
      c === void 0 && (c = [], s[l] = c), c.push(a);
    }
    let r = !0;
    for (const o in e) {
      r = !1;
      break;
    }
    if (r)
      for (const o in s) {
        const a = o.indexOf(":");
        if (a !== -1) {
          const l = o.substring(0, a), c = o.substring(a + 1);
          l === this._name && !this._ref[c] && (this._ref[c] = s[o]);
        } else
          this._ref[o] || (this._ref[o] = s[o]);
      }
    else {
      this._ref = {};
      for (const o in e) {
        if (!Object.prototype.hasOwnProperty.call(e, o)) continue;
        const a = Array.isArray(e[o]);
        if (e[o] !== null && a && e[o].length > 0) {
          this._ref[o] = e[o];
          continue;
        }
        const l = `${this._name}:${o}`;
        let c = s[l] || [];
        c.length === 0 && (c = s[o] || []), this._ref[o] = a ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const s = t.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
        } catch (r) {
          console.error(`Failed to parse options for component "${this._name}": ${r.message}`);
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
    typeof window > "u" || (w || (w = !0, window.lenis ? (h = window.lenis, h.on("scroll", y)) : window.addEventListener("scroll", y, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), C.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, h ? (h.off("scroll", y), h = null) : window.removeEventListener("scroll", y));
  }
  observeWindowResize(e) {
    typeof window > "u" || (m || (m = !0, window.addEventListener(M, I, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), S.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), S.delete(e), S.size === 0 && m && (m = !1, window.removeEventListener(M, I));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    _ || (_ = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const a = r[o], l = g.get(a.target);
        if (l) {
          v[0] = a;
          for (const c of l)
            c(v);
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
      const r = g.get(e);
      r && r.delete(t);
    } else {
      const r = g.get(e);
      if (r)
        for (const o of n)
          r.delete(o);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = g.get(e);
    s && s.size === 0 && (g.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = q(n);
    let r = E.get(s);
    r || (r = { observer: new IntersectionObserver((u) => {
      for (let d = 0; d < u.length; d++) {
        const $ = u[d], P = r.callbacks.get($.target);
        if (P) {
          v[0] = $;
          for (const W of P)
            W(v);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(s, r));
    let o = r.callbacks.get(e);
    o || (o = /* @__PURE__ */ new Set(), r.callbacks.set(e, o), r.observer.observe(e)), o.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let l = a.get(s);
    l || (l = /* @__PURE__ */ new Set(), a.set(s, l)), l.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, r] of n) {
        const o = E.get(s);
        if (t)
          r.has(t) && (r.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
        else {
          if (o && o.callbacks.has(e)) {
            const a = o.callbacks.get(e);
            for (const l of r)
              a.delete(l);
          }
          r.clear();
        }
        if (r.size === 0 && n.delete(s), o) {
          const a = o.callbacks.get(e);
          a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), E.delete(s));
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
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((s, r) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n._loadPromise, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (o(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
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
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let o = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            o = !0;
            break;
          }
        o && (r(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this._state[t] !== n) {
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[t] = n;
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = N.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, N.set(t, r)), this._pendingAttributeChanges[r] = s === "boolean" ? n ? "true" : "false" : n;
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
    if (e)
      for (const t in this._pendingAttributeChanges) {
        if (!Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, t)) continue;
        const n = this._pendingAttributeChanges[t];
        this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
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
      var s;
      return !L.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), x.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = p("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], r = s.getAttribute("data-action");
      if (!r) continue;
      let o = 0;
      for (; o < r.length; ) {
        let a = r.indexOf(" ", o);
        if (a === -1 && (a = r.length), a > o) {
          const l = r.substring(o, a), c = l.indexOf("->");
          let u, d;
          c !== -1 ? (u = l.substring(0, c), d = l.substring(c + 2)) : (u = l, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !L.has(d) ? s.addEventListener(u, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        o = a + 1;
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
class Y extends EventTarget {
  emit(e, t = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, n = !1) {
    let s = t._wrappedHandlers;
    s || (s = /* @__PURE__ */ new Map(), t._wrappedHandlers = s);
    let r = s.get(e);
    r || (r = (o) => {
      o.detail && o.detail._name === o._name ? t(o.detail) : t({ ...o.detail, _name: o._name });
    }, s.set(e, r)), this.addEventListener(e, r, { once: n });
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
const ee = new Y();
let b = null;
function K(i) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < i.length; s++) {
    const r = i[s];
    for (let o = 0; o < r.removedNodes.length; o++) {
      const a = r.removedNodes[o];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && z(a);
        const l = p(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          z(l[c]);
      }
    }
    for (let o = 0; o < r.addedNodes.length; o++) {
      const a = r.addedNodes[o];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  for (const s of n)
    s.isConnected && T(t, s);
}
function B() {
  typeof document > "u" || (f.get("autoMountComponents") && !b ? (b = new MutationObserver(K), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const U = f.set;
f.set = function(i, e) {
  U.call(this, i, e), i === "autoMountComponents" && B();
};
typeof window < "u" && setTimeout(B, 0);
export {
  G as BaseComponent,
  X as Component,
  f as config,
  O as createInstance,
  Z as destroyInstance,
  ee as eventbus,
  V as getComponentFromElement,
  T as loadComponents,
  Z as removeComponents
};
