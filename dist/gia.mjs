var D = Object.defineProperty;
var U = (s, e, t) => e in s ? D(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var L = (s, e, t) => U(s, typeof e != "symbol" ? e + "" : e, t);
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
class G {
  constructor() {
    L(this, "_options", {
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
const d = new G();
function x(s, e, t, n) {
  if (s.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), s.__gia_component__;
  try {
    const o = new t(s, n);
    return d.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function ge(s) {
  return typeof s == "string" && (s = document.getElementById(s), !s) ? null : s.__gia_component__;
}
function Y(s, e = document) {
  return typeof s != "string" ? s : e.querySelector(s);
}
function b(s, e = document) {
  return typeof s != "string" ? s : e.querySelectorAll(s);
}
function K(s, e, t = null) {
  t === null ? s.classList.toggle(e) : s.classList.toggle(e, !!t);
}
function q(s, e, t) {
  if (!s) return s;
  if (s.length !== void 0 && s.nodeType === void 0)
    for (let n = 0; n < s.length; n++)
      s[n].classList[t](e);
  else
    s.classList[t](e);
  return s;
}
function J(s, e) {
  return q(s, e, "remove");
}
function V(s, e) {
  return q(s, e, "add");
}
function Z(s, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const o = new CustomEvent(e, n);
  s.dispatchEvent(o);
}
function Q(s, e) {
  let t, n = null, o = null;
  const r = () => {
    clearTimeout(t), n && s.apply(o, n);
  }, i = function() {
    n = arguments, o = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return i.cancel = function() {
    clearTimeout(t), n = null, o = null;
  }, i;
}
const _e = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: V,
  debounce: Q,
  query: Y,
  queryAll: b,
  removeClass: J,
  toggleClass: K,
  triggerEvent: Z
}, Symbol.toStringTag, { value: "Module" }));
function X(s = {}, e = document.documentElement) {
  if (!s) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in s) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${d.get("attrPrefix")}-component`, r = b(`[${o}]`, e), i = r.length;
  for (let l = 0; l < i; l++) {
    const a = r[l];
    if (!a.__gia_component__) {
      const u = a.getAttribute(o);
      typeof s[u] == "function" ? n.push(x(a, u, s[u])) : console.warn(`Constructor "${u}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const a = e.getAttribute(o);
    typeof s[a] == "function" ? n.push(x(e, a, s[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l]._load();
}
function A(s) {
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
    s.__gia_component__ = null, e.element && (e.element = null), d.get("log") && console.info(`Removed component "${t}".`);
  }
}
function be(s = document.documentElement) {
  const e = b(`[${d.get("attrPrefix")}-component]`, s);
  for (let t = 0; t < e.length; t++)
    A(e[t]);
}
let m = !1, w = !1;
const y = /* @__PURE__ */ new Set(), ee = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), T = ee ? "orientationchange" : "resize", C = /* @__PURE__ */ new Set();
let h = null;
const z = { scroll: 0, velocity: 0 }, k = { width: 0, height: 0 }, $ = [null], te = (s) => s(z), ne = (s) => s(k), B = (s) => s($), se = function(s, e) {
  this.unobserveResize(e);
}, oe = function(s, e) {
  this.unobserveIntersection(e);
};
let R = !1;
function ie() {
  R = !1, y.forEach(te);
}
function v(s) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : s && typeof s.scroll == "number" ? (e = s.scroll, t = s.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), z.scroll = e, z.velocity = t, R || (R = !0, window.requestAnimationFrame(ie));
}
let P = !1;
function re() {
  P = !1, C.forEach(ne);
}
function N(s) {
  k.width = window.innerWidth, k.height = window.innerHeight, P || (P = !0, window.requestAnimationFrame(re));
}
let p = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), W = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), H = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new Map();
function le(s) {
  const e = s.root || null, t = s.rootMargin || "0px 0px 0px 0px", n = s.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let ae = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), d.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${d.get("attrPrefix")}-ref`, n = b(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < n.length; i++) {
      const l = n[i], a = l.getAttribute(t);
      let c = o[a];
      c === void 0 && (c = [], o[a] = c), c.push(l);
    }
    let r = !0;
    for (const i in e) {
      r = !1;
      break;
    }
    if (r)
      for (const i in o) {
        const l = i.indexOf(":");
        if (l !== -1) {
          const a = i.substring(0, l), c = i.substring(l + 1);
          a === this._name && !this._ref[c] && (this._ref[c] = o[i]);
        } else
          this._ref[i] || (this._ref[i] = o[i]);
      }
    else {
      this._ref = {};
      for (const i in e) {
        if (!Object.prototype.hasOwnProperty.call(e, i)) continue;
        const l = Array.isArray(e[i]);
        if (e[i] !== null && l && e[i].length > 0) {
          this._ref[i] = e[i];
          continue;
        }
        const a = `${this._name}:${i}`;
        let c = o[a] || [];
        c.length === 0 && (c = o[i] || []), this._ref[i] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${d.get("attrPrefix")}-options`);
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
    this.unmount(), this._observedScrollCallbacks && this._observedScrollCallbacks.forEach(this.unobserveScroll, this), this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.forEach(this.unobserveWindowResize, this), this._observedResizeElements && this._observedResizeElements.forEach(se, this), this._observedIntersectionElements && this._observedIntersectionElements.forEach(oe, this);
  }
  observeScroll(e) {
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), y.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), y.delete(e), y.size === 0 && m && (m = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(T, N, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, window.removeEventListener(T, N));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let i = 0; i < r.length; i++) {
        const l = r[i], a = g.get(l.target);
        a && ($[0] = l, a.forEach(B));
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
      r && n.forEach(Set.prototype.delete, r), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = g.get(e);
    o && o.size === 0 && (g.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = le(n);
    let r = E.get(o);
    r || (r = { observer: new IntersectionObserver((u) => {
      for (let f = 0; f < u.length; f++) {
        const M = u[f], I = r.callbacks.get(M.target);
        I && ($[0] = M, I.forEach(B));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(o, r));
    let i = r.callbacks.get(e);
    i || (i = /* @__PURE__ */ new Set(), r.callbacks.set(e, i), r.observer.observe(e)), i.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let l = this._observedIntersectionElements.get(e);
    l || (l = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, l));
    let a = l.get(o);
    a || (a = /* @__PURE__ */ new Set(), l.set(o, a)), a.add(t);
  }
  _processIntersectionHash(e, t) {
    const n = E.get(t), o = this._currentUnobserveElement, r = this._currentUnobserveCallback;
    if (r)
      e.has(r) && (e.delete(r), n && n.callbacks.has(o) && n.callbacks.get(o).delete(r));
    else {
      if (n && n.callbacks.has(o)) {
        const i = n.callbacks.get(o);
        e.forEach(Set.prototype.delete, i);
      }
      e.clear();
    }
    if (e.size === 0 && this._observedIntersectionElements.get(o).delete(t), n) {
      const i = n.callbacks.get(o);
      i && i.size === 0 && (n.callbacks.delete(o), n.observer.unobserve(o)), n.callbacks.size === 0 && (n.observer.disconnect(), E.delete(t));
    }
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (this._currentUnobserveElement = e, this._currentUnobserveCallback = t, n.forEach(this._processIntersectionHash, this), this._currentUnobserveElement = null, this._currentUnobserveCallback = null, n.size === 0 && this._observedIntersectionElements.delete(e));
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
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
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
    return `[${d.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this._state[t] !== n) {
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[t] = n;
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = j.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, j.set(t, r)), this._pendingAttributeChanges[r] = o === "boolean" ? n ? "true" : "false" : n;
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
    var n;
    const e = Object.getPrototypeOf(this);
    let t = H.get(e);
    if (!t) {
      t = [];
      const o = Object.getOwnPropertyNames(e);
      for (let r = 0; r < o.length; r++) {
        const i = o[r];
        !W.has(i) && !i.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, i)) == null ? void 0 : n.value) == "function" && t.push(i);
      }
      H.set(e, t);
    }
    for (let o = 0; o < t.length; o++) {
      const r = t[o];
      this[r] = this[r].bind(this);
    }
  }
  _autoBindActions() {
    const e = b("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], r = o.getAttribute("data-action");
      if (!r) continue;
      let i = 0;
      for (; i < r.length; ) {
        let l = r.indexOf(" ", i);
        if (l === -1 && (l = r.length), l > i) {
          const a = r.substring(i, l), c = a.indexOf("->");
          let u, f;
          c !== -1 ? (u = a.substring(0, c), f = a.substring(c + 2)) : (u = a, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !W.has(f) ? o.addEventListener(u, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        i = l + 1;
      }
    }
  }
};
class me extends ae {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class ce extends EventTarget {
  emit(e, t = {}) {
    d.get("log") && console.info(`Emitting event '${e}'`);
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
const we = new ce();
let _ = null, O = null;
const S = /* @__PURE__ */ new Set(), de = (s) => {
  s.isConnected && X(O, s);
};
function fe(s) {
  const e = `${d.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  S.clear();
  for (let n = 0; n < s.length; n++) {
    const o = s[n];
    for (let r = 0; r < o.removedNodes.length; r++) {
      const i = o.removedNodes[r];
      if (i.nodeType === Node.ELEMENT_NODE) {
        i.hasAttribute(e) && A(i);
        const l = b(`[${e}]`, i);
        for (let a = 0; a < l.length; a++)
          A(l[a]);
      }
    }
    for (let r = 0; r < o.addedNodes.length; r++) {
      const i = o.addedNodes[r];
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) || i.querySelector(`[${e}]`)) && S.add(i);
    }
  }
  O = t, S.forEach(de), O = null;
}
function F() {
  typeof document > "u" || (d.get("autoMountComponents") && !_ ? (_ = new MutationObserver(fe), _.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !d.get("autoMountComponents") && _ && (_.disconnect(), _ = null));
}
const ue = d.set;
d.set = function(s, e) {
  ue.call(this, s, e), s === "autoMountComponents" && F();
};
typeof window < "u" && setTimeout(F, 0);
export {
  ae as BaseComponent,
  me as Component,
  d as config,
  x as createInstance,
  be as destroyInstance,
  we as eventbus,
  ge as getComponentFromElement,
  X as loadComponents,
  be as removeComponents,
  _e as utils
};
