var W = Object.defineProperty;
var A = (t, e, n) => e in t ? W(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var P = (t, e, n) => A(t, typeof e != "symbol" ? e + "" : e, n);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (t, e = {}) => {
  if (typeof t != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", t);
    return;
  }
  const n = t.name;
  if (!n) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  e.priority !== void 0 && (t.g = e.priority), window.gia.components[n] = t;
});
class O {
  constructor() {
    P(this, "o", {
      log: !1,
      attrPrefix: "data",
      // data-component="HelloWorld"
      autoMountComponents: !1,
      // Use MutationObserver to automatically mount/unmount components
      autoBindActions: !1
      // Automatically bind actions using data-action attributes
    });
  }
  set(e, n) {
    this.o[e] = n;
  }
  get(e) {
    return this.o[e];
  }
}
const g = new O(), d = /* @__PURE__ */ new WeakMap();
function R(t, e, n, r) {
  if (d.has(t))
    return console.warn(`Component "${e}" already exists.`), d.get(t);
  try {
    const s = new n(t, r);
    return g.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function V(t) {
  return typeof t == "string" && (t = document.getElementById(t), !t) ? null : d.get(t) || null;
}
function $(t, e = document) {
  return typeof t != "string" ? t : e.querySelector(t);
}
function y(t, e = document) {
  return typeof t != "string" ? t : e.querySelectorAll(t);
}
function k(t, e, n = null) {
  n === null ? t.classList.toggle(e) : t.classList.toggle(e, !!n);
}
function C(t, e, n) {
  if (!t) return t;
  if (t.length !== void 0 && t.nodeType === void 0)
    for (let r = 0; r < t.length; r++)
      t[r].classList[n](e);
  else
    t.classList[n](e);
  return t;
}
function E(t, e) {
  return C(t, e, "remove");
}
function I(t, e) {
  return C(t, e, "add");
}
function M(t, e, n = null, r = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  r.detail = n;
  const s = new CustomEvent(e, r);
  t.dispatchEvent(s);
}
function N(t, e) {
  let n, r = null, s = null;
  const f = () => {
    if (clearTimeout(n), r) {
      const c = s, l = r;
      s = null, r = null, t.apply(c, l);
    }
  }, u = function() {
    r = arguments, s = this, clearTimeout(n), n = setTimeout(f, e);
  };
  return u.cancel = function() {
    clearTimeout(n), r = null, s = null;
  }, u;
}
const H = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: I,
  debounce: N,
  query: $,
  queryAll: y,
  removeClass: E,
  toggleClass: k,
  triggerEvent: M
}, Symbol.toStringTag, { value: "Module" }));
function J(t = {}, e = document.documentElement) {
  if (!t) {
    console.warn("App has no components");
    return;
  }
  let n = !1;
  for (const c in t) {
    n = !0;
    break;
  }
  if (!n) {
    console.warn("App has no components");
    return;
  }
  const r = [], s = `${g.get("attrPrefix")}-component`, f = y(`[${s}]`, e), u = f.length;
  for (let c = 0; c < u; c++) {
    const l = f[c];
    if (!d.get(l)) {
      const i = l.getAttribute(s);
      typeof t[i] == "function" ? r.push(R(l, i, t[i])) : console.warn(`Constructor "${i}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !d.get(e)) {
    const l = e.getAttribute(s);
    typeof t[l] == "function" ? r.push(R(e, l, t[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  r.length > 1 && r.sort((c, l) => {
    if (!c) return 1;
    if (!l) return -1;
    const m = c.constructor.g ?? c.constructor.priority ?? 0;
    return (l.constructor.g ?? l.constructor.priority ?? 0) - m;
  });
  for (let c = 0; c < r.length; c++) {
    const l = r[c];
    l && l.y();
  }
}
function z(t) {
  if (!t) return;
  let e = d.get(t);
  if (!e && typeof t == "string") {
    const n = document.getElementById(t);
    n && (e = d.get(n), t = n);
  }
  if (e) {
    const n = e.n || "Unknown";
    try {
      typeof e.m == "function" ? e.m() : e.unmount();
    } catch (r) {
      console.error(`Gia: Error unmounting component "${n}".`, r);
    }
    d.delete(t), e.element && (e.element = null), g.get("log") && console.info(`Removed component "${n}".`);
  }
}
function K(t = document.documentElement) {
  const e = y(`[${g.get("attrPrefix")}-component]`, t);
  for (let n = 0; n < e.length; n++)
    z(e[n]);
}
const o = (typeof window < "u" ? window.w : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
o.tempReads || (o.tempReads = []);
o.tempWrites || (o.tempWrites = []);
o.wrapperPool || (o.wrapperPool = []);
typeof window < "u" && !window.w && (window.w = o);
function S(t, e) {
  let n = o.wrapperPool.pop();
  return n || (n = function() {
    n.fn.call(n.ctx);
  }, n.e = !0), n.fn = t, n.ctx = e, n;
}
function B() {
  o.scheduled = !1;
  const t = o.reads;
  o.currentReads = t, o.reads = o.tempReads;
  for (let n = 0; n < t.length; n++) {
    const r = t[n];
    if (r) {
      try {
        r();
      } catch (s) {
        console.error(s);
      }
      r.e && (r.fn = null, r.ctx = null, o.wrapperPool.push(r));
    }
  }
  t.length = 0, o.tempReads = t, o.currentReads = null;
  const e = o.writes;
  o.currentWrites = e, o.writes = o.tempWrites;
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (r) {
      try {
        r();
      } catch (s) {
        console.error(s);
      }
      r.e && (r.fn = null, r.ctx = null, o.wrapperPool.push(r));
    }
  }
  e.length = 0, o.tempWrites = e, o.currentWrites = null, (o.reads.length > 0 || o.writes.length > 0) && v();
}
function v() {
  !o.scheduled && typeof window < "u" && (o.scheduled = !0, window.requestAnimationFrame(B));
}
function X(t, e) {
  const n = e ? S(t, e) : t;
  return o.reads.push(n), v(), n;
}
function j(t, e) {
  const n = e ? S(t, e) : t;
  return o.writes.push(n), v(), n;
}
function Y(t) {
  let e = o.reads.indexOf(t);
  if (e > -1) {
    const n = o.reads[e];
    return n && n.e && (n.fn = null, n.ctx = null, o.wrapperPool.push(n)), o.reads[e] = null, !0;
  }
  for (let n = 0; n < o.reads.length; n++) {
    const r = o.reads[n];
    if (r && r.e && r.fn === t)
      return r.fn = null, r.ctx = null, o.wrapperPool.push(r), o.reads[n] = null, !0;
  }
  if (e = o.writes.indexOf(t), e > -1) {
    const n = o.writes[e];
    return n && n.e && (n.fn = null, n.ctx = null, o.wrapperPool.push(n)), o.writes[e] = null, !0;
  }
  for (let n = 0; n < o.writes.length; n++) {
    const r = o.writes[n];
    if (r && r.e && r.fn === t)
      return r.fn = null, r.ctx = null, o.wrapperPool.push(r), o.writes[n] = null, !0;
  }
  if (o.currentReads) {
    let n = o.currentReads.indexOf(t);
    if (n > -1) {
      const r = o.currentReads[n];
      return r && r.e && (r.fn = null, r.ctx = null, o.wrapperPool.push(r)), o.currentReads[n] = null, !0;
    }
    for (let r = 0; r < o.currentReads.length; r++) {
      const s = o.currentReads[r];
      if (s && s.e && s.fn === t)
        return s.fn = null, s.ctx = null, o.wrapperPool.push(s), o.currentReads[r] = null, !0;
    }
  }
  if (o.currentWrites) {
    let n = o.currentWrites.indexOf(t);
    if (n > -1) {
      const r = o.currentWrites[n];
      return r && r.e && (r.fn = null, r.ctx = null, o.wrapperPool.push(r)), o.currentWrites[n] = null, !0;
    }
    for (let r = 0; r < o.currentWrites.length; r++) {
      const s = o.currentWrites[r];
      if (s && s.e && s.fn === t)
        return s.fn = null, s.ctx = null, o.wrapperPool.push(s), o.currentWrites[r] = null, !0;
    }
  }
  return !1;
}
let b = !1;
const w = [];
function q() {
  b = !1;
  for (let t = 0; t < w.length; t++)
    w[t].h();
  w.length = 0;
}
function T(t, e) {
  if (!(!t.element || !t.l || t.u) && e)
    for (const n in e) {
      if (!Object.prototype.hasOwnProperty.call(e, n)) continue;
      const r = e[n];
      t.c[n] !== r && (t.c[n] = r, t.s || (t.s = t.d || {}, t.p = t.f || {}, w.push(t), b || (b = !0, j(q))), t.s[n] = r);
    }
}
function _(t) {
  if (t.element) {
    t.stateChange(t.s), t.d = t.s, t.f = t.p;
    for (const e in t.d)
      delete t.d[e];
    if (t.f)
      for (const e in t.f)
        delete t.f[e];
    t.s = null, t.p = null;
  }
}
function G(t) {
  t.s = null, t.p = null;
}
function L(t, e) {
  return Promise.resolve();
}
function F(t) {
  return Promise.resolve();
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const U = /* @__PURE__ */ new Set([
  "constructor",
  "require",
  "mount",
  "unmount",
  "getRef",
  "setState",
  "stateChange",
  "loadScript",
  "loadStyle",
  "signal",
  "isMounted",
  "observeScroll",
  "unobserveScroll",
  "observeWindowResize",
  "unobserveWindowResize",
  "observeResize",
  "unobserveResize",
  "observeIntersection",
  "unobserveIntersection"
]), x = /* @__PURE__ */ new WeakMap();
class Z {
  constructor(e, n) {
    this.element = e, d.set(this.element, this), this.n = this.constructor.name, this.t = {}, this.o = n || {}, this.c = {}, this.l = !1, this.u = !1, this.r = null, this.a = null, this.h = this.h.bind(this), this.b();
  }
  get isMounted() {
    return this.l;
  }
  get signal() {
    if (!this.r) {
      const e = typeof window < "u" && window.AbortController || (typeof AbortController < "u" ? AbortController : null);
      e && (this.r = new e(), this.u && this.r.abort());
    }
    return this.r ? this.r.signal : null;
  }
  get ref() {
    return this.t;
  }
  set ref(e) {
    const n = g.get("attrPrefix"), r = `${n}-ref`, s = `${n}-component`, f = y(`[${r}]`, this.element), u = /* @__PURE__ */ Object.create(null), c = this.element.querySelector(`[${s}]`) !== null, l = `${this.n}:`;
    for (let i = 0; i < f.length; i++) {
      const h = f[i], p = h.getAttribute(r);
      if (!p || c && h.closest(`[${s}]`) !== this.element && !p.startsWith(l))
        continue;
      let a = u[p];
      a === void 0 && (a = [], u[p] = a), a.push(h);
    }
    let m = !0;
    for (const i in e) {
      m = !1;
      break;
    }
    if (m)
      for (const i in u) {
        const h = i.indexOf(":");
        if (h !== -1) {
          const p = i.substring(0, h), a = i.substring(h + 1);
          p === this.n && !this.t[a] && (this.t[a] = u[i]);
        } else
          this.t[i] || (this.t[i] = u[i]);
      }
    else {
      this.t = {};
      for (const i in e) {
        if (!Object.prototype.hasOwnProperty.call(e, i)) continue;
        const h = Array.isArray(e[i]);
        if (e[i] !== null && h && e[i].length > 0) {
          this.t[i] = e[i];
          continue;
        }
        const p = `${this.n}:${i}`;
        let a = u[p] || [];
        a.length === 0 && (a = u[i] || []), this.t[i] = h ? a : a[0] ?? null;
      }
    }
  }
  get options() {
    return this.o;
  }
  set options(e) {
    {
      this.o = { ...this.o, ...e };
      return;
    }
  }
  get state() {
    return this.c;
  }
  set state(e) {
    console.warn("Use setState instead."), this.c = e;
  }
  y() {
    this.element && !this.u && (this.l = !0, this.a = this.mount());
  }
  m() {
    if (this.l = !1, this.u = !0, this.r && this.r.abort(), typeof this.a == "function") {
      try {
        this.a();
      } catch (e) {
        console.error(`Gia: Error in mount cleanup for "${this.n}".`, e);
      }
      this.a = null;
    }
    try {
      this.unmount();
    } catch (e) {
      console.error(`Gia: Error in unmount for "${this.n}".`, e);
    }
    if (G(this), this.i) {
      for (let e = 0; e < this.i.length; e += 3)
        this.i[e].removeEventListener(
          this.i[e + 1],
          this[this.i[e + 2]]
        );
      this.i = null;
    }
    this.t = null, this.element && (d.delete(this.element), this.element = null);
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, n = !1) {
    return `[${g.get("attrPrefix")}-ref="${n ? `${this.n}:` : ""}${e}"]`;
  }
  setState(e) {
    T(this, e);
  }
  h() {
    _(this);
  }
  stateChange(e) {
    return e;
  }
  observeScroll(e) {
  }
  unobserveScroll(e) {
  }
  observeWindowResize(e) {
  }
  unobserveWindowResize(e) {
  }
  observeResize(e, n) {
  }
  unobserveResize(e, n = null) {
  }
  observeIntersection(e, n, r = {}) {
  }
  unobserveIntersection(e, n = null) {
  }
  loadScript(e, n) {
    return L();
  }
  loadStyle(e) {
    return F();
  }
  b() {
    var r;
    const e = Object.getPrototypeOf(this);
    let n = x.get(e);
    if (!n) {
      n = [];
      const s = Object.getOwnPropertyNames(e);
      for (let f = 0; f < s.length; f++) {
        const u = s[f];
        !U.has(u) && !u.startsWith("_") && typeof ((r = Object.getOwnPropertyDescriptor(e, u)) == null ? void 0 : r.value) == "function" && n.push(u);
      }
      x.set(e, n);
    }
    for (let s = 0; s < n.length; s++) {
      const f = n[s];
      this[f] = this[f].bind(this);
    }
  }
}
export {
  Z as BaseComponent,
  Y as clear,
  g as config,
  R as createInstance,
  z as destroyInstance,
  V as getComponentFromElement,
  J as loadComponents,
  X as measure,
  j as mutate,
  K as removeComponents,
  H as utils
};
