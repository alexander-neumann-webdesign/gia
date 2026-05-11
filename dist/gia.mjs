var y = Object.defineProperty;
var C = (r, e, t) => e in r ? y(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var w = (r, e, t) => C(r, typeof e != "symbol" ? e + "" : e, t);
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
const f = new $();
function A(r, e, t, n) {
  if (r.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), r.__gia_component__;
  try {
    const s = new t(r, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
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
  const t = [], n = `${f.get("attrPrefix")}-component`;
  g(`[${n}]`, e).forEach((s) => {
    const i = v(s);
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
function O(r = document.documentElement) {
  g(`[${f.get("attrPrefix")}-component]`, r).forEach(
    (e) => {
      b(e);
    }
  );
}
let h = null;
const l = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
function I(r) {
  const e = r.root || null, t = r.rootMargin || "0px 0px 0px 0px", n = r.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._stateAttributeCache = {}, this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = g(`[${t}]`, this.element), s = {};
    for (let o = 0; o < n.length; o++) {
      const a = n[o], c = a.getAttribute(t);
      s[c] || (s[c] = []), s[c].push(a);
    }
    let i = !1;
    for (const o in e) {
      i = !0;
      break;
    }
    if (i)
      for (const o in e) {
        const a = Array.isArray(e[o]);
        if (e[o] !== null && a && e[o].length > 0) {
          this._ref[o] = e[o];
          continue;
        }
        const c = `${this._name}:${o}`;
        let d = s[c];
        (!d || d.length === 0) && (d = s[o]), this._ref[o] = a ? d || [] : d ? d[0] : null;
      }
    else
      for (let o = 0; o < n.length; o++) {
        const c = n[o].getAttribute(t), d = c.indexOf(":");
        if (d !== -1) {
          const _ = c.substring(0, d), p = c.substring(d + 1);
          _ === this._name && !this._ref[p] && (this._ref[p] = s[c]);
        } else
          this._ref[c] || (this._ref[c] = s[c]);
      }
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
        const i = l.get(s.target);
        i && i.forEach((o) => o([s]));
      }
    })), l.has(e) || (l.set(e, /* @__PURE__ */ new Set()), h.observe(e)), l.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const i = l.get(e);
      i && i.delete(t);
    } else {
      const i = l.get(e);
      i && n.forEach((o) => i.delete(o)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = l.get(e);
    s && s.size === 0 && (l.delete(e), h && h.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = I(n);
    let i = m.get(s);
    i || (i = { observer: new IntersectionObserver((c) => {
      for (const d of c) {
        const _ = i.callbacks.get(d.target);
        _ && _.forEach((p) => p([d]));
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
          const a = o.callbacks.get(e);
          s.forEach((c) => a.delete(c));
        }
        s.clear();
      }
      if (s.size === 0 && n.delete(i), o) {
        const a = o.callbacks.get(e);
        a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), m.delete(i));
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
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    let t = !1, n = null;
    for (const s in e) {
      const i = e[s];
      this._state[s] !== i && (t || (t = !0, n = {}), n[s] = i, this._state[s] = i);
    }
    if (t) {
      this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(() => {
        for (const s in this._pendingAttributeChanges)
          this.element.setAttribute(s, this._pendingAttributeChanges[s]);
        this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
      }));
      for (const s in n) {
        const i = n[s], o = typeof i;
        if (o === "boolean" || o === "string") {
          let a = this._stateAttributeCache[s];
          a || (a = `data-${s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, this._stateAttributeCache[s] = a), this._pendingAttributeChanges[a] = o === "boolean" ? i ? "true" : "false" : i;
        }
        this._pendingStateChanges[s] = i;
      }
    }
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getOwnPropertyNames(Object.getPrototypeOf(this)), t = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
    for (let n = 0; n < e.length; n++) {
      const s = e[n];
      t.has(s) || s[0] === "_" || typeof this[s] == "function" && (this[s] = this[s].bind(this));
    }
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
class k extends R {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class S extends EventTarget {
  emit(e, t = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
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
const B = new S();
let u = null;
function x(r) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  let n = !1;
  r.forEach((s) => {
    s.removedNodes.forEach((i) => {
      i.nodeType === Node.ELEMENT_NODE && (i.hasAttribute(e) && b(i), g(`[${e}]`, i).forEach((a) => b(a)));
    }), s.addedNodes.length > 0 && (n = !0);
  }), n && z(t, document.body);
}
function E() {
  typeof document > "u" || (f.get("autoMountComponents") && !u ? (u = new MutationObserver(x), u.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && u && (u.disconnect(), u = null));
}
const M = f.set;
f.set = function(r, e) {
  M.call(this, r, e), r === "autoMountComponents" && E();
};
typeof window < "u" && setTimeout(E, 0);
export {
  R as BaseComponent,
  k as Component,
  f as config,
  A as createInstance,
  O as destroyInstance,
  B as eventbus,
  v as getComponentFromElement,
  z as loadComponents,
  O as removeComponents
};
