var C = Object.defineProperty;
var $ = (r, e, t) => e in r ? C(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var w = (r, e, t) => $(r, typeof e != "symbol" ? e + "" : e, t);
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
class A {
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
const l = new A();
function O(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const o = new t(r, n);
    return l.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function v(r) {
  return typeof r == "string" && (r = document.getElementById(r), !r) ? null : r.__gia_component__;
}
function g(r, e = document) {
  return typeof r != "string" ? r : e.querySelectorAll(r);
}
function z(r = {}, e = document.documentElement) {
  if (!r || Object.keys(r).length === 0) {
    console.warn("App has no components");
    return;
  }
  const t = [], n = `${l.get("attrPrefix")}-component`, o = g(`[${n}]`, e), i = o.length, s = (a) => {
    if (v(a))
      return;
    const c = a.getAttribute(n);
    typeof r[c] == "function" ? t.push(O(a, c, r[c])) : console.warn(`Constructor "${c}" not found.`);
  };
  for (let a = 0; a < i; a++)
    s(o[a]);
  e instanceof Element && e.hasAttribute(n) && s(e), t.forEach((a) => {
    a._load();
  });
}
function b(r) {
  const e = v(r);
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
function j(r = document.documentElement) {
  g(`[${l.get("attrPrefix")}-component]`, r).forEach(
    (e) => {
      b(e);
    }
  );
}
let h = null;
const d = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), S = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), E = /* @__PURE__ */ new WeakMap();
function M(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, n = g(`[${t}]`, this.element), o = {};
    for (let i = 0; i < n.length; i++) {
      const s = n[i], a = s.getAttribute(t);
      o[a] || (o[a] = []), o[a].push(s);
    }
    Object.keys(e).length === 0 ? n.forEach((i) => {
      const s = i.getAttribute(t);
      if (s.includes(":")) {
        const [a, f] = s.split(":");
        a === this._name && !this._ref[f] && (this._ref[f] = o[s]);
      } else
        this._ref[s] || (this._ref[s] = o[s]);
    }) : this._ref = Object.keys(e).reduce((i, s) => {
      const a = Array.isArray(e[s]);
      if (e[s] !== null && a && e[s].length > 0)
        return i[s] = e[s], i;
      const f = `${this._name}:${s}`;
      let c = o[f] || [];
      return c.length === 0 && (c = o[s] || []), i[s] = a ? c : c[0] ?? null, i;
    }, {});
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${l.get("attrPrefix")}-options`);
    let n = {};
    if (t)
      try {
        n = JSON.parse(t);
      } catch (o) {
        console.error(`Failed to parse options for component "${this._name}": ${o.message}`);
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
      for (const e of Array.from(this._observedResizeElements.keys()))
        this.unobserveResize(e);
    if (this._observedIntersectionElements)
      for (const e of Array.from(this._observedIntersectionElements.keys()))
        this.unobserveIntersection(e);
  }
  observeResize(e, t) {
    typeof window > "u" || !window.ResizeObserver || (h || (h = new ResizeObserver((n) => {
      for (const o of n) {
        const i = d.get(o.target);
        i && i.forEach((s) => s([o]));
      }
    })), d.has(e) || (d.set(e, /* @__PURE__ */ new Set()), h.observe(e)), d.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const i = d.get(e);
      i && i.delete(t);
    } else {
      const i = d.get(e);
      i && n.forEach((s) => i.delete(s)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = d.get(e);
    o && o.size === 0 && (d.delete(e), h && h.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = M(n);
    let i = _.get(o);
    i || (i = { observer: new IntersectionObserver((f) => {
      for (const c of f) {
        const p = i.callbacks.get(c.target);
        p && p.forEach((m) => m([c]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(o, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const s = this._observedIntersectionElements.get(e);
    s.has(o) || s.set(o, /* @__PURE__ */ new Set()), s.get(o).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((o, i) => {
      const s = _.get(i);
      if (t)
        o.has(t) && (o.delete(t), s && s.callbacks.has(e) && s.callbacks.get(e).delete(t));
      else {
        if (s && s.callbacks.has(e)) {
          const a = s.callbacks.get(e);
          o.forEach((f) => a.delete(f));
        }
        o.clear();
      }
      if (o.size === 0 && n.delete(i), s) {
        const a = s.callbacks.get(e);
        a && a.size === 0 && (s.callbacks.delete(e), s.observer.unobserve(e)), s.callbacks.size === 0 && (s.observer.disconnect(), _.delete(i));
      }
    }), n.size === 0 && this._observedIntersectionElements.delete(e));
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * * @param {string} scriptId - The ID of the script tag (without "-js" suffix)
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (t && window[t])
      return Promise.resolve(window[t]);
    const n = document.getElementById(`${e}-js`);
    return n ? (n._loadPromise || (n._loadPromise = new Promise((o, i) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (s(), i(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
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
    let n = !1;
    const o = Object.keys(e);
    for (let i = 0; i < o.length; i++) {
      const s = o[i];
      this._state[s] !== e[s] && (t[s] = e[s], this._state[s] = e[s], n = !0);
    }
    if (n) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        const s = Object.keys(this._pendingAttributeChanges);
        for (let a = 0; a < s.length; a++) {
          const f = s[a], c = this._pendingAttributeChanges[f];
          this.element.getAttribute(f) !== c && this.element.setAttribute(f, c);
        }
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      const i = Object.keys(t);
      for (let s = 0; s < i.length; s++) {
        const a = i[s], f = t[a], c = typeof f;
        if (c === "boolean" || c === "string") {
          if (!this._stateAttributeCache[a]) {
            const m = a.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
            this._stateAttributeCache[a] = `data-${m}`;
          }
          const p = this._stateAttributeCache[a];
          this._pendingAttributeChanges[p] = c === "boolean" ? f ? "true" : "false" : f;
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
    let t = E.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var o;
      return !S.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), E.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    g("[data-action]", this.element).forEach((t) => {
      t.dataset.action.split(" ").forEach((o) => {
        const [i, s] = o.split("->");
        this[s] ? t.addEventListener(i, (a) => this[s](a)) : console.warn(`Method "${s}" not found in component.`);
      });
    });
  }
};
class k extends R {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class I extends EventTarget {
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
const L = new I();
let u = null;
function P(r) {
  const e = `${l.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  r.forEach((o) => {
    o.removedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) && b(i), g(`[${e}]`, i).forEach((a) => b(a)));
    }), o.addedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && n.add(i);
    });
  }), n.forEach((o) => {
    o.isConnected && z(t, o);
  });
}
function y() {
  typeof document > "u" || (l.get("autoMountComponents") && !u ? (u = new MutationObserver(P), u.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && u && (u.disconnect(), u = null));
}
const N = l.set;
l.set = function(r, e) {
  N.call(this, r, e), r === "autoMountComponents" && y();
};
typeof window < "u" && setTimeout(y, 0);
export {
  R as BaseComponent,
  k as Component,
  l as config,
  O as createInstance,
  j as destroyInstance,
  L as eventbus,
  v as getComponentFromElement,
  z as loadComponents,
  j as removeComponents
};
