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
const d = new O(), f = /* @__PURE__ */ new WeakMap();
function b(n, t, e, i) {
  if (f.has(n))
    return console.warn(`Component "${t}" already exists.`), f.get(n);
  try {
    const s = new e(n, i);
    return d.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function _(n) {
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
function R(n, t) {
  return C(n, t, "remove");
}
function $(n, t) {
  return C(n, t, "add");
}
function v(n, t, e = null, i = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  i.detail = e;
  const s = new CustomEvent(t, i);
  n.dispatchEvent(s);
}
function M(n, t) {
  let e, i = null, s = null;
  const u = () => {
    if (clearTimeout(e), i) {
      const r = s, l = i;
      s = null, i = null, n.apply(r, l);
    }
  }, o = function() {
    i = arguments, s = this, clearTimeout(e), e = setTimeout(u, t);
  };
  return o.cancel = function() {
    clearTimeout(e), i = null, s = null;
  }, o;
}
const q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: $,
  debounce: M,
  query: P,
  queryAll: g,
  removeClass: R,
  toggleClass: E,
  triggerEvent: v
}, Symbol.toStringTag, { value: "Module" }));
function z(n = {}, t = document.documentElement) {
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
  const i = [], s = `${d.get("attrPrefix")}-component`, u = g(`[${s}]`, t), o = u.length;
  for (let r = 0; r < o; r++) {
    const l = u[r];
    if (!f.get(l)) {
      const h = l.getAttribute(s);
      typeof n[h] == "function" ? i.push(b(l, h, n[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(s) && !f.get(t)) {
    const l = t.getAttribute(s);
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
    l && l.d();
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
    f.delete(n), t.element && (t.element = null), d.get("log") && console.info(`Removed component "${e}".`);
  }
}
function T(n = document.documentElement) {
  const t = g(`[${d.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    x(t[e]);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const I = (n) => n.r();
let p = !1;
const m = /* @__PURE__ */ new Set();
function W() {
  p = !1, m.forEach(I), m.clear();
}
const B = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap();
class F {
  constructor(t, e) {
    this.element = t, f.set(this.element, this), this.i = this.constructor.name, this.t = {}, this.e = e || {}, this.s = {}, this.r = this.r.bind(this), this.h();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${d.get("attrPrefix")}-ref`, i = g(`[${e}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < i.length; o++) {
      const r = i[o], l = r.getAttribute(e);
      let a = s[l];
      a === void 0 && (a = [], s[l] = a), a.push(r);
    }
    let u = !0;
    for (const o in t) {
      u = !1;
      break;
    }
    if (u)
      for (const o in s) {
        const r = o.indexOf(":");
        if (r !== -1) {
          const l = o.substring(0, r), a = o.substring(r + 1);
          l === this.i && !this.t[a] && (this.t[a] = s[o]);
        } else
          this.t[o] || (this.t[o] = s[o]);
      }
    else {
      this.t = {};
      for (const o in t) {
        if (!Object.prototype.hasOwnProperty.call(t, o)) continue;
        const r = Array.isArray(t[o]);
        if (t[o] !== null && r && t[o].length > 0) {
          this.t[o] = t[o];
          continue;
        }
        const l = `${this.i}:${o}`;
        let a = s[l] || [];
        a.length === 0 && (a = s[o] || []), this.t[o] = r ? a : a[0] ?? null;
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
    return this.s;
  }
  set state(t) {
    console.warn("Use setState instead."), this.s = t;
  }
  d() {
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
    const i = this.p, s = this.m;
    if (s)
      t.has(s) && (t.delete(s), e && e.callbacks.has(i) && e.callbacks.get(i).delete(s));
    else {
      if (e && e.callbacks.has(i)) {
        const u = e.callbacks.get(i);
        t.forEach(Set.prototype.delete, u);
      }
      t.clear();
    }
    if (t.size === 0 && this.w.get(i).delete(e), e) {
      const u = e.callbacks.get(i);
      u && u.size === 0 && (e.callbacks.delete(i), e.observer.unobserve(i), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
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
    return `[${d.get("attrPrefix")}-ref="${e ? `${this.i}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const i = t[e];
        this.s[e] !== i && (this.s[e] = i, this.n || (this.n = this.l || {}, this.a = this.o || {}, m.add(this), p || (p = !0, requestAnimationFrame(W))), this.n[e] = i);
      }
  }
  r() {
    this.stateChange(this.n), this.l = this.n, this.o = this.a;
    for (const t in this.l)
      delete this.l[t];
    if (this.o)
      for (const t in this.o)
        delete this.o[t];
    this.n = null, this.a = null;
  }
  stateChange(t) {
    return t;
  }
  h() {
    var i;
    const t = Object.getPrototypeOf(this);
    let e = k.get(t);
    if (!e) {
      e = [];
      const s = Object.getOwnPropertyNames(t);
      for (let u = 0; u < s.length; u++) {
        const o = s[u];
        !B.has(o) && !o.startsWith("_") && typeof ((i = Object.getOwnPropertyDescriptor(t, o)) == null ? void 0 : i.value) == "function" && e.push(o);
      }
      k.set(t, e);
    }
    for (let s = 0; s < e.length; s++) {
      const u = e[s];
      this[u] = this[u].bind(this);
    }
  }
  y() {
  }
}
const c = (typeof window < "u" ? window.f : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
c.tempReads || (c.tempReads = []);
c.tempWrites || (c.tempWrites = []);
typeof window < "u" && !window.f && (window.f = c);
function j() {
  c.scheduled = !1;
  const n = c.reads;
  c.reads = c.tempReads;
  for (let e = 0; e < n.length; e++)
    try {
      n[e]();
    } catch (i) {
      console.error(i);
    }
  n.length = 0, c.tempReads = n;
  const t = c.writes;
  c.writes = c.tempWrites;
  for (let e = 0; e < t.length; e++)
    try {
      t[e]();
    } catch (i) {
      console.error(i);
    }
  t.length = 0, c.tempWrites = t, (c.reads.length > 0 || c.writes.length > 0) && w();
}
function w() {
  !c.scheduled && typeof window < "u" && (c.scheduled = !0, window.requestAnimationFrame(j));
}
function L(n, t) {
  const e = t ? n.bind(t) : n;
  return c.reads.push(e), w(), e;
}
function G(n, t) {
  const e = t ? n.bind(t) : n;
  return c.writes.push(e), w(), e;
}
function U(n) {
  let t = c.reads.indexOf(n);
  return t > -1 ? (c.reads.splice(t, 1), !0) : (t = c.writes.indexOf(n), t > -1 ? (c.writes.splice(t, 1), !0) : !1);
}
export {
  F as BaseComponent,
  U as clear,
  d as config,
  b as createInstance,
  x as destroyInstance,
  _ as getComponentFromElement,
  z as loadComponents,
  L as measure,
  G as mutate,
  T as removeComponents,
  q as utils
};
