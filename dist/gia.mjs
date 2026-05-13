var O = Object.defineProperty;
var S = (i, e, t) => e in i ? O(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var w = (i, e, t) => S(i, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (i) => {
  if (typeof i != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", i);
    return;
  }
  const e = i.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = i;
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
function I(i, e, t, n) {
  if (i.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), i.__gia_component__;
  try {
    const s = new t(i, n);
    return l.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function $(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
function m(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function z(i = {}, e = document.documentElement) {
  let t = !0;
  if (i) {
    for (const c in i)
      if (Object.prototype.hasOwnProperty.call(i, c)) {
        t = !1;
        break;
      }
  }
  if (t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${l.get("attrPrefix")}-component`, r = m(`[${s}]`, e), o = r.length, a = (c) => {
    if ($(c))
      return;
    const d = c.getAttribute(s);
    typeof i[d] == "function" ? n.push(I(c, d, i[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let c = 0; c < o; c++)
    a(r[c]);
  e instanceof Element && e.hasAttribute(s) && a(e);
  for (let c = 0; c < n.length; c++)
    n[c]._load();
}
function b(i) {
  const e = $(i);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    i.__gia_component__ = null, e.element && (e.element = null), l.get("log") && console.info(`Removed component "${t}".`);
  }
}
function j(i = document.documentElement) {
  const e = m(`[${l.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    b(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), v = /* @__PURE__ */ new WeakMap(), y = /* @__PURE__ */ new Map();
function M(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let R = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._autoBindFunctions(), l.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${l.get("attrPrefix")}-ref`, n = m(`[${t}]`, this.element), s = {};
    for (let o = 0; o < n.length; o++) {
      const a = n[o], c = a.getAttribute(t);
      s[c] || (s[c] = []), s[c].push(a);
    }
    let r = !0;
    for (const o in e)
      if (Object.prototype.hasOwnProperty.call(e, o)) {
        r = !1;
        break;
      }
    if (r) {
      for (const o in s)
        if (Object.prototype.hasOwnProperty.call(s, o)) {
          const a = o.indexOf(":");
          if (a !== -1) {
            const c = o.substring(0, a), f = o.substring(a + 1);
            c === this._name && !this._ref[f] && (this._ref[f] = s[o]);
          } else
            this._ref[o] || (this._ref[o] = s[o]);
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
          let f = s[c] || [];
          f.length === 0 && (f = s[o] || []), this._ref[o] = a ? f : f[0] ?? null;
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
        } catch (r) {
          console.error(`Failed to parse options for component "${this._name}": ${r.message}`);
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
        const r = h.get(s.target);
        r && r.forEach((o) => o([s]));
      }
    })), h.has(e) || (h.set(e, /* @__PURE__ */ new Set()), p.observe(e)), h.get(e).add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map()), this._observedResizeElements.has(e) || this._observedResizeElements.set(e, /* @__PURE__ */ new Set()), this._observedResizeElements.get(e).add(t));
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const r = h.get(e);
      r && r.delete(t);
    } else {
      const r = h.get(e);
      r && n.forEach((o) => r.delete(o)), n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = M(n);
    let r = _.get(s);
    r || (r = { observer: new IntersectionObserver((c) => {
      for (const f of c) {
        const d = r.callbacks.get(f.target);
        d && d.forEach((u) => u([f]));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(s, r)), r.callbacks.has(e) || (r.callbacks.set(e, /* @__PURE__ */ new Set()), r.observer.observe(e)), r.callbacks.get(e).add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map()), this._observedIntersectionElements.has(e) || this._observedIntersectionElements.set(e, /* @__PURE__ */ new Map());
    const o = this._observedIntersectionElements.get(e);
    o.has(s) || o.set(s, /* @__PURE__ */ new Set()), o.get(s).add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    n && (n.forEach((s, r) => {
      const o = _.get(r);
      if (t)
        s.has(t) && (s.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
      else {
        if (o && o.callbacks.has(e)) {
          const a = o.callbacks.get(e);
          s.forEach((c) => a.delete(c));
        }
        s.clear();
      }
      if (s.size === 0 && n.delete(r), o) {
        const a = o.callbacks.get(e);
        a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), _.delete(r));
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
    return n ? n.tagName !== "SCRIPT" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : (n._loadPromise || (n._loadPromise = new Promise((s, r) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n._loadPromise, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.dataset.src ? (n.src = n.dataset.src, delete n.dataset.src) : !n.src && !n.dataset.src && (o(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    const t = document.getElementById(e);
    return t ? t.tagName !== "LINK" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : (t._loadPromise || (t._loadPromise = new Promise((n, s) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.dataset.href)
        t.href = t.dataset.href, delete t.dataset.href;
      else if (!t.href && !t.dataset.href)
        r(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.dataset.href) {
        let o = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            o = !0;
            break;
          }
        o && (r(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
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
            for (const r in this._pendingAttributeChanges)
              if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, r)) {
                const o = this._pendingAttributeChanges[r];
                this.element.getAttribute(r) !== o && this.element.setAttribute(r, o);
              }
            this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
          })), this._pendingStateChanges[t] = n;
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = y.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, y.set(t, r)), this._pendingAttributeChanges[r] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = v.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !E.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), v.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = m("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], r = s.dataset.action;
      let o = 0;
      for (; o < r.length; ) {
        let a = r.indexOf(" ", o);
        if (a === -1 && (a = r.length), a > o) {
          const c = r.substring(o, a), f = c.indexOf("->");
          let d, u;
          f !== -1 ? (d = c.substring(0, f), u = c.substring(f + 2)) : (d = c, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !E.has(u) ? s.addEventListener(d, (P) => this[u](P)) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        o = a + 1;
      }
    }
  }
};
class D extends R {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class k extends EventTarget {
  emit(e, t = {}) {
    l.get("log") && console.info(`Emitting event '${e}'`);
    const n = new CustomEvent(e, { detail: t });
    n._name = e, this.dispatchEvent(n);
  }
  on(e, t, n = !1) {
    const s = (r) => t({ ...r.detail, _name: r._name });
    t._wrapped = s, this.addEventListener(e, s, { once: n });
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    t && t._wrapped ? this.removeEventListener(e, t._wrapped) : t && this.removeEventListener(e, t), t || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const F = new k();
let g = null;
function x(i) {
  const e = `${l.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < i.length; s++) {
    const r = i[s];
    for (let o = 0; o < r.removedNodes.length; o++) {
      const a = r.removedNodes[o];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && b(a);
        const c = m(`[${e}]`, a);
        for (let f = 0; f < c.length; f++)
          b(c[f]);
      }
    }
    for (let o = 0; o < r.addedNodes.length; o++) {
      const a = r.addedNodes[o];
      a.nodeType === Node.ELEMENT_NODE && n.add(a);
    }
  }
  for (const s of n)
    s.isConnected && z(t, s);
}
function C() {
  typeof document > "u" || (l.get("autoMountComponents") && !g ? (g = new MutationObserver(x), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !l.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const N = l.set;
l.set = function(i, e) {
  N.call(this, i, e), i === "autoMountComponents" && C();
};
typeof window < "u" && setTimeout(C, 0);
export {
  R as BaseComponent,
  D as Component,
  l as config,
  I as createInstance,
  j as destroyInstance,
  F as eventbus,
  $ as getComponentFromElement,
  z as loadComponents,
  j as removeComponents
};
