var k = Object.defineProperty;
var I = (a, e, t) => e in a ? k(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var y = (a, e, t) => I(a, typeof e != "symbol" ? e + "" : e, t);
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
class z {
  constructor() {
    y(this, "_options", {
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
const f = new z();
function M(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const s = new t(a, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function S(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function m(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function x(a = {}, e = document.documentElement) {
  if (!a || Object.keys(a).length === 0) {
    console.warn("App has no components");
    return;
  }
  const t = [], n = `${f.get("attrPrefix")}-component`, s = m(`[${n}]`, e), i = s.length, o = (r) => {
    if (S(r))
      return;
    const l = r.getAttribute(n);
    typeof a[l] == "function" ? t.push(M(r, l, a[l])) : console.warn(`Constructor "${l}" not found.`);
  };
  for (let r = 0; r < i; r++)
    o(s[r]);
  e instanceof Element && e.hasAttribute(n) && o(e);
  for (let r = 0; r < t.length; r++)
    t[r]._load();
}
function b(a) {
  const e = S(a);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    a.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function F(a = document.documentElement) {
  const e = m(`[${f.get("attrPrefix")}-component]`, a);
  for (let t = 0; t < e.length; t++)
    b(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), C = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new Map();
function R(a) {
  const e = a.root || null, t = a.rootMargin || "0px 0px 0px 0px", n = a.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${s}`;
}
let N = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = m(`[${t}]`, this.element), s = {};
    for (let o = 0; o < n.length; o++) {
      const r = n[o], c = r.getAttribute(t);
      s[c] || (s[c] = []), s[c].push(r);
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
          const r = o.indexOf(":");
          if (r !== -1) {
            const c = o.substring(0, r), l = o.substring(r + 1);
            c === this._name && !this._ref[l] && (this._ref[l] = s[o]);
          } else
            this._ref[o] || (this._ref[o] = s[o]);
        }
    } else {
      this._ref = {};
      for (const o in e)
        if (Object.prototype.hasOwnProperty.call(e, o)) {
          const r = Array.isArray(e[o]);
          if (e[o] !== null && r && e[o].length > 0) {
            this._ref[o] = e[o];
            continue;
          }
          const c = `${this._name}:${o}`;
          let l = s[c] || [];
          l.length === 0 && (l = s[o] || []), this._ref[o] = r ? l : l[0] ?? null;
        }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${f.get("attrPrefix")}-options`);
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
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((i) => {
      for (let o = 0; o < i.length; o++) {
        const r = i[o], c = h.get(r.target);
        if (c) {
          const l = [r];
          for (const u of c)
            u(l);
        }
      }
    }));
    let n = h.get(e);
    n || (n = /* @__PURE__ */ new Set(), h.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let s = this._observedResizeElements.get(e);
    s || (s = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, s)), s.add(t);
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
      if (i)
        for (const o of n)
          i.delete(o);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = R(n);
    let i = _.get(s);
    i || (i = { observer: new IntersectionObserver((u) => {
      for (let d = 0; d < u.length; d++) {
        const w = u[d], v = i.callbacks.get(w.target);
        if (v) {
          const O = [w];
          for (const A of v)
            A(O);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, _.set(s, i));
    let o = i.callbacks.get(e);
    o || (o = /* @__PURE__ */ new Set(), i.callbacks.set(e, o), i.observer.observe(e)), o.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let r = this._observedIntersectionElements.get(e);
    r || (r = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, r));
    let c = r.get(s);
    c || (c = /* @__PURE__ */ new Set(), r.set(s, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, i] of n) {
        const o = _.get(s);
        if (t)
          i.has(t) && (i.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
        else {
          if (o && o.callbacks.has(e)) {
            const r = o.callbacks.get(e);
            for (const c of i)
              r.delete(c);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(s), o) {
          const r = o.callbacks.get(e);
          r && r.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), _.delete(s));
        }
      }
      n.size === 0 && this._observedIntersectionElements.delete(e);
    }
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
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    const t = document.getElementById(e);
    return t ? t.tagName !== "LINK" ? Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : (t._loadPromise || (t._loadPromise = new Promise((n, s) => {
      const i = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        i(), n(!0);
      }, t.onerror = () => {
        i(), delete t._loadPromise, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.dataset.href)
        t.href = t.dataset.href, delete t.dataset.href;
      else if (!t.href && !t.dataset.href)
        i(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.dataset.href) {
        let o = !1;
        for (let r = 0; r < document.styleSheets.length; r++)
          if (document.styleSheets[r].href === t.href) {
            o = !0;
            break;
          }
        o && (i(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    for (const t in e)
      if (Object.prototype.hasOwnProperty.call(e, t)) {
        const n = e[t];
        if (this._state[t] !== n) {
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[t] = n;
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let i = $.get(t);
            i || (i = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(t, i)), this._pendingAttributeChanges[i] = s === "boolean" ? n ? "true" : "false" : n;
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
    let t = C.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var s;
      return !E.has(n) && !n.startsWith("_") && typeof ((s = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : s.value) == "function";
    }), C.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const s = t[n];
      this[s] = this[s].bind(this);
    }
  }
  _autoBindActions() {
    const e = m("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], i = s.dataset.action;
      let o = 0;
      for (; o < i.length; ) {
        let r = i.indexOf(" ", o);
        if (r === -1 && (r = i.length), r > o) {
          const c = i.substring(o, r), l = c.indexOf("->");
          let u, d;
          l !== -1 ? (u = c.substring(0, l), d = c.substring(l + 2)) : (u = c, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !E.has(d) ? s.addEventListener(u, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        o = r + 1;
      }
    }
  }
};
class q extends N {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class L extends EventTarget {
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
const W = new L();
let g = null;
function j(a) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < a.length; s++) {
    const i = a[s];
    for (let o = 0; o < i.removedNodes.length; o++) {
      const r = i.removedNodes[o];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && b(r);
        const c = m(`[${e}]`, r);
        for (let l = 0; l < c.length; l++)
          b(c[l]);
      }
    }
    for (let o = 0; o < i.addedNodes.length; o++) {
      const r = i.addedNodes[o];
      r.nodeType === Node.ELEMENT_NODE && n.add(r);
    }
  }
  for (const s of n)
    s.isConnected && x(t, s);
}
function P() {
  typeof document > "u" || (f.get("autoMountComponents") && !g ? (g = new MutationObserver(j), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const B = f.set;
f.set = function(a, e) {
  B.call(this, a, e), a === "autoMountComponents" && P();
};
typeof window < "u" && setTimeout(P, 0);
export {
  N as BaseComponent,
  q as Component,
  f as config,
  M as createInstance,
  F as destroyInstance,
  W as eventbus,
  S as getComponentFromElement,
  x as loadComponents,
  F as removeComponents
};
