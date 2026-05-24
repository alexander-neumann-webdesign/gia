var W = Object.defineProperty;
var D = (o, e, t) => e in o ? W(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var $ = (o, e, t) => D(o, typeof e != "symbol" ? e + "" : e, t);
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
class H {
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
const u = new H();
function R(o, e, t, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const s = new t(o, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function se(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function q(o, e = document) {
  return typeof o != "string" ? o : e.querySelector(o);
}
function _(o, e = document) {
  return typeof o != "string" ? o : e.querySelectorAll(o);
}
function F(o, e, t = null) {
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
function G(o, e) {
  return x(o, e, "remove");
}
function K(o, e) {
  return x(o, e, "add");
}
function Y(o, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  o.dispatchEvent(s);
}
function U(o, e) {
  let t, n = null;
  const s = () => {
    clearTimeout(t), n && o(...n);
  }, i = function(...r) {
    n = r, clearTimeout(t), t = setTimeout(s, e);
  };
  return i.cancel = function() {
    clearTimeout(t), n = null;
  }, i;
}
function S(o) {
  return o ? o.toLowerCase().replace(/([a-z])(\d)/g, "$1 $2").replace(/(\d)([a-z])/g, "$1 $2") : "";
}
function J(o, e) {
  if (o = S(o), e = S(e), o.includes(e)) return !0;
  if (e.length === 0 || e.length > o.length) return !1;
  let t = 0;
  return e.length >= 3 && (t = 1), e.length >= 6 && (t = 2), t === 0 ? !1 : B(o, e) <= t;
}
function B(o, e) {
  const t = e.length, n = o.length;
  let s = Array(n + 1).fill(0), i = Array(n + 1).fill(0);
  for (let a = 0; a <= n; a++)
    s[a] = 0;
  let r = 1 / 0;
  for (let a = 1; a <= t; a++) {
    i[0] = a;
    for (let l = 1; l <= n; l++)
      e[a - 1] === o[l - 1] ? i[l] = s[l - 1] : i[l] = 1 + Math.min(
        s[l],
        // Deletion
        i[l - 1],
        // Insertion
        s[l - 1]
        // Substitution
      );
    for (let l = 0; l <= n; l++)
      s[l] = i[l];
  }
  for (let a = 1; a <= n; a++)
    i[a] < r && (r = i[a]);
  return r;
}
const ie = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: K,
  calculateMinEditDistance: B,
  debounce: U,
  fuzzyMatch: J,
  normalizeSearch: S,
  query: q,
  queryAll: _,
  removeClass: G,
  toggleClass: F,
  triggerEvent: Y
}, Symbol.toStringTag, { value: "Module" }));
function V(o = {}, e = document.documentElement) {
  if (!o) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const a in o) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${u.get("attrPrefix")}-component`, i = _(`[${s}]`, e), r = i.length;
  for (let a = 0; a < r; a++) {
    const l = i[a];
    if (!l.__gia_component__) {
      const d = l.getAttribute(s);
      typeof o[d] == "function" ? n.push(R(l, d, o[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !e.__gia_component__) {
    const l = e.getAttribute(s);
    typeof o[l] == "function" ? n.push(R(e, l, o[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
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
    o.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function re(o = document.documentElement) {
  const e = _(`[${u.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    A(e[t]);
}
let p = !1, w = !1;
const E = /* @__PURE__ */ new Set(), Z = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), M = Z ? "orientationchange" : "resize", C = /* @__PURE__ */ new Set();
let h = null;
function v(o) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : o && typeof o.scroll == "number" ? (e = o.scroll, t = o.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0);
  const n = { scroll: e, velocity: t };
  for (const s of E)
    s(n);
}
function P(o) {
  const e = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  for (const t of C)
    t(e);
}
let m = null;
const g = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map(), O = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), L = /* @__PURE__ */ new WeakMap(), I = /* @__PURE__ */ new Map();
function Q(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let X = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const a = n[r], l = a.getAttribute(t);
      let c = s[l];
      c === void 0 && (c = [], s[l] = c), c.push(a);
    }
    let i = !0;
    for (const r in e) {
      i = !1;
      break;
    }
    if (i) {
      const r = Object.keys(s);
      for (let a = 0; a < r.length; a++) {
        const l = r[a], c = l.indexOf(":");
        if (c !== -1) {
          const d = l.substring(0, c), f = l.substring(c + 1);
          d === this._name && !this._ref[f] && (this._ref[f] = s[l]);
        } else
          this._ref[l] || (this._ref[l] = s[l]);
      }
    } else {
      this._ref = {};
      const r = e ? Object.keys(e) : [];
      for (let a = 0; a < r.length; a++) {
        const l = r[a], c = Array.isArray(e[l]);
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
    typeof window > "u" || (p || (p = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), E.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), E.delete(e), E.size === 0 && p && (p = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (w || (w = !0, window.addEventListener(M, P, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && w && (w = !1, window.removeEventListener(M, P));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    m || (m = new ResizeObserver((i) => {
      for (let r = 0; r < i.length; r++) {
        const a = i[r], l = g.get(a.target);
        if (l) {
          const c = [a];
          for (const d of l)
            d(c);
        }
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), m.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
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
        for (const r of n)
          i.delete(r);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = g.get(e);
    s && s.size === 0 && (g.delete(e), m && m.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = Q(n);
    let i = y.get(s);
    i || (i = { observer: new IntersectionObserver((d) => {
      for (let f = 0; f < d.length; f++) {
        const k = d[f], z = i.callbacks.get(k.target);
        if (z) {
          const N = [k];
          for (const T of z)
            T(N);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, y.set(s, i));
    let r = i.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), i.callbacks.set(e, r), i.observer.observe(e)), r.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
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
        const r = y.get(s);
        if (t)
          i.has(t) && (i.delete(t), r && r.callbacks.has(e) && r.callbacks.get(e).delete(t));
        else {
          if (r && r.callbacks.has(e)) {
            const a = r.callbacks.get(e);
            for (const l of i)
              a.delete(l);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(s), r) {
          const a = r.callbacks.get(e);
          a && a.size === 0 && (r.callbacks.delete(e), r.observer.unobserve(e)), r.callbacks.size === 0 && (r.observer.disconnect(), y.delete(s));
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
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
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
        let r = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            r = !0;
            break;
          }
        r && (i(), n(!0));
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
        const r = typeof i;
        if (r === "boolean" || r === "string") {
          let a = I.get(s);
          a || (a = `data-${s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, I.set(s, a)), this._pendingAttributeChanges[a] = r === "boolean" ? i ? "true" : "false" : i;
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
    let t = L.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !O.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), L.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], i = s.getAttribute("data-action");
      if (!i) continue;
      let r = 0;
      for (; r < i.length; ) {
        let a = i.indexOf(" ", r);
        if (a === -1 && (a = i.length), a > r) {
          const l = i.substring(r, a), c = l.indexOf("->");
          let d, f;
          c !== -1 ? (d = l.substring(0, c), f = l.substring(c + 2)) : (d = l, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !O.has(f) ? s.addEventListener(d, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        r = a + 1;
      }
    }
  }
};
class le extends X {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class ee extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, n = !1) {
    let s = t._wrappedHandlers;
    s || (s = /* @__PURE__ */ new Map(), t._wrappedHandlers = s);
    let i = s.get(e);
    i || (i = (r) => {
      r.detail && r.detail._name === r._name ? t(r.detail) : t({ ...r.detail, _name: r._name });
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
const ce = new ee();
let b = null;
function te(o) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < o.length; s++) {
    const i = o[s];
    for (let r = 0; r < i.removedNodes.length; r++) {
      const a = i.removedNodes[r];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && A(a);
        const l = _(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          A(l[c]);
      }
    }
    for (let r = 0; r < i.addedNodes.length; r++) {
      const a = i.addedNodes[r];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  for (const s of n)
    s.isConnected && V(t, s);
}
function j() {
  typeof document > "u" || (u.get("autoMountComponents") && !b ? (b = new MutationObserver(te), b.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && b && (b.disconnect(), b = null));
}
const ne = u.set;
u.set = function(o, e) {
  ne.call(this, o, e), o === "autoMountComponents" && j();
};
typeof window < "u" && setTimeout(j, 0);
export {
  X as BaseComponent,
  le as Component,
  u as config,
  R as createInstance,
  re as destroyInstance,
  ce as eventbus,
  se as getComponentFromElement,
  V as loadComponents,
  re as removeComponents,
  ie as utils
};
