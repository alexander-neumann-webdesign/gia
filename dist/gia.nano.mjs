var k = Object.defineProperty;
var C = (n, t, e) => t in n ? k(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var p = (n, t, e) => C(n, typeof t != "symbol" ? t + "" : t, e);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (n) => {
  if (typeof n != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", n);
    return;
  }
  const t = n.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  window.gia.components[t] = n;
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
    const s = new e(n, o);
    return f.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function N(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : a.get(n) || null;
}
function P(n, t = document) {
  return typeof n != "string" ? n : t.querySelector(n);
}
function d(n, t = document) {
  return typeof n != "string" ? n : t.querySelectorAll(n);
}
function A(n, t, e = null) {
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
  const s = new CustomEvent(t, o);
  n.dispatchEvent(s);
}
function v(n, t) {
  let e, o = null, s = null;
  const r = () => {
    if (clearTimeout(e), o) {
      const l = s, c = o;
      s = null, o = null, n.apply(l, c);
    }
  }, i = function() {
    o = arguments, s = this, clearTimeout(e), e = setTimeout(r, t);
  };
  return i.cancel = function() {
    clearTimeout(e), o = null, s = null;
  }, i;
}
const _ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: O,
  debounce: v,
  query: P,
  queryAll: d,
  removeClass: E,
  toggleClass: A,
  triggerEvent: $
}, Symbol.toStringTag, { value: "Module" }));
function z(n = {}, t = document.documentElement) {
  if (!n) {
    console.warn("App has no components");
    return;
  }
  let e = !1;
  for (const l in n) {
    e = !0;
    break;
  }
  if (!e) {
    console.warn("App has no components");
    return;
  }
  const o = [], s = `${f.get("attrPrefix")}-component`, r = d(`[${s}]`, t), i = r.length;
  for (let l = 0; l < i; l++) {
    const c = r[l];
    if (!a.get(c)) {
      const h = c.getAttribute(s);
      typeof n[h] == "function" ? o.push(y(c, h, n[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(s) && !a.get(t)) {
    const c = t.getAttribute(s);
    typeof n[c] == "function" ? o.push(y(t, c, n[c])) : console.warn(`Constructor "${c}" not found.`);
  }
  for (let l = 0; l < o.length; l++)
    o[l].a();
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
      typeof t.c == "function" ? t.c() : t.unmount();
    } catch (o) {
      console.error(`Gia: Error unmounting component "${e}".`, o);
    }
    a.delete(n), t.element && (t.element = null), f.get("log") && console.info(`Removed component "${e}".`);
  }
}
function B(n = document.documentElement) {
  const t = d(`[${f.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    M(t[e]);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const R = (n) => n.l();
let g = !1;
const m = /* @__PURE__ */ new Set();
function I() {
  g = !1, m.forEach(R), m.clear();
}
const x = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), b = /* @__PURE__ */ new WeakMap();
class T {
  constructor(t, e) {
    this.element = t, a.set(this.element, this), this.o = this.constructor.name, this.t = {}, this.e = e || {}, this.s = {}, this.l = this.l.bind(this), this.f();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${f.get("attrPrefix")}-ref`, o = d(`[${e}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let i = 0; i < o.length; i++) {
      const l = o[i], c = l.getAttribute(e);
      let u = s[c];
      u === void 0 && (u = [], s[c] = u), u.push(l);
    }
    let r = !0;
    for (const i in t) {
      r = !1;
      break;
    }
    if (r)
      for (const i in s) {
        const l = i.indexOf(":");
        if (l !== -1) {
          const c = i.substring(0, l), u = i.substring(l + 1);
          c === this.o && !this.t[u] && (this.t[u] = s[i]);
        } else
          this.t[i] || (this.t[i] = s[i]);
      }
    else {
      this.t = {};
      for (const i in t) {
        if (!Object.prototype.hasOwnProperty.call(t, i)) continue;
        const l = Array.isArray(t[i]);
        if (t[i] !== null && l && t[i].length > 0) {
          this.t[i] = t[i];
          continue;
        }
        const c = `${this.o}:${i}`;
        let u = s[c] || [];
        u.length === 0 && (u = s[i] || []), this.t[i] = l ? u : u[0] ?? null;
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
  a() {
    this.mount();
  }
  c() {
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
  h(t, e) {
    const o = this.d, s = this.g;
    if (s)
      t.has(s) && (t.delete(s), e && e.callbacks.has(o) && e.callbacks.get(o).delete(s));
    else {
      if (e && e.callbacks.has(o)) {
        const r = e.callbacks.get(o);
        t.forEach(Set.prototype.delete, r);
      }
      t.clear();
    }
    if (t.size === 0 && this.m.get(o).delete(e), e) {
      const r = e.callbacks.get(o);
      r && r.size === 0 && (e.callbacks.delete(o), e.observer.unobserve(o), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
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
        this.s[e] !== o && (this.s[e] = o, this.n || (this.n = this.r || {}, this.u = this.i || {}, m.add(this), g || (g = !0, requestAnimationFrame(I))), this.n[e] = o);
      }
  }
  l() {
    this.stateChange(this.n), this.r = this.n, this.i = this.u;
    for (const t in this.r)
      delete this.r[t];
    if (this.i)
      for (const t in this.i)
        delete this.i[t];
    this.n = null, this.u = null;
  }
  stateChange(t) {
    return t;
  }
  f() {
    var o;
    const t = Object.getPrototypeOf(this);
    let e = b.get(t);
    if (!e) {
      e = [];
      const s = Object.getOwnPropertyNames(t);
      for (let r = 0; r < s.length; r++) {
        const i = s[r];
        !x.has(i) && !i.startsWith("_") && typeof ((o = Object.getOwnPropertyDescriptor(t, i)) == null ? void 0 : o.value) == "function" && e.push(i);
      }
      b.set(t, e);
    }
    for (let s = 0; s < e.length; s++) {
      const r = e[s];
      this[r] = this[r].bind(this);
    }
  }
  p() {
  }
}
export {
  T as BaseComponent,
  f as config,
  y as createInstance,
  M as destroyInstance,
  N as getComponentFromElement,
  z as loadComponents,
  B as removeComponents,
  _ as utils
};
