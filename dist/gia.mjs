var F = Object.defineProperty;
var D = (s, e, t) => e in s ? F(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var I = (s, e, t) => D(s, typeof e != "symbol" ? e + "" : e, t);
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
class U {
  constructor() {
    I(this, "_options", {
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
const f = new U();
function L(s, e, t, n) {
  if (s.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), s.__gia_component__;
  try {
    const o = new t(s, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function he(s) {
  return typeof s == "string" && (s = document.getElementById(s), !s) ? null : s.__gia_component__;
}
function G(s, e = document) {
  return typeof s != "string" ? s : e.querySelector(s);
}
function _(s, e = document) {
  return typeof s != "string" ? s : e.querySelectorAll(s);
}
function Y(s, e, t = null) {
  t === null ? s.classList.toggle(e) : s.classList.toggle(e, !!t);
}
function j(s, e, t) {
  if (!s) return s;
  if (s.length !== void 0 && s.nodeType === void 0)
    for (let n = 0; n < s.length; n++)
      s[n].classList[t](e);
  else
    s.classList[t](e);
  return s;
}
function K(s, e) {
  return j(s, e, "remove");
}
function J(s, e) {
  return j(s, e, "add");
}
function V(s, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const o = new CustomEvent(e, n);
  s.dispatchEvent(o);
}
function Z(s, e) {
  let t, n = null, o = null;
  const r = () => {
    if (clearTimeout(t), n) {
      const l = n, a = o;
      n = null, o = null, s.apply(a, l);
    }
  }, i = function() {
    n = arguments, o = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return i.cancel = function() {
    clearTimeout(t), n = null, o = null;
  }, i;
}
const ge = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: J,
  debounce: Z,
  query: G,
  queryAll: _,
  removeClass: K,
  toggleClass: Y,
  triggerEvent: V
}, Symbol.toStringTag, { value: "Module" }));
function Q(s = {}, e = document.documentElement) {
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
  const n = [], o = `${f.get("attrPrefix")}-component`, r = _(`[${o}]`, e), i = r.length;
  for (let l = 0; l < i; l++) {
    const a = r[l];
    if (!a.__gia_component__) {
      const u = a.getAttribute(o);
      typeof s[u] == "function" ? n.push(L(a, u, s[u])) : console.warn(`Constructor "${u}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const a = e.getAttribute(o);
    typeof s[a] == "function" ? n.push(L(e, a, s[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l]._load();
}
function S(s) {
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
    s.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function be(s = document.documentElement) {
  const e = _(`[${f.get("attrPrefix")}-component]`, s);
  for (let t = 0; t < e.length; t++)
    S(e[t]);
}
let m = !1, w = !1;
const y = /* @__PURE__ */ new Set(), X = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), x = X ? "orientationchange" : "resize", C = /* @__PURE__ */ new Set();
let h = null;
const A = { scroll: 0, velocity: 0 }, z = { width: 0, height: 0 }, k = [null], ee = (s) => s(A), te = (s) => s(z), T = (s) => s(k), ne = function(s, e) {
  this.unobserveResize(e);
}, se = function(s, e) {
  this.unobserveIntersection(e);
};
let $ = !1;
function oe() {
  $ = !1, y.forEach(ee);
}
function v(s) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : s && typeof s.scroll == "number" ? (e = s.scroll, t = s.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), A.scroll = e, A.velocity = t, $ || ($ = !0, window.requestAnimationFrame(oe));
}
let R = !1;
function ie() {
  R = !1, C.forEach(te);
}
function B(s) {
  z.width = window.innerWidth, z.height = window.innerHeight, R || (R = !0, window.requestAnimationFrame(ie));
}
let p = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), W = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new Map();
function re(s) {
  const e = s.root || null, t = s.rootMargin || "0px 0px 0px 0px", n = s.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let le = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
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
    const t = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
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
    this.unmount(), this._observedScrollCallbacks && this._observedScrollCallbacks.forEach(this.unobserveScroll, this), this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.forEach(this.unobserveWindowResize, this), this._observedResizeElements && this._observedResizeElements.forEach(ne, this), this._observedIntersectionElements && this._observedIntersectionElements.forEach(se, this);
  }
  observeScroll(e) {
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), y.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), y.delete(e), y.size === 0 && m && (m = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(x, B, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, window.removeEventListener(x, B));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let i = 0; i < r.length; i++) {
        const l = r[i], a = g.get(l.target);
        a && (k[0] = l, a.forEach(T));
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
    const o = re(n);
    let r = E.get(o);
    r || (r = { observer: new IntersectionObserver((u) => {
      for (let d = 0; d < u.length; d++) {
        const O = u[d], M = r.callbacks.get(O.target);
        M && (k[0] = O, M.forEach(T));
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
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
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
            let r = H.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, H.set(t, r)), this._pendingAttributeChanges[r] = o === "boolean" ? n ? "true" : "false" : n;
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
    let t = W.get(e);
    if (!t) {
      t = [];
      const o = Object.getOwnPropertyNames(e);
      for (let r = 0; r < o.length; r++) {
        const i = o[r];
        !N.has(i) && !i.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, i)) == null ? void 0 : n.value) == "function" && t.push(i);
      }
      W.set(e, t);
    }
    for (let o = 0; o < t.length; o++) {
      const r = t[o];
      this[r] = this[r].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], r = o.getAttribute("data-action");
      if (!r) continue;
      let i = 0;
      for (; i < r.length; ) {
        let l = r.indexOf(" ", i);
        if (l === -1 && (l = r.length), l > i) {
          const a = r.substring(i, l), c = a.indexOf("->");
          let u, d;
          c !== -1 ? (u = a.substring(0, c), d = a.substring(c + 2)) : (u = a, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !N.has(d) ? o.addEventListener(u, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        i = l + 1;
      }
    }
  }
};
class pe extends le {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class ae extends EventTarget {
  emit(e, t = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
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
const me = new ae();
let b = null, P = null;
const ce = (s) => {
  s.isConnected && Q(P, s);
};
function fe(s) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < s.length; o++) {
    const r = s[o];
    for (let i = 0; i < r.removedNodes.length; i++) {
      const l = r.removedNodes[i];
      if (l.nodeType === Node.ELEMENT_NODE) {
        l.hasAttribute(e) && S(l);
        const a = _(`[${e}]`, l);
        for (let c = 0; c < a.length; c++)
          S(a[c]);
      }
    }
    for (let i = 0; i < r.addedNodes.length; i++) {
      const l = r.addedNodes[i];
      l.nodeType === Node.ELEMENT_NODE && (l.hasAttribute(e) || l.querySelector(`[${e}]`)) && n.add(l);
    }
  }
  P = t, n.forEach(ce), P = null;
}
function q() {
  typeof document > "u" || (f.get("autoMountComponents") && !b ? (b = new MutationObserver(fe), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const de = f.set;
f.set = function(s, e) {
  de.call(this, s, e), s === "autoMountComponents" && q();
};
typeof window < "u" && setTimeout(q, 0);
export {
  le as BaseComponent,
  pe as Component,
  f as config,
  L as createInstance,
  be as destroyInstance,
  me as eventbus,
  he as getComponentFromElement,
  Q as loadComponents,
  be as removeComponents,
  ge as utils
};
