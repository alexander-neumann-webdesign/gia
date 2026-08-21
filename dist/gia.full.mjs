var Z = Object.defineProperty;
var X = (i, e, t) => e in i ? Z(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var B = (i, e, t) => X(i, typeof e != "symbol" ? e + "" : e, t);
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
class D {
  constructor() {
    B(this, "l", {
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
const h = new D(), d = /* @__PURE__ */ new WeakMap();
function T(i, e, t, n) {
  if (d.has(i))
    return console.warn(`Component "${e}" already exists.`), d.get(i);
  try {
    const s = new t(i, n);
    return h.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function be(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : d.get(i) || null;
}
function ee(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function O(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function te(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function K(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function ne(i, e) {
  return K(i, e, "remove");
}
function ie(i, e) {
  return K(i, e, "add");
}
function se(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  i.dispatchEvent(s);
}
function oe(i, e) {
  let t, n = null, s = null;
  const r = () => {
    if (clearTimeout(t), n) {
      const f = s, u = n;
      s = null, n = null, i.apply(f, u);
    }
  }, o = function() {
    n = arguments, s = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return o.cancel = function() {
    clearTimeout(t), n = null, s = null;
  }, o;
}
const Ae = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: ie,
  debounce: oe,
  query: ee,
  queryAll: O,
  removeClass: ne,
  toggleClass: te,
  triggerEvent: se
}, Symbol.toStringTag, { value: "Module" }));
function re(i = {}, e = document.documentElement) {
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
  const n = [], s = `${h.get("attrPrefix")}-component`, r = O(`[${s}]`, e), o = r.length;
  for (let f = 0; f < o; f++) {
    const u = r[f];
    if (!d.get(u)) {
      const a = u.getAttribute(s);
      typeof i[a] == "function" ? n.push(T(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !d.get(e)) {
    const u = e.getAttribute(s);
    typeof i[u] == "function" ? n.push(T(e, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
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
function R(i) {
  if (!i) return;
  let e = d.get(i);
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = d.get(t), i = t);
  }
  if (e) {
    const t = e.c || "Unknown";
    try {
      typeof e.y == "function" ? e.y() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    d.delete(i), e.element && (e.element = null), h.get("log") && console.info(`Removed component "${t}".`);
  }
}
function Oe(i = document.documentElement) {
  const e = O(`[${h.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    R(e[t]);
}
const l = (typeof window < "u" ? window.b : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
l.tempReads || (l.tempReads = []);
l.tempWrites || (l.tempWrites = []);
l.wrapperPool || (l.wrapperPool = []);
typeof window < "u" && !window.b && (window.b = l);
function Q(i, e) {
  let t = l.wrapperPool.pop();
  return t || (t = function() {
    t.fn.call(t.ctx);
  }, t.n = !0), t.fn = i, t.ctx = e, t;
}
function le() {
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
  e.length = 0, l.tempWrites = e, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && z();
}
function z() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(le));
}
function Ne(i, e) {
  const t = e ? Q(i, e) : i;
  return l.reads.push(t), z(), t;
}
function fe(i, e) {
  const t = e ? Q(i, e) : i;
  return l.writes.push(t), z(), t;
}
function xe(i) {
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
let x = !1, v = !1;
const p = [], ue = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), j = ue ? "orientationchange" : "resize", g = [];
let w = null;
const G = { scroll: 0, velocity: 0 }, $ = { width: 0, height: 0 }, M = [null], ce = function(i, e) {
  this.unobserveResize(e);
}, ae = function(i, e) {
  this.unobserveIntersection(e);
};
let S = !1;
const I = [];
function he() {
  S = !1;
  for (let i = 0; i < I.length; i++)
    I[i].g();
  I.length = 0;
}
function de() {
  for (let i = 0; i < p.length; i++)
    p[i](G);
}
function E(i) {
  let e, t;
  w ? (e = w.scroll, t = w.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), G.scroll = e, G.velocity = t, de();
}
function pe() {
  for (let i = 0; i < g.length; i++)
    g[i]($);
}
function k(i) {
  $.width = window.innerWidth, $.height = window.innerHeight, pe();
}
let N = null;
const m = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map(), U = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), F = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new Map();
function ge(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = q.get(e);
  s || (s = /* @__PURE__ */ new Map(), q.set(e, s));
  let r = s.get(t);
  r || (r = /* @__PURE__ */ new Map(), s.set(t, r));
  let o = r;
  if (Array.isArray(n)) {
    let u = o.get("array");
    u || (u = /* @__PURE__ */ new Map(), o.set("array", u)), o = u;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let _ = o.get(a);
      _ || (_ = /* @__PURE__ */ new Map(), o.set(a, _)), o = _;
    }
  } else {
    let u = o.get("number");
    u || (u = /* @__PURE__ */ new Map(), o.set("number", u)), o = u;
    let c = o.get(n);
    c || (c = /* @__PURE__ */ new Map(), o.set(n, c)), o = c;
  }
  let f = o.get("data");
  return f || (f = {
    observer: new IntersectionObserver((c) => {
      for (let a = 0; a < c.length; a++) {
        const _ = c[a], C = f.callbacks.get(_.target);
        if (C) {
          M[0] = _;
          for (let P = 0; P < C.length; P++)
            C[P](M);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: o,
    elementsCount: 0
  }, o.set("data", f)), f;
}
class J {
  constructor(e, t) {
    this.element = e, d.set(this.element, this), this.c = this.constructor.name, this.i = {}, this.l = t || {}, this.d = {}, this.g = this.g.bind(this), this.N(), h.get("autoBindActions") && this.x();
  }
  get ref() {
    return this.i;
  }
  set ref(e) {
    const t = `${h.get("attrPrefix")}-ref`, n = O(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < n.length; o++) {
      const f = n[o], u = f.getAttribute(t);
      let c = s[u];
      c === void 0 && (c = [], s[u] = c), c.push(f);
    }
    let r = !0;
    for (const o in e) {
      r = !1;
      break;
    }
    if (r)
      for (const o in s) {
        const f = o.indexOf(":");
        if (f !== -1) {
          const u = o.substring(0, f), c = o.substring(f + 1);
          u === this.c && !this.i[c] && (this.i[c] = s[o]);
        } else
          this.i[o] || (this.i[o] = s[o]);
      }
    else {
      this.i = {};
      for (const o in e) {
        if (!Object.prototype.hasOwnProperty.call(e, o)) continue;
        const f = Array.isArray(e[o]);
        if (e[o] !== null && f && e[o].length > 0) {
          this.i[o] = e[o];
          continue;
        }
        const u = `${this.c}:${o}`;
        let c = s[u] || [];
        c.length === 0 && (c = s[o] || []), this.i[o] = f ? c : c[0] ?? null;
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
    const t = this.element.getAttribute(`${h.get("attrPrefix")}-options`);
    let n = {};
    if (t) {
      const s = t.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
        } catch (r) {
          console.error(`Failed to parse options for component "${this.c}": ${r.message}`);
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
      this.i = null, this.element && (d.delete(this.element), this.element = null);
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
    if (this.o && (this.o.forEach(ce, this), this.o = null), this.s && (this.s.forEach(ae, this), this.s = null), this.f) {
      for (let e = 0; e < this.f.length; e += 3)
        this.f[e].removeEventListener(this.f[e + 1], this[this.f[e + 2]]);
      this.f = null;
    }
    this.i = null, this.element && (d.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.lenis ? (w = window.lenis, w.on("scroll", E)) : window.addEventListener("scroll", E, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(e) === -1 && this.e.push(e), p.indexOf(e) === -1 && p.push(e));
  }
  unobserveScroll(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(e);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const t = p.indexOf(e);
    t !== -1 && (p[t] = p[p.length - 1], p.pop()), p.length === 0 && x && (x = !1, w ? (w.off("scroll", E), w = null) : window.removeEventListener("scroll", E));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (v || (v = !0, window.addEventListener(j, k, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(e) === -1 && this.t.push(e), g.indexOf(e) === -1 && g.push(e));
  }
  unobserveWindowResize(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(e);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const t = g.indexOf(e);
    t !== -1 && (g[t] = g[g.length - 1], g.pop()), g.length === 0 && v && (v = !1, window.removeEventListener(j, k));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    N || (N = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const f = r[o], u = m.get(f.target);
        if (u) {
          M[0] = f;
          for (let c = 0; c < u.length; c++)
            u[c](M);
        }
      }
    }));
    let n = m.get(e);
    n || (n = [], m.set(e, n), N.observe(e)), n.indexOf(t) === -1 && n.push(t), this.o || (this.o = /* @__PURE__ */ new Map());
    let s = this.o.get(e);
    s || (s = [], this.o.set(e, s)), s.indexOf(t) === -1 && s.push(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.o) return;
    const n = this.o.get(e);
    if (!n) return;
    if (t) {
      const r = n.indexOf(t);
      r !== -1 && (n[r] = n[n.length - 1], n.pop());
      const o = m.get(e);
      if (o) {
        const f = o.indexOf(t);
        f !== -1 && (o[f] = o[o.length - 1], o.pop());
      }
    } else {
      const r = m.get(e);
      if (r)
        for (let o = 0; o < n.length; o++) {
          const f = n[o], u = r.indexOf(f);
          u !== -1 && (r[u] = r[r.length - 1], r.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.o.delete(e);
    const s = m.get(e);
    s && s.length === 0 && (m.delete(e), N && N.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = ge(n);
    let r = s.callbacks.get(e);
    r || (r = [], s.callbacks.set(e, r), s.observer.observe(e), s.elementsCount++), r.indexOf(t) === -1 && r.push(t), this.s || (this.s = /* @__PURE__ */ new Map());
    let o = this.s.get(e);
    o || (o = /* @__PURE__ */ new Map(), this.s.set(e, o));
    let f = o.get(s);
    f || (f = [], o.set(s, f)), f.indexOf(t) === -1 && f.push(t);
  }
  v(e, t) {
    const n = this.A, s = this.O;
    if (s) {
      const r = e.indexOf(s);
      if (r !== -1 && (e[r] = e[e.length - 1], e.pop(), t && t.callbacks.has(n))) {
        const o = t.callbacks.get(n), f = o.indexOf(s);
        f !== -1 && (o[f] = o[o.length - 1], o.pop());
      }
    } else {
      if (t && t.callbacks.has(n)) {
        const r = t.callbacks.get(n);
        for (let o = 0; o < e.length; o++) {
          const f = e[o], u = r.indexOf(f);
          u !== -1 && (r[u] = r[r.length - 1], r.pop());
        }
      }
      e.length = 0;
    }
    if (e.length === 0 && this.s.get(n).delete(t), t) {
      const r = t.callbacks.get(n);
      r && r.length === 0 && (t.callbacks.delete(n), t.observer.unobserve(n), t.elementsCount--), t.elementsCount === 0 && (t.observer.disconnect(), t.nodeMap && t.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.s) return;
    const n = this.s.get(e);
    n && (this.A = e, this.O = t, n.forEach(this.v, this), this.A = null, this.O = null, n.size === 0 && this.s.delete(e));
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
    return n ? n instanceof HTMLScriptElement ? n.r ? n.r : (n.r = new Promise((s, r) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n.r, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (o(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.r) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
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
    return t ? t instanceof HTMLLinkElement ? t.r ? t.r : (t.r = new Promise((n, s) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t.r, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let o = !1;
        for (let f = 0; f < document.styleSheets.length; f++)
          if (document.styleSheets[f].href === t.href) {
            o = !0;
            break;
          }
        o && (r(), n(!0));
      }
    }), t.r) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${h.get("attrPrefix")}-ref="${t ? `${this.c}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.d[t] !== n && (this.d[t] = n, this.h || (this.h = this.w || {}, this.u = this.p || {}, I.push(this), S || (S = !0, fe(he))), this.h[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = H.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, H.set(t, r)), this.u[r] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  g() {
    if (this.element) {
      if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
        let e = !1;
        for (const t in this.u) {
          e = !0;
          break;
        }
        if (e)
          for (const t in this.u) {
            if (!Object.prototype.hasOwnProperty.call(this.u, t)) continue;
            const n = this.u[t];
            this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
          }
      }
      this.stateChange(this.h), this.w = this.h, this.p = this.u;
      for (const e in this.w)
        delete this.w[e];
      if (this.p)
        for (const e in this.p)
          delete this.p[e];
      this.h = null, this.u = null;
    }
  }
  stateChange(e) {
    return e;
  }
  N() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = F.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let r = 0; r < s.length; r++) {
        const o = s[r];
        !U.has(o) && !o.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, o)) == null ? void 0 : n.value) == "function" && t.push(o);
      }
      F.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const r = t[s];
      this[r] = this[r].bind(this);
    }
  }
}
J.prototype.x = function() {
  const i = O("[data-action]", this.element), e = i.length;
  for (let t = 0; t < e; t++) {
    const n = i[t], s = n.getAttribute("data-action");
    if (!s) continue;
    let r = 0;
    for (; r < s.length; ) {
      let o = s.indexOf(" ", r);
      if (o === -1 && (o = s.length), o > r) {
        const f = s.substring(r, o), u = f.indexOf("->");
        let c, a;
        u !== -1 ? (c = f.substring(0, u), a = f.substring(u + 2)) : (c = f, a = void 0), this[a] && typeof this[a] == "function" && !a.startsWith("_") && !U.has(a) ? (n.addEventListener(c, this[a]), this.f || (this.f = []), this.f.push(n, c, a)) : console.warn(`Method "${a}" not found, is restricted, or is not a function in component.`);
      }
      r = o + 1;
    }
  }
};
class ve extends J {
  async require() {
  }
  m() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class we {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    h.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    t && typeof t == "object" && (t.c = e);
    const s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](t);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let s = t;
    n && (s = (r) => {
      this.off(e, s), t(r);
    }, t.a || (t.a = /* @__PURE__ */ Object.create(null)), t.a[e] = s), this.listeners[e].push(s);
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
    t.a && t.a[e] ? (s = t.a[e], delete t.a[e]) : t.E && (s = t.E);
    const r = n.indexOf(s);
    r !== -1 && n.splice(r, 1);
  }
}
const Ee = new we();
let y = null, W = null;
const b = [], A = [];
let L = !1;
const _e = (i) => {
  i.isConnected && re(W, i);
}, Y = () => {
  L = !1;
  const i = `${h.get("attrPrefix")}-component`;
  for (let e = 0; e < A.length; e++) {
    const t = A[e];
    if (!t.isConnected) {
      t.hasAttribute(i) && R(t);
      const n = O(`[${i}]`, t);
      for (let s = 0; s < n.length; s++)
        R(n[s]);
    }
  }
  A.length = 0, W = typeof window < "u" && window.gia ? window.gia.components : {};
  for (let e = 0; e < b.length; e++)
    _e(b[e]);
  b.length = 0, W = null;
};
function me(i) {
  for (let e = 0; e < i.length; e++) {
    const t = i[e];
    for (let n = 0; n < t.removedNodes.length; n++) {
      const s = t.removedNodes[n];
      s.nodeType === Node.ELEMENT_NODE && A.indexOf(s) === -1 && A.push(s);
    }
    if (t.addedNodes.length > 0)
      for (let n = 0; n < t.addedNodes.length; n++) {
        const s = t.addedNodes[n];
        s.nodeType === Node.ELEMENT_NODE && b.indexOf(s) === -1 && b.push(s);
      }
  }
  !L && (b.length > 0 || A.length > 0) && (L = !0, typeof window < "u" && window.requestAnimationFrame ? window.requestAnimationFrame(Y) : Y());
}
function V() {
  typeof document > "u" || (h.get("autoMountComponents") && !y ? (y = new MutationObserver(me), y.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !h.get("autoMountComponents") && y && (y.disconnect(), y = null));
}
{
  const i = h.set;
  h.set = function(e, t) {
    i.call(this, e, t), e === "autoMountComponents" && V();
  };
}
typeof window < "u" && setTimeout(V, 0);
export {
  J as BaseComponent,
  ve as Component,
  xe as clear,
  h as config,
  T as createInstance,
  R as destroyInstance,
  Ee as eventbus,
  be as getComponentFromElement,
  re as loadComponents,
  Ne as measure,
  fe as mutate,
  Oe as removeComponents,
  Ae as utils
};
