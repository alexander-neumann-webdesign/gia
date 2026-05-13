var A = Object.defineProperty;
var P = (r, e, t) => e in r ? A(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var w = (r, e, t) => P(r, typeof e != "symbol" ? e + "" : e, t);
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
class S {
  constructor() {
    w(this, "_options", {
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
const l = new S();
function I(r, e, t, s) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const n = new t(r, s);
    return l.get("log") && console.info(`Created instance of component "${e}".`), n;
  } catch (n) {
    return console.error(`Failed to create component "${e}".`, n), null;
  }
}
function C(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function _(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function z(r = {}, e = document.documentElement) {
  let t = !0;
  if (r) {
    for (const c in r)
      if (Object.prototype.hasOwnProperty.call(r, c)) {
        t = !1;
        break;
      }
  }
  if (t) {
    console.warn("App has no components");
    return;
  }
  const s = [], n = `${l.get("attrPrefix")}-component`, i = _(`[${n}]`, e), o = i.length, a = (c) => {
    if (C(c))
      return;
    const d = c.getAttribute(n);
    typeof r[d] == "function" ? s.push(I(c, d, r[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let c = 0; c < o; c++)
    a(i[c]);
  e instanceof Element && e.hasAttribute(n) && a(e);
  for (let c = 0; c < s.length; c++)
    s[c]._load();
}
function b(r) {
  const e = C(r);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (s) {
      console.error(`Gia: Error unmounting component "${t}".`, s);
    }
    r.__gia_component__ = null, e.element && (e.element = null), l.get("log") && console.info(`Removed component "${t}".`);
  }
}
function B(r = document.documentElement) {
  const e = _(`[${l.get("attrPrefix")}-component]`, r);
  for (let t = 0; t < e.length; t++)
    b(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), y = /* @__PURE__ */ new WeakMap(), E = /* @__PURE__ */ new Map();
function M(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", s = r.threshold || 0, n = Array.isArray(s) ? s.join(",") : s.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${n}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, s = _(`[${t}]`, this.element), n = {};
    for (let o = 0; o < s.length; o++) {
      const a = s[o], c = a.getAttribute(t);
      n[c] || (n[c] = []), n[c].push(a);
    }
    let i = !0;
    for (const o in e)
      if (Object.prototype.hasOwnProperty.call(e, o)) {
        i = !1;
        break;
      }
    if (i) {
      for (const o in n)
        if (Object.prototype.hasOwnProperty.call(n, o)) {
          const a = o.indexOf(":");
          if (a !== -1) {
            const c = o.substring(0, a), f = o.substring(a + 1);
            c === this._name && !this._ref[f] && (this._ref[f] = n[o]);
          } else
            this._ref[o] || (this._ref[o] = n[o]);
        }
    } else {
      this._ref = {};
      for (const o in e)
        if (Object.prototype.hasOwnProperty.call(e, o)) {
          const a = Array.isArray(e[o]);
          if (e[o] !== null && a && e[o].length > 0) {
            this._ref[o] = e[o];
            continue;
          }
          const c = `${this._name}:${o}`;
          let f = n[c] || [];
          f.length === 0 && (f = n[o] || []), this._ref[o] = a ? f : f[0] ?? null;
        }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${l.get("attrPrefix")}-options`);
    let s = {};
    if (t) {
      const n = t.trim();
      if (n.startsWith("{") || n.startsWith("["))
        try {
          s = JSON.parse(n);
        } catch (i) {
          console.error(`Failed to parse options for component "${this._name}": ${i.message}`);
        }
    }
    this._options = {
      ...this._options,
      ...e,
      ...s
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
    typeof window > "u" || !window.ResizeObserver || (p || (p = new ResizeObserver((s) => {
      for (const n of s) {
        const i = h.get(n.target);
        i && i.forEach((o) => o([n]));
      }
    })), h.has(e) || (h.set(e, /* @__PURE__ */ new Set()), p.observe(e)), h.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const s = this._observedResizeElements.get(e);
    if (!s) return;
    if (t) {
      s.delete(t);
      const i = h.get(e);
      i && i.delete(t);
    } else {
      const i = h.get(e);
      i && s.forEach((o) => i.delete(o)), s.clear();
    }
    s.size === 0 && this._observedResizeElements.delete(e);
    const n = h.get(e);
    n && n.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, s = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const n = M(s);
    let i = m.get(n);
    i || (i = { observer: new IntersectionObserver((c) => {
      for (const f of c) {
        const d = i.callbacks.get(f.target);
        d && d.forEach((u) => u([f]));
      }
    }, s), callbacks: /* @__PURE__ */ new Map() }, m.set(n, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(n) || o.set(n, /* @__PURE__ */ new Set()), o.get(n).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const s = this._observedIntersectionElements.get(e);
    s && (s.forEach((n, i) => {
      const o = m.get(i);
      if (t)
        n.has(t) && (n.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
      else {
        if (o && o.callbacks.has(e)) {
          const a = o.callbacks.get(e);
          n.forEach((c) => a.delete(c));
        }
        n.clear();
      }
      if (n.size === 0 && s.delete(i), o) {
        const a = o.callbacks.get(e);
        a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), m.delete(i));
      }
    }), s.size === 0 && this._observedIntersectionElements.delete(e));
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
    const s = document.getElementById(e);
    return s ? s.tagName !== "SCRIPT" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : (s._loadPromise || (s._loadPromise = new Promise((n, i) => {
      const o = () => {
        s.onload = null, s.onerror = null;
      };
      s.onload = () => {
        o(), n(t ? window[t] : !0);
      }, s.onerror = () => {
        o(), delete s._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !s.src && s.dataset.src ? (s.src = s.dataset.src, delete s.dataset.src) : !s.src && !s.dataset.src && (o(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), s._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${l.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = {};
    let s = !1;
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && this._state[n] !== e[n] && (t[n] = e[n], this._state[n] = e[n], s = !0);
    if (s) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        for (const n in this._pendingAttributeChanges)
          if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, n)) {
            const i = this._pendingAttributeChanges[n];
            this.element.getAttribute(n) !== i && this.element.setAttribute(n, i);
          }
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      for (const n in t)
        if (Object.prototype.hasOwnProperty.call(t, n)) {
          const i = t[n], o = typeof i;
          if (o === "boolean" || o === "string") {
            let a = E.get(n);
            a || (a = `data-${n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, E.set(n, a)), this._pendingAttributeChanges[a] = o === "boolean" ? i ? "true" : "false" : i;
          }
        }
      Object.assign(this._pendingStateChanges, t);
    }
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = y.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((s) => {
      var n;
      return !v.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, s)) == null ? void 0 : n.value) == "function";
    }), y.set(e, t));
    for (let s = 0; s < t.length; s++) {
      const n = t[s];
      this[n] = this[n].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let s = 0; s < t; s++) {
      const n = e[s], i = n.dataset.action;
      let o = 0;
      for (; o < i.length; ) {
        let a = i.indexOf(" ", o);
        if (a === -1 && (a = i.length), a > o) {
          const c = i.substring(o, a), f = c.indexOf("->");
          let d, u;
          f !== -1 ? (d = c.substring(0, f), u = c.substring(f + 2)) : (d = c, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !v.has(u) ? n.addEventListener(d, ($) => this[u]($)) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        o = a + 1;
      }
    }
  }
};
class T extends R {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class x extends EventTarget {
  emit(e, t = {}) {
    l.get("log") && console.info(`Emitting event '${e}'`);
    const s = new CustomEvent(e, { detail: t });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, t, s = !1) {
    const n = (i) => t({ ...i.detail, _name: i._name });
    t._wrapped = n, this.addEventListener(e, n, { once: s });
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    t && t._wrapped ? this.removeEventListener(e, t._wrapped) : t && this.removeEventListener(e, t), t || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const F = new x();
let g = null;
function N(r) {
  const e = `${l.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, s = /* @__PURE__ */ new Set();
  for (let n = 0; n < r.length; n++) {
    const i = r[n];
    for (let o = 0; o < i.removedNodes.length; o++) {
      const a = i.removedNodes[o];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && b(a);
        const c = _(`[${e}]`, a);
        for (let f = 0; f < c.length; f++)
          b(c[f]);
      }
    }
    for (let o = 0; o < i.addedNodes.length; o++) {
      const a = i.addedNodes[o];
      a.nodeType === Node.ELEMENT_NODE && s.add(a);
    }
  }
  for (const n of s)
    n.isConnected && z(t, n);
}
function O() {
  typeof document > "u" || (l.get("autoMountComponents") && !g ? (g = new MutationObserver(N), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const k = l.set;
l.set = function(r, e) {
  k.call(this, r, e), r === "autoMountComponents" && O();
};
typeof window < "u" && setTimeout(O, 0);
export {
  R as BaseComponent,
  T as Component,
  l as config,
  I as createInstance,
  B as destroyInstance,
  F as eventbus,
  C as getComponentFromElement,
  z as loadComponents,
  B as removeComponents
};
