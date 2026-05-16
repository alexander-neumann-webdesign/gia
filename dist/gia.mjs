var k = Object.defineProperty;
var I = (a, e, t) => e in a ? k(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var v = (a, e, t) => I(a, typeof e != "symbol" ? e + "" : e, t);
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
class M {
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
const u = new M();
function z(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const s = new t(a, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function S(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function m(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function x(a = {}, e = document.documentElement) {
  if (!a || Object.keys(a).length === 0) {
    console.warn("App has no components");
    return;
  }
  const t = [], n = `${u.get("attrPrefix")}-component`, s = m(`[${n}]`, e), i = s.length, r = (o) => {
    if (S(o))
      return;
    const l = o.getAttribute(n);
    typeof a[l] == "function" ? t.push(z(o, l, a[l])) : console.warn(`Constructor "${l}" not found.`);
  };
  for (let o = 0; o < i; o++)
    r(s[o]);
  e instanceof Element && e.hasAttribute(n) && r(e);
  for (let o = 0; o < t.length; o++)
    t[o]._load();
}
function b(a) {
  const e = S(a);
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
function F(a = document.documentElement) {
  const e = m(`[${u.get("attrPrefix")}-component]`, a);
  for (let t = 0; t < e.length; t++)
    b(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), C = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new Map();
function R(a) {
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
    const t = `${u.get("attrPrefix")}-ref`, n = m(`[${t}]`, this.element), s = {};
    for (let o = 0; o < n.length; o++) {
      const c = n[o], l = c.getAttribute(t);
      let f = s[l];
      f === void 0 && (f = [], s[l] = f), f.push(c);
    }
    const i = e ? Object.keys(e) : [];
    if (i.length === 0) {
      for (const o in s)
        if (Object.prototype.hasOwnProperty.call(s, o)) {
          const c = o.indexOf(":");
          if (c !== -1) {
            const l = o.substring(0, c), f = o.substring(c + 1);
            l === this._name && !this._ref[f] && (this._ref[f] = s[o]);
          } else
            this._ref[o] || (this._ref[o] = s[o]);
        }
    } else {
      this._ref = {};
      for (let o = 0; o < i.length; o++) {
        const c = i[o], l = Array.isArray(e[c]);
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
    if (this.unmount(), this._observedResizeElements)
      for (const e of this._observedResizeElements.keys())
        this.unobserveResize(e);
    if (this._observedIntersectionElements)
      for (const e of this._observedIntersectionElements.keys())
        this.unobserveIntersection(e);
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((i) => {
      for (let r = 0; r < i.length; r++) {
        const o = i[r], c = h.get(o.target);
        if (c) {
          const l = [o];
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
      const i = h.get(e);
      i && i.delete(t);
    } else {
      const i = h.get(e);
      if (i)
        for (const r of n)
          i.delete(r);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = R(n);
    let i = _.get(s);
    i || (i = { observer: new IntersectionObserver((f) => {
      for (let d = 0; d < f.length; d++) {
        const w = f[d], E = i.callbacks.get(w.target);
        if (E) {
          const P = [w];
          for (const O of E)
            O(P);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(s, i));
    let r = i.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), i.callbacks.set(e, r), i.observer.observe(e)), r.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let o = this._observedIntersectionElements.get(e);
    o || (o = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, o));
    let c = o.get(s);
    c || (c = /* @__PURE__ */ new Set(), o.set(s, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, i] of n) {
        const r = _.get(s);
        if (t)
          i.has(t) && (i.delete(t), r && r.callbacks.has(e) && r.callbacks.get(e).delete(t));
        else {
          if (r && r.callbacks.has(e)) {
            const o = r.callbacks.get(e);
            for (const c of i)
              o.delete(c);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(s), r) {
          const o = r.callbacks.get(e);
          o && o.size === 0 && (r.callbacks.delete(e), r.observer.unobserve(e)), r.callbacks.size === 0 && (r.observer.disconnect(), _.delete(s));
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
    return n ? n.tagName !== "SCRIPT" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : (n._loadPromise || (n._loadPromise = new Promise((s, i) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (r(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    const t = document.getElementById(e);
    return t ? t.tagName !== "LINK" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : (t._loadPromise || (t._loadPromise = new Promise((n, s) => {
      const i = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        i(), n(!0);
      }, t.onerror = () => {
        i(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.dataset.href)
        t.href = t.dataset.href, delete t.dataset.href;
      else if (!t.href && !t.dataset.href)
        i(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.dataset.href) {
        let r = !1;
        for (let o = 0; o < document.styleSheets.length; o++)
          if (document.styleSheets[o].href === t.href) {
            r = !0;
            break;
          }
        r && (i(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
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
          let o = $.get(s);
          o || (o = `data-${s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(s, o)), this._pendingAttributeChanges[o] = r === "boolean" ? i ? "true" : "false" : i;
        }
      }
    }
  }
  _flushStateChanges() {
    for (const e in this._pendingAttributeChanges)
      if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, e)) {
        const t = this._pendingAttributeChanges[e];
        this.element.getAttribute(e) !== t && this.element.setAttribute(e, t);
      }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = C.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !y.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), C.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = m("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], i = s.dataset.action;
      let r = 0;
      for (; r < i.length; ) {
        let o = i.indexOf(" ", r);
        if (o === -1 && (o = i.length), o > r) {
          const c = i.substring(r, o), l = c.indexOf("->");
          let f, d;
          l !== -1 ? (f = c.substring(0, l), d = c.substring(l + 2)) : (f = c, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !y.has(d) ? s.addEventListener(f, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        r = o + 1;
      }
    }
  }
};
class H extends N {
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
const q = new L();
let g = null;
function B(a) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < a.length; s++) {
    const i = a[s];
    for (let r = 0; r < i.removedNodes.length; r++) {
      const o = i.removedNodes[r];
      if (o.nodeType === Node.ELEMENT_NODE) {
        o.hasAttribute(e) && b(o);
        const c = m(`[${e}]`, o);
        for (let l = 0; l < c.length; l++)
          b(c[l]);
      }
    }
    for (let r = 0; r < i.addedNodes.length; r++) {
      const o = i.addedNodes[r];
      o.nodeType === Node.ELEMENT_NODE && n.add(o);
    }
  }
  for (const s of n)
    s.isConnected && x(t, s);
}
function A() {
  typeof document > "u" || (u.get("autoMountComponents") && !g ? (g = new MutationObserver(B), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const j = u.set;
u.set = function(a, e) {
  j.call(this, a, e), a === "autoMountComponents" && A();
};
typeof window < "u" && setTimeout(A, 0);
export {
  N as BaseComponent,
  H as Component,
  u as config,
  z as createInstance,
  F as destroyInstance,
  q as eventbus,
  S as getComponentFromElement,
  x as loadComponents,
  F as removeComponents
};
