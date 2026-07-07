var k = Object.defineProperty;
var C = (n, t, e) => t in n ? k(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var p = (n, t, e) => C(n, typeof t != "symbol" ? t + "" : t, e);
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
class S {
  constructor() {
    p(this, "e", {
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
const f = new S(), a = /* @__PURE__ */ new WeakMap();
function y(n, t, e, o) {
  if (a.has(n))
    return console.warn(`Component "${t}" already exists.`), a.get(n);
  try {
    const i = new e(n, o);
    return f.get("log") && console.info(`Created instance of component "${t}".`), i;
  } catch (i) {
    return console.error(`Failed to create component "${t}".`, i), null;
  }
}
function j(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : a.get(n) || null;
}
function A(n, t = document) {
  return typeof n != "string" ? n : t.querySelector(n);
}
function d(n, t = document) {
  return typeof n != "string" ? n : t.querySelectorAll(n);
}
function P(n, t, e = null) {
  e === null ? n.classList.toggle(t) : n.classList.toggle(t, !!e);
}
function w(n, t, e) {
  if (!n) return n;
  if (n.length !== void 0 && n.nodeType === void 0)
    for (let o = 0; o < n.length; o++)
      n[o].classList[e](t);
  else
    n.classList[e](t);
  return n;
}
function E(n, t) {
  return w(n, t, "remove");
}
function O(n, t) {
  return w(n, t, "add");
}
function $(n, t, e = null, o = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  o.detail = e;
  const i = new CustomEvent(t, o);
  n.dispatchEvent(i);
}
function v(n, t) {
  let e, o = null, i = null;
  const c = () => {
    if (clearTimeout(e), o) {
      const r = i, l = o;
      i = null, o = null, n.apply(r, l);
    }
  }, s = function() {
    o = arguments, i = this, clearTimeout(e), e = setTimeout(c, t);
  };
  return s.cancel = function() {
    clearTimeout(e), o = null, i = null;
  }, s;
}
const N = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: O,
  debounce: v,
  query: A,
  queryAll: d,
  removeClass: E,
  toggleClass: P,
  triggerEvent: $
}, Symbol.toStringTag, { value: "Module" }));
function _(n = {}, t = document.documentElement) {
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
  const o = [], i = `${f.get("attrPrefix")}-component`, c = d(`[${i}]`, t), s = c.length;
  for (let r = 0; r < s; r++) {
    const l = c[r];
    if (!a.get(l)) {
      const h = l.getAttribute(i);
      typeof n[h] == "function" ? o.push(y(l, h, n[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(i) && !a.get(t)) {
    const l = t.getAttribute(i);
    typeof n[l] == "function" ? o.push(y(t, l, n[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  o.length > 1 && o.sort((r, l) => {
    if (!r) return 1;
    if (!l) return -1;
    const u = r.constructor.c ?? r.constructor.priority ?? 0;
    return (l.constructor.c ?? l.constructor.priority ?? 0) - u;
  });
  for (let r = 0; r < o.length; r++) {
    const l = o[r];
    l && l.f();
  }
}
function M(n) {
  if (!n) return;
  let t = a.get(n);
  if (!t && typeof n == "string") {
    const e = document.getElementById(n);
    e && (t = a.get(e), n = e);
  }
  if (t) {
    const e = t.o || "Unknown";
    try {
      typeof t.u == "function" ? t.u() : t.unmount();
    } catch (o) {
      console.error(`Gia: Error unmounting component "${e}".`, o);
    }
    a.delete(n), t.element && (t.element = null), f.get("log") && console.info(`Removed component "${e}".`);
  }
}
function z(n = document.documentElement) {
  const t = d(`[${f.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    M(t[e]);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const R = (n) => n.r();
let g = !1;
const m = /* @__PURE__ */ new Set();
function I() {
  g = !1, m.forEach(R), m.clear();
}
const x = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), b = /* @__PURE__ */ new WeakMap();
class T {
  constructor(t, e) {
    this.element = t, a.set(this.element, this), this.o = this.constructor.name, this.t = {}, this.e = e || {}, this.i = {}, this.r = this.r.bind(this), this.h();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${f.get("attrPrefix")}-ref`, o = d(`[${e}]`, this.element), i = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < o.length; s++) {
      const r = o[s], l = r.getAttribute(e);
      let u = i[l];
      u === void 0 && (u = [], i[l] = u), u.push(r);
    }
    let c = !0;
    for (const s in t) {
      c = !1;
      break;
    }
    if (c)
      for (const s in i) {
        const r = s.indexOf(":");
        if (r !== -1) {
          const l = s.substring(0, r), u = s.substring(r + 1);
          l === this.o && !this.t[u] && (this.t[u] = i[s]);
        } else
          this.t[s] || (this.t[s] = i[s]);
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
        const l = `${this.o}:${s}`;
        let u = i[l] || [];
        u.length === 0 && (u = i[s] || []), this.t[s] = r ? u : u[0] ?? null;
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
    return this.i;
  }
  set state(t) {
    console.warn("Use setState instead."), this.i = t;
  }
  f() {
    this.mount();
  }
  u() {
    this.unmount();
    {
      this.t = null, this.element && (a.delete(this.element), this.element = null);
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
  observeIntersection(t, e, o = {}) {
  }
  d(t, e) {
    const o = this.g, i = this.m;
    if (i)
      t.has(i) && (t.delete(i), e && e.callbacks.has(o) && e.callbacks.get(o).delete(i));
    else {
      if (e && e.callbacks.has(o)) {
        const c = e.callbacks.get(o);
        t.forEach(Set.prototype.delete, c);
      }
      t.clear();
    }
    if (t.size === 0 && this.p.get(o).delete(e), e) {
      const c = e.callbacks.get(o);
      c && c.size === 0 && (e.callbacks.delete(o), e.observer.unobserve(o), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
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
    return `[${f.get("attrPrefix")}-ref="${e ? `${this.o}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const o = t[e];
        this.i[e] !== o && (this.i[e] = o, this.n || (this.n = this.l || {}, this.a = this.s || {}, m.add(this), g || (g = !0, requestAnimationFrame(I))), this.n[e] = o);
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
  h() {
    var o;
    const t = Object.getPrototypeOf(this);
    let e = b.get(t);
    if (!e) {
      e = [];
      const i = Object.getOwnPropertyNames(t);
      for (let c = 0; c < i.length; c++) {
        const s = i[c];
        !x.has(s) && !s.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : o.value) == "function" && e.push(s);
      }
      b.set(t, e);
    }
    for (let i = 0; i < e.length; i++) {
      const c = e[i];
      this[c] = this[c].bind(this);
    }
  }
  y() {
  }
}
export {
  T as BaseComponent,
  f as config,
  y as createInstance,
  M as destroyInstance,
  j as getComponentFromElement,
  _ as loadComponents,
  z as removeComponents,
  N as utils
};
