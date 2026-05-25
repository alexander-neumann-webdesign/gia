var j = Object.defineProperty;
var H = (s, e, t) => e in s ? j(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var R = (s, e, t) => H(s, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (s) => {
  if (typeof s != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", s);
    return;
  }
  const e = s.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = s;
});
class q {
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
const u = new q();
function M(s, e, t, n) {
  if (s.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), s.__gia_component__;
  try {
    const o = new t(s, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function oe(s) {
  return typeof s == "string" && (s = document.getElementById(s), !s) ? null : s.__gia_component__;
}
function D(s, e = document) {
  return typeof s != "string" ? s : e.querySelector(s);
}
function _(s, e = document) {
  return typeof s != "string" ? s : e.querySelectorAll(s);
}
function F(s, e, t = null) {
  t === null ? s.classList.toggle(e) : s.classList.toggle(e, !!t);
}
function T(s, e, t) {
  if (!s) return s;
  if (s.length !== void 0 && s.nodeType === void 0)
    for (let n = 0; n < s.length; n++)
      s[n].classList[t](e);
  else
    s.classList[t](e);
  return s;
}
function G(s, e) {
  return T(s, e, "remove");
}
function K(s, e) {
  return T(s, e, "add");
}
function Y(s, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const o = new CustomEvent(e, n);
  s.dispatchEvent(o);
}
function U(s, e) {
  let t, n = null;
  const o = () => {
    clearTimeout(t), n && s(...n);
  }, r = function(...i) {
    n = i, clearTimeout(t), t = setTimeout(o, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null;
  }, r;
}
const se = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: K,
  debounce: U,
  query: D,
  queryAll: _,
  removeClass: G,
  toggleClass: F,
  triggerEvent: Y
}, Symbol.toStringTag, { value: "Module" }));
function J(s = {}, e = document.documentElement) {
  if (!s) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const a in s) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${u.get("attrPrefix")}-component`, r = _(`[${o}]`, e), i = r.length;
  for (let a = 0; a < i; a++) {
    const l = r[a];
    if (!l.__gia_component__) {
      const d = l.getAttribute(o);
      typeof s[d] == "function" ? n.push(M(l, d, s[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const l = e.getAttribute(o);
    typeof s[l] == "function" ? n.push(M(e, l, s[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function z(s) {
  if (!s) return;
  let e = s.__gia_component__;
  if (!e && typeof s == "string") {
    const t = document.getElementById(s);
    t && (e = t.__gia_component__, s = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    s.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ie(s = document.documentElement) {
  const e = _(`[${u.get("attrPrefix")}-component]`, s);
  for (let t = 0; t < e.length; t++)
    z(e[t]);
}
let m = !1, w = !1;
const C = /* @__PURE__ */ new Set(), V = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), O = V ? "orientationchange" : "resize", S = /* @__PURE__ */ new Set();
let h = null;
const k = { scroll: 0, velocity: 0 }, A = { width: 0, height: 0 }, v = [null];
function y(s) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : s && typeof s.scroll == "number" ? (e = s.scroll, t = s.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), k.scroll = e, k.velocity = t;
  for (const n of C)
    n(k);
}
function L(s) {
  A.width = window.innerWidth, A.height = window.innerHeight;
  for (const e of S)
    e(A);
}
let p = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), I = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), x = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new Map();
function Z(s) {
  const e = s.root || null, t = s.rootMargin || "0px 0px 0px 0px", n = s.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let Q = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < n.length; i++) {
      const a = n[i], l = a.getAttribute(t);
      let c = o[l];
      c === void 0 && (c = [], o[l] = c), c.push(a);
    }
    let r = !0;
    for (const i in e) {
      r = !1;
      break;
    }
    if (r) {
      const i = Object.keys(o);
      for (let a = 0; a < i.length; a++) {
        const l = i[a], c = l.indexOf(":");
        if (c !== -1) {
          const d = l.substring(0, c), f = l.substring(c + 1);
          d === this._name && !this._ref[f] && (this._ref[f] = o[l]);
        } else
          this._ref[l] || (this._ref[l] = o[l]);
      }
    } else {
      this._ref = {};
      const i = e ? Object.keys(e) : [];
      for (let a = 0; a < i.length; a++) {
        const l = i[a], c = Array.isArray(e[l]);
        if (e[l] !== null && c && e[l].length > 0) {
          this._ref[l] = e[l];
          continue;
        }
        const d = `${this._name}:${l}`;
        let f = o[d] || [];
        f.length === 0 && (f = o[l] || []), this._ref[l] = c ? f : f[0] ?? null;
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
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", y)) : window.addEventListener("scroll", y, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), C.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), C.delete(e), C.size === 0 && m && (m = !1, h ? (h.off("scroll", y), h = null) : window.removeEventListener("scroll", y));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(O, L, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), S.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), S.delete(e), S.size === 0 && w && (w = !1, window.removeEventListener(O, L));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let i = 0; i < r.length; i++) {
        const a = r[i], l = g.get(a.target);
        if (l) {
          v[0] = a;
          for (const c of l)
            c(v);
        }
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let o = this._observedResizeElements.get(e);
    o || (o = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, o)), o.add(t);
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
        for (const i of n)
          r.delete(i);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = g.get(e);
    o && o.size === 0 && (g.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = Z(n);
    let r = E.get(o);
    r || (r = { observer: new IntersectionObserver((d) => {
      for (let f = 0; f < d.length; f++) {
        const $ = d[f], P = r.callbacks.get($.target);
        if (P) {
          v[0] = $;
          for (const N of P)
            N(v);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(o, r));
    let i = r.callbacks.get(e);
    i || (i = /* @__PURE__ */ new Set(), r.callbacks.set(e, i), r.observer.observe(e)), i.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let l = a.get(o);
    l || (l = /* @__PURE__ */ new Set(), a.set(o, l)), l.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [o, r] of n) {
        const i = E.get(o);
        if (t)
          r.has(t) && (r.delete(t), i && i.callbacks.has(e) && i.callbacks.get(e).delete(t));
        else {
          if (i && i.callbacks.has(e)) {
            const a = i.callbacks.get(e);
            for (const l of r)
              a.delete(l);
          }
          r.clear();
        }
        if (r.size === 0 && n.delete(o), i) {
          const a = i.callbacks.get(e);
          a && a.size === 0 && (i.callbacks.delete(e), i.observer.unobserve(e)), i.callbacks.size === 0 && (i.observer.disconnect(), E.delete(o));
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
    if (t && window[t] && !(window[t] instanceof Node) && !(window[t] instanceof HTMLCollection) && !(window[t] instanceof Window))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((o, r) => {
      const i = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        i(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        i(), delete n._loadPromise, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (i(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
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
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let i = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            i = !0;
            break;
          }
        i && (r(), n(!0));
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
      const o = t[n], r = e[o];
      if (this._state[o] !== r) {
        this._state[o] = r, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[o] = r;
        const i = typeof r;
        if (i === "boolean" || i === "string") {
          let a = B.get(o);
          a || (a = `data-${o.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, B.set(o, a)), this._pendingAttributeChanges[a] = i === "boolean" ? r ? "true" : "false" : r;
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
        const o = t[n], r = this._pendingAttributeChanges[o];
        this.element.getAttribute(o) !== r && this.element.setAttribute(o, r);
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
      return !I.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), x.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], r = o.getAttribute("data-action");
      if (!r) continue;
      let i = 0;
      for (; i < r.length; ) {
        let a = r.indexOf(" ", i);
        if (a === -1 && (a = r.length), a > i) {
          const l = r.substring(i, a), c = l.indexOf("->");
          let d, f;
          c !== -1 ? (d = l.substring(0, c), f = l.substring(c + 2)) : (d = l, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !I.has(f) ? o.addEventListener(d, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        i = a + 1;
      }
    }
  }
};
class ae extends Q {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class X extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, o = new CustomEvent(e, { detail: n });
    o._name = e, this.dispatchEvent(o);
  }
  on(e, t, n = !1) {
    let o = t._wrappedHandlers;
    o || (o = /* @__PURE__ */ new Map(), t._wrappedHandlers = o);
    let r = o.get(e);
    r || (r = (i) => {
      i.detail && i.detail._name === i._name ? t(i.detail) : t({ ...i.detail, _name: i._name });
    }, o.set(e, r)), this.addEventListener(e, r, { once: n });
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
const le = new X();
let b = null;
function ee(s) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < s.length; o++) {
    const r = s[o];
    for (let i = 0; i < r.removedNodes.length; i++) {
      const a = r.removedNodes[i];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && z(a);
        const l = _(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          z(l[c]);
      }
    }
    for (let i = 0; i < r.addedNodes.length; i++) {
      const a = r.addedNodes[i];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  for (const o of n)
    o.isConnected && J(t, o);
}
function W() {
  typeof document > "u" || (u.get("autoMountComponents") && !b ? (b = new MutationObserver(ee), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const te = u.set;
u.set = function(s, e) {
  te.call(this, s, e), s === "autoMountComponents" && W();
};
typeof window < "u" && setTimeout(W, 0);
export {
  Q as BaseComponent,
  ae as Component,
  u as config,
  M as createInstance,
  ie as destroyInstance,
  le as eventbus,
  oe as getComponentFromElement,
  J as loadComponents,
  ie as removeComponents,
  se as utils
};
