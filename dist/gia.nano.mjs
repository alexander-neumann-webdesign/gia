var A = Object.defineProperty;
var P = (n, t, e) => t in n ? A(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var y = (n, t, e) => P(n, typeof t != "symbol" ? t + "" : t, e);
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
class x {
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
const h = new x(), a = /* @__PURE__ */ new WeakMap();
function b(n, t, e, i) {
  if (a.has(n))
    return console.warn(`Component "${t}" already exists.`), a.get(n);
  try {
    const o = new e(n, i);
    return h.get("log") && console.info(`Created instance of component "${t}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${t}".`, o), null;
  }
}
function T(n) {
  return typeof n == "string" && (n = document.getElementById(n), !n) ? null : a.get(n) || null;
}
function R(n, t = document) {
  return typeof n != "string" ? n : t.querySelector(n);
}
function p(n, t = document) {
  return typeof n != "string" ? n : t.querySelectorAll(n);
}
function C(n, t, e = null) {
  e === null ? n.classList.toggle(t) : n.classList.toggle(t, !!e);
}
function O(n, t, e) {
  if (!n) return n;
  if (n.length !== void 0 && n.nodeType === void 0)
    for (let i = 0; i < n.length; i++)
      n[i].classList[e](t);
  else
    n.classList[e](t);
  return n;
}
function S(n, t) {
  return O(n, t, "remove");
}
function E(n, t) {
  return O(n, t, "add");
}
function $(n, t, e = null, i = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  i.detail = e;
  const o = new CustomEvent(t, i);
  n.dispatchEvent(o);
}
function I(n, t) {
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
const _ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: E,
  debounce: I,
  query: R,
  queryAll: p,
  removeClass: S,
  toggleClass: C,
  triggerEvent: $
}, Symbol.toStringTag, { value: "Module" }));
function q(n = {}, t = document.documentElement) {
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
  const i = [], o = `${h.get("attrPrefix")}-component`, c = p(`[${o}]`, t), s = c.length;
  for (let r = 0; r < s; r++) {
    const l = c[r];
    if (!a.get(l)) {
      const d = l.getAttribute(o);
      typeof n[d] == "function" ? i.push(b(l, d, n[d])) : console.warn(`Constructor "${d}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !a.get(t)) {
    const l = t.getAttribute(o);
    typeof n[l] == "function" ? i.push(b(t, l, n[l])) : console.warn(`Constructor "${l}" not found.`);
  }
  i.length > 1 && i.sort((r, l) => {
    if (!r) return 1;
    if (!l) return -1;
    const f = r.constructor.c ?? r.constructor.priority ?? 0;
    return (l.constructor.c ?? l.constructor.priority ?? 0) - f;
  });
  for (let r = 0; r < i.length; r++) {
    const l = i[r];
    l && l.h();
  }
}
function v(n) {
  if (!n) return;
  let t = a.get(n);
  if (!t && typeof n == "string") {
    const e = document.getElementById(n);
    e && (t = a.get(e), n = e);
  }
  if (t) {
    const e = t.i || "Unknown";
    try {
      typeof t.u == "function" ? t.u() : t.unmount();
    } catch (i) {
      console.error(`Gia: Error unmounting component "${e}".`, i);
    }
    a.delete(n), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function z(n = document.documentElement) {
  const t = p(`[${h.get("attrPrefix")}-component]`, n);
  for (let e = 0; e < t.length; e++)
    v(t[e]);
}
const u = (typeof window < "u" ? window.f : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
u.tempReads || (u.tempReads = []);
u.tempWrites || (u.tempWrites = []);
typeof window < "u" && !window.f && (window.f = u);
function M() {
  u.scheduled = !1;
  const n = u.reads;
  u.reads = u.tempReads;
  for (let e = 0; e < n.length; e++)
    if (n[e])
      try {
        n[e]();
      } catch (i) {
        console.error(i);
      }
  n.length = 0, u.tempReads = n;
  const t = u.writes;
  u.writes = u.tempWrites;
  for (let e = 0; e < t.length; e++)
    if (t[e])
      try {
        t[e]();
      } catch (i) {
        console.error(i);
      }
  t.length = 0, u.tempWrites = t, (u.reads.length > 0 || u.writes.length > 0) && w();
}
function w() {
  !u.scheduled && typeof window < "u" && (u.scheduled = !0, window.requestAnimationFrame(M));
}
function L(n, t) {
  const e = t ? n.bind(t) : n;
  return u.reads.push(e), w(), e;
}
function W(n, t) {
  const e = t ? n.bind(t) : n;
  return u.writes.push(e), w(), e;
}
function F(n) {
  let t = u.reads.indexOf(n);
  return t > -1 ? (u.reads[t] = null, !0) : (t = u.writes.indexOf(n), t > -1 ? (u.writes[t] = null, !0) : !1);
}
typeof navigator < "u" && navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
let m = !1;
const g = [];
function B() {
  m = !1;
  for (let n = 0; n < g.length; n++)
    g[n].r();
  g.length = 0;
}
const j = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap();
class G {
  constructor(t, e) {
    this.element = t, a.set(this.element, this), this.i = this.constructor.name, this.t = {}, this.e = e || {}, this.s = {}, this.r = this.r.bind(this), this.d();
  }
  get ref() {
    return this.t;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, i = p(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < i.length; s++) {
      const r = i[s], l = r.getAttribute(e);
      let f = o[l];
      f === void 0 && (f = [], o[l] = f), f.push(r);
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
          const l = s.substring(0, r), f = s.substring(r + 1);
          l === this.i && !this.t[f] && (this.t[f] = o[s]);
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
        let f = o[l] || [];
        f.length === 0 && (f = o[s] || []), this.t[s] = r ? f : f[0] ?? null;
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
  h() {
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
  observeIntersection(t, e, i = {}) {
  }
  g(t, e) {
    const i = this.p, o = this.m;
    if (o) {
      const c = t.indexOf(o);
      if (c !== -1 && (t[c] = t[t.length - 1], t.pop(), e && e.callbacks.has(i))) {
        const s = e.callbacks.get(i), r = s.indexOf(o);
        r !== -1 && (s[r] = s[s.length - 1], s.pop());
      }
    } else {
      if (e && e.callbacks.has(i)) {
        const c = e.callbacks.get(i);
        for (let s = 0; s < t.length; s++) {
          const r = t[s], l = c.indexOf(r);
          l !== -1 && (c[l] = c[c.length - 1], c.pop());
        }
      }
      t.length = 0;
    }
    if (t.length === 0 && this.w.get(i).delete(e), e) {
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
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.i}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const i = t[e];
        this.s[e] !== i && (this.s[e] = i, this.n || (this.n = this.l || {}, this.a = this.o || {}, g.push(this), m || (m = !0, W(B))), this.n[e] = i);
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
}
export {
  G as BaseComponent,
  F as clear,
  h as config,
  b as createInstance,
  v as destroyInstance,
  T as getComponentFromElement,
  q as loadComponents,
  L as measure,
  W as mutate,
  z as removeComponents,
  _ as utils
};
