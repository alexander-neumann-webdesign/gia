var M = Object.defineProperty;
var O = (a, e, t) => e in a ? M(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var y = (a, e, t) => O(a, typeof e != "symbol" ? e + "" : e, t);
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
class I {
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
const u = new I();
function E(a, e, t, n) {
  if (a.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), a.__gia_component__;
  try {
    const o = new t(a, n);
    return u.get("log") && console.info(`Created instance of component "${e}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${e}".`, o), null;
  }
}
function D(a) {
  return typeof a == "string" && (a = document.getElementById(a), !a) ? null : a.__gia_component__;
}
function p(a, e = document) {
  return typeof a != "string" ? a : e.querySelectorAll(a);
}
function z(a = {}, e = document.documentElement) {
  if (!a) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const r in a) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${u.get("attrPrefix")}-component`, i = p(`[${o}]`, e), s = i.length;
  for (let r = 0; r < s; r++) {
    const c = i[r];
    if (!c.__gia_component__) {
      const d = c.getAttribute(o);
      typeof a[d] == "function" ? n.push(E(c, d, a[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(o) && !e.__gia_component__) {
    const c = e.getAttribute(o);
    typeof a[c] == "function" ? n.push(E(e, c, a[c])) : console.warn(`Constructor "${c}" not found.`);
  }
  for (let r = 0; r < n.length; r++)
    n[r]._load();
}
function b(a) {
  if (!a) return;
  let e = a.__gia_component__;
  if (!e && typeof a == "string") {
    const t = document.getElementById(a);
    t && (e = t.__gia_component__, a = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    a.__gia_component__ = null, e.element && (e.element = null), u.get("log") && console.info(`Removed component "${t}".`);
  }
}
function H(a = document.documentElement) {
  const e = p(`[${u.get("attrPrefix")}-component]`, a);
  for (let t = 0; t < e.length; t++)
    b(e[t]);
}
let _ = null;
const h = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), A = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new Map();
function R(a) {
  const e = a.root || null, t = a.rootMargin || "0px 0px 0px 0px", n = a.threshold || 0, o = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${o}`;
}
let x = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), u.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${u.get("attrPrefix")}-ref`, n = p(`[${t}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const r = n[s], c = r.getAttribute(t);
      let l = o[c];
      l === void 0 && (l = [], o[c] = l), l.push(r);
    }
    let i = !0;
    for (const s in e) {
      i = !1;
      break;
    }
    if (i) {
      const s = Object.keys(o);
      for (let r = 0; r < s.length; r++) {
        const c = s[r], l = c.indexOf(":");
        if (l !== -1) {
          const d = c.substring(0, l), f = c.substring(l + 1);
          d === this._name && !this._ref[f] && (this._ref[f] = o[c]);
        } else
          this._ref[c] || (this._ref[c] = o[c]);
      }
    } else {
      this._ref = {};
      const s = e ? Object.keys(e) : [];
      for (let r = 0; r < s.length; r++) {
        const c = s[r], l = Array.isArray(e[c]);
        if (e[c] !== null && l && e[c].length > 0) {
          this._ref[c] = e[c];
          continue;
        }
        const d = `${this._name}:${c}`;
        let f = o[d] || [];
        f.length === 0 && (f = o[c] || []), this._ref[c] = l ? f : f[0] ?? null;
      }
    }
  }
  get options() {
    return this._options;
  }
  set options(e) {
    const t = this.element.getAttribute(`${u.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const o = t.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
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
    _ || (_ = new ResizeObserver((i) => {
      for (let s = 0; s < i.length; s++) {
        const r = i[s], c = h.get(r.target);
        if (c) {
          const l = [r];
          for (const d of c)
            d(l);
        }
      }
    }));
    let n = h.get(e);
    n || (n = /* @__PURE__ */ new Set(), h.set(e, n), _.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let o = this._observedResizeElements.get(e);
    o || (o = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, o)), o.add(t);
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
        for (const s of n)
          i.delete(s);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const o = h.get(e);
    o && o.size === 0 && (h.delete(e), _ && _.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const o = R(n);
    let i = m.get(o);
    i || (i = { observer: new IntersectionObserver((d) => {
      for (let f = 0; f < d.length; f++) {
        const w = d[f], v = i.callbacks.get(w.target);
        if (v) {
          const k = [w];
          for (const P of v)
            P(k);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, m.set(o, i));
    let s = i.callbacks.get(e);
    s || (s = /* @__PURE__ */ new Set(), i.callbacks.set(e, s), i.observer.observe(e)), s.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let r = this._observedIntersectionElements.get(e);
    r || (r = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, r));
    let c = r.get(o);
    c || (c = /* @__PURE__ */ new Set(), r.set(o, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [o, i] of n) {
        const s = m.get(o);
        if (t)
          i.has(t) && (i.delete(t), s && s.callbacks.has(e) && s.callbacks.get(e).delete(t));
        else {
          if (s && s.callbacks.has(e)) {
            const r = s.callbacks.get(e);
            for (const c of i)
              r.delete(c);
          }
          i.clear();
        }
        if (i.size === 0 && n.delete(o), s) {
          const r = s.callbacks.get(e);
          r && r.size === 0 && (s.callbacks.delete(e), s.observer.unobserve(e)), s.callbacks.size === 0 && (s.observer.disconnect(), m.delete(o));
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
    if (t && window[t] && !(window[t] instanceof Node))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((o, i) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, i(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), i(new Error(`Script tag '${e}' has no src or data-src.`)));
    })), n._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    const t = document.getElementById(e);
    return t ? t instanceof HTMLLinkElement ? (t._loadPromise || (t._loadPromise = new Promise((n, o) => {
      const i = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        i(), n(!0);
      }, t.onerror = () => {
        i(), delete t._loadPromise, o(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        i(), o(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let s = !1;
        for (let r = 0; r < document.styleSheets.length; r++)
          if (document.styleSheets[r].href === t.href) {
            s = !0;
            break;
          }
        s && (i(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${u.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    const t = e ? Object.keys(e) : [];
    for (let n = 0; n < t.length; n++) {
      const o = t[n], i = e[o];
      if (this._state[o] !== i) {
        this._state[o] = i, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[o] = i;
        const s = typeof i;
        if (s === "boolean" || s === "string") {
          let r = $.get(o);
          r || (r = `data-${o.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(o, r)), this._pendingAttributeChanges[r] = s === "boolean" ? i ? "true" : "false" : i;
        }
      }
    }
  }
  _flushStateChanges() {
    let e = !1;
    for (const t in this._pendingAttributeChanges) {
      e = !0;
      break;
    }
    if (e) {
      const t = Object.keys(this._pendingAttributeChanges);
      for (let n = 0; n < t.length; n++) {
        const o = t[n], i = this._pendingAttributeChanges[o];
        this.element.getAttribute(o) !== i && this.element.setAttribute(o, i);
      }
    }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    const e = Object.getPrototypeOf(this);
    let t = A.get(e);
    t || (t = Object.getOwnPropertyNames(e).filter((n) => {
      var o;
      return !C.has(n) && !n.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(e, n)) == null ? void 0 : o.value) == "function";
    }), A.set(e, t));
    for (let n = 0; n < t.length; n++) {
      const o = t[n];
      this[o] = this[o].bind(this);
    }
  }
  _autoBindActions() {
    const e = p("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const o = e[n], i = o.getAttribute("data-action");
      if (!i) continue;
      let s = 0;
      for (; s < i.length; ) {
        let r = i.indexOf(" ", s);
        if (r === -1 && (r = i.length), r > s) {
          const c = i.substring(s, r), l = c.indexOf("->");
          let d, f;
          l !== -1 ? (d = c.substring(0, l), f = c.substring(l + 2)) : (d = c, f = void 0), this[f] && typeof this[f] == "function" && !f.startsWith("_") && !C.has(f) ? o.addEventListener(d, this[f]) : console.warn(`Method "${f}" not found, is restricted, or is not a function in component.`);
        }
        s = r + 1;
      }
    }
  }
};
class F extends x {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class N extends EventTarget {
  emit(e, t = {}) {
    u.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, o = new CustomEvent(e, { detail: n });
    o._name = e, this.dispatchEvent(o);
  }
  on(e, t, n = !1) {
    let o = t._wrappedHandlers;
    o || (o = /* @__PURE__ */ new Map(), t._wrappedHandlers = o);
    let i = o.get(e);
    i || (i = (s) => {
      s.detail && s.detail._name === s._name ? t(s.detail) : t({ ...s.detail, _name: s._name });
    }, o.set(e, i)), this.addEventListener(e, i, { once: n });
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    if (t && t._wrappedHandlers) {
      const n = t._wrappedHandlers.get(e);
      n && this.removeEventListener(e, n);
    } else t && t._wrapped ? this.removeEventListener(e, t._wrapped) : t && this.removeEventListener(e, t);
    t || console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
  }
}
const q = new N();
let g = null;
function L(a) {
  const e = `${u.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let o = 0; o < a.length; o++) {
    const i = a[o];
    for (let s = 0; s < i.removedNodes.length; s++) {
      const r = i.removedNodes[s];
      if (r.nodeType === Node.ELEMENT_NODE) {
        r.hasAttribute(e) && b(r);
        const c = p(`[${e}]`, r);
        for (let l = 0; l < c.length; l++)
          b(c[l]);
      }
    }
    for (let s = 0; s < i.addedNodes.length; s++) {
      const r = i.addedNodes[s];
      r.nodeType === Node.ELEMENT_NODE && (r.hasAttribute(e) || r.querySelector(`[${e}]`)) && n.add(r);
    }
  }
  for (const o of n)
    o.isConnected && z(t, o);
}
function S() {
  typeof document > "u" || (u.get("autoMountComponents") && !g ? (g = new MutationObserver(L), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !u.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const B = u.set;
u.set = function(a, e) {
  B.call(this, a, e), a === "autoMountComponents" && S();
};
typeof window < "u" && setTimeout(S, 0);
export {
  x as BaseComponent,
  F as Component,
  u as config,
  E as createInstance,
  H as destroyInstance,
  q as eventbus,
  D as getComponentFromElement,
  z as loadComponents,
  H as removeComponents
};
