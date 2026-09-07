var T = Object.defineProperty;
var q = (i, e, t) => e in i ? T(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var C = (i, e, t) => q(i, typeof e != "symbol" ? e + "" : e, t);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (i, e = {}) => {
  if (typeof i != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", i);
    return;
  }
  const t = i.name;
  if (!t) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  e.priority !== void 0 && (i._ = e.priority), window.gia.components[t] = i;
});
class F {
  constructor() {
    C(this, "l", {
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
    this.l[e] = t;
  }
  get(e) {
    return this.l[e];
  }
}
const w = new F(), h = /* @__PURE__ */ new WeakMap();
function W(i, e, t, n) {
  if (h.has(i))
    return console.warn(`Component "${e}" already exists.`), h.get(i);
  try {
    const s = new t(i, n);
    return w.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function fe(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : h.get(i) || null;
}
function H(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function I(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function Y(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function B(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function K(i, e) {
  return B(i, e, "remove");
}
function U(i, e) {
  return B(i, e, "add");
}
function J(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  i.dispatchEvent(s);
}
function Q(i, e) {
  let t, n = null, s = null;
  const o = () => {
    if (clearTimeout(t), n) {
      const f = s, u = n;
      s = null, n = null, i.apply(f, u);
    }
  }, r = function() {
    n = arguments, s = this, clearTimeout(t), t = setTimeout(o, e);
  };
  return r.cancel = function() {
    clearTimeout(t), n = null, s = null;
  }, r;
}
const ue = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: U,
  debounce: Q,
  query: H,
  queryAll: I,
  removeClass: K,
  toggleClass: Y,
  triggerEvent: J
}, Symbol.toStringTag, { value: "Module" }));
function ce(i = {}, e = document.documentElement) {
  if (!i) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const f in i) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${w.get("attrPrefix")}-component`, o = I(`[${s}]`, e), r = o.length;
  for (let f = 0; f < r; f++) {
    const u = o[f];
    if (!h.get(u)) {
      const a = u.getAttribute(s);
      typeof i[a] == "function" ? n.push(W(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !h.get(e)) {
    const u = e.getAttribute(s);
    typeof i[u] == "function" ? n.push(W(e, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  n.length > 1 && n.sort((f, u) => {
    if (!f) return 1;
    if (!u) return -1;
    const c = f.constructor._ ?? f.constructor.priority ?? 0;
    return (u.constructor._ ?? u.constructor.priority ?? 0) - c;
  });
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    u && u.m();
  }
}
function V(i) {
  if (!i) return;
  let e = h.get(i);
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = h.get(t), i = t);
  }
  if (e) {
    const t = e.u || "Unknown";
    try {
      typeof e.y == "function" ? e.y() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    h.delete(i), e.element && (e.element = null), w.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ae(i = document.documentElement) {
  const e = I(`[${w.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    V(e[t]);
}
const l = (typeof window < "u" ? window.A : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
l.tempReads || (l.tempReads = []);
l.tempWrites || (l.tempWrites = []);
l.wrapperPool || (l.wrapperPool = []);
typeof window < "u" && !window.A && (window.A = l);
function j(i, e) {
  let t = l.wrapperPool.pop();
  return t || (t = function() {
    t.fn.call(t.ctx);
  }, t.n = !0), t.fn = i, t.ctx = e, t;
}
function Z() {
  l.scheduled = !1;
  const i = l.reads;
  l.currentReads = i, l.reads = l.tempReads;
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    if (n) {
      try {
        n();
      } catch (s) {
        console.error(s);
      }
      n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n));
    }
  }
  i.length = 0, l.tempReads = i, l.currentReads = null;
  const e = l.writes;
  l.currentWrites = e, l.writes = l.tempWrites;
  for (let t = 0; t < e.length; t++) {
    const n = e[t];
    if (n) {
      try {
        n();
      } catch (s) {
        console.error(s);
      }
      n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n));
    }
  }
  e.length = 0, l.tempWrites = e, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && G();
}
function G() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(Z));
}
function he(i, e) {
  const t = e ? j(i, e) : i;
  return l.reads.push(t), G(), t;
}
function X(i, e) {
  const t = e ? j(i, e) : i;
  return l.writes.push(t), G(), t;
}
function de(i) {
  let e = l.reads.indexOf(i);
  if (e > -1) {
    const t = l.reads[e];
    return t && t.n && (t.fn = null, t.ctx = null, l.wrapperPool.push(t)), l.reads[e] = null, !0;
  }
  for (let t = 0; t < l.reads.length; t++) {
    const n = l.reads[t];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, l.wrapperPool.push(n), l.reads[t] = null, !0;
  }
  if (e = l.writes.indexOf(i), e > -1) {
    const t = l.writes[e];
    return t && t.n && (t.fn = null, t.ctx = null, l.wrapperPool.push(t)), l.writes[e] = null, !0;
  }
  for (let t = 0; t < l.writes.length; t++) {
    const n = l.writes[t];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, l.wrapperPool.push(n), l.writes[t] = null, !0;
  }
  if (l.currentReads) {
    let t = l.currentReads.indexOf(i);
    if (t > -1) {
      const n = l.currentReads[t];
      return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.currentReads[t] = null, !0;
    }
    for (let n = 0; n < l.currentReads.length; n++) {
      const s = l.currentReads[n];
      if (s && s.n && s.fn === i)
        return s.fn = null, s.ctx = null, l.wrapperPool.push(s), l.currentReads[n] = null, !0;
    }
  }
  if (l.currentWrites) {
    let t = l.currentWrites.indexOf(i);
    if (t > -1) {
      const n = l.currentWrites[t];
      return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.currentWrites[t] = null, !0;
    }
    for (let n = 0; n < l.currentWrites.length; n++) {
      const s = l.currentWrites[n];
      if (s && s.n && s.fn === i)
        return s.fn = null, s.ctx = null, l.wrapperPool.push(s), l.currentWrites[n] = null, !0;
    }
  }
  return !1;
}
let A = !1, b = !1;
const d = [], D = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), $ = D ? "orientationchange" : "resize", p = [];
let g = null;
const M = { scroll: 0, velocity: 0 }, E = { width: 0, height: 0 }, N = [null];
let R = !1;
const x = [];
function ee() {
  R = !1;
  for (let i = 0; i < x.length; i++)
    x[i].g();
  x.length = 0;
}
function te() {
  for (let i = 0; i < d.length; i++)
    d[i](M);
}
function O(i) {
  let e, t;
  g ? (e = g.scroll, t = g.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), M.scroll = e, M.velocity = t, te();
}
function ne() {
  for (let i = 0; i < p.length; i++)
    p[i](E);
}
function S(i) {
  E.width = window.innerWidth, E.height = window.innerHeight, ne();
}
let y = null;
const m = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new Map(), ie = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), z = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new Map();
function se(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = L.get(e);
  s || (s = /* @__PURE__ */ new Map(), L.set(e, s));
  let o = s.get(t);
  o || (o = /* @__PURE__ */ new Map(), s.set(t, o));
  let r = o;
  if (Array.isArray(n)) {
    let u = r.get("array");
    u || (u = /* @__PURE__ */ new Map(), r.set("array", u)), r = u;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let _ = r.get(a);
      _ || (_ = /* @__PURE__ */ new Map(), r.set(a, _)), r = _;
    }
  } else {
    let u = r.get("number");
    u || (u = /* @__PURE__ */ new Map(), r.set("number", u)), r = u;
    let c = r.get(n);
    c || (c = /* @__PURE__ */ new Map(), r.set(n, c)), r = c;
  }
  let f = r.get("data");
  return f || (f = {
    observer: new IntersectionObserver((c) => {
      for (let a = 0; a < c.length; a++) {
        const _ = c[a], v = f.callbacks.get(_.target);
        if (v) {
          N[0] = _;
          for (let P = 0; P < v.length; P++)
            v[P](N);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: r,
    elementsCount: 0
  }, r.set("data", f)), f;
}
class re {
  constructor(e, t) {
    this.element = e, h.set(this.element, this), this.u = this.constructor.name, this.i = {}, this.l = t || {}, this.d = {}, this.g = this.g.bind(this), this.x();
  }
  get ref() {
    return this.i;
  }
  set ref(e) {
    const t = `${w.get("attrPrefix")}-ref`, n = I(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const f = n[r], u = f.getAttribute(t);
      let c = s[u];
      c === void 0 && (c = [], s[u] = c), c.push(f);
    }
    let o = !0;
    for (const r in e) {
      o = !1;
      break;
    }
    if (o)
      for (const r in s) {
        const f = r.indexOf(":");
        if (f !== -1) {
          const u = r.substring(0, f), c = r.substring(f + 1);
          u === this.u && !this.i[c] && (this.i[c] = s[r]);
        } else
          this.i[r] || (this.i[r] = s[r]);
      }
    else {
      this.i = {};
      for (const r in e) {
        if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
        const f = Array.isArray(e[r]);
        if (e[r] !== null && f && e[r].length > 0) {
          this.i[r] = e[r];
          continue;
        }
        const u = `${this.u}:${r}`;
        let c = s[u] || [];
        c.length === 0 && (c = s[r] || []), this.i[r] = f ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.l;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.l = { ...this.l, ...e };
      return;
    }
    const t = this.element.getAttribute(`${w.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const s = t.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
        } catch (o) {
          console.error(`Failed to parse options for component "${this.u}": ${o.message}`);
        }
    }
    this.l = {
      ...this.l,
      ...e,
      ...n
    };
  }
  get state() {
    return this.d;
  }
  set state(e) {
    console.warn("Use setState instead."), this.d = e;
  }
  m() {
    this.mount();
  }
  y() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.i = null, this.element && (h.delete(this.element), this.element = null);
      return;
    }
    if (this.e) {
      for (let e = this.e.length - 1; e >= 0; e--)
        this.unobserveScroll(this.e[e]);
      this.e = null;
    }
    if (this.t) {
      for (let e = this.t.length - 1; e >= 0; e--)
        this.unobserveWindowResize(this.t[e]);
      this.t = null;
    }
    if (this.r) {
      for (const e of this.r.keys())
        this.unobserveResize(e);
      this.r = null;
    }
    if (this.s) {
      for (const e of this.s.keys())
        this.unobserveIntersection(e);
      this.s = null;
    }
    if (this.a) {
      for (let e = 0; e < this.a.length; e += 3)
        this.a[e].removeEventListener(this.a[e + 1], this[this.a[e + 2]]);
      this.a = null;
    }
    this.i = null, this.element && (h.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (A || (A = !0, window.lenis ? (g = window.lenis, g.on("scroll", O)) : window.addEventListener("scroll", O, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(e) === -1 && this.e.push(e), d.indexOf(e) === -1 && d.push(e));
  }
  unobserveScroll(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(e);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const t = d.indexOf(e);
    t !== -1 && (d[t] = d[d.length - 1], d.pop()), d.length === 0 && A && (A = !1, g ? (g.off("scroll", O), g = null) : window.removeEventListener("scroll", O));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.addEventListener($, S, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(e) === -1 && this.t.push(e), p.indexOf(e) === -1 && p.push(e));
  }
  unobserveWindowResize(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(e);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const t = p.indexOf(e);
    t !== -1 && (p[t] = p[p.length - 1], p.pop()), p.length === 0 && b && (b = !1, window.removeEventListener($, S));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    y || (y = new ResizeObserver((o) => {
      for (let r = 0; r < o.length; r++) {
        const f = o[r], u = m.get(f.target);
        if (u) {
          N[0] = f;
          for (let c = 0; c < u.length; c++)
            u[c](N);
        }
      }
    }));
    let n = m.get(e);
    n || (n = [], m.set(e, n), y.observe(e)), n.indexOf(t) === -1 && n.push(t), this.r || (this.r = /* @__PURE__ */ new Map());
    let s = this.r.get(e);
    s || (s = [], this.r.set(e, s)), s.indexOf(t) === -1 && s.push(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.r) return;
    const n = this.r.get(e);
    if (!n) return;
    if (t) {
      const o = n.indexOf(t);
      o !== -1 && (n[o] = n[n.length - 1], n.pop());
      const r = m.get(e);
      if (r) {
        const f = r.indexOf(t);
        f !== -1 && (r[f] = r[r.length - 1], r.pop());
      }
    } else {
      const o = m.get(e);
      if (o)
        for (let r = 0; r < n.length; r++) {
          const f = n[r], u = o.indexOf(f);
          u !== -1 && (o[u] = o[o.length - 1], o.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.r.delete(e);
    const s = m.get(e);
    s && s.length === 0 && (m.delete(e), y && y.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = se(n);
    let o = s.callbacks.get(e);
    o || (o = [], s.callbacks.set(e, o), s.observer.observe(e), s.elementsCount++), o.indexOf(t) === -1 && o.push(t), this.s || (this.s = /* @__PURE__ */ new Map());
    let r = this.s.get(e);
    r || (r = /* @__PURE__ */ new Map(), this.s.set(e, r));
    let f = r.get(s);
    f || (f = [], r.set(s, f)), f.indexOf(t) === -1 && f.push(t);
  }
  N(e, t) {
    const n = this.b, s = this.O;
    if (s) {
      const o = e.indexOf(s);
      if (o !== -1 && (e[o] = e[e.length - 1], e.pop(), t && t.callbacks.has(n))) {
        const r = t.callbacks.get(n), f = r.indexOf(s);
        f !== -1 && (r[f] = r[r.length - 1], r.pop());
      }
    } else {
      if (t && t.callbacks.has(n)) {
        const o = t.callbacks.get(n);
        for (let r = 0; r < e.length; r++) {
          const f = e[r], u = o.indexOf(f);
          u !== -1 && (o[u] = o[o.length - 1], o.pop());
        }
      }
      e.length = 0;
    }
    if (e.length === 0 && this.s.get(n).delete(t), t) {
      const o = t.callbacks.get(n);
      o && o.length === 0 && (t.callbacks.delete(n), t.observer.unobserve(n), t.elementsCount--), t.elementsCount === 0 && (t.observer.disconnect(), t.nodeMap && t.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.s) return;
    const n = this.s.get(e);
    if (n) {
      this.b = e, this.O = t;
      for (const [s, o] of n.entries())
        this.N(o, s);
      this.b = null, this.O = null, n.size === 0 && this.s.delete(e);
    }
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    if (t && window[t] && !(window[t] instanceof Node) && !(window[t] instanceof HTMLCollection) && !(window[t] instanceof Window))
      return Promise.resolve(window[t]);
    const n = document.getElementById(e);
    return n ? n instanceof HTMLScriptElement ? n.o ? n.o : (n.o = new Promise((s, o) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        r(), delete n.o, o(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), o(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.o) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    const t = document.getElementById(e);
    return t ? t instanceof HTMLLinkElement ? t.o ? t.o : (t.o = new Promise((n, s) => {
      const o = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        o(), n(!0);
      }, t.onerror = () => {
        o(), delete t.o, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        o(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let r = !1;
        for (let f = 0; f < document.styleSheets.length; f++)
          if (document.styleSheets[f].href === t.href) {
            r = !0;
            break;
          }
        r && (o(), n(!0));
      }
    }), t.o) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${w.get("attrPrefix")}-ref="${t ? `${this.u}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.d[t] !== n && (this.d[t] = n, this.h || (this.h = this.w || {}, this.f = this.p || {}, x.push(this), R || (R = !0, X(ee))), this.h[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let o = k.get(t);
            o || (o = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, k.set(t, o)), this.f[o] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  g() {
    if (this.element) {
      if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
        let e = !1;
        for (const t in this.f) {
          e = !0;
          break;
        }
        if (e)
          for (const t in this.f) {
            if (!Object.prototype.hasOwnProperty.call(this.f, t)) continue;
            const n = this.f[t];
            this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
          }
      }
      this.stateChange(this.h), this.w = this.h, this.p = this.f;
      for (const e in this.w)
        delete this.w[e];
      if (this.p)
        for (const e in this.p)
          delete this.p[e];
      this.h = null, this.f = null;
    }
  }
  stateChange(e) {
    return e;
  }
  x() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = z.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let o = 0; o < s.length; o++) {
        const r = s[o];
        !ie.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, r)) == null ? void 0 : n.value) == "function" && t.push(r);
      }
      z.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const o = t[s];
      this[o] = this[o].bind(this);
    }
  }
}
class pe extends re {
  async require() {
  }
  m() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class oe {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    w.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    t && typeof t == "object" && (t.u = e);
    const s = n.slice();
    for (let o = 0; o < s.length; o++)
      s[o](t);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let s = t;
    n && (s = (o) => {
      this.off(e, s), t(o);
    }, t.c || (t.c = /* @__PURE__ */ Object.create(null)), t.c[e] = s), this.listeners[e].push(s);
  }
  once(e, t) {
    this.on(e, t, !0);
  }
  off(e, t) {
    if (!t) {
      this.listeners[e] && (this.listeners[e].length = 0);
      return;
    }
    const n = this.listeners[e];
    if (!n) return;
    let s = t;
    t.c && t.c[e] ? (s = t.c[e], delete t.c[e]) : t.I && (s = t.I);
    const o = n.indexOf(s);
    o !== -1 && n.splice(o, 1);
  }
}
const ge = new oe();
export {
  re as BaseComponent,
  pe as Component,
  de as clear,
  w as config,
  W as createInstance,
  V as destroyInstance,
  ge as eventbus,
  fe as getComponentFromElement,
  ce as loadComponents,
  he as measure,
  X as mutate,
  ae as removeComponents,
  ue as utils
};
