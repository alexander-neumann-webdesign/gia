var O = Object.defineProperty;
var A = (n, t, e) => t in n ? O(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var y = (n, t, e) => A(n, typeof t != "symbol" ? t + "" : t, e);
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
class R {
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
const h = new R(), a = /* @__PURE__ */ new WeakMap();
function b(n, t, e, i) {
  if (a.has(n))
    return console.warn(`Component "${t}" already exists.`), a.get(n);
  try {
    const r = new e(n, i);
    return h.get("log") && console.info(`Created instance of component "${t}".`), r;
  } catch (r) {
    return console.error(`Failed to create component "${t}".`, r), null;
  }
}
function _(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : a.get(n) || null;
}
function S(n, t = document) {
  return typeof n != "string" ? n : t.querySelector(n);
}
function g(n, t = document) {
  return typeof n != "string" ? n : t.querySelectorAll(n);
}
function C(n, t, e = null) {
  e === null ? n.classList.toggle(t) : n.classList.toggle(t, !!e);
}
function x(n, t, e) {
  if (!n) return n;
  if (n.length !== void 0 && n.nodeType === void 0)
    for (let i = 0; i < n.length; i++)
      n[i].classList[e](t);
  else
    n.classList[e](t);
  return n;
}
function E(n, t) {
  return x(n, t, "remove");
}
function $(n, t) {
  return x(n, t, "add");
}
function I(n, t, e = null, i = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  i.detail = e;
  const r = new CustomEvent(t, i);
  n.dispatchEvent(r);
}
function v(n, t) {
  let e, i = null, r = null;
  const c = () => {
    if (clearTimeout(e), i) {
      const l = r, u = i;
      r = null, i = null, n.apply(l, u);
    }
  }, o = function() {
    i = arguments, r = this, clearTimeout(e), e = setTimeout(c, t);
  };
  return o.cancel = function() {
    clearTimeout(e), i = null, r = null;
  }, o;
}
const q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: $,
  debounce: v,
  query: S,
  queryAll: g,
  removeClass: E,
  toggleClass: C,
  triggerEvent: I
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
  const i = [], r = `${h.get("attrPrefix")}-component`, c = g(`[${r}]`, t), o = c.length;
  for (let l = 0; l < o; l++) {
    const u = c[l];
    if (!a.get(u)) {
      const d = u.getAttribute(r);
      typeof n[d] == "function" ? i.push(b(u, d, n[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(r) && !a.get(t)) {
    const u = t.getAttribute(r);
    typeof n[u] == "function" ? i.push(b(t, u, n[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  i.length > 1 && i.sort((l, u) => {
    if (!l) return 1;
    if (!u) return -1;
    const f = l.constructor.c ?? l.constructor.priority ?? 0;
    return (u.constructor.c ?? u.constructor.priority ?? 0) - f;
  });
  for (let l = 0; l < i.length; l++) {
    const u = i[l];
    u && u.d();
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
      typeof t.f == "function" ? t.f() : t.unmount();
    } catch (i) {
      console.error(`Gia: Error unmounting component "${e}".`, i);
    }
    a.delete(n), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function L(n = document.documentElement) {
  const t = g(`[${h.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    M(t[e]);
}
const s = (typeof window < "u" ? window.a : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
s.tempReads || (s.tempReads = []);
s.tempWrites || (s.tempWrites = []);
s.wrapperPool || (s.wrapperPool = []);
typeof window < "u" && !window.a && (window.a = s);
function k(n, t) {
  let e = s.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.n = !0), e.fn = n, e.ctx = t, e;
}
function W() {
  s.scheduled = !1;
  const n = s.reads;
  s.reads = s.tempReads;
  for (let e = 0; e < n.length; e++) {
    const i = n[e];
    if (i) {
      try {
        i();
      } catch (r) {
        console.error(r);
      }
      i.n && (i.fn = null, i.ctx = null, s.wrapperPool.push(i));
    }
  }
  n.length = 0, s.tempReads = n;
  const t = s.writes;
  s.writes = s.tempWrites;
  for (let e = 0; e < t.length; e++) {
    const i = t[e];
    if (i) {
      try {
        i();
      } catch (r) {
        console.error(r);
      }
      i.n && (i.fn = null, i.ctx = null, s.wrapperPool.push(i));
    }
  }
  t.length = 0, s.tempWrites = t, (s.reads.length > 0 || s.writes.length > 0) && w();
}
function w() {
  !s.scheduled && typeof window < "u" && (s.scheduled = !0, window.requestAnimationFrame(W));
}
function F(n, t) {
  const e = t ? k(n, t) : n;
  return s.reads.push(e), w(), e;
}
function B(n, t) {
  const e = t ? k(n, t) : n;
  return s.writes.push(e), w(), e;
}
function G(n) {
  let t = s.reads.indexOf(n);
  if (t > -1) {
    const e = s.reads[t];
    return e && e.n && (e.fn = null, e.ctx = null, s.wrapperPool.push(e)), s.reads[t] = null, !0;
  }
  for (let e = 0; e < s.reads.length; e++) {
    const i = s.reads[e];
    if (i && i.n && i.fn === n)
      return i.fn = null, i.ctx = null, s.wrapperPool.push(i), s.reads[e] = null, !0;
  }
  if (t = s.writes.indexOf(n), t > -1) {
    const e = s.writes[t];
    return e && e.n && (e.fn = null, e.ctx = null, s.wrapperPool.push(e)), s.writes[t] = null, !0;
  }
  for (let e = 0; e < s.writes.length; e++) {
    const i = s.writes[e];
    if (i && i.n && i.fn === n)
      return i.fn = null, i.ctx = null, s.wrapperPool.push(i), s.writes[e] = null, !0;
  }
  return !1;
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
let m = !1;
const p = [];
function j() {
  m = !1;
  for (let n = 0; n < p.length; n++)
    p[n].l();
  p.length = 0;
}
const N = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), P = /* @__PURE__ */ new WeakMap();
class U {
  constructor(t, e) {
    this.element = t, a.set(this.element, this), this.o = this.constructor.name, this.t = {}, this.e = e || {}, this.s = {}, this.l = this.l.bind(this), this.p();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, i = g(`[${e}]`, this.element), r = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < i.length; o++) {
      const l = i[o], u = l.getAttribute(e);
      let f = r[u];
      f === void 0 && (f = [], r[u] = f), f.push(l);
    }
    let c = !0;
    for (const o in t) {
      c = !1;
      break;
    }
    if (c)
      for (const o in r) {
        const l = o.indexOf(":");
        if (l !== -1) {
          const u = o.substring(0, l), f = o.substring(l + 1);
          u === this.o && !this.t[f] && (this.t[f] = r[o]);
        } else
          this.t[o] || (this.t[o] = r[o]);
      }
    else {
      this.t = {};
      for (const o in t) {
        if (!Object.prototype.hasOwnProperty.call(t, o)) continue;
        const l = Array.isArray(t[o]);
        if (t[o] !== null && l && t[o].length > 0) {
          this.t[o] = t[o];
          continue;
        }
        const u = `${this.o}:${o}`;
        let f = r[u] || [];
        f.length === 0 && (f = r[o] || []), this.t[o] = l ? f : f[0] ?? null;
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
  f() {
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
  observeIntersection(t, e, i = {}) {
  }
  g(t, e) {
    const i = this.m, r = this.w;
    if (r) {
      const c = t.indexOf(r);
      if (c !== -1 && (t[c] = t[t.length - 1], t.pop(), e && e.callbacks.has(i))) {
        const o = e.callbacks.get(i), l = o.indexOf(r);
        l !== -1 && (o[l] = o[o.length - 1], o.pop());
      }
    } else {
      if (e && e.callbacks.has(i)) {
        const c = e.callbacks.get(i);
        for (let o = 0; o < t.length; o++) {
          const l = t[o], u = c.indexOf(l);
          u !== -1 && (c[u] = c[c.length - 1], c.pop());
        }
      }
      t.length = 0;
    }
    if (t.length === 0 && this.y.get(i).delete(e), e) {
      const c = e.callbacks.get(i);
      c && c.length === 0 && (e.callbacks.delete(i), e.observer.unobserve(i), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
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
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.o}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const i = t[e];
        this.s[e] !== i && (this.s[e] = i, this.i || (this.i = this.u || {}, this.h = this.r || {}, p.push(this), m || (m = !0, B(j))), this.i[e] = i);
      }
  }
  l() {
    if (this.element) {
      this.stateChange(this.i), this.u = this.i, this.r = this.h;
      for (const t in this.u)
        delete this.u[t];
      if (this.r)
        for (const t in this.r)
          delete this.r[t];
      this.i = null, this.h = null;
    }
  }
  stateChange(t) {
    return t;
  }
  p() {
    var i;
    const t = Object.getPrototypeOf(this);
    let e = P.get(t);
    if (!e) {
      e = [];
      const r = Object.getOwnPropertyNames(t);
      for (let c = 0; c < r.length; c++) {
        const o = r[c];
        !N.has(o) && !o.startsWith("_") && typeof ((i = Object.getOwnPropertyDescriptor(t, o)) == null ? void 0 : i.value) == "function" && e.push(o);
      }
      P.set(t, e);
    }
    for (let r = 0; r < e.length; r++) {
      const c = e[r];
      this[c] = this[c].bind(this);
    }
  }
}
export {
  U as BaseComponent,
  G as clear,
  h as config,
  b as createInstance,
  M as destroyInstance,
  _ as getComponentFromElement,
  z as loadComponents,
  F as measure,
  B as mutate,
  L as removeComponents,
  q as utils
};
