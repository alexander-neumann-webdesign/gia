var O = Object.defineProperty;
var W = (n, e, t) => e in n ? O(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var y = (n, e, t) => W(n, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (n, e = {}) => {
  if (typeof n != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", n);
    return;
  }
  const t = n.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  e.priority !== void 0 && (n.c = e.priority), window.gia.components[t] = n;
});
class A {
  constructor() {
    y(this, "n", {
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
    this.n[e] = t;
  }
  get(e) {
    return this.n[e];
  }
}
const h = new A(), a = /* @__PURE__ */ new WeakMap();
function b(n, e, t, r) {
  if (a.has(n))
    return console.warn(`Component "${e}" already exists.`), a.get(n);
  try {
    const s = new t(n, r);
    return h.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function _(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : a.get(n) || null;
}
function k(n, e = document) {
  return typeof n != "string" ? n : e.querySelector(n);
}
function g(n, e = document) {
  return typeof n != "string" ? n : e.querySelectorAll(n);
}
function v(n, e, t = null) {
  t === null ? n.classList.toggle(e) : n.classList.toggle(e, !!t);
}
function P(n, e, t) {
  if (!n) return n;
  if (n.length !== void 0 && n.nodeType === void 0)
    for (let r = 0; r < n.length; r++)
      n[r].classList[t](e);
  else
    n.classList[t](e);
  return n;
}
function S(n, e) {
  return P(n, e, "remove");
}
function C(n, e) {
  return P(n, e, "add");
}
function E(n, e, t = null, r = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  r.detail = t;
  const s = new CustomEvent(e, r);
  n.dispatchEvent(s);
}
function I(n, e) {
  let t, r = null, s = null;
  const c = () => {
    if (clearTimeout(t), r) {
      const l = s, u = r;
      s = null, r = null, n.apply(l, u);
    }
  }, o = function() {
    r = arguments, s = this, clearTimeout(t), t = setTimeout(c, e);
  };
  return o.cancel = function() {
    clearTimeout(t), r = null, s = null;
  }, o;
}
const q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: C,
  debounce: I,
  query: k,
  queryAll: g,
  removeClass: S,
  toggleClass: v,
  triggerEvent: E
}, Symbol.toStringTag, { value: "Module" }));
function z(n = {}, e = document.documentElement) {
  if (!n) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in n) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const r = [], s = `${h.get("attrPrefix")}-component`, c = g(`[${s}]`, e), o = c.length;
  for (let l = 0; l < o; l++) {
    const u = c[l];
    if (!a.get(u)) {
      const d = u.getAttribute(s);
      typeof n[d] == "function" ? r.push(b(u, d, n[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !a.get(e)) {
    const u = e.getAttribute(s);
    typeof n[u] == "function" ? r.push(b(e, u, n[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  r.length > 1 && r.sort((l, u) => {
    if (!l) return 1;
    if (!u) return -1;
    const f = l.constructor.c ?? l.constructor.priority ?? 0;
    return (u.constructor.c ?? u.constructor.priority ?? 0) - f;
  });
  for (let l = 0; l < r.length; l++) {
    const u = r[l];
    u && u.d();
  }
}
function $(n) {
  if (!n) return;
  let e = a.get(n);
  if (!e && typeof n == "string") {
    const t = document.getElementById(n);
    t && (e = a.get(t), n = t);
  }
  if (e) {
    const t = e.i || "Unknown";
    try {
      typeof e.f == "function" ? e.f() : e.unmount();
    } catch (r) {
      console.error(`Gia: Error unmounting component "${t}".`, r);
    }
    a.delete(n), e.element && (e.element = null), h.get("log") && console.info(`Removed component "${t}".`);
  }
}
function L(n = document.documentElement) {
  const e = g(`[${h.get("attrPrefix")}-component]`, n);
  for (let t = 0; t < e.length; t++)
    $(e[t]);
}
const i = (typeof window < "u" ? window.a : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
i.tempReads || (i.tempReads = []);
i.tempWrites || (i.tempWrites = []);
i.wrapperPool || (i.wrapperPool = []);
typeof window < "u" && !window.a && (window.a = i);
function R(n, e) {
  let t = i.wrapperPool.pop();
  return t || (t = function() {
    t.fn.call(t.ctx);
  }, t.t = !0), t.fn = n, t.ctx = e, t;
}
function M() {
  i.scheduled = !1;
  const n = i.reads;
  i.currentReads = n, i.reads = i.tempReads;
  for (let t = 0; t < n.length; t++) {
    const r = n[t];
    if (r) {
      try {
        r();
      } catch (s) {
        console.error(s);
      }
      r.t && (r.fn = null, r.ctx = null, i.wrapperPool.push(r));
    }
  }
  n.length = 0, i.tempReads = n, i.currentReads = null;
  const e = i.writes;
  i.currentWrites = e, i.writes = i.tempWrites;
  for (let t = 0; t < e.length; t++) {
    const r = e[t];
    if (r) {
      try {
        r();
      } catch (s) {
        console.error(s);
      }
      r.t && (r.fn = null, r.ctx = null, i.wrapperPool.push(r));
    }
  }
  e.length = 0, i.tempWrites = e, i.currentWrites = null, (i.reads.length > 0 || i.writes.length > 0) && w();
}
function w() {
  !i.scheduled && typeof window < "u" && (i.scheduled = !0, window.requestAnimationFrame(M));
}
function F(n, e) {
  const t = e ? R(n, e) : n;
  return i.reads.push(t), w(), t;
}
function B(n, e) {
  const t = e ? R(n, e) : n;
  return i.writes.push(t), w(), t;
}
function G(n) {
  let e = i.reads.indexOf(n);
  if (e > -1) {
    const t = i.reads[e];
    return t && t.t && (t.fn = null, t.ctx = null, i.wrapperPool.push(t)), i.reads[e] = null, !0;
  }
  for (let t = 0; t < i.reads.length; t++) {
    const r = i.reads[t];
    if (r && r.t && r.fn === n)
      return r.fn = null, r.ctx = null, i.wrapperPool.push(r), i.reads[t] = null, !0;
  }
  if (e = i.writes.indexOf(n), e > -1) {
    const t = i.writes[e];
    return t && t.t && (t.fn = null, t.ctx = null, i.wrapperPool.push(t)), i.writes[e] = null, !0;
  }
  for (let t = 0; t < i.writes.length; t++) {
    const r = i.writes[t];
    if (r && r.t && r.fn === n)
      return r.fn = null, r.ctx = null, i.wrapperPool.push(r), i.writes[t] = null, !0;
  }
  if (i.currentReads) {
    let t = i.currentReads.indexOf(n);
    if (t > -1) {
      const r = i.currentReads[t];
      return r && r.t && (r.fn = null, r.ctx = null, i.wrapperPool.push(r)), i.currentReads[t] = null, !0;
    }
    for (let r = 0; r < i.currentReads.length; r++) {
      const s = i.currentReads[r];
      if (s && s.t && s.fn === n)
        return s.fn = null, s.ctx = null, i.wrapperPool.push(s), i.currentReads[r] = null, !0;
    }
  }
  if (i.currentWrites) {
    let t = i.currentWrites.indexOf(n);
    if (t > -1) {
      const r = i.currentWrites[t];
      return r && r.t && (r.fn = null, r.ctx = null, i.wrapperPool.push(r)), i.currentWrites[t] = null, !0;
    }
    for (let r = 0; r < i.currentWrites.length; r++) {
      const s = i.currentWrites[r];
      if (s && s.t && s.fn === n)
        return s.fn = null, s.ctx = null, i.wrapperPool.push(s), i.currentWrites[r] = null, !0;
    }
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
const N = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), x = /* @__PURE__ */ new WeakMap();
class U {
  constructor(e, t) {
    this.element = e, a.set(this.element, this), this.i = this.constructor.name, this.e = {}, this.n = t || {}, this.s = {}, this.l = this.l.bind(this), this.p();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${h.get("attrPrefix")}-ref`, r = g(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < r.length; o++) {
      const l = r[o], u = l.getAttribute(t);
      let f = s[u];
      f === void 0 && (f = [], s[u] = f), f.push(l);
    }
    let c = !0;
    for (const o in e) {
      c = !1;
      break;
    }
    if (c)
      for (const o in s) {
        const l = o.indexOf(":");
        if (l !== -1) {
          const u = o.substring(0, l), f = o.substring(l + 1);
          u === this.i && !this.e[f] && (this.e[f] = s[o]);
        } else
          this.e[o] || (this.e[o] = s[o]);
      }
    else {
      this.e = {};
      for (const o in e) {
        if (!Object.prototype.hasOwnProperty.call(e, o)) continue;
        const l = Array.isArray(e[o]);
        if (e[o] !== null && l && e[o].length > 0) {
          this.e[o] = e[o];
          continue;
        }
        const u = `${this.i}:${o}`;
        let f = s[u] || [];
        f.length === 0 && (f = s[o] || []), this.e[o] = l ? f : f[0] ?? null;
      }
    }
  }
  get options() {
    return this.n;
  }
  set options(e) {
    {
      this.n = { ...this.n, ...e };
      return;
    }
  }
  get state() {
    return this.s;
  }
  set state(e) {
    console.warn("Use setState instead."), this.s = e;
  }
  d() {
    this.mount();
  }
  f() {
    this.unmount();
    {
      this.e = null, this.element && (a.delete(this.element), this.element = null);
      return;
    }
  }
  observeScroll(e) {
  }
  g(e, t) {
    this.unobserveResize(t);
  }
  m(e, t) {
    this.unobserveIntersection(t);
  }
  unobserveScroll(e) {
  }
  observeWindowResize(e) {
  }
  unobserveWindowResize(e) {
  }
  observeResize(e, t) {
  }
  unobserveResize(e, t = null) {
  }
  observeIntersection(e, t, r = {}) {
  }
  w(e, t) {
    const r = this.y, s = this.b;
    if (s) {
      const c = e.indexOf(s);
      if (c !== -1 && (e[c] = e[e.length - 1], e.pop(), t && t.callbacks.has(r))) {
        const o = t.callbacks.get(r), l = o.indexOf(s);
        l !== -1 && (o[l] = o[o.length - 1], o.pop());
      }
    } else {
      if (t && t.callbacks.has(r)) {
        const c = t.callbacks.get(r);
        for (let o = 0; o < e.length; o++) {
          const l = e[o], u = c.indexOf(l);
          u !== -1 && (c[u] = c[c.length - 1], c.pop());
        }
      }
      e.length = 0;
    }
    if (e.length === 0 && this.x.get(r).delete(t), t) {
      const c = t.callbacks.get(r);
      c && c.length === 0 && (t.callbacks.delete(r), t.observer.unobserve(r), t.elementsCount--), t.elementsCount === 0 && (t.observer.disconnect(), t.nodeMap && t.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(e, t = null) {
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    return Promise.resolve();
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    return Promise.resolve();
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${h.get("attrPrefix")}-ref="${t ? `${this.i}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const r = e[t];
        this.s[t] !== r && (this.s[t] = r, this.r || (this.r = this.u || {}, this.h = this.o || {}, p.push(this), m || (m = !0, B(j))), this.r[t] = r);
      }
  }
  l() {
    if (this.element) {
      this.stateChange(this.r), this.u = this.r, this.o = this.h;
      for (const e in this.u)
        delete this.u[e];
      if (this.o)
        for (const e in this.o)
          delete this.o[e];
      this.r = null, this.h = null;
    }
  }
  stateChange(e) {
    return e;
  }
  p() {
    var r;
    const e = Object.getPrototypeOf(this);
    let t = x.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let c = 0; c < s.length; c++) {
        const o = s[c];
        !N.has(o) && !o.startsWith("_") && typeof ((r = Object.getOwnPropertyDescriptor(e, o)) == null ? void 0 : r.value) == "function" && t.push(o);
      }
      x.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const c = t[s];
      this[c] = this[c].bind(this);
    }
  }
}
export {
  U as BaseComponent,
  G as clear,
  h as config,
  b as createInstance,
  $ as destroyInstance,
  _ as getComponentFromElement,
  z as loadComponents,
  F as measure,
  B as mutate,
  L as removeComponents,
  q as utils
};
