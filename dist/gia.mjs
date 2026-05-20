var M = Object.defineProperty;
var O = (a, e, t) => e in a ? M(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var v = (a, e, t) => O(a, typeof e != "symbol" ? e + "" : e, t);
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
    v(this, "_options", {
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
function y(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const o = new t(a, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function D(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function _(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function z(a = {}, e = document.documentElement) {
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
  const n = [], o = `${u.get("attrPrefix")}-component`, s = _(`[${o}]`, e), i = s.length;
  for (let r = 0; r < i; r++) {
    const c = s[r];
    if (!c.__gia_component__) {
      const f = c.getAttribute(o);
      typeof a[f] == "function" ? n.push(y(c, f, a[f])) : console.warn(`Constructor "${f}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const c = e.getAttribute(o);
    typeof a[c] == "function" ? n.push(y(e, c, a[c])) : console.warn(`Constructor "${c}" not found.`);
  }
  for (let r = 0; r < n.length; r++)
    n[r]._load();
}
function w(a) {
  if (!a) return;
  let e = a.__gia_component__;
  if (!e && typeof a == "string") {
    const t = document.getElementById(a);
    t && (e = t.__gia_component__, a = t);
  }
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
  const e = _(`[${u.get("attrPrefix")}-component]`, a);
  for (let t = 0; t < e.length; t++)
    w(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), A = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new Map();
function R(a) {
  const e = a.root || null, t = a.rootMargin || "0px 0px 0px 0px", n = a.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let x = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const c = n[r], l = c.getAttribute(t);
      let f = o[l];
      f === void 0 && (f = [], o[l] = f), f.push(c);
    }
    const s = e ? Object.keys(e) : [];
    if (s.length === 0) {
      const r = Object.keys(o);
      for (let c = 0; c < r.length; c++) {
        const l = r[c], f = l.indexOf(":");
        if (f !== -1) {
          const d = l.substring(0, f), m = l.substring(f + 1);
          d === this._name && !this._ref[m] && (this._ref[m] = o[l]);
        } else
          this._ref[l] || (this._ref[l] = o[l]);
      }
    } else {
      this._ref = {};
      for (let r = 0; r < s.length; r++) {
        const c = s[r], l = Array.isArray(e[c]);
        if (e[c] !== null && l && e[c].length > 0) {
          this._ref[c] = e[c];
          continue;
        }
        const f = `${this._name}:${c}`;
        let d = o[f] || [];
        d.length === 0 && (d = o[c] || []), this._ref[c] = l ? d : d[0] ?? null;
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
        } catch (s) {
          console.error(`Failed to parse options for component "${this._name}": ${s.message}`);
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
    p || (p = new ResizeObserver((s) => {
      for (let i = 0; i < s.length; i++) {
        const r = s[i], c = h.get(r.target);
        if (c) {
          const l = [r];
          for (const f of c)
            f(l);
        }
      }
    }));
    let n = h.get(e);
    n || (n = /* @__PURE__ */ new Set(), h.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let o = this._observedResizeElements.get(e);
    o || (o = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, o)), o.add(t);
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const s = h.get(e);
      s && s.delete(t);
    } else {
      const s = h.get(e);
      if (s)
        for (const i of n)
          s.delete(i);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = h.get(e);
    o && o.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = R(n);
    let s = b.get(o);
    s || (s = { observer: new IntersectionObserver((f) => {
      for (let d = 0; d < f.length; d++) {
        const m = f[d], E = s.callbacks.get(m.target);
        if (E) {
          const k = [m];
          for (const P of E)
            P(k);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, b.set(o, s));
    let i = s.callbacks.get(e);
    i || (i = /* @__PURE__ */ new Set(), s.callbacks.set(e, i), s.observer.observe(e)), i.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let r = this._observedIntersectionElements.get(e);
    r || (r = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, r));
    let c = r.get(o);
    c || (c = /* @__PURE__ */ new Set(), r.set(o, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [o, s] of n) {
        const i = b.get(o);
        if (t)
          s.has(t) && (s.delete(t), i && i.callbacks.has(e) && i.callbacks.get(e).delete(t));
        else {
          if (i && i.callbacks.has(e)) {
            const r = i.callbacks.get(e);
            for (const c of s)
              r.delete(c);
          }
          s.clear();
        }
        if (s.size === 0 && n.delete(o), i) {
          const r = i.callbacks.get(e);
          r && r.size === 0 && (i.callbacks.delete(e), i.observer.unobserve(e)), i.callbacks.size === 0 && (i.observer.disconnect(), b.delete(o));
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
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((o, s) => {
      const i = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        i(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        i(), delete n._loadPromise, s(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (i(), s(new Error(`Script tag '${e}' has no src or data-src.`)));
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
      const s = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        s(), n(!0);
      }, t.onerror = () => {
        s(), delete t._loadPromise, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        s(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let i = !1;
        for (let r = 0; r < document.styleSheets.length; r++)
          if (document.styleSheets[r].href === t.href) {
            i = !0;
            break;
          }
        i && (s(), n(!0));
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
      const o = t[n], s = e[o];
      if (this._state[o] !== s) {
        this._state[o] = s, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[o] = s;
        const i = typeof s;
        if (i === "boolean" || i === "string") {
          let r = $.get(o);
          r || (r = `data-${o.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(o, r)), this._pendingAttributeChanges[r] = i === "boolean" ? s ? "true" : "false" : s;
        }
      }
    }
  }
  _flushStateChanges() {
    const e = this._pendingAttributeChanges ? Object.keys(this._pendingAttributeChanges) : [];
    for (let t = 0; t < e.length; t++) {
      const n = e[t], o = this._pendingAttributeChanges[n];
      this.element.getAttribute(n) !== o && this.element.setAttribute(n, o);
    }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = A.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var o;
      return !C.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), A.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], s = o.getAttribute("data-action");
      if (!s) continue;
      let i = 0;
      for (; i < s.length; ) {
        let r = s.indexOf(" ", i);
        if (r === -1 && (r = s.length), r > i) {
          const c = s.substring(i, r), l = c.indexOf("->");
          let f, d;
          l !== -1 ? (f = c.substring(0, l), d = c.substring(l + 2)) : (f = c, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !C.has(d) ? o.addEventListener(f, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        i = r + 1;
      }
    }
  }
};
class F extends x {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class N extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, o = new CustomEvent(e, { detail: n });
    o._name = e, this.dispatchEvent(o);
  }
  on(e, t, n = !1) {
    let o = t._wrappedHandlers;
    o || (o = /* @__PURE__ */ new Map(), t._wrappedHandlers = o);
    let s = o.get(e);
    s || (s = (i) => {
      i.detail && i.detail._name === i._name ? t(i.detail) : t({ ...i.detail, _name: i._name });
    }, o.set(e, s)), this.addEventListener(e, s, { once: n });
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
const q = new N();
let g = null;
function L(a) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < a.length; o++) {
    const s = a[o];
    for (let i = 0; i < s.removedNodes.length; i++) {
      const r = s.removedNodes[i];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && w(r);
        const c = _(`[${e}]`, r);
        for (let l = 0; l < c.length; l++)
          w(c[l]);
      }
    }
    for (let i = 0; i < s.addedNodes.length; i++) {
      const r = s.addedNodes[i];
      r.nodeType === Node.ELEMENT_NODE && n.add(r);
    }
  }
  for (const o of n)
    o.isConnected && z(t, o);
}
function S() {
  typeof document > "u" || (u.get("autoMountComponents") && !g ? (g = new MutationObserver(L), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const B = u.set;
u.set = function(a, e) {
  B.call(this, a, e), a === "autoMountComponents" && S();
};
typeof window < "u" && setTimeout(S, 0);
export {
  x as BaseComponent,
  F as Component,
  u as config,
  y as createInstance,
  H as destroyInstance,
  q as eventbus,
  D as getComponentFromElement,
  z as loadComponents,
  H as removeComponents
};
