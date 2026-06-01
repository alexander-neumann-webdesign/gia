var D = Object.defineProperty;
var G = (o, e, t) => e in o ? D(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var L = (o, e, t) => G(o, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (o) => {
  if (typeof o != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", o);
    return;
  }
  const e = o.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[e] = o;
});
class Y {
  constructor() {
    L(this, "_options", {
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
const f = new Y();
function I(o, e, t, n) {
  if (o.__gia_component__)
    return console.warn(`Component "${e}" already exists.`), o.__gia_component__;
  try {
    const i = new t(o, n);
    return f.get("log") && console.info(`Created instance of component "${e}".`), i;
  } catch (i) {
    return console.error(`Failed to create component "${e}".`, i), null;
  }
}
function ue(o) {
  return typeof o == "string" && (o = document.getElementById(o), !o) ? null : o.__gia_component__;
}
function K(o, e = document) {
  return typeof o != "string" ? o : e.querySelector(o);
}
function b(o, e = document) {
  return typeof o != "string" ? o : e.querySelectorAll(o);
}
function U(o, e, t = null) {
  t === null ? o.classList.toggle(e) : o.classList.toggle(e, !!t);
}
function H(o, e, t) {
  if (!o) return o;
  if (o.length !== void 0 && o.nodeType === void 0)
    for (let n = 0; n < o.length; n++)
      o[n].classList[t](e);
  else
    o.classList[t](e);
  return o;
}
function J(o, e) {
  return H(o, e, "remove");
}
function V(o, e) {
  return H(o, e, "add");
}
function Z(o, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const i = new CustomEvent(e, n);
  o.dispatchEvent(i);
}
function Q(o, e) {
  let t, n = null;
  const i = () => {
    clearTimeout(t), n && o(...n);
  }, r = function(...s) {
    n = s, clearTimeout(t), t = setTimeout(i, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null;
  }, r;
}
const he = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: V,
  debounce: Q,
  query: K,
  queryAll: b,
  removeClass: J,
  toggleClass: U,
  triggerEvent: Z
}, Symbol.toStringTag, { value: "Module" }));
function X(o = {}, e = document.documentElement) {
  if (!o) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const a in o) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], i = `${f.get("attrPrefix")}-component`, r = b(`[${i}]`, e), s = r.length;
  for (let a = 0; a < s; a++) {
    const l = r[a];
    if (!l.__gia_component__) {
      const d = l.getAttribute(i);
      typeof o[d] == "function" ? n.push(I(l, d, o[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(i) && !e.__gia_component__) {
    const l = e.getAttribute(i);
    typeof o[l] == "function" ? n.push(I(e, l, o[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  for (let a = 0; a < n.length; a++)
    n[a]._load();
}
function S(o) {
  if (!o) return;
  let e = o.__gia_component__;
  if (!e && typeof o == "string") {
    const t = document.getElementById(o);
    t && (e = t.__gia_component__, o = t);
  }
  if (e) {
    const t = e._name || "Unknown";
    try {
      typeof e._destroy == "function" ? e._destroy() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    o.__gia_component__ = null, e.element && (e.element = null), f.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ge(o = document.documentElement) {
  const e = b(`[${f.get("attrPrefix")}-component]`, o);
  for (let t = 0; t < e.length; t++)
    S(e[t]);
}
let w = !1, m = !1;
const y = /* @__PURE__ */ new Set(), ee = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), x = ee ? "orientationchange" : "resize", C = /* @__PURE__ */ new Set();
let h = null;
const A = { scroll: 0, velocity: 0 }, z = { width: 0, height: 0 }, $ = [null], te = (o) => o(A), ne = (o) => o(z), T = (o) => o($);
let k = !1, q = null;
function oe() {
  k = !1;
  const o = q;
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : o && typeof o.scroll == "number" ? (e = o.scroll, t = o.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), A.scroll = e, A.velocity = t, y.forEach(te);
}
function v(o) {
  q = o, k || (k = !0, window.requestAnimationFrame(oe));
}
let P = !1;
function se() {
  P = !1, z.width = window.innerWidth, z.height = window.innerHeight, C.forEach(ne);
}
function B(o) {
  P || (P = !0, window.requestAnimationFrame(se));
}
let p = null;
const g = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), W = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new Map();
function ie(o) {
  const e = o.root || null, t = o.rootMargin || "0px 0px 0px 0px", n = o.threshold || 0, i = Array.isArray(n) ? n.join(",") : n.toString();
  return `${e ? e.id || "root-element" : "null"}|${t}|${i}`;
}
let re = class {
  constructor(e, t) {
    this.element = e, this.element.__gia_component__ = this, this._name = this.constructor.name, this._ref = {}, this._options = t || {}, this._state = {}, this._flushStateChanges = this._flushStateChanges.bind(this), this._autoBindFunctions(), f.get("autoBindActions") && this._autoBindActions();
  }
  get ref() {
    return this._ref;
  }
  set ref(e) {
    const t = `${f.get("attrPrefix")}-ref`, n = b(`[${t}]`, this.element), i = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const a = n[s], l = a.getAttribute(t);
      let c = i[l];
      c === void 0 && (c = [], i[l] = c), c.push(a);
    }
    let r = !0;
    for (const s in e) {
      r = !1;
      break;
    }
    if (r)
      for (const s in i) {
        const a = s.indexOf(":");
        if (a !== -1) {
          const l = s.substring(0, a), c = s.substring(a + 1);
          l === this._name && !this._ref[c] && (this._ref[c] = i[s]);
        } else
          this._ref[s] || (this._ref[s] = i[s]);
      }
    else {
      this._ref = {};
      for (const s in e) {
        if (!Object.prototype.hasOwnProperty.call(e, s)) continue;
        const a = Array.isArray(e[s]);
        if (e[s] !== null && a && e[s].length > 0) {
          this._ref[s] = e[s];
          continue;
        }
        const l = `${this._name}:${s}`;
        let c = i[l] || [];
        c.length === 0 && (c = i[s] || []), this._ref[s] = a ? c : c[0] ?? null;
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
      const i = t.trim();
      if (i.startsWith("{") || i.startsWith("["))
        try {
          n = JSON.parse(i);
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
    if (this.unmount(), this._observedScrollCallbacks && this._observedScrollCallbacks.forEach(this.unobserveScroll, this), this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.forEach(this.unobserveWindowResize, this), this._observedResizeElements) {
      const e = function(t, n) {
        this.unobserveResize(n);
      };
      this._observedResizeElements.forEach(e, this);
    }
    if (this._observedIntersectionElements) {
      const e = function(t, n) {
        this.unobserveIntersection(n);
      };
      this._observedIntersectionElements.forEach(e, this);
    }
  }
  observeScroll(e) {
    typeof window > "u" || (w || (w = !0, window.lenis ? (h = window.lenis, h.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this._observedScrollCallbacks || (this._observedScrollCallbacks = /* @__PURE__ */ new Set()), this._observedScrollCallbacks.add(e), y.add(e));
  }
  unobserveScroll(e) {
    this._observedScrollCallbacks && this._observedScrollCallbacks.delete(e), y.delete(e), y.size === 0 && w && (w = !1, h ? (h.off("scroll", v), h = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof window > "u" || (m || (m = !0, window.addEventListener(x, B, { passive: !0 })), this._observedWindowResizeCallbacks || (this._observedWindowResizeCallbacks = /* @__PURE__ */ new Set()), this._observedWindowResizeCallbacks.add(e), C.add(e));
  }
  unobserveWindowResize(e) {
    this._observedWindowResizeCallbacks && this._observedWindowResizeCallbacks.delete(e), C.delete(e), C.size === 0 && m && (m = !1, window.removeEventListener(x, B));
  }
  observeResize(e, t) {
    if (typeof window > "u" || !window.ResizeObserver) return;
    p || (p = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const a = r[s], l = g.get(a.target);
        l && ($[0] = a, l.forEach(T));
      }
    }));
    let n = g.get(e);
    n || (n = /* @__PURE__ */ new Set(), g.set(e, n), p.observe(e)), n.add(t), this._observedResizeElements || (this._observedResizeElements = /* @__PURE__ */ new Map());
    let i = this._observedResizeElements.get(e);
    i || (i = /* @__PURE__ */ new Set(), this._observedResizeElements.set(e, i)), i.add(t);
  }
  unobserveResize(e, t = null) {
    if (!this._observedResizeElements) return;
    const n = this._observedResizeElements.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const r = g.get(e);
      r && r.delete(t);
    } else {
      const r = g.get(e);
      if (r) {
        const s = function(a) {
          this.delete(a);
        };
        n.forEach(s, r);
      }
      n.clear();
    }
    n.size === 0 && this._observedResizeElements.delete(e);
    const i = g.get(e);
    i && i.size === 0 && (g.delete(e), p && p.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof window > "u" || !window.IntersectionObserver) return;
    const i = ie(n);
    let r = E.get(i);
    r || (r = { observer: new IntersectionObserver((d) => {
      for (let u = 0; u < d.length; u++) {
        const O = d[u], M = r.callbacks.get(O.target);
        M && ($[0] = O, M.forEach(T));
      }
    }, n), callbacks: /* @__PURE__ */ new Map() }, E.set(i, r));
    let s = r.callbacks.get(e);
    s || (s = /* @__PURE__ */ new Set(), r.callbacks.set(e, s), r.observer.observe(e)), s.add(t), this._observedIntersectionElements || (this._observedIntersectionElements = /* @__PURE__ */ new Map());
    let a = this._observedIntersectionElements.get(e);
    a || (a = /* @__PURE__ */ new Map(), this._observedIntersectionElements.set(e, a));
    let l = a.get(i);
    l || (l = /* @__PURE__ */ new Set(), a.set(i, l)), l.add(t);
  }
  unobserveIntersection(e, t = null) {
    if (!this._observedIntersectionElements) return;
    const n = this._observedIntersectionElements.get(e);
    if (!n) return;
    const i = function(r, s) {
      const a = E.get(s);
      if (t)
        r.has(t) && (r.delete(t), a && a.callbacks.has(e) && a.callbacks.get(e).delete(t));
      else {
        if (a && a.callbacks.has(e)) {
          const l = a.callbacks.get(e), c = function(d) {
            this.delete(d);
          };
          r.forEach(c, l);
        }
        r.clear();
      }
      if (r.size === 0 && n.delete(s), a) {
        const l = a.callbacks.get(e);
        l && l.size === 0 && (a.callbacks.delete(e), a.observer.unobserve(e)), a.callbacks.size === 0 && (a.observer.disconnect(), E.delete(s));
      }
    };
    n.forEach(i), n.size === 0 && this._observedIntersectionElements.delete(e);
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (t && window[t] && !(window[t] instanceof Node) && !(window[t] instanceof HTMLCollection) && !(window[t] instanceof Window))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? (n._loadPromise || (n._loadPromise = new Promise((i, r) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), i(t ? window[t] : !0);
      }, n.onerror = () => {
        s(), delete n._loadPromise, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
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
    return t ? t instanceof HTMLLinkElement ? (t._loadPromise || (t._loadPromise = new Promise((n, i) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t._loadPromise, i(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), i(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let s = !1;
        for (let a = 0; a < document.styleSheets.length; a++)
          if (document.styleSheets[a].href === t.href) {
            s = !0;
            break;
          }
        s && (r(), n(!0));
      }
    })), t._loadPromise) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${f.get("attrPrefix")}-ref="${t ? `${this._name}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this._state[t] !== n) {
          this._state[t] = n, this._pendingStateChanges || (this._pendingStateChanges = {}, this._pendingAttributeChanges = {}, requestAnimationFrame(this._flushStateChanges)), this._pendingStateChanges[t] = n;
          const i = typeof n;
          if (i === "boolean" || i === "string") {
            let r = j.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, j.set(t, r)), this._pendingAttributeChanges[r] = i === "boolean" ? n ? "true" : "false" : n;
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
    if (e)
      for (const t in this._pendingAttributeChanges) {
        if (!Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, t)) continue;
        const n = this._pendingAttributeChanges[t];
        this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
      }
    this.stateChange(this._pendingStateChanges), this._pendingStateChanges = null, this._pendingAttributeChanges = null;
  }
  stateChange(e) {
    return e;
  }
  _autoBindFunctions() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = W.get(e);
    if (!t) {
      t = [];
      const i = Object.getOwnPropertyNames(e);
      for (let r = 0; r < i.length; r++) {
        const s = i[r];
        !N.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, s)) == null ? void 0 : n.value) == "function" && t.push(s);
      }
      W.set(e, t);
    }
    for (let i = 0; i < t.length; i++) {
      const r = t[i];
      this[r] = this[r].bind(this);
    }
  }
  _autoBindActions() {
    const e = b("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const i = e[n], r = i.getAttribute("data-action");
      if (!r) continue;
      let s = 0;
      for (; s < r.length; ) {
        let a = r.indexOf(" ", s);
        if (a === -1 && (a = r.length), a > s) {
          const l = r.substring(s, a), c = l.indexOf("->");
          let d, u;
          c !== -1 ? (d = l.substring(0, c), u = l.substring(c + 2)) : (d = l, u = void 0), this[u] && typeof this[u] == "function" && !u.startsWith("_") && !N.has(u) ? i.addEventListener(d, this[u]) : console.warn(`Method "${u}" not found, is restricted, or is not a function in component.`);
        }
        s = a + 1;
      }
    }
  }
};
class be extends re {
  async require() {
  }
  _load() {
    this.require().then(this.mount.bind(this));
  }
}
class ae extends EventTarget {
  emit(e, t = {}) {
    f.get("log") && console.info(`Emitting event '${e}'`);
    const n = { ...t, _name: e }, i = new CustomEvent(e, { detail: n });
    i._name = e, this.dispatchEvent(i);
  }
  on(e, t, n = !1) {
    let i = t._wrappedHandlers;
    i || (i = /* @__PURE__ */ new Map(), t._wrappedHandlers = i);
    let r = i.get(e);
    r || (r = (s) => {
      s.detail && s.detail._name === s._name ? t(s.detail) : t({ ...s.detail, _name: s._name });
    }, i.set(e, r)), this.addEventListener(e, r, { once: n });
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
const pe = new ae();
let _ = null, R = null;
const le = (o) => {
  o.isConnected && X(R, o);
};
function ce(o) {
  const e = `${f.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {}, n = /* @__PURE__ */ new Set();
  for (let i = 0; i < o.length; i++) {
    const r = o[i];
    for (let s = 0; s < r.removedNodes.length; s++) {
      const a = r.removedNodes[s];
      if (a.nodeType === Node.ELEMENT_NODE) {
        a.hasAttribute(e) && S(a);
        const l = b(`[${e}]`, a);
        for (let c = 0; c < l.length; c++)
          S(l[c]);
      }
    }
    for (let s = 0; s < r.addedNodes.length; s++) {
      const a = r.addedNodes[s];
      a.nodeType === Node.ELEMENT_NODE && (a.hasAttribute(e) || a.querySelector(`[${e}]`)) && n.add(a);
    }
  }
  R = t, n.forEach(le), R = null;
}
function F() {
  typeof document > "u" || (f.get("autoMountComponents") && !_ ? (_ = new MutationObserver(ce), _.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !f.get("autoMountComponents") && _ && (_.disconnect(), _ = null));
}
const fe = f.set;
f.set = function(o, e) {
  fe.call(this, o, e), o === "autoMountComponents" && F();
};
typeof window < "u" && setTimeout(F, 0);
export {
  re as BaseComponent,
  be as Component,
  f as config,
  I as createInstance,
  ge as destroyInstance,
  pe as eventbus,
  ue as getComponentFromElement,
  X as loadComponents,
  ge as removeComponents,
  he as utils
};
