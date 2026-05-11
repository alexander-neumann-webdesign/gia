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
const f = new A();
function O(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const i = new t(r, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), i;
  } catch (i) {
    return console.error(`Failed to create component "${e}".`, i), null;
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
  const t = [], n = `${f.get("attrPrefix")}-component`, i = Array.from(g(`[${n}]`, e));
  e instanceof Element && e.hasAttribute(n) && i.push(e), i.forEach((o) => {
    if (v(o))
      return;
    const a = o.getAttribute(n);
    typeof r[a] == "function" ? t.push(O(o, a, r[a])) : console.warn(`Constructor "${a}" not found.`);
  }), t.forEach((o) => {
    o._load();
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
    r.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function j(r = document.documentElement) {
  g(`[${f.get("attrPrefix")}-component]`, r).forEach(
    (e) => {
      b(e);
    }
  );
}
let h = null;
const l = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), S = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), E = /* @__PURE__ */ new WeakMap();
function M(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, i = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${i}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = g(`[${t}]`, this.element), i = {};
    for (let o = 0; o < n.length; o++) {
      const s = n[o], a = s.getAttribute(t);
      i[a] || (i[a] = []), i[a].push(s);
    }
    Object.keys(e).length === 0 ? n.forEach((o) => {
      const s = o.getAttribute(t);
      if (s.includes(":")) {
        const [a, c] = s.split(":");
        a === this._name && !this._ref[c] && (this._ref[c] = i[s]);
      } else
        this._ref[s] || (this._ref[s] = i[s]);
    }) : this._ref = Object.keys(e).reduce((o, s) => {
      const a = Array.isArray(e[s]);
      if (e[s] !== null && a && e[s].length > 0)
        return o[s] = e[s], o;
      const c = `${this._name}:${s}`;
      let d = i[c] || [];
      return d.length === 0 && (d = i[s] || []), o[s] = a ? d : d[0] ?? null, o;
    }, {});
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
    let n = {};
    if (t)
      try {
        n = JSON.parse(t);
      } catch (i) {
        console.error(`Failed to parse options for component "${this._name}": ${i.message}`);
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
      for (const i of n) {
        const o = l.get(i.target);
        o && o.forEach((s) => s([i]));
      }
    })), l.has(e) || (l.set(e, /* @__PURE__ */ new Set()), h.observe(e)), l.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const o = l.get(e);
      o && o.delete(t);
    } else {
      const o = l.get(e);
      o && n.forEach((s) => o.delete(s)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const i = l.get(e);
    i && i.size === 0 && (l.delete(e), h && h.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const i = M(n);
    let o = _.get(i);
    o || (o = { observer: new IntersectionObserver((c) => {
      for (const d of c) {
        const p = o.callbacks.get(d.target);
        p && p.forEach((m) => m([d]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(i, o)), o.callbacks.has(e) || (o.callbacks.set(e, /* @__PURE__ */ new Set()), o.observer.observe(e)), o.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const s = this._observedIntersectionElements.get(e);
    s.has(i) || s.set(i, /* @__PURE__ */ new Set()), s.get(i).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((i, o) => {
      const s = _.get(o);
      if (t)
        i.has(t) && (i.delete(t), s && s.callbacks.has(e) && s.callbacks.get(e).delete(t));
      else {
        if (s && s.callbacks.has(e)) {
          const a = s.callbacks.get(e);
          i.forEach((c) => a.delete(c));
        }
        i.clear();
      }
      if (i.size === 0 && n.delete(o), s) {
        const a = s.callbacks.get(e);
        a && a.size === 0 && (s.callbacks.delete(e), s.observer.unobserve(e)), s.callbacks.size === 0 && (s.observer.disconnect(), _.delete(o));
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
    return n ? (n._loadPromise || (n._loadPromise = new Promise((i, o) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), i(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, o(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (s(), o(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = {};
    let n = !1;
    const i = Object.keys(e);
    for (let o = 0; o < i.length; o++) {
      const s = i[o];
      this._state[s] !== e[s] && (t[s] = e[s], this._state[s] = e[s], n = !0);
    }
    if (n) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        const s = Object.keys(this._pendingAttributeChanges);
        for (let a = 0; a < s.length; a++) {
          const c = s[a], d = this._pendingAttributeChanges[c];
          this.element.setAttribute(c, d);
        }
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      const o = Object.keys(t);
      for (let s = 0; s < o.length; s++) {
        const a = o[s], c = t[a], d = typeof c;
        if (d === "boolean" || d === "string") {
          if (!this._stateAttributeCache[a]) {
            const m = a.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
            this._stateAttributeCache[a] = `data-${m}`;
          }
          const p = this._stateAttributeCache[a];
          this._pendingAttributeChanges[p] = d === "boolean" ? c ? "true" : "false" : c;
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
      var i;
      return !S.has(n) && !n.startsWith("_") && typeof ((i = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : i.value) == "function";
    }), E.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const i = t[n];
      this[i] = this[i].bind(this);
    }
  }
  _autoBindActions() {
    g("[data-action]", this.element).forEach((t) => {
      t.dataset.action.split(" ").forEach((i) => {
        const [o, s] = i.split("->");
        this[s] ? t.addEventListener(o, (a) => this[s](a)) : console.warn(`Method "${s}" not found in component.`);
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
    f.get("log") && console.info(`Emitting event '${e}'`);
    const n = new CustomEvent(e, { detail: t });
    n._name = e, this.dispatchEvent(n);
  }
  on(e, t, n = !1) {
    const i = (o) => t({ ...o.detail, _name: o._name });
    t._wrapped = i, this.addEventListener(e, i, { once: n });
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
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  r.forEach((i) => {
    i.removedNodes.forEach((o) => {
      o.nodeType === Node.ELEMENT_NODE && (o.hasAttribute(e) && b(o), g(`[${e}]`, o).forEach((a) => b(a)));
    }), i.addedNodes.forEach((o) => {
      o.nodeType === Node.ELEMENT_NODE && n.add(o);
    });
  }), n.forEach((i) => {
    document.body.contains(i) && z(t, i);
  });
}
function y() {
  typeof document > "u" || (f.get("autoMountComponents") && !u ? (u = new MutationObserver(P), u.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && u && (u.disconnect(), u = null));
}
const N = f.set;
f.set = function(r, e) {
  N.call(this, r, e), r === "autoMountComponents" && y();
};
typeof window < "u" && setTimeout(y, 0);
export {
  R as BaseComponent,
  k as Component,
  f as config,
  O as createInstance,
  j as destroyInstance,
  L as eventbus,
  v as getComponentFromElement,
  z as loadComponents,
  j as removeComponents
};
