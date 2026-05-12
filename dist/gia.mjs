var $ = Object.defineProperty;
var A = (r, e, n) => e in r ? $(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n;
var w = (r, e, n) => A(r, typeof e != "symbol" ? e + "" : e, n);
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
  set(e, n) {
    this._options[e] = n;
  }
  get(e) {
    return this._options[e];
  }
}
const l = new P();
function I(r, e, n, s) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const t = new n(r, s);
    return l.get("log") && console.info(`Created instance of component "${e}".`), t;
  } catch (t) {
    return console.error(`Failed to create component "${e}".`, t), null;
  }
}
function E(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function _(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function S(r = {}, e = document.documentElement) {
  let n = !0;
  if (r) {
    for (const a in r)
      if (Object.prototype.hasOwnProperty.call(r, a)) {
        n = !1;
        break;
      }
  }
  if (n) {
    console.warn("App has no components");
    return;
  }
  const s = [], t = `${l.get("attrPrefix")}-component`, i = _(`[${t}]`, e), o = i.length, c = (a) => {
    if (E(a))
      return;
    const d = a.getAttribute(t);
    typeof r[d] == "function" ? s.push(I(a, d, r[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let a = 0; a < o; a++)
    c(i[a]);
  e instanceof Element && e.hasAttribute(t) && c(e);
  for (let a = 0; a < s.length; a++)
    s[a]._load();
}
function m(r) {
  const e = E(r);
  if (e) {
    const n = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (s) {
      console.error(`Gia: Error unmounting component "${n}".`, s);
    }
    r.__gia_component__ = null, e.element && (e.element = null), l.get("log") && console.info(`Removed component "${n}".`);
  }
}
function j(r = document.documentElement) {
  const e = _(`[${l.get("attrPrefix")}-component]`, r);
  for (let n = 0; n < e.length; n++)
    m(e[n]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), y = /* @__PURE__ */ new WeakMap();
function z(r) {
  const e = r.root || null, n = r.rootMargin || "0px 0px 0px 0px", s = r.threshold || 0, t = Array.isArray(s) ? s.join(",") : s.toString();
  return `${e ? e.id || "root-element" : "null"}|${n}|${t}`;
}
let x = class {
  constructor(e, n) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = n || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const n = `${l.get("attrPrefix")}-ref`, s = _(`[${n}]`, this.element), t = {};
    for (let o = 0; o < s.length; o++) {
      const c = s[o], a = c.getAttribute(n);
      t[a] || (t[a] = []), t[a].push(c);
    }
    let i = !0;
    for (const o in e)
      if (Object.prototype.hasOwnProperty.call(e, o)) {
        i = !1;
        break;
      }
    if (i) {
      for (const o in t)
        if (Object.prototype.hasOwnProperty.call(t, o)) {
          const c = o.indexOf(":");
          if (c !== -1) {
            const a = o.substring(0, c), f = o.substring(c + 1);
            a === this._name && !this._ref[f] && (this._ref[f] = t[o]);
          } else
            this._ref[o] || (this._ref[o] = t[o]);
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
          let f = t[a] || [];
          f.length === 0 && (f = t[o] || []), this._ref[o] = c ? f : f[0] ?? null;
        }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const n = this.element.getAttribute(`${l.get("attrPrefix")}-options`);
    let s = {};
    if (n) {
      const t = n.trim();
      if (t.startsWith("{") || t.startsWith("["))
        try {
          s = JSON.parse(t);
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
  observeResize(e, n) {
    typeof window > "u" || !window.ResizeObserver || (p || (p = new ResizeObserver((s) => {
      for (const t of s) {
        const i = h.get(t.target);
        i && i.forEach((o) => o([t]));
      }
    })), h.has(e) || (h.set(e, /* @__PURE__ */ new Set()), p.observe(e)), h.get(e).add(n), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(n));
  }
  unobserveResize(e, n = null) {
    if (!this._observedResizeElements) return;
    const s = this._observedResizeElements.get(e);
    if (!s) return;
    if (n) {
      s.delete(n);
      const i = h.get(e);
      i && i.delete(n);
    } else {
      const i = h.get(e);
      i && s.forEach((o) => i.delete(o)), s.clear();
    }
    s.size === 0 && this._observedResizeElements.delete(e);
    const t = h.get(e);
    t && t.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, n, s = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const t = z(s);
    let i = b.get(t);
    i || (i = { observer: new IntersectionObserver((a) => {
      for (const f of a) {
        const d = i.callbacks.get(f.target);
        d && d.forEach((u) => u([f]));
      }
    }, s), callbacks: /* @__PURE__ */ new Map() }, b.set(t, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(n), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(t) || o.set(t, /* @__PURE__ */ new Set()), o.get(t).add(n);
  }
  unobserveIntersection(e, n = null) {
    if (!this._observedIntersectionElements) return;
    const s = this._observedIntersectionElements.get(e);
    s && (s.forEach((t, i) => {
      const o = b.get(i);
      if (n)
        t.has(n) && (t.delete(n), o && o.callbacks.has(e) && o.callbacks.get(e).delete(n));
      else {
        if (o && o.callbacks.has(e)) {
          const c = o.callbacks.get(e);
          t.forEach((a) => c.delete(a));
        }
        t.clear();
      }
      if (t.size === 0 && s.delete(i), o) {
        const c = o.callbacks.get(e);
        c && c.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), b.delete(i));
      }
    }), s.size === 0 && this._observedIntersectionElements.delete(e));
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * * @param {string} scriptId - The ID of the script tag (without "-js" suffix)
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, n) {
    if (n && window[n])
      return Promise.resolve(window[n]);
    const s = document.getElementById(`${e}-js`);
    return s ? (s._loadPromise || (s._loadPromise = new Promise((t, i) => {
      const o = () => {
        s.onload = null, s.onerror = null;
      };
      s.onload = () => {
        o(), t(n ? window[n] : !0);
      }, s.onerror = () => {
        o(), delete s._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !s.src && s.dataset.src ? (s.src = s.dataset.src, delete s.dataset.src) : !s.src && !s.dataset.src && (o(), i(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), s._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, n = !1) {
    return `[${l.get("attrPrefix")}-ref="${n ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const n = {};
    let s = !1;
    for (const t in e)
      Object.prototype.hasOwnProperty.call(e, t) && this._state[t] !== e[t] && (n[t] = e[t], this._state[t] = e[t], s = !0);
    if (s) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        for (const t in this._pendingAttributeChanges)
          if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, t)) {
            const i = this._pendingAttributeChanges[t];
            this.element.getAttribute(t) !== i && this.element.setAttribute(t, i);
          }
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      for (const t in n)
        if (Object.prototype.hasOwnProperty.call(n, t)) {
          const i = n[t], o = typeof i;
          if (o === "boolean" || o === "string") {
            if (!this._stateAttributeCache[t]) {
              const a = t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
              this._stateAttributeCache[t] = `data-${a}`;
            }
            const c = this._stateAttributeCache[t];
            this._pendingAttributeChanges[c] = o === "boolean" ? i ? "true" : "false" : i;
          }
        }
      Object.assign(this._pendingStateChanges, n);
    }
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let n = y.get(e);
    n || (n = Object.getOwnPropertyNames(e).filter((s) => {
      var t;
      return !v.has(s) && !s.startsWith("_") && typeof ((t = Object.getOwnPropertyDescriptor(e, s)) == null ? void 0 : t.value) == "function";
    }), y.set(e, n));
    for (let s = 0; s < n.length; s++) {
      const t = n[s];
      this[t] = this[t].bind(this);
    }
  }
  _autoBindActions() {
    const e = _("[data-action]", this.element), n = e.length;
    for (let s = 0; s < n; s++) {
      const t = e[s], i = t.dataset.action;
      let o = 0;
      for (; o < i.length; ) {
        let c = i.indexOf(" ", o);
        if (c === -1 && (c = i.length), c > o) {
          const a = i.substring(o, c), f = a.indexOf("->");
          let d, u;
          f !== -1 ? (d = a.substring(0, f), u = a.substring(f + 2)) : (d = a, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !v.has(u) ? t.addEventListener(d, (O) => this[u](O)) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        o = c + 1;
      }
    }
  }
};
class L extends x {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class M extends EventTarget {
  emit(e, n = {}) {
    l.get("log") && console.info(`Emitting event '${e}'`);
    const s = new CustomEvent(e, { detail: n });
    s._name = e, this.dispatchEvent(s);
  }
  on(e, n, s = !1) {
    const t = (i) => n({ ...i.detail, _name: i._name });
    n._wrapped = t, this.addEventListener(e, t, { once: s });
  }
  once(e, n) {
    this.on(e, n, !0);
  }
  off(e, n) {
    n && n._wrapped ? this.removeEventListener(e, n._wrapped) : n && this.removeEventListener(e, n), n || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const F = new M();
let g = null;
function R(r) {
  const e = `${l.get("attrPrefix")}-component`, n = typeof window < "u" && window.gia ? window.gia.components : {}, s = /* @__PURE__ */ new Set();
  for (let t = 0; t < r.length; t++) {
    const i = r[t];
    for (let o = 0; o < i.removedNodes.length; o++) {
      const c = i.removedNodes[o];
      if (c.nodeType === Node.ELEMENT_NODE) {
        c.hasAttribute(e) && m(c);
        const a = _(`[${e}]`, c);
        for (let f = 0; f < a.length; f++)
          m(a[f]);
      }
    }
    for (let o = 0; o < i.addedNodes.length; o++) {
      const c = i.addedNodes[o];
      c.nodeType === Node.ELEMENT_NODE && s.add(c);
    }
  }
  for (const t of s)
    t.isConnected && S(n, t);
}
function C() {
  typeof document > "u" || (l.get("autoMountComponents") && !g ? (g = new MutationObserver(R), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const N = l.set;
l.set = function(r, e) {
  N.call(this, r, e), r === "autoMountComponents" && C();
};
typeof window < "u" && setTimeout(C, 0);
export {
  x as BaseComponent,
  L as Component,
  l as config,
  I as createInstance,
  j as destroyInstance,
  F as eventbus,
  E as getComponentFromElement,
  S as loadComponents,
  j as removeComponents
};
