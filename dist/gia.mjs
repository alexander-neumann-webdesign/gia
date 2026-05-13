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
function I(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const o = new t(r, n);
    return l.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
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
    for (const a in r)
      if (Object.prototype.hasOwnProperty.call(r, a)) {
        t = !1;
        break;
      }
  }
  if (t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${l.get("attrPrefix")}-component`, i = _(`[${o}]`, e), s = i.length, c = (a) => {
    if (C(a))
      return;
    const d = a.getAttribute(o);
    typeof r[d] == "function" ? n.push(I(a, d, r[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let a = 0; a < s; a++)
    c(i[a]);
  e instanceof Element && e.hasAttribute(o) && c(e);
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function b(r) {
  const e = C(r);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
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
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), o = {};
    for (let s = 0; s < n.length; s++) {
      const c = n[s], a = c.getAttribute(t);
      o[a] || (o[a] = []), o[a].push(c);
    }
    let i = !0;
    for (const s in e)
      if (Object.prototype.hasOwnProperty.call(e, s)) {
        i = !1;
        break;
      }
    if (i) {
      for (const s in o)
        if (Object.prototype.hasOwnProperty.call(o, s)) {
          const c = s.indexOf(":");
          if (c !== -1) {
            const a = s.substring(0, c), f = s.substring(c + 1);
            a === this._name && !this._ref[f] && (this._ref[f] = o[s]);
          } else
            this._ref[s] || (this._ref[s] = o[s]);
        }
    } else {
      this._ref = {};
      for (const s in e)
        if (Object.prototype.hasOwnProperty.call(e, s)) {
          const c = Array.isArray(e[s]);
          if (e[s] !== null && c && e[s].length > 0) {
            this._ref[s] = e[s];
            continue;
          }
          const a = `${this._name}:${s}`;
          let f = o[a] || [];
          f.length === 0 && (f = o[s] || []), this._ref[s] = c ? f : f[0] ?? null;
        }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${l.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const o = t.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
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
    typeof window > "u" || !window.ResizeObserver || (p || (p = new ResizeObserver((n) => {
      for (const o of n) {
        const i = h.get(o.target);
        i && i.forEach((s) => s([o]));
      }
    })), h.has(e) || (h.set(e, /* @__PURE__ */ new Set()), p.observe(e)), h.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
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
      i && n.forEach((s) => i.delete(s)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = h.get(e);
    o && o.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = M(n);
    let i = m.get(o);
    i || (i = { observer: new IntersectionObserver((a) => {
      for (const f of a) {
        const d = i.callbacks.get(f.target);
        d && d.forEach((u) => u([f]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, m.set(o, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const s = this._observedIntersectionElements.get(e);
    s.has(o) || s.set(o, /* @__PURE__ */ new Set()), s.get(o).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((o, i) => {
      const s = m.get(i);
      if (t)
        o.has(t) && (o.delete(t), s && s.callbacks.has(e) && s.callbacks.get(e).delete(t));
      else {
        if (s && s.callbacks.has(e)) {
          const c = s.callbacks.get(e);
          o.forEach((a) => c.delete(a));
        }
        o.clear();
      }
      if (o.size === 0 && n.delete(i), s) {
        const c = s.callbacks.get(e);
        c && c.size === 0 && (s.callbacks.delete(e), s.observer.unobserve(e)), s.callbacks.size === 0 && (s.observer.disconnect(), m.delete(i));
      }
    }), n.size === 0 && this._observedIntersectionElements.delete(e));
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
    return n ? n.tagName !== "SCRIPT" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : (n._loadPromise || (n._loadPromise = new Promise((o, i) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (s(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${l.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    for (const t in e)
      if (Object.prototype.hasOwnProperty.call(e, t)) {
        const n = e[t];
        if (this._state[t] !== n) {
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
            for (const i in this._pendingAttributeChanges)
              if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, i)) {
                const s = this._pendingAttributeChanges[i];
                this.element.getAttribute(i) !== s && this.element.setAttribute(i, s);
              }
            this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
          })), this._pendingStateChanges[t] = n;
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let i = E.get(t);
            i || (i = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, E.set(t, i)), this._pendingAttributeChanges[i] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = y.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var o;
      return !v.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), y.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], i = o.dataset.action;
      let s = 0;
      for (; s < i.length; ) {
        let c = i.indexOf(" ", s);
        if (c === -1 && (c = i.length), c > s) {
          const a = i.substring(s, c), f = a.indexOf("->");
          let d, u;
          f !== -1 ? (d = a.substring(0, f), u = a.substring(f + 2)) : (d = a, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !v.has(u) ? o.addEventListener(d, (O) => this[u](O)) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        s = c + 1;
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
    const n = new CustomEvent(e, { detail: t });
    n._name = e, this.dispatchEvent(n);
  }
  on(e, t, n = !1) {
    const o = (i) => t({ ...i.detail, _name: i._name });
    t._wrapped = o, this.addEventListener(e, o, { once: n });
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
  const e = `${l.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < r.length; o++) {
    const i = r[o];
    for (let s = 0; s < i.removedNodes.length; s++) {
      const c = i.removedNodes[s];
      if (c.nodeType === Node.ELEMENT_NODE) {
        c.hasAttribute(e) && b(c);
        const a = _(`[${e}]`, c);
        for (let f = 0; f < a.length; f++)
          b(a[f]);
      }
    }
    for (let s = 0; s < i.addedNodes.length; s++) {
      const c = i.addedNodes[s];
      c.nodeType === Node.ELEMENT_NODE && n.add(c);
    }
  }
  for (const o of n)
    o.isConnected && z(t, o);
}
function $() {
  typeof document > "u" || (l.get("autoMountComponents") && !g ? (g = new MutationObserver(N), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const k = l.set;
l.set = function(r, e) {
  k.call(this, r, e), r === "autoMountComponents" && $();
};
typeof window < "u" && setTimeout($, 0);
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
