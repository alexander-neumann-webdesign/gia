var k = Object.defineProperty;
var I = (i, e, t) => e in i ? k(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var v = (i, e, t) => I(i, typeof e != "symbol" ? e + "" : e, t);
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
class z {
  constructor() {
    v(this, "_options", {
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
function M(i, e, t, n) {
  if (i.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), i.__gia_component__;
  try {
    const s = new t(i, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function P(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : i.__gia_component__;
}
function m(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function x(i = {}, e = document.documentElement) {
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
  const n = [], s = `${f.get("attrPrefix")}-component`, r = m(`[${s}]`, e), o = r.length, a = (c) => {
    if (P(c))
      return;
    const d = c.getAttribute(s);
    typeof i[d] == "function" ? n.push(M(c, d, i[d])) : console.warn(`Constructor "${d}" not found.`);
  };
  for (let c = 0; c < o; c++)
    a(r[c]);
  e instanceof Element && e.hasAttribute(s) && a(e);
  for (let c = 0; c < n.length; c++)
    n[c]._load();
}
function _(i) {
  const e = P(i);
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    i.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function F(i = document.documentElement) {
  const e = m(`[${f.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    _(e[t]);
}
let p = null;
const h = /* @__PURE__ */ new Map(), b = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), C = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new Map();
function R(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0, s = Array.isArray(n) ? n.join(",") : n.toString();
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
            const c = o.substring(0, a), l = o.substring(a + 1);
            c === this._name && !this._ref[l] && (this._ref[l] = s[o]);
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
          let l = s[c] || [];
          l.length === 0 && (l = s[o] || []), this._ref[o] = a ? l : l[0] ?? null;
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
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const a = r[o], c = h.get(a.target);
        if (c) {
          const l = [a];
          for (const d of c)
            d(l);
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
      const r = h.get(e);
      r && r.delete(t);
    } else {
      const r = h.get(e);
      if (r)
        for (const o of n)
          r.delete(o);
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const s = h.get(e);
    s && s.size === 0 && (h.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const s = R(n);
    let r = b.get(s);
    r || (r = { observer: new IntersectionObserver((d) => {
      for (let u = 0; u < d.length; u++) {
        const w = d[u], y = r.callbacks.get(w.target);
        if (y) {
          const O = [w];
          for (const A of y)
            A(O);
        }
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, b.set(s, r));
    let o = r.callbacks.get(e);
    o || (o = /* @__PURE__ */ new Set(), r.callbacks.set(e, o), r.observer.observe(e)), o.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let c = a.get(s);
    c || (c = /* @__PURE__ */ new Set(), a.set(s, c)), c.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (n) {
      for (const [s, r] of n) {
        const o = b.get(s);
        if (t)
          r.has(t) && (r.delete(t), o && o.callbacks.has(e) && o.callbacks.get(e).delete(t));
        else {
          if (o && o.callbacks.has(e)) {
            const a = o.callbacks.get(e);
            for (const c of r)
              a.delete(c);
          }
          r.clear();
        }
        if (r.size === 0 && n.delete(s), o) {
          const a = o.callbacks.get(e);
          a && a.size === 0 && (o.callbacks.delete(e), o.observer.unobserve(e)), o.callbacks.size === 0 && (o.observer.disconnect(), b.delete(s));
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
            let r = $.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, $.set(t, r)), this._pendingAttributeChanges[r] = s === "boolean" ? n ? "true" : "false" : n;
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
      const s = e[n], r = s.dataset.action;
      let o = 0;
      for (; o < r.length; ) {
        let a = r.indexOf(" ", o);
        if (a === -1 && (a = r.length), a > o) {
          const c = r.substring(o, a), l = c.indexOf("->");
          let d, u;
          l !== -1 ? (d = c.substring(0, l), u = c.substring(l + 2)) : (d = c, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !E.has(u) ? s.addEventListener(d, this[u]) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        o = a + 1;
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
const W = new L();
let g = null;
function j(i) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let s = 0; s < i.length; s++) {
    const r = i[s];
    for (let o = 0; o < r.removedNodes.length; o++) {
      const a = r.removedNodes[o];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && _(a);
        const c = m(`[${e}]`, a);
        for (let l = 0; l < c.length; l++)
          _(c[l]);
      }
    }
    for (let o = 0; o < r.addedNodes.length; o++) {
      const a = r.addedNodes[o];
      a.nodeType === Node.ELEMENT_NODE && n.add(a);
    }
  }
  for (const s of n)
    s.isConnected && x(t, s);
}
function S() {
  typeof document > "u" || (f.get("autoMountComponents") && !g ? (g = new MutationObserver(j), g.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && g && (g.disconnect(), g = null));
}
const B = f.set;
f.set = function(i, e) {
  B.call(this, i, e), i === "autoMountComponents" && S();
};
typeof window < "u" && setTimeout(S, 0);
export {
  N as BaseComponent,
  q as Component,
  f as config,
  M as createInstance,
  F as destroyInstance,
  W as eventbus,
  P as getComponentFromElement,
  x as loadComponents,
  F as removeComponents
};
