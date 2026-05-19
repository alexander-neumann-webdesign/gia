var O = Object.defineProperty;
var z = (a, e, t) => e in a ? O(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var y = (a, e, t) => z(a, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (a) => {
  if (typeof a != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", a);
    return;
  }
  const e = a.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = a;
});
class I {
  constructor() {
    y(this, "_options", {
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
const u = new I();
function C(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const s = new t(a, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function w(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function b(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function R(a = {}, e = document.documentElement) {
  if (!a) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const r in a) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${u.get("attrPrefix")}-component`, o = b(`[${s}]`, e), i = o.length;
  for (let r = 0; r < i; r++) {
    const c = o[r];
    if (!w(c)) {
      const f = c.getAttribute(s);
      typeof a[f] == "function" ? n.push(C(c, f, a[f])) : console.warn(`Constructor "${f}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !w(e)) {
    const c = e.getAttribute(s);
    typeof a[c] == "function" ? n.push(C(e, c, a[c])) : console.warn(`Constructor "${c}" not found.`);
  }
  for (let r = 0; r < n.length; r++)
    n[r]._load();
}
function v(a) {
  const e = w(a);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    a.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function H(a = document.documentElement) {
  const e = b(`[${u.get("attrPrefix")}-component]`, a);
  for (let t = 0; t < e.length; t++)
    v(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), A = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), $ = /* @__PURE__ */ new WeakMap(), S = /* @__PURE__ */ new Map();
function x(a) {
  const e = a.root || null, t = a.rootMargin || "0px 0px 0px 0px", n = a.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let N = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = b(`[${t}]`, this.element), s = {};
    for (let r = 0; r < n.length; r++) {
      const c = n[r], l = c.getAttribute(t);
      let f = s[l];
      f === void 0 && (f = [], s[l] = f), f.push(c);
    }
    const o = e ? Object.keys(e) : [];
    if (o.length === 0) {
      const r = Object.keys(s);
      for (let c = 0; c < r.length; c++) {
        const l = r[c], f = l.indexOf(":");
        if (f !== -1) {
          const d = l.substring(0, f), m = l.substring(f + 1);
          d === this._name && !this._ref[m] && (this._ref[m] = s[l]);
        } else
          this._ref[l] || (this._ref[l] = s[l]);
      }
    } else {
      this._ref = {};
      for (let r = 0; r < o.length; r++) {
        const c = o[r], l = Array.isArray(e[c]);
        if (e[c] !== null && l && e[c].length > 0) {
          this._ref[c] = e[c];
          continue;
        }
        const f = `${this._name}:${c}`;
        let d = s[f] || [];
        d.length === 0 && (d = s[c] || []), this._ref[c] = l ? d : d[0] ?? null;
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
        } catch (o) {
          console.error(`Failed to parse options for component "${this._name}": ${o.message}`);
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
    if (this.unmount(), this._observedResizeElements)
      for (const e of this._observedResizeElements.keys())
        this.unobserveResize(e);
    if (this._observedIntersectionElements)
      for (const e of this._observedIntersectionElements.keys())
        this.unobserveIntersection(e);
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((o) => {
      for (let i = 0; i < o.length; i++) {
        const r = o[i], c = h.get(r.target);
        if (c) {
          const l = [r];
          for (const f of c)
            f(l);
        }
      }
    }));
    let n = h.get(e);
    n || (n = /* @__PURE__ */ new Set(), h.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let s = this._observedResizeElements.get(e);
    s || (s = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, s)), s.add(t);
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const o = h.get(e);
      o && o.delete(t);
    } else {
      const o = h.get(e);
      if (o)
        for (const i of n)
          o.delete(i);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = x(n);
    let o = _.get(s);
    o || (o = { observer: new IntersectionObserver((f) => {
      for (let d = 0; d < f.length; d++) {
        const m = f[d], E = o.callbacks.get(m.target);
        if (E) {
          const P = [m];
          for (const M of E)
            M(P);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(s, o));
    let i = o.callbacks.get(e);
    i || (i = /* @__PURE__ */ new Set(), o.callbacks.set(e, i), o.observer.observe(e)), i.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let r = this._observedIntersectionElements.get(e);
    r || (r = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, r));
    let c = r.get(s);
    c || (c = /* @__PURE__ */ new Set(), r.set(s, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, o] of n) {
        const i = _.get(s);
        if (t)
          o.has(t) && (o.delete(t), i && i.callbacks.has(e) && i.callbacks.get(e).delete(t));
        else {
          if (i && i.callbacks.has(e)) {
            const r = i.callbacks.get(e);
            for (const c of o)
              r.delete(c);
          }
          o.clear();
        }
        if (o.size === 0 && n.delete(s), i) {
          const r = i.callbacks.get(e);
          r && r.size === 0 && (i.callbacks.delete(e), i.observer.unobserve(e)), i.callbacks.size === 0 && (i.observer.disconnect(), _.delete(s));
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
    if (t && window[t])
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((s, o) => {
      const i = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        i(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        i(), delete n._loadPromise, o(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (i(), o(new Error(`Script tag '${e}' has no src or data-src.`)));
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
      const o = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        o(), n(!0);
      }, t.onerror = () => {
        o(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        o(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let i = !1;
        for (let r = 0; r < document.styleSheets.length; r++)
          if (document.styleSheets[r].href === t.href) {
            i = !0;
            break;
          }
        i && (o(), n(!0));
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
      const s = t[n], o = e[s];
      if (this._state[s] !== o) {
        this._state[s] = o, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[s] = o;
        const i = typeof o;
        if (i === "boolean" || i === "string") {
          let r = S.get(s);
          r || (r = `data-${s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, S.set(s, r)), this._pendingAttributeChanges[r] = i === "boolean" ? o ? "true" : "false" : o;
        }
      }
    }
  }
  _flushStateChanges() {
    const e = this._pendingAttributeChanges ? Object.keys(this._pendingAttributeChanges) : [];
    for (let t = 0; t < e.length; t++) {
      const n = e[t], s = this._pendingAttributeChanges[n];
      this.element.getAttribute(n) !== s && this.element.setAttribute(n, s);
    }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = $.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !A.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), $.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = b("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], o = s.getAttribute("data-action");
      if (!o) continue;
      let i = 0;
      for (; i < o.length; ) {
        let r = o.indexOf(" ", i);
        if (r === -1 && (r = o.length), r > i) {
          const c = o.substring(i, r), l = c.indexOf("->");
          let f, d;
          l !== -1 ? (f = c.substring(0, l), d = c.substring(l + 2)) : (f = c, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !A.has(d) ? s.addEventListener(f, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        i = r + 1;
      }
    }
  }
};
class F extends N {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class L extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, n = !1) {
    let s = t._wrappedHandlers;
    s || (s = /* @__PURE__ */ new Map(), t._wrappedHandlers = s);
    let o = s.get(e);
    o || (o = (i) => {
      i.detail && i.detail._name === i._name ? t(i.detail) : t({ ...i.detail, _name: i._name });
    }, s.set(e, o)), this.addEventListener(e, o, { once: n });
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
const q = new L();
let g = null;
function B(a) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < a.length; s++) {
    const o = a[s];
    for (let i = 0; i < o.removedNodes.length; i++) {
      const r = o.removedNodes[i];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && v(r);
        const c = b(`[${e}]`, r);
        for (let l = 0; l < c.length; l++)
          v(c[l]);
      }
    }
    for (let i = 0; i < o.addedNodes.length; i++) {
      const r = o.addedNodes[i];
      r.nodeType === Node.ELEMENT_NODE && n.add(r);
    }
  }
  for (const s of n)
    s.isConnected && R(t, s);
}
function k() {
  typeof document > "u" || (u.get("autoMountComponents") && !g ? (g = new MutationObserver(B), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const j = u.set;
u.set = function(a, e) {
  j.call(this, a, e), a === "autoMountComponents" && k();
};
typeof window < "u" && setTimeout(k, 0);
export {
  N as BaseComponent,
  F as Component,
  u as config,
  C as createInstance,
  H as destroyInstance,
  q as eventbus,
  w as getComponentFromElement,
  R as loadComponents,
  H as removeComponents
};
