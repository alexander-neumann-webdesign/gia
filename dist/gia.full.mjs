var J = Object.defineProperty;
var Q = (i, t, e) => t in i ? J(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var L = (i, t, e) => Q(i, typeof t != "symbol" ? t + "" : t, e);
typeof window < "u" && (window.gia = window.gia || {}, window.gia.components = window.gia.components || {}, window.gia.register = (i, t = {}) => {
  if (typeof i != "function") {
    console.error("Gia: Register failed. Expected a Class, got:", i);
    return;
  }
  const e = i.name;
  if (!e) {
    console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
    return;
  }
  t.priority !== void 0 && (i._ = t.priority), window.gia.components[e] = i;
});
class V {
  constructor() {
    L(this, "l", {
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
    this.l[t] = e;
  }
  get(t) {
    return this.l[t];
  }
}
const h = new V(), d = /* @__PURE__ */ new WeakMap();
function z(i, t, e, n) {
  if (d.has(i))
    return console.warn(`Component "${t}" already exists.`), d.get(i);
  try {
    const s = new e(i, n);
    return h.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function gt(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : d.get(i) || null;
}
function Z(i, t = document) {
  return typeof i != "string" ? i : t.querySelector(i);
}
function b(i, t = document) {
  return typeof i != "string" ? i : t.querySelectorAll(i);
}
function X(i, t, e = null) {
  e === null ? i.classList.toggle(t) : i.classList.toggle(t, !!e);
}
function F(i, t, e) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[e](t);
  else
    i.classList[e](t);
  return i;
}
function D(i, t) {
  return F(i, t, "remove");
}
function tt(i, t) {
  return F(i, t, "add");
}
function et(i, t, e = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = e;
  const s = new CustomEvent(t, n);
  i.dispatchEvent(s);
}
function nt(i, t) {
  let e, n = null, s = null;
  const r = () => {
    if (clearTimeout(e), n) {
      const f = s, u = n;
      s = null, n = null, i.apply(f, u);
    }
  }, o = function() {
    n = arguments, s = this, clearTimeout(e), e = setTimeout(r, t);
  };
  return o.cancel = function() {
    clearTimeout(e), n = null, s = null;
  }, o;
}
const wt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: tt,
  debounce: nt,
  query: Z,
  queryAll: b,
  removeClass: D,
  toggleClass: X,
  triggerEvent: et
}, Symbol.toStringTag, { value: "Module" }));
function it(i = {}, t = document.documentElement) {
  if (!i) {
    console.warn("App has no components");
    return;
  }
  let e = !1;
  for (const f in i) {
    e = !0;
    break;
  }
  if (!e) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${h.get("attrPrefix")}-component`, r = b(`[${s}]`, t), o = r.length;
  for (let f = 0; f < o; f++) {
    const u = r[f];
    if (!d.get(u)) {
      const a = u.getAttribute(s);
      typeof i[a] == "function" ? n.push(z(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(s) && !d.get(t)) {
    const u = t.getAttribute(s);
    typeof i[u] == "function" ? n.push(z(t, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
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
function C(i) {
  if (!i) return;
  let t = d.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = d.get(e), i = e);
  }
  if (t) {
    const e = t.c || "Unknown";
    try {
      typeof t.y == "function" ? t.y() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    d.delete(i), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function _t(i = document.documentElement) {
  const t = b(`[${h.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    C(t[e]);
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
function H(i, t) {
  let e = l.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.n = !0), e.fn = i, e.ctx = t, e;
}
function st() {
  l.scheduled = !1;
  const i = l.reads;
  l.currentReads = i, l.reads = l.tempReads;
  for (let e = 0; e < i.length; e++) {
    const n = i[e];
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
  const t = l.writes;
  l.currentWrites = t, l.writes = l.tempWrites;
  for (let e = 0; e < t.length; e++) {
    const n = t[e];
    if (n) {
      try {
        n();
      } catch (s) {
        console.error(s);
      }
      n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n));
    }
  }
  t.length = 0, l.tempWrites = t, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && W();
}
function W() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(st));
}
function mt(i, t) {
  const e = t ? H(i, t) : i;
  return l.reads.push(e), W(), e;
}
function ot(i, t) {
  const e = t ? H(i, t) : i;
  return l.writes.push(e), W(), e;
}
function yt(i) {
  let t = l.reads.indexOf(i);
  if (t > -1) {
    const e = l.reads[t];
    return e && e.n && (e.fn = null, e.ctx = null, l.wrapperPool.push(e)), l.reads[t] = null, !0;
  }
  for (let e = 0; e < l.reads.length; e++) {
    const n = l.reads[e];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, l.wrapperPool.push(n), l.reads[e] = null, !0;
  }
  if (t = l.writes.indexOf(i), t > -1) {
    const e = l.writes[t];
    return e && e.n && (e.fn = null, e.ctx = null, l.wrapperPool.push(e)), l.writes[t] = null, !0;
  }
  for (let e = 0; e < l.writes.length; e++) {
    const n = l.writes[e];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, l.wrapperPool.push(n), l.writes[e] = null, !0;
  }
  if (l.currentReads) {
    let e = l.currentReads.indexOf(i);
    if (e > -1) {
      const n = l.currentReads[e];
      return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.currentReads[e] = null, !0;
    }
    for (let n = 0; n < l.currentReads.length; n++) {
      const s = l.currentReads[n];
      if (s && s.n && s.fn === i)
        return s.fn = null, s.ctx = null, l.wrapperPool.push(s), l.currentReads[n] = null, !0;
    }
  }
  if (l.currentWrites) {
    let e = l.currentWrites.indexOf(i);
    if (e > -1) {
      const n = l.currentWrites[e];
      return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.currentWrites[e] = null, !0;
    }
    for (let n = 0; n < l.currentWrites.length; n++) {
      const s = l.currentWrites[n];
      if (s && s.n && s.fn === i)
        return s.fn = null, s.ctx = null, l.wrapperPool.push(s), l.currentWrites[n] = null, !0;
    }
  }
  return !1;
}
let N = !1, x = !1;
const p = [], rt = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), k = rt ? "orientationchange" : "resize", g = [];
let w = null;
const R = { scroll: 0, velocity: 0 }, G = { width: 0, height: 0 }, I = [null];
let $ = !1;
const E = [];
function lt() {
  $ = !1;
  for (let i = 0; i < E.length; i++)
    E[i].g();
  E.length = 0;
}
function ft() {
  for (let i = 0; i < p.length; i++)
    p[i](R);
}
function v(i) {
  let t, e;
  w ? (t = w.scroll, e = w.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), R.scroll = t, R.velocity = e, ft();
}
function ut() {
  for (let i = 0; i < g.length; i++)
    g[i](G);
}
function T(i) {
  G.width = window.innerWidth, G.height = window.innerHeight, ut();
}
let A = null;
const m = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new Map(), Y = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), j = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map();
function ct(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = B.get(t);
  s || (s = /* @__PURE__ */ new Map(), B.set(t, s));
  let r = s.get(e);
  r || (r = /* @__PURE__ */ new Map(), s.set(e, r));
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
        const _ = c[a], M = f.callbacks.get(_.target);
        if (M) {
          I[0] = _;
          for (let P = 0; P < M.length; P++)
            M[P](I);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: o,
    elementsCount: 0
  }, o.set("data", f)), f;
}
class K {
  constructor(t, e) {
    this.element = t, d.set(this.element, this), this.c = this.constructor.name, this.i = {}, this.l = e || {}, this.d = {}, this.g = this.g.bind(this), this.N(), h.get("autoBindActions") && this.x();
  }
  get ref() {
    return this.i;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, n = b(`[${e}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < n.length; o++) {
      const f = n[o], u = f.getAttribute(e);
      let c = s[u];
      c === void 0 && (c = [], s[u] = c), c.push(f);
    }
    let r = !0;
    for (const o in t) {
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
      for (const o in t) {
        if (!Object.prototype.hasOwnProperty.call(t, o)) continue;
        const f = Array.isArray(t[o]);
        if (t[o] !== null && f && t[o].length > 0) {
          this.i[o] = t[o];
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
  set options(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.l = { ...this.l, ...t };
      return;
    }
    const e = this.element.getAttribute(`${h.get("attrPrefix")}-options`);
    let n = {};
    if (e) {
      const s = e.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
        } catch (r) {
          console.error(`Failed to parse options for component "${this.c}": ${r.message}`);
        }
    }
    this.l = {
      ...this.l,
      ...t,
      ...n
    };
  }
  get state() {
    return this.d;
  }
  set state(t) {
    console.warn("Use setState instead."), this.d = t;
  }
  m() {
    this.mount();
  }
  y() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.i = null, this.element && (d.delete(this.element), this.element = null);
      return;
    }
    if (this.t) {
      for (let t = this.t.length - 1; t >= 0; t--)
        this.unobserveScroll(this.t[t]);
      this.t = null;
    }
    if (this.e) {
      for (let t = this.e.length - 1; t >= 0; t--)
        this.unobserveWindowResize(this.e[t]);
      this.e = null;
    }
    if (this.o) {
      for (const t of this.o.keys())
        this.unobserveResize(t);
      this.o = null;
    }
    if (this.s) {
      for (const t of this.s.keys())
        this.unobserveIntersection(t);
      this.s = null;
    }
    if (this.f) {
      for (let t = 0; t < this.f.length; t += 3)
        this.f[t].removeEventListener(this.f[t + 1], this[this.f[t + 2]]);
      this.f = null;
    }
    this.i = null, this.element && (d.delete(this.element), this.element = null);
  }
  observeScroll(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (N || (N = !0, window.lenis ? (w = window.lenis, w.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(t) === -1 && this.t.push(t), p.indexOf(t) === -1 && p.push(t));
  }
  unobserveScroll(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(t);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const e = p.indexOf(t);
    e !== -1 && (p[e] = p[p.length - 1], p.pop()), p.length === 0 && N && (N = !1, w ? (w.off("scroll", v), w = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.addEventListener(k, T, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), g.indexOf(t) === -1 && g.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = g.indexOf(t);
    e !== -1 && (g[e] = g[g.length - 1], g.pop()), g.length === 0 && x && (x = !1, window.removeEventListener(k, T));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    A || (A = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const f = r[o], u = m.get(f.target);
        if (u) {
          I[0] = f;
          for (let c = 0; c < u.length; c++)
            u[c](I);
        }
      }
    }));
    let n = m.get(t);
    n || (n = [], m.set(t, n), A.observe(t)), n.indexOf(e) === -1 && n.push(e), this.o || (this.o = /* @__PURE__ */ new Map());
    let s = this.o.get(t);
    s || (s = [], this.o.set(t, s)), s.indexOf(e) === -1 && s.push(e);
  }
  unobserveResize(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.o) return;
    const n = this.o.get(t);
    if (!n) return;
    if (e) {
      const r = n.indexOf(e);
      r !== -1 && (n[r] = n[n.length - 1], n.pop());
      const o = m.get(t);
      if (o) {
        const f = o.indexOf(e);
        f !== -1 && (o[f] = o[o.length - 1], o.pop());
      }
    } else {
      const r = m.get(t);
      if (r)
        for (let o = 0; o < n.length; o++) {
          const f = n[o], u = r.indexOf(f);
          u !== -1 && (r[u] = r[r.length - 1], r.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.o.delete(t);
    const s = m.get(t);
    s && s.length === 0 && (m.delete(t), A && A.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = ct(n);
    let r = s.callbacks.get(t);
    r || (r = [], s.callbacks.set(t, r), s.observer.observe(t), s.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
    let o = this.s.get(t);
    o || (o = /* @__PURE__ */ new Map(), this.s.set(t, o));
    let f = o.get(s);
    f || (f = [], o.set(s, f)), f.indexOf(e) === -1 && f.push(e);
  }
  v(t, e) {
    const n = this.A, s = this.O;
    if (s) {
      const r = t.indexOf(s);
      if (r !== -1 && (t[r] = t[t.length - 1], t.pop(), e && e.callbacks.has(n))) {
        const o = e.callbacks.get(n), f = o.indexOf(s);
        f !== -1 && (o[f] = o[o.length - 1], o.pop());
      }
    } else {
      if (e && e.callbacks.has(n)) {
        const r = e.callbacks.get(n);
        for (let o = 0; o < t.length; o++) {
          const f = t[o], u = r.indexOf(f);
          u !== -1 && (r[u] = r[r.length - 1], r.pop());
        }
      }
      t.length = 0;
    }
    if (t.length === 0 && this.s.get(n).delete(e), e) {
      const r = e.callbacks.get(n);
      r && r.length === 0 && (e.callbacks.delete(n), e.observer.unobserve(n), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.s) return;
    const n = this.s.get(t);
    if (n) {
      this.A = t, this.O = e;
      for (const [s, r] of n.entries())
        this.v(r, s);
      this.A = null, this.O = null, n.size === 0 && this.s.delete(t);
    }
  }
  /**
   * Loads a script that is already defined in the DOM with a data-src attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} scriptId - The exact ID of the script tag
   * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
   * @return {Promise}
   */
  loadScript(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    if (e && window[e] && !(window[e] instanceof Node) && !(window[e] instanceof HTMLCollection) && !(window[e] instanceof Window))
      return Promise.resolve(window[e]);
    const n = document.getElementById(t);
    return n ? n instanceof HTMLScriptElement ? n.r ? n.r : (n.r = new Promise((s, r) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(e ? window[e] : !0);
      }, n.onerror = () => {
        o(), delete n.r, r(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (o(), r(new Error(`Script tag '${t}' has no src or data-src.`)));
    }), n.r) : Promise.reject(new Error(`Element with ID '${t}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${t}' not found.`));
  }
  /**
   * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
   * Prevents double-loading and handles race conditions.
   * @param {string} styleId - The exact ID of the link tag
   * @return {Promise}
   */
  loadStyle(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return Promise.resolve();
    const e = document.getElementById(t);
    return e ? e instanceof HTMLLinkElement ? e.r ? e.r : (e.r = new Promise((n, s) => {
      const r = () => {
        e.onload = null, e.onerror = null;
      };
      if (e.onload = () => {
        r(), n(!0);
      }, e.onerror = () => {
        r(), delete e.r, s(new Error(`Failed to load style: ${t}`));
      }, !e.href && e.hasAttribute("data-href"))
        e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
      else if (!e.href && !e.hasAttribute("data-href"))
        r(), s(new Error(`Link tag '${t}' has no href or data-href.`));
      else if (e.href && !e.hasAttribute("data-href")) {
        let o = !1;
        for (let f = 0; f < document.styleSheets.length; f++)
          if (document.styleSheets[f].href === e.href) {
            o = !0;
            break;
          }
        o && (r(), n(!0));
      }
    }), e.r) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.c}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.d[e] !== n && (this.d[e] = n, this.h || (this.h = this.w || {}, this.u = this.p || {}, E.push(this), $ || ($ = !0, ot(lt))), this.h[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = q.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, q.set(e, r)), this.u[r] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  g() {
    if (this.element) {
      if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
        let t = !1;
        for (const e in this.u) {
          t = !0;
          break;
        }
        if (t)
          for (const e in this.u) {
            if (!Object.prototype.hasOwnProperty.call(this.u, e)) continue;
            const n = this.u[e];
            this.element.getAttribute(e) !== n && this.element.setAttribute(e, n);
          }
      }
      this.stateChange(this.h), this.w = this.h, this.p = this.u;
      for (const t in this.w)
        delete this.w[t];
      if (this.p)
        for (const t in this.p)
          delete this.p[t];
      this.h = null, this.u = null;
    }
  }
  stateChange(t) {
    return t;
  }
  N() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = j.get(t);
    if (!e) {
      e = [];
      const s = Object.getOwnPropertyNames(t);
      for (let r = 0; r < s.length; r++) {
        const o = s[r];
        !Y.has(o) && !o.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, o)) == null ? void 0 : n.value) == "function" && e.push(o);
      }
      j.set(t, e);
    }
    for (let s = 0; s < e.length; s++) {
      const r = e[s];
      this[r] = this[r].bind(this);
    }
  }
}
K.prototype.x = function() {
  const i = b("[data-action]", this.element), t = i.length;
  for (let e = 0; e < t; e++) {
    const n = i[e], s = n.getAttribute("data-action");
    if (!s) continue;
    let r = 0;
    for (; r < s.length; ) {
      let o = s.indexOf(" ", r);
      if (o === -1 && (o = s.length), o > r) {
        const f = s.substring(r, o), u = f.indexOf("->");
        let c, a;
        u !== -1 ? (c = f.substring(0, u), a = f.substring(u + 2)) : (c = f, a = void 0), this[a] && typeof this[a] == "function" && !a.startsWith("_") && !Y.has(a) ? (n.addEventListener(c, this[a]), this.f || (this.f = []), this.f.push(n, c, a)) : console.warn(`Method "${a}" not found, is restricted, or is not a function in component.`);
      }
      r = o + 1;
    }
  }
};
class bt extends K {
  async require() {
  }
  m() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class at {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    h.get("log") && console.info(`Emitting event '${t}'`);
    const n = this.listeners[t];
    if (!n || n.length === 0) return;
    e && typeof e == "object" && (e.c = t);
    const s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](e);
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let s = e;
    n && (s = (r) => {
      this.off(t, s), e(r);
    }, e.a || (e.a = /* @__PURE__ */ Object.create(null)), e.a[t] = s), this.listeners[t].push(s);
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    if (!e) {
      this.listeners[t] && (this.listeners[t].length = 0);
      return;
    }
    const n = this.listeners[t];
    if (!n) return;
    let s = e;
    e.a && e.a[t] ? (s = e.a[t], delete e.a[t]) : e.E && (s = e.E);
    const r = n.indexOf(s);
    r !== -1 && n.splice(r, 1);
  }
}
const At = new at();
let y = null, S = null;
const O = [], ht = (i) => {
  i.isConnected && it(S, i);
};
function dt(i) {
  const t = `${h.get("attrPrefix")}-component`, e = typeof window < "u" && window.gia ? window.gia.components : {};
  O.length = 0;
  for (let n = 0; n < i.length; n++) {
    const s = i[n];
    for (let r = 0; r < s.removedNodes.length; r++) {
      const o = s.removedNodes[r];
      if (o.nodeType === Node.ELEMENT_NODE) {
        o.hasAttribute(t) && C(o);
        const f = b(`[${t}]`, o);
        for (let u = 0; u < f.length; u++)
          C(f[u]);
      }
    }
    if (s.addedNodes.length > 0)
      for (let r = 0; r < s.addedNodes.length; r++) {
        const o = s.addedNodes[r];
        o.nodeType === Node.ELEMENT_NODE && (o.hasAttribute(t) || o.querySelector(`[${t}]`)) && O.indexOf(o) === -1 && O.push(o);
      }
  }
  S = e;
  for (let n = 0; n < O.length; n++)
    ht(O[n]);
  S = null;
}
function U() {
  typeof document > "u" || (h.get("autoMountComponents") && !y ? (y = new MutationObserver(dt), y.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !h.get("autoMountComponents") && y && (y.disconnect(), y = null));
}
{
  const i = h.set;
  h.set = function(t, e) {
    i.call(this, t, e), t === "autoMountComponents" && U();
  };
}
typeof window < "u" && setTimeout(U, 0);
export {
  K as BaseComponent,
  bt as Component,
  yt as clear,
  h as config,
  z as createInstance,
  C as destroyInstance,
  At as eventbus,
  gt as getComponentFromElement,
  it as loadComponents,
  mt as measure,
  ot as mutate,
  _t as removeComponents,
  wt as utils
};
