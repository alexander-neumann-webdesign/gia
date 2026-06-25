var q = Object.defineProperty;
var D = (o, e, t) => e in o ? q(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var M = (o, e, t) => D(o, typeof e != "symbol" ? e + "" : e, t);
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
class F {
  constructor() {
    M(this, "_options", {
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
const d = new F();
function L(o, e, t, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const s = new t(o, n);
    return d.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function ue(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function U(o, e = document) {
  return typeof o != "string" ? o : e.querySelector(o);
}
function _(o, e = document) {
  return typeof o != "string" ? o : e.querySelectorAll(o);
}
function G(o, e, t = null) {
  t === null ? o.classList.toggle(e) : o.classList.toggle(e, !!t);
}
function H(o, e, t) {
  if (!o) return o;
  if (o.length !== void 0 && o.nodeType === void 0)
    for (let n = 0; n < o.length; n++)
      o[n].classList[t](e);
  else
    o.classList[t](e);
  return o;
}
function Y(o, e) {
  return H(o, e, "remove");
}
function K(o, e) {
  return H(o, e, "add");
}
function J(o, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  o.dispatchEvent(s);
}
function V(o, e) {
  let t, n = null, s = null;
  const r = () => {
    if (clearTimeout(t), n) {
      const l = s, a = n;
      s = null, n = null, o.apply(l, a);
    }
  }, i = function() {
    n = arguments, s = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return i.cancel = function() {
    clearTimeout(t), n = null, s = null;
  }, i;
}
const he = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: K,
  debounce: V,
  query: U,
  queryAll: _,
  removeClass: Y,
  toggleClass: G,
  triggerEvent: J
}, Symbol.toStringTag, { value: "Module" }));
function Z(o = {}, e = document.documentElement) {
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
  const n = [], s = `${d.get("attrPrefix")}-component`, r = _(`[${s}]`, e), i = r.length;
  for (let l = 0; l < i; l++) {
    const a = r[l];
    if (!a.__gia_component__) {
      const u = a.getAttribute(s);
      typeof o[u] == "function" ? n.push(L(a, u, o[u])) : console.warn(`Constructor "${u}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !e.__gia_component__) {
    const a = e.getAttribute(s);
    typeof o[a] == "function" ? n.push(L(e, a, o[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let l = 0; l < n.length; l++)
    n[l]._load();
}
function A(o) {
  if (!o) return;
  let e = o.__gia_component__;
  if (!e && typeof o == "string") {
    const t = document.getElementById(o);
    t && (e = t.__gia_component__, o = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    o.__gia_component__ = null, e.element && (e.element = null), d.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ge(o = document.documentElement) {
  const e = _(`[${d.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    A(e[t]);
}
let m = !1, w = !1;
const y = /* @__PURE__ */ new Set(), Q = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), I = Q ? "orientationchange" : "resize", C = /* @__PURE__ */ new Set();
let h = null;
const z = { scroll: 0, velocity: 0 }, k = { width: 0, height: 0 }, $ = [null], X = (o) => o(z), ee = (o) => o(k), x = (o) => o($), te = function(o, e) {
  this.unobserveResize(e);
}, ne = function(o, e) {
  this.unobserveIntersection(e);
};
function oe() {
  y.forEach(X);
}
function v(o) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : o && typeof o.scroll == "number" ? (e = o.scroll, t = o.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), z.scroll = e, z.velocity = t, oe();
}
function se() {
  C.forEach(ee);
}
function B(o) {
  k.width = window.innerWidth, k.height = window.innerHeight, se();
}
let p = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), N = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new Map();
function ie(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let re = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), d.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${d.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < n.length; i++) {
      const l = n[i], a = l.getAttribute(t);
      let c = s[a];
      c === void 0 && (c = [], s[a] = c), c.push(l);
    }
    let r = !0;
    for (const i in e) {
      r = !1;
      break;
    }
    if (r)
      for (const i in s) {
        const l = i.indexOf(":");
        if (l !== -1) {
          const a = i.substring(0, l), c = i.substring(l + 1);
          a === this._name && !this._ref[c] && (this._ref[c] = s[i]);
        } else
          this._ref[i] || (this._ref[i] = s[i]);
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
        let c = s[a] || [];
        c.length === 0 && (c = s[i] || []), this._ref[i] = l ? c : c[0] ?? null;
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
    this.unmount(), this._observedScrollCallbacks && this._observedScrollCallbacks.forEach(this.unobserveScroll, this), this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.forEach(this.unobserveWindowResize, this), this._observedResizeElements && this._observedResizeElements.forEach(te, this), this._observedIntersectionElements && this._observedIntersectionElements.forEach(ne, this);
  }
  observeScroll(e) {
    typeof window > "u" || (m || (m = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), y.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), y.delete(e), y.size === 0 && m && (m = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(I, B, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, window.removeEventListener(I, B));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let i = 0; i < r.length; i++) {
        const l = r[i], a = g.get(l.target);
        a && ($[0] = l, a.forEach(x));
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
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
      r && n.forEach(Set.prototype.delete, r), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = g.get(e);
    s && s.size === 0 && (g.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = ie(n);
    let r = E.get(s);
    r || (r = { observer: new IntersectionObserver((u) => {
      for (let f = 0; f < u.length; f++) {
        const R = u[f], O = r.callbacks.get(R.target);
        O && ($[0] = R, O.forEach(x));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(s, r));
    let i = r.callbacks.get(e);
    i || (i = /* @__PURE__ */ new Set(), r.callbacks.set(e, i), r.observer.observe(e)), i.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let l = this._observedIntersectionElements.get(e);
    l || (l = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, l));
    let a = l.get(s);
    a || (a = /* @__PURE__ */ new Set(), l.set(s, a)), a.add(t);
  }
  _processIntersectionHash(e, t) {
    const n = E.get(t), s = this._currentUnobserveElement, r = this._currentUnobserveCallback;
    if (r)
      e.has(r) && (e.delete(r), n && n.callbacks.has(s) && n.callbacks.get(s).delete(r));
    else {
      if (n && n.callbacks.has(s)) {
        const i = n.callbacks.get(s);
        e.forEach(Set.prototype.delete, i);
      }
      e.clear();
    }
    if (e.size === 0 && this._observedIntersectionElements.get(s).delete(t), n) {
      const i = n.callbacks.get(s);
      i && i.size === 0 && (n.callbacks.delete(s), n.observer.unobserve(s)), n.callbacks.size === 0 && (n.observer.disconnect(), E.delete(t));
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
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((s, r) => {
      const i = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        i(), s(t ? window[t] : !0);
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
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = W.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, W.set(t, r)), this._pendingAttributeChanges[r] = s === "boolean" ? n ? "true" : "false" : n;
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
    let t = N.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let r = 0; r < s.length; r++) {
        const i = s[r];
        !T.has(i) && !i.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, i)) == null ? void 0 : n.value) == "function" && t.push(i);
      }
      N.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const r = t[s];
      this[r] = this[r].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], r = s.getAttribute("data-action");
      if (!r) continue;
      let i = 0;
      for (; i < r.length; ) {
        let l = r.indexOf(" ", i);
        if (l === -1 && (l = r.length), l > i) {
          const a = r.substring(i, l), c = a.indexOf("->");
          let u, f;
          c !== -1 ? (u = a.substring(0, c), f = a.substring(c + 2)) : (u = a, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !T.has(f) ? s.addEventListener(u, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        i = l + 1;
      }
    }
  }
};
class _e extends re {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class le extends EventTarget {
  emit(e, t = {}) {
    d.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, n = !1) {
    let s = t._wrappedHandlers;
    s || (s = /* @__PURE__ */ new Map(), t._wrappedHandlers = s);
    let r = s.get(e);
    r || (r = (i) => {
      i.detail && i.detail._name === i._name ? t(i.detail) : t({ ...i.detail, _name: i._name });
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
const pe = new le();
let b = null, P = null;
const S = /* @__PURE__ */ new Set(), ae = (o) => {
  o.isConnected && Z(P, o);
};
function ce(o) {
  const e = `${d.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  S.clear();
  for (let n = 0; n < o.length; n++) {
    const s = o[n];
    for (let r = 0; r < s.removedNodes.length; r++) {
      const i = s.removedNodes[r];
      if (i.nodeType === Node.ELEMENT_NODE) {
        i.hasAttribute(e) && A(i);
        const l = _(`[${e}]`, i);
        for (let a = 0; a < l.length; a++)
          A(l[a]);
      }
    }
    for (let r = 0; r < s.addedNodes.length; r++) {
      const i = s.addedNodes[r];
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) || i.querySelector(`[${e}]`)) && S.add(i);
    }
  }
  P = t, S.forEach(ae), P = null;
}
function j() {
  typeof document > "u" || (d.get("autoMountComponents") && !b ? (b = new MutationObserver(ce), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !d.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const de = d.set;
d.set = function(o, e) {
  de.call(this, o, e), o === "autoMountComponents" && j();
};
typeof window < "u" && setTimeout(j, 0);
export {
  re as BaseComponent,
  _e as Component,
  d as config,
  L as createInstance,
  A as destroyInstance,
  pe as eventbus,
  ue as getComponentFromElement,
  Z as loadComponents,
  ge as removeComponents,
  he as utils
};
