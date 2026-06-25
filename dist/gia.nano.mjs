var w = Object.defineProperty;
var v = (e, t, n) => t in e ? w(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var m = (e, t, n) => v(e, typeof t != "symbol" ? t + "" : t, n);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (e) => {
  if (typeof e != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", e);
    return;
  }
  const t = e.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[t] = e;
});
class k {
  constructor() {
    m(this, "e", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(t, n) {
    this.e[t] = n;
  }
  get(t) {
    return this.e[t];
  }
}
const u = new k();
function p(e, t, n, o) {
  if (e.__gia_component__)
    return console.warn(`Component "${t}" already exists.`), e.__gia_component__;
  try {
    const s = new n(e, o);
    return u.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function j(e) {
  return typeof e == "string" && (e = document.getElementById(e), !e) ? null : e.__gia_component__;
}
function C(e, t = document) {
  return typeof e != "string" ? e : t.querySelector(e);
}
function h(e, t = document) {
  return typeof e != "string" ? e : t.querySelectorAll(e);
}
function S(e, t, n = null) {
  n === null ? e.classList.toggle(t) : e.classList.toggle(t, !!n);
}
function y(e, t, n) {
  if (!e) return e;
  if (e.length !== void 0 && e.nodeType === void 0)
    for (let o = 0; o < e.length; o++)
      e[o].classList[n](t);
  else
    e.classList[n](t);
  return e;
}
function $(e, t) {
  return y(e, t, "remove");
}
function P(e, t) {
  return y(e, t, "add");
}
function A(e, t, n = null, o = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  o.detail = n;
  const s = new CustomEvent(t, o);
  e.dispatchEvent(s);
}
function E(e, t) {
  let n, o = null, s = null;
  const l = () => {
    if (clearTimeout(n), o) {
      const r = s, a = o;
      s = null, o = null, e.apply(r, a);
    }
  }, i = function() {
    o = arguments, s = this, clearTimeout(n), n = setTimeout(l, t);
  };
  return i.cancel = function() {
    clearTimeout(n), o = null, s = null;
  }, i;
}
const z = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: P,
  debounce: E,
  query: C,
  queryAll: h,
  removeClass: $,
  toggleClass: S,
  triggerEvent: A
}, Symbol.toStringTag, { value: "Module" }));
function N(e = {}, t = document.documentElement) {
  if (!e) {
    console.warn("App has no components");
    return;
  }
  let n = !1;
  for (const r in e) {
    n = !0;
    break;
  }
  if (!n) {
    console.warn("App has no components");
    return;
  }
  const o = [], s = `${u.get("attrPrefix")}-component`, l = h(`[${s}]`, t), i = l.length;
  for (let r = 0; r < i; r++) {
    const a = l[r];
    if (!a.__gia_component__) {
      const f = a.getAttribute(s);
      typeof e[f] == "function" ? o.push(p(a, f, e[f])) : console.warn(`Constructor "${f}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(s) && !t.__gia_component__) {
    const a = t.getAttribute(s);
    typeof e[a] == "function" ? o.push(p(t, a, e[a])) : console.warn(`Constructor "${a}" not found.`);
  }
  for (let r = 0; r < o.length; r++)
    o[r].l();
}
function O(e) {
  if (!e) return;
  let t = e.__gia_component__;
  if (!t && typeof e == "string") {
    const n = document.getElementById(e);
    n && (t = n.__gia_component__, e = n);
  }
  if (t) {
    const n = t.n || "Unknown";
    try {
      typeof t.r == "function" ? t.r() : t.unmount();
    } catch (o) {
      console.error(`Gia: Error unmounting component "${n}".`, o);
    }
    e.__gia_component__ = null, t.element && (t.element = null), u.get("log") && console.info(`Removed component "${n}".`);
  }
}
function B(e = document.documentElement) {
  const t = h(`[${u.get("attrPrefix")}-component]`, e);
  for (let n = 0; n < t.length; n++)
    O(t[n]);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const R = (e) => e.i();
let g = !1;
const d = /* @__PURE__ */ new Set();
function I() {
  g = !1, d.forEach(R), d.clear();
}
const b = /* @__PURE__ */ new Map(), x = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), _ = /* @__PURE__ */ new WeakMap();
class T {
  constructor(t, n) {
    this.element = t, this.element.__gia_component__ = this, this.n = this.constructor.name, this.t = {}, this.e = n || {}, this.o = {}, this.i = this.i.bind(this), this.a();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const n = `${u.get("attrPrefix")}-ref`, o = h(`[${n}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < o.length; i++) {
      const r = o[i], a = r.getAttribute(n);
      let c = s[a];
      c === void 0 && (c = [], s[a] = c), c.push(r);
    }
    let l = !0;
    for (const i in t) {
      l = !1;
      break;
    }
    if (l)
      for (const i in s) {
        const r = i.indexOf(":");
        if (r !== -1) {
          const a = i.substring(0, r), c = i.substring(r + 1);
          a === this.n && !this.t[c] && (this.t[c] = s[i]);
        } else
          this.t[i] || (this.t[i] = s[i]);
      }
    else {
      this.t = {};
      for (const i in t) {
        if (!Object.prototype.hasOwnProperty.call(t, i)) continue;
        const r = Array.isArray(t[i]);
        if (t[i] !== null && r && t[i].length > 0) {
          this.t[i] = t[i];
          continue;
        }
        const a = `${this.n}:${i}`;
        let c = s[a] || [];
        c.length === 0 && (c = s[i] || []), this.t[i] = r ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.e;
  }
  set options(t) {
    {
      this.e = { ...this.e, ...t };
      return;
    }
  }
  get state() {
    return this.o;
  }
  set state(t) {
    console.warn("Use setState instead."), this.o = t;
  }
  l() {
    this.mount();
  }
  r() {
    this.unmount();
  }
  observeScroll(t) {
  }
  unobserveScroll(t) {
  }
  observeWindowResize(t) {
  }
  unobserveWindowResize(t) {
  }
  observeResize(t, n) {
  }
  unobserveResize(t, n = null) {
  }
  observeIntersection(t, n, o = {}) {
  }
  u(t, n) {
    const o = b.get(n), s = this.f, l = this.h;
    if (l)
      t.has(l) && (t.delete(l), o && o.callbacks.has(s) && o.callbacks.get(s).delete(l));
    else {
      if (o && o.callbacks.has(s)) {
        const i = o.callbacks.get(s);
        t.forEach(Set.prototype.delete, i);
      }
      t.clear();
    }
    if (t.size === 0 && this.g.get(s).delete(n), o) {
      const i = o.callbacks.get(s);
      i && i.size === 0 && (o.callbacks.delete(s), o.observer.unobserve(s)), o.callbacks.size === 0 && (o.observer.disconnect(), b.delete(n));
    }
  }
  unobserveIntersection(t, n = null) {
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(t, n) {
    return Promise.resolve();
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(t) {
    return Promise.resolve();
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, n = !1) {
    return `[${u.get("attrPrefix")}-ref="${n ? `${this.n}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const n in t) {
        if (!Object.prototype.hasOwnProperty.call(t, n)) continue;
        const o = t[n];
        this.o[n] !== o && (this.o[n] = o, this.s || (this.s = {}, this.c = {}, d.add(this), g || (g = !0, requestAnimationFrame(I))), this.s[n] = o);
      }
  }
  i() {
    this.stateChange(this.s), this.s = null, this.c = null;
  }
  stateChange(t) {
    return t;
  }
  a() {
    var o;
    const t = Object.getPrototypeOf(this);
    let n = _.get(t);
    if (!n) {
      n = [];
      const s = Object.getOwnPropertyNames(t);
      for (let l = 0; l < s.length; l++) {
        const i = s[l];
        !x.has(i) && !i.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(t, i)) == null ? void 0 : o.value) == "function" && n.push(i);
      }
      _.set(t, n);
    }
    for (let s = 0; s < n.length; s++) {
      const l = n[s];
      this[l] = this[l].bind(this);
    }
  }
  d() {
  }
}
export {
  T as BaseComponent,
  u as config,
  p as createInstance,
  O as destroyInstance,
  j as getComponentFromElement,
  N as loadComponents,
  B as removeComponents,
  z as utils
};
