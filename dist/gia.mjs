var C = Object.defineProperty;
var O = (r, e, n) => e in r ? C(r, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : r[e] = n;
var m = (r, e, n) => O(r, typeof e != "symbol" ? e + "" : e, n);
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
class $ {
  constructor() {
    m(this, "_options", {
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
const f = new $();
function A(r, e, n, s) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const t = new n(r, s);
    return f.get("log") && console.info(`Created instance of component "${e}".`), t;
  } catch (t) {
    return console.error(`Failed to create component "${e}".`, t), null;
  }
}
function E(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function g(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function P(r = {}, e = document.documentElement) {
  let n = !0;
  if (r) {
    for (const c in r)
      if (Object.prototype.hasOwnProperty.call(r, c)) {
        n = !1;
        break;
      }
  }
  if (n) {
    console.warn("App has no components");
    return;
  }
  const s = [], t = `${f.get("attrPrefix")}-component`, i = g(`[${t}]`, e), o = i.length, a = (c) => {
    if (E(c))
      return;
    const u = c.getAttribute(t);
    typeof r[u] == "function" ? s.push(A(c, u, r[u])) : console.warn(`Constructor "${u}" not found.`);
  };
  for (let c = 0; c < o; c++)
    a(i[c]);
  e instanceof Element && e.hasAttribute(t) && a(e), s.forEach((c) => {
    c._load();
  });
}
function b(r) {
  const e = E(r);
  if (e) {
    const n = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (s) {
      console.error(`Gia: Error unmounting component "${n}".`, s);
    }
    r.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${n}".`);
  }
}
function N(r = document.documentElement) {
  g(`[${f.get("attrPrefix")}-component]`, r).forEach(
    (e) => {
      b(e);
    }
  );
}
let p = null;
const d = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), z = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), w = /* @__PURE__ */ new WeakMap();
function I(r) {
  const e = r.root || null, n = r.rootMargin || "0px 0px 0px 0px", s = r.threshold || 0, t = Array.isArray(s) ? s.join(",") : s.toString();
  return `${e ? e.id || "root-element" : "null"}|${n}|${t}`;
}
let S = class {
  constructor(e, n) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = n || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const n = `${f.get("attrPrefix")}-ref`, s = g(`[${n}]`, this.element), t = {};
    for (let o = 0; o < s.length; o++) {
      const a = s[o], c = a.getAttribute(n);
      t[c] || (t[c] = []), t[c].push(a);
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
          const a = o.indexOf(":");
          if (a !== -1) {
            const c = o.substring(0, a), l = o.substring(a + 1);
            c === this._name && !this._ref[l] && (this._ref[l] = t[o]);
          } else
            this._ref[o] || (this._ref[o] = t[o]);
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
          let l = t[c] || [];
          l.length === 0 && (l = t[o] || []), this._ref[o] = a ? l : l[0] ?? null;
        }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const n = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
    let s = {};
    if (n)
      try {
        s = JSON.parse(n);
      } catch (t) {
        console.error(`Failed to parse options for component "${this._name}": ${t.message}`);
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
        const i = d.get(t.target);
        i && i.forEach((o) => o([t]));
      }
    })), d.has(e) || (d.set(e, /* @__PURE__ */ new Set()), p.observe(e)), d.get(e).add(n), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(n));
  }
  unobserveResize(e, n = null) {
    if (!this._observedResizeElements) return;
    const s = this._observedResizeElements.get(e);
    if (!s) return;
    if (n) {
      s.delete(n);
      const i = d.get(e);
      i && i.delete(n);
    } else {
      const i = d.get(e);
      i && s.forEach((o) => i.delete(o)), s.clear();
    }
    s.size === 0 && this._observedResizeElements.delete(e);
    const t = d.get(e);
    t && t.size === 0 && (d.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, n, s = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const t = I(s);
    let i = _.get(t);
    i || (i = { observer: new IntersectionObserver((c) => {
      for (const l of c) {
        const u = i.callbacks.get(l.target);
        u && u.forEach((y) => y([l]));
      }
    }, s), callbacks: /* @__PURE__ */ new Map() }, _.set(t, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(n), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(t) || o.set(t, /* @__PURE__ */ new Set()), o.get(t).add(n);
  }
  unobserveIntersection(e, n = null) {
    if (!this._observedIntersectionElements) return;
    const s = this._observedIntersectionElements.get(e);
    s && (s.forEach((t, i) => {
      const o = _.get(i);
      if (n)
        t.has(n) && (t.delete(n), o && o.callbacks.has(e) && o.callbacks.get(e).delete(n));
      else {
        if (o && o.callbacks.has(e)) {
          const a = o.callbacks.get(e);
          t.forEach((c) => a.delete(c));
        }
        t.clear();
      }
      if (t.size === 0 && s.delete(i), o) {
        const a = o.callbacks.get(e);
        a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), _.delete(i));
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
    return `[${f.get("attrPrefix")}-ref="${n ? `${this._name}:` : ""}${e}"]`;
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
              const c = t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
              this._stateAttributeCache[t] = `data-${c}`;
            }
            const a = this._stateAttributeCache[t];
            this._pendingAttributeChanges[a] = o === "boolean" ? i ? "true" : "false" : i;
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
    let n = w.get(e);
    n || (n = Object.getOwnPropertyNames(e).filter((s) => {
      var t;
      return !z.has(s) && !s.startsWith("_") && typeof ((t = Object.getOwnPropertyDescriptor(e, s)) == null ? void 0 : t.value) == "function";
    }), w.set(e, n));
    for (let s = 0; s < n.length; s++) {
      const t = n[s];
      this[t] = this[t].bind(this);
    }
  }
  _autoBindActions() {
    g("[data-action]", this.element).forEach((n) => {
      n.dataset.action.split(" ").forEach((t) => {
        const i = t.indexOf("->");
        let o, a;
        i !== -1 ? (o = t.substring(0, i), a = t.substring(i + 2)) : (o = t, a = void 0), this[a] ? n.addEventListener(o, (c) => this[a](c)) : console.warn(`Method "${a}" not found in component.`);
      });
    });
  }
};
class B extends S {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class M extends EventTarget {
  emit(e, n = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
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
const L = new M();
let h = null;
function R(r) {
  const e = `${f.get("attrPrefix")}-component`, n = typeof window < "u" && window.gia ? window.gia.components : {}, s = /* @__PURE__ */ new Set();
  r.forEach((t) => {
    t.removedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) && b(i), g(`[${e}]`, i).forEach((a) => b(a)));
    }), t.addedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && s.add(i);
    });
  }), s.forEach((t) => {
    t.isConnected && P(n, t);
  });
}
function v() {
  typeof document > "u" || (f.get("autoMountComponents") && !h ? (h = new MutationObserver(R), h.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && h && (h.disconnect(), h = null));
}
const x = f.set;
f.set = function(r, e) {
  x.call(this, r, e), r === "autoMountComponents" && v();
};
typeof window < "u" && setTimeout(v, 0);
export {
  S as BaseComponent,
  B as Component,
  f as config,
  A as createInstance,
  N as destroyInstance,
  L as eventbus,
  E as getComponentFromElement,
  P as loadComponents,
  N as removeComponents
};
