var A = Object.defineProperty;
var S = (n, t, e) => t in n ? A(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var y = (n, t, e) => S(n, typeof t != "symbol" ? t + "" : t, e);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (n, t = {}) => {
  if (typeof n != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", n);
    return;
  }
  const e = n.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  t.priority !== void 0 && (n.c = t.priority), window.gia.components[e] = n;
});
class O {
  constructor() {
    y(this, "e", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(t, e) {
    this.e[t] = e;
  }
  get(t) {
    return this.e[t];
  }
}
const h = new O(), f = /* @__PURE__ */ new WeakMap();
function b(n, t, e, i) {
  if (f.has(n))
    return console.warn(`Component "${t}" already exists.`), f.get(n);
  try {
    const o = new e(n, i);
    return h.get("log") && console.info(`Created instance of component "${t}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${t}".`, o), null;
  }
}
function q(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : f.get(n) || null;
}
function P(n, t = document) {
  return typeof n != "string" ? n : t.querySelector(n);
}
function g(n, t = document) {
  return typeof n != "string" ? n : t.querySelectorAll(n);
}
function E(n, t, e = null) {
  e === null ? n.classList.toggle(t) : n.classList.toggle(t, !!e);
}
function C(n, t, e) {
  if (!n) return n;
  if (n.length !== void 0 && n.nodeType === void 0)
    for (let i = 0; i < n.length; i++)
      n[i].classList[e](t);
  else
    n.classList[e](t);
  return n;
}
function $(n, t) {
  return C(n, t, "remove");
}
function R(n, t) {
  return C(n, t, "add");
}
function v(n, t, e = null, i = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  i.detail = e;
  const o = new CustomEvent(t, i);
  n.dispatchEvent(o);
}
function M(n, t) {
  let e, i = null, o = null;
  const c = () => {
    if (clearTimeout(e), i) {
      const r = o, l = i;
      o = null, i = null, n.apply(r, l);
    }
  }, s = function() {
    i = arguments, o = this, clearTimeout(e), e = setTimeout(c, t);
  };
  return s.cancel = function() {
    clearTimeout(e), i = null, o = null;
  }, s;
}
const z = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: R,
  debounce: M,
  query: P,
  queryAll: g,
  removeClass: $,
  toggleClass: E,
  triggerEvent: v
}, Symbol.toStringTag, { value: "Module" }));
function T(n = {}, t = document.documentElement) {
  if (!n) {
    console.warn("App has no components");
    return;
  }
  let e = !1;
  for (const r in n) {
    e = !0;
    break;
  }
  if (!e) {
    console.warn("App has no components");
    return;
  }
  const i = [], o = `${h.get("attrPrefix")}-component`, c = g(`[${o}]`, t), s = c.length;
  for (let r = 0; r < s; r++) {
    const l = c[r];
    if (!f.get(l)) {
      const d = l.getAttribute(o);
      typeof n[d] == "function" ? i.push(b(l, d, n[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !f.get(t)) {
    const l = t.getAttribute(o);
    typeof n[l] == "function" ? i.push(b(t, l, n[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  i.length > 1 && i.sort((r, l) => {
    if (!r) return 1;
    if (!l) return -1;
    const a = r.constructor.c ?? r.constructor.priority ?? 0;
    return (l.constructor.c ?? l.constructor.priority ?? 0) - a;
  });
  for (let r = 0; r < i.length; r++) {
    const l = i[r];
    l && l.h();
  }
}
function x(n) {
  if (!n) return;
  let t = f.get(n);
  if (!t && typeof n == "string") {
    const e = document.getElementById(n);
    e && (t = f.get(e), n = e);
  }
  if (t) {
    const e = t.i || "Unknown";
    try {
      typeof t.u == "function" ? t.u() : t.unmount();
    } catch (i) {
      console.error(`Gia: Error unmounting component "${e}".`, i);
    }
    f.delete(n), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function W(n = document.documentElement) {
  const t = g(`[${h.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    x(t[e]);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const I = (n) => n.r();
let p = !1;
const m = /* @__PURE__ */ new Set();
function B() {
  p = !1, m.forEach(I), m.clear();
}
const j = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap();
class F {
  constructor(t, e) {
    this.element = t, f.set(this.element, this), this.i = this.constructor.name, this.t = {}, this.e = e || {}, this.o = {}, this.r = this.r.bind(this), this.d();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, i = g(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < i.length; s++) {
      const r = i[s], l = r.getAttribute(e);
      let a = o[l];
      a === void 0 && (a = [], o[l] = a), a.push(r);
    }
    let c = !0;
    for (const s in t) {
      c = !1;
      break;
    }
    if (c)
      for (const s in o) {
        const r = s.indexOf(":");
        if (r !== -1) {
          const l = s.substring(0, r), a = s.substring(r + 1);
          l === this.i && !this.t[a] && (this.t[a] = o[s]);
        } else
          this.t[s] || (this.t[s] = o[s]);
      }
    else {
      this.t = {};
      for (const s in t) {
        if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
        const r = Array.isArray(t[s]);
        if (t[s] !== null && r && t[s].length > 0) {
          this.t[s] = t[s];
          continue;
        }
        const l = `${this.i}:${s}`;
        let a = o[l] || [];
        a.length === 0 && (a = o[s] || []), this.t[s] = r ? a : a[0] ?? null;
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
  h() {
    this.mount();
  }
  u() {
    this.unmount();
    {
      this.t = null, this.element && (f.delete(this.element), this.element = null);
      return;
    }
  }
  observeScroll(t) {
  }
  unobserveScroll(t) {
  }
  observeWindowResize(t) {
  }
  unobserveWindowResize(t) {
  }
  observeResize(t, e) {
  }
  unobserveResize(t, e = null) {
  }
  observeIntersection(t, e, i = {}) {
  }
  g(t, e) {
    const i = this.p, o = this.m;
    if (o)
      t.has(o) && (t.delete(o), e && e.callbacks.has(i) && e.callbacks.get(i).delete(o));
    else {
      if (e && e.callbacks.has(i)) {
        const c = e.callbacks.get(i);
        t.forEach(Set.prototype.delete, c);
      }
      t.clear();
    }
    if (t.size === 0 && this.w.get(i).delete(e), e) {
      const c = e.callbacks.get(i);
      c && c.size === 0 && (e.callbacks.delete(i), e.observer.unobserve(i), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(t, e = null) {
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(t, e) {
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
  getRef(t, e = !1) {
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.i}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const i = t[e];
        this.o[e] !== i && (this.o[e] = i, this.n || (this.n = this.l || {}, this.a = this.s || {}, m.add(this), p || (p = !0, requestAnimationFrame(B))), this.n[e] = i);
      }
  }
  r() {
    this.stateChange(this.n), this.l = this.n, this.s = this.a;
    for (const t in this.l)
      delete this.l[t];
    if (this.s)
      for (const t in this.s)
        delete this.s[t];
    this.n = null, this.a = null;
  }
  stateChange(t) {
    return t;
  }
  d() {
    var i;
    const t = Object.getPrototypeOf(this);
    let e = k.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let c = 0; c < o.length; c++) {
        const s = o[c];
        !j.has(s) && !s.startsWith("_") && typeof ((i = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : i.value) == "function" && e.push(s);
      }
      k.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const c = e[o];
      this[c] = this[c].bind(this);
    }
  }
  y() {
  }
}
const u = (typeof window < "u" ? window.f : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
typeof window < "u" && !window.f && (window.f = u);
function N() {
  u.scheduled = !1;
  const n = u.reads;
  u.reads = [];
  for (let e = 0; e < n.length; e++)
    try {
      n[e]();
    } catch (i) {
      console.error(i);
    }
  const t = u.writes;
  u.writes = [];
  for (let e = 0; e < t.length; e++)
    try {
      t[e]();
    } catch (i) {
      console.error(i);
    }
  (u.reads.length > 0 || u.writes.length > 0) && w();
}
function w() {
  !u.scheduled && typeof window < "u" && (u.scheduled = !0, window.requestAnimationFrame(N));
}
function L(n, t) {
  const e = t ? n.bind(t) : n;
  return u.reads.push(e), w(), e;
}
function G(n, t) {
  const e = t ? n.bind(t) : n;
  return u.writes.push(e), w(), e;
}
function U(n) {
  let t = u.reads.indexOf(n);
  return t > -1 ? (u.reads.splice(t, 1), !0) : (t = u.writes.indexOf(n), t > -1 ? (u.writes.splice(t, 1), !0) : !1);
}
export {
  F as BaseComponent,
  U as clear,
  h as config,
  b as createInstance,
  x as destroyInstance,
  q as getComponentFromElement,
  T as loadComponents,
  L as measure,
  G as mutate,
  W as removeComponents,
  z as utils
};
