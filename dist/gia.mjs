var S = Object.defineProperty;
var A = (r, e, t) => e in r ? S(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var w = (r, e, t) => A(r, typeof e != "symbol" ? e + "" : e, t);
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
class P {
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
const l = new P();
function I(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const s = new t(r, n);
    return l.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
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
  const n = [], s = `${l.get("attrPrefix")}-component`, i = _(`[${s}]`, e), o = i.length, c = (a) => {
    if (C(a))
      return;
    const d = a.getAttribute(s);
    typeof r[d] == "function" ? n.push(I(a, d, r[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let a = 0; a < o; a++)
    c(i[a]);
  e instanceof Element && e.hasAttribute(s) && c(e);
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
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), s = {};
    for (let o = 0; o < n.length; o++) {
      const c = n[o], a = c.getAttribute(t);
      s[a] || (s[a] = []), s[a].push(c);
    }
    let i = !0;
    for (const o in e)
      if (Object.prototype.hasOwnProperty.call(e, o)) {
        i = !1;
        break;
      }
    if (i) {
      for (const o in s)
        if (Object.prototype.hasOwnProperty.call(s, o)) {
          const c = o.indexOf(":");
          if (c !== -1) {
            const a = o.substring(0, c), f = o.substring(c + 1);
            a === this._name && !this._ref[f] && (this._ref[f] = s[o]);
          } else
            this._ref[o] || (this._ref[o] = s[o]);
        }
    } else {
      this._ref = {};
      for (const o in e)
        if (Object.prototype.hasOwnProperty.call(e, o)) {
          const c = Array.isArray(e[o]);
          if (e[o] !== null && c && e[o].length > 0) {
            this._ref[o] = e[o];
            continue;
          }
          const a = `${this._name}:${o}`;
          let f = s[a] || [];
          f.length === 0 && (f = s[o] || []), this._ref[o] = c ? f : f[0] ?? null;
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
    typeof window > "u" || !window.ResizeObserver || (p || (p = new ResizeObserver((n) => {
      for (const s of n) {
        const i = h.get(s.target);
        i && i.forEach((o) => o([s]));
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
      i && n.forEach((o) => i.delete(o)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = M(n);
    let i = m.get(s);
    i || (i = { observer: new IntersectionObserver((a) => {
      for (const f of a) {
        const d = i.callbacks.get(f.target);
        d && d.forEach((u) => u([f]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, m.set(s, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(s) || o.set(s, /* @__PURE__ */ new Set()), o.get(s).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((s, i) => {
      const o = m.get(i);
      if (t)
        s.has(t) && (s.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
      else {
        if (o && o.callbacks.has(e)) {
          const c = o.callbacks.get(e);
          s.forEach((a) => c.delete(a));
        }
        s.clear();
      }
      if (s.size === 0 && n.delete(i), o) {
        const c = o.callbacks.get(e);
        c && c.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), m.delete(i));
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
    return n ? n.tagName !== "SCRIPT" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : (n._loadPromise || (n._loadPromise = new Promise((s, i) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (o(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
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
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[t] = n;
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let i = E.get(t);
            i || (i = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, E.set(t, i)), this._pendingAttributeChanges[i] = s === "boolean" ? n ? "true" : "false" : n;
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
    let t = y.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !v.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), y.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], i = s.dataset.action;
      let o = 0;
      for (; o < i.length; ) {
        let c = i.indexOf(" ", o);
        if (c === -1 && (c = i.length), c > o) {
          const a = i.substring(o, c), f = a.indexOf("->");
          let d, u;
          f !== -1 ? (d = a.substring(0, f), u = a.substring(f + 2)) : (d = a, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !v.has(u) ? s.addEventListener(d, (O) => this[u](O)) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        o = c + 1;
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
    const s = (i) => t({ ...i.detail, _name: i._name });
    t._wrapped = s, this.addEventListener(e, s, { once: n });
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
  for (let s = 0; s < r.length; s++) {
    const i = r[s];
    for (let o = 0; o < i.removedNodes.length; o++) {
      const c = i.removedNodes[o];
      if (c.nodeType === Node.ELEMENT_NODE) {
        c.hasAttribute(e) && b(c);
        const a = _(`[${e}]`, c);
        for (let f = 0; f < a.length; f++)
          b(a[f]);
      }
    }
    for (let o = 0; o < i.addedNodes.length; o++) {
      const c = i.addedNodes[o];
      c.nodeType === Node.ELEMENT_NODE && n.add(c);
    }
  }
  for (const s of n)
    s.isConnected && z(t, s);
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
