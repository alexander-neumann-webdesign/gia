var C = Object.defineProperty;
var y = (r, e, t) => e in r ? C(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var m = (r, e, t) => y(r, typeof e != "symbol" ? e + "" : e, t);
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
  set(e, t) {
    this._options[e] = t;
  }
  get(e) {
    return this._options[e];
  }
}
const c = new $();
function A(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const s = new t(r, n);
    return c.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function w(r) {
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
  const t = [], n = `${c.get("attrPrefix")}-component`;
  g(`[${n}]`, e).forEach((s) => {
    const i = w(s);
    if (i) {
      console.warn("Error: instance exists: ", i);
      return;
    }
    const o = s.getAttribute(n);
    typeof r[o] == "function" ? t.push(A(s, o, r[o])) : console.warn(`Constructor "${o}" not found.`);
  }), t.forEach((s) => {
    s._load();
  });
}
function p(r) {
  const e = w(r);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    r.__gia_component__ = null, e.element && (e.element = null), c.get("log") && console.info(`Removed component "${t}".`);
  }
}
function P(r = document.documentElement) {
  g(`[${c.get("attrPrefix")}-component]`, r).forEach(
    (e) => {
      p(e);
    }
  );
}
let h = null;
const d = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map();
function O(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), c.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${c.get("attrPrefix")}-ref`, n = g(`[${t}]`, this.element), s = {};
    for (let i = 0; i < n.length; i++) {
      const o = n[i], a = o.getAttribute(t);
      s[a] || (s[a] = []), s[a].push(o);
    }
    Object.keys(e).length === 0 ? n.forEach((i) => {
      const o = i.getAttribute(t);
      if (o.includes(":")) {
        const [a, f] = o.split(":");
        a === this._name && !this._ref[f] && (this._ref[f] = s[o]);
      } else
        this._ref[o] || (this._ref[o] = s[o]);
    }) : this._ref = Object.keys(e).reduce((i, o) => {
      const a = Array.isArray(e[o]);
      if (e[o] !== null && a && e[o].length > 0)
        return i[o] = e[o], i;
      const f = `${this._name}:${o}`;
      let u = s[f] || [];
      return u.length === 0 && (u = s[o] || []), i[o] = a ? u : u[0] ?? null, i;
    }, {});
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${c.get("attrPrefix")}-options`);
    let n = {};
    if (t)
      try {
        n = JSON.parse(t);
      } catch (s) {
        console.error(`Failed to parse options for component "${this._name}": ${s.message}`);
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
      for (const s of n) {
        const i = d.get(s.target);
        i && i.forEach((o) => o([s]));
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
      i && n.forEach((o) => i.delete(o)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = d.get(e);
    s && s.size === 0 && (d.delete(e), h && h.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = O(n);
    let i = _.get(s);
    i || (i = { observer: new IntersectionObserver((f) => {
      for (const u of f) {
        const b = i.callbacks.get(u.target);
        b && b.forEach((v) => v([u]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(s, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(s) || o.set(s, /* @__PURE__ */ new Set()), o.get(s).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((s, i) => {
      const o = _.get(i);
      if (t)
        s.has(t) && (s.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
      else {
        if (o && o.callbacks.has(e)) {
          const a = o.callbacks.get(e);
          s.forEach((f) => a.delete(f));
        }
        s.clear();
      }
      if (s.size === 0 && n.delete(i), o) {
        const a = o.callbacks.get(e);
        a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), _.delete(i));
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
    return n ? (n._loadPromise || (n._loadPromise = new Promise((s, i) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (o(), i(new Error(`Script tag '${e}-js' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}-js' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${c.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = {};
    let n = !1;
    Object.keys(e).forEach((s) => {
      this._state[s] !== e[s] && (t[s] = e[s], this._state[s] = e[s], n = !0);
    }), n && (this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
      Object.keys(this._pendingAttributeChanges).forEach((s) => {
        const i = this._pendingAttributeChanges[s];
        this.element.setAttribute(s, i);
      }), this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
    })), Object.keys(t).forEach((s) => {
      const i = t[s], o = typeof i;
      if (o === "boolean" || o === "string") {
        if (!this._stateAttributeCache[s]) {
          const f = s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
          this._stateAttributeCache[s] = `data-${f}`;
        }
        const a = this._stateAttributeCache[s];
        this._pendingAttributeChanges[a] = o === "boolean" ? i ? "true" : "false" : i;
      }
    }), Object.assign(this._pendingStateChanges, t));
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), t = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
    e.forEach((n) => {
      t.has(n) || n.startsWith("_") || typeof this[n] == "function" && (this[n] = this[n].bind(this));
    });
  }
  _autoBindActions() {
    g("[data-action]", this.element).forEach((t) => {
      t.dataset.action.split(" ").forEach((s) => {
        const [i, o] = s.split("->");
        this[o] ? t.addEventListener(i, (a) => this[o](a)) : console.warn(`Method "${o}" not found in component.`);
      });
    });
  }
};
class B extends R {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class S extends EventTarget {
  emit(e, t = {}) {
    c.get("log") && console.info(`Emitting event '${e}'`);
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
const N = new S();
let l = null;
function I(r) {
  const e = `${c.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  let n = !1;
  r.forEach((s) => {
    s.removedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) && p(i), g(`[${e}]`, i).forEach((a) => p(a)));
    }), s.addedNodes.length > 0 && (n = !0);
  }), n && z(t, document.body);
}
function E() {
  typeof document > "u" || (c.get("autoMountComponents") && !l ? (l = new MutationObserver(I), l.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !c.get("autoMountComponents") && l && (l.disconnect(), l = null));
}
const x = c.set;
c.set = function(r, e) {
  x.call(this, r, e), r === "autoMountComponents" && E();
};
typeof window < "u" && setTimeout(E, 0);
export {
  R as BaseComponent,
  B as Component,
  c as config,
  A as createInstance,
  P as destroyInstance,
  N as eventbus,
  w as getComponentFromElement,
  z as loadComponents,
  P as removeComponents
};
