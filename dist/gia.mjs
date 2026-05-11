var C = Object.defineProperty;
var $ = (a, e, t) => e in a ? C(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var w = (a, e, t) => $(a, typeof e != "symbol" ? e + "" : e, t);
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
function O(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const s = new t(a, n);
    return l.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function v(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function _(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function z(a = {}, e = document.documentElement) {
  if (!a || Object.keys(a).length === 0) {
    console.warn("App has no components");
    return;
  }
  const t = [], n = `${l.get("attrPrefix")}-component`, s = _(`[${n}]`, e), i = s.length, o = (r) => {
    if (v(r))
      return;
    const c = r.getAttribute(n);
    typeof a[c] == "function" ? t.push(O(r, c, a[c])) : console.warn(`Constructor "${c}" not found.`);
  };
  for (let r = 0; r < i; r++)
    o(s[r]);
  e instanceof Element && e.hasAttribute(n) && o(e), t.forEach((r) => {
    r._load();
  });
}
function m(a) {
  const e = v(a);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    a.__gia_component__ = null, e.element && (e.element = null), l.get("log") && console.info(`Removed component "${t}".`);
  }
}
function j(a = document.documentElement) {
  _(`[${l.get("attrPrefix")}-component]`, a).forEach(
    (e) => {
      m(e);
    }
  );
}
let g = null;
const d = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Map(), I = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]), E = /* @__PURE__ */ new WeakMap();
function S(a) {
  const e = a.root || null, t = a.rootMargin || "0px 0px 0px 0px", n = a.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let M = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, n = _(`[${t}]`, this.element), s = {};
    for (let i = 0; i < n.length; i++) {
      const o = n[i], r = o.getAttribute(t);
      s[r] || (s[r] = []), s[r].push(o);
    }
    if (Object.keys(e).length === 0) {
      const i = Object.keys(s);
      for (let o = 0; o < i.length; o++) {
        const r = i[o], f = r.indexOf(":");
        if (f !== -1) {
          const c = r.substring(0, f), u = r.substring(f + 1);
          c === this._name && !this._ref[u] && (this._ref[u] = s[r]);
        } else
          this._ref[r] || (this._ref[r] = s[r]);
      }
    } else
      this._ref = Object.keys(e).reduce((i, o) => {
        const r = Array.isArray(e[o]);
        if (e[o] !== null && r && e[o].length > 0)
          return i[o] = e[o], i;
        const f = `${this._name}:${o}`;
        let c = s[f] || [];
        return c.length === 0 && (c = s[o] || []), i[o] = r ? c : c[0] ?? null, i;
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
      for (const e of this._observedResizeElements.keys())
        this.unobserveResize(e);
    if (this._observedIntersectionElements)
      for (const e of this._observedIntersectionElements.keys())
        this.unobserveIntersection(e);
  }
  observeResize(e, t) {
    typeof window > "u" || !window.ResizeObserver || (g || (g = new ResizeObserver((n) => {
      for (const s of n) {
        const i = d.get(s.target);
        i && i.forEach((o) => o([s]));
      }
    })), d.has(e) || (d.set(e, /* @__PURE__ */ new Set()), g.observe(e)), d.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
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
    s && s.size === 0 && (d.delete(e), g && g.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = S(n);
    let i = p.get(s);
    i || (i = { observer: new IntersectionObserver((f) => {
      for (const c of f) {
        const u = i.callbacks.get(c.target);
        u && u.forEach((b) => b([c]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, p.set(s, i)), i.callbacks.has(e) || (i.callbacks.set(e, /* @__PURE__ */ new Set()), i.observer.observe(e)), i.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(s) || o.set(s, /* @__PURE__ */ new Set()), o.get(s).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((s, i) => {
      const o = p.get(i);
      if (t)
        s.has(t) && (s.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
      else {
        if (o && o.callbacks.has(e)) {
          const r = o.callbacks.get(e);
          s.forEach((f) => r.delete(f));
        }
        s.clear();
      }
      if (s.size === 0 && n.delete(i), o) {
        const r = o.callbacks.get(e);
        r && r.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), p.delete(i));
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
    return `[${l.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = {};
    let n = !1;
    const s = Object.keys(e);
    for (let i = 0; i < s.length; i++) {
      const o = s[i];
      this._state[o] !== e[o] && (t[o] = e[o], this._state[o] = e[o], n = !0);
    }
    if (n) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        const o = Object.keys(this._pendingAttributeChanges);
        for (let r = 0; r < o.length; r++) {
          const f = o[r], c = this._pendingAttributeChanges[f];
          this.element.getAttribute(f) !== c && this.element.setAttribute(f, c);
        }
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      const i = Object.keys(t);
      for (let o = 0; o < i.length; o++) {
        const r = i[o], f = t[r], c = typeof f;
        if (c === "boolean" || c === "string") {
          if (!this._stateAttributeCache[r]) {
            const b = r.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
            this._stateAttributeCache[r] = `data-${b}`;
          }
          const u = this._stateAttributeCache[r];
          this._pendingAttributeChanges[u] = c === "boolean" ? f ? "true" : "false" : f;
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
      var s;
      return !I.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), E.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    _("[data-action]", this.element).forEach((t) => {
      t.dataset.action.split(" ").forEach((s) => {
        const i = s.indexOf("->");
        let o, r;
        i !== -1 ? (o = s.substring(0, i), r = s.substring(i + 2)) : (o = s, r = void 0), this[r] ? t.addEventListener(o, (f) => this[r](f)) : console.warn(`Method "${r}" not found in component.`);
      });
    });
  }
};
class B extends M {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class R extends EventTarget {
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
const L = new R();
let h = null;
function x(a) {
  const e = `${l.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  a.forEach((s) => {
    s.removedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) && m(i), _(`[${e}]`, i).forEach((r) => m(r)));
    }), s.addedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && n.add(i);
    });
  }), n.forEach((s) => {
    s.isConnected && z(t, s);
  });
}
function y() {
  typeof document > "u" || (l.get("autoMountComponents") && !h ? (h = new MutationObserver(x), h.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && h && (h.disconnect(), h = null));
}
const P = l.set;
l.set = function(a, e) {
  P.call(this, a, e), a === "autoMountComponents" && y();
};
typeof window < "u" && setTimeout(y, 0);
export {
  M as BaseComponent,
  B as Component,
  l as config,
  O as createInstance,
  j as destroyInstance,
  L as eventbus,
  v as getComponentFromElement,
  z as loadComponents,
  j as removeComponents
};
