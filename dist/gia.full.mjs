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
  t.priority !== void 0 && (i.m = t.priority), window.gia.components[e] = i;
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
    const o = new e(i, n);
    return h.get("log") && console.info(`Created instance of component "${t}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${t}".`, o), null;
  }
}
function _t(i) {
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
  const o = new CustomEvent(t, n);
  i.dispatchEvent(o);
}
function nt(i, t) {
  let e, n = null, o = null;
  const r = () => {
    if (clearTimeout(e), n) {
      const l = o, u = n;
      o = null, n = null, i.apply(l, u);
    }
  }, s = function() {
    n = arguments, o = this, clearTimeout(e), e = setTimeout(r, t);
  };
  return s.cancel = function() {
    clearTimeout(e), n = null, o = null;
  }, s;
}
const mt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
  for (const l in i) {
    e = !0;
    break;
  }
  if (!e) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${h.get("attrPrefix")}-component`, r = b(`[${o}]`, t), s = r.length;
  for (let l = 0; l < s; l++) {
    const u = r[l];
    if (!d.get(u)) {
      const a = u.getAttribute(o);
      typeof i[a] == "function" ? n.push(z(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !d.get(t)) {
    const u = t.getAttribute(o);
    typeof i[u] == "function" ? n.push(z(t, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  n.length > 1 && n.sort((l, u) => {
    if (!l) return 1;
    if (!u) return -1;
    const c = l.constructor.m ?? l.constructor.priority ?? 0;
    return (u.constructor.m ?? u.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const u = n[l];
    u && u.y();
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
    const e = t.a || "Unknown";
    try {
      typeof t.b == "function" ? t.b() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    d.delete(i), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function yt(i = document.documentElement) {
  const t = b(`[${h.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    C(t[e]);
}
const f = (typeof window < "u" ? window.A : null) || {
  reads: [],
  writes: [],
  scheduled: !1,
  currentReads: null,
  currentWrites: null
};
f.tempReads || (f.tempReads = []);
f.tempWrites || (f.tempWrites = []);
f.wrapperPool || (f.wrapperPool = []);
typeof window < "u" && !window.A && (window.A = f);
function H(i, t) {
  let e = f.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.n = !0), e.fn = i, e.ctx = t, e;
}
function st() {
  f.scheduled = !1;
  const i = f.reads;
  f.currentReads = i, f.reads = f.tempReads;
  for (let e = 0; e < i.length; e++) {
    const n = i[e];
    if (n) {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
      n.n && (n.fn = null, n.ctx = null, f.wrapperPool.push(n));
    }
  }
  i.length = 0, f.tempReads = i, f.currentReads = null;
  const t = f.writes;
  f.currentWrites = t, f.writes = f.tempWrites;
  for (let e = 0; e < t.length; e++) {
    const n = t[e];
    if (n) {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
      n.n && (n.fn = null, n.ctx = null, f.wrapperPool.push(n));
    }
  }
  t.length = 0, f.tempWrites = t, f.currentWrites = null, (f.reads.length > 0 || f.writes.length > 0) && W();
}
function W() {
  !f.scheduled && typeof window < "u" && (f.scheduled = !0, window.requestAnimationFrame(st));
}
function bt(i, t) {
  const e = t ? H(i, t) : i;
  return f.reads.push(e), W(), e;
}
function ot(i, t) {
  const e = t ? H(i, t) : i;
  return f.writes.push(e), W(), e;
}
function At(i) {
  let t = f.reads.indexOf(i);
  if (t > -1) {
    const e = f.reads[t];
    return e && e.n && (e.fn = null, e.ctx = null, f.wrapperPool.push(e)), f.reads[t] = null, !0;
  }
  for (let e = 0; e < f.reads.length; e++) {
    const n = f.reads[e];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, f.wrapperPool.push(n), f.reads[e] = null, !0;
  }
  if (t = f.writes.indexOf(i), t > -1) {
    const e = f.writes[t];
    return e && e.n && (e.fn = null, e.ctx = null, f.wrapperPool.push(e)), f.writes[t] = null, !0;
  }
  for (let e = 0; e < f.writes.length; e++) {
    const n = f.writes[e];
    if (n && n.n && n.fn === i)
      return n.fn = null, n.ctx = null, f.wrapperPool.push(n), f.writes[e] = null, !0;
  }
  if (f.currentReads) {
    let e = f.currentReads.indexOf(i);
    if (e > -1) {
      const n = f.currentReads[e];
      return n && n.n && (n.fn = null, n.ctx = null, f.wrapperPool.push(n)), f.currentReads[e] = null, !0;
    }
    for (let n = 0; n < f.currentReads.length; n++) {
      const o = f.currentReads[n];
      if (o && o.n && o.fn === i)
        return o.fn = null, o.ctx = null, f.wrapperPool.push(o), f.currentReads[n] = null, !0;
    }
  }
  if (f.currentWrites) {
    let e = f.currentWrites.indexOf(i);
    if (e > -1) {
      const n = f.currentWrites[e];
      return n && n.n && (n.fn = null, n.ctx = null, f.wrapperPool.push(n)), f.currentWrites[e] = null, !0;
    }
    for (let n = 0; n < f.currentWrites.length; n++) {
      const o = f.currentWrites[n];
      if (o && o.n && o.fn === i)
        return o.fn = null, o.ctx = null, f.wrapperPool.push(o), f.currentWrites[n] = null, !0;
    }
  }
  return !1;
}
let N = !1, x = !1;
const p = [], rt = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), T = rt ? "orientationchange" : "resize", g = [];
let w = null;
const R = { scroll: 0, velocity: 0 }, G = { width: 0, height: 0 }, v = [null], lt = function(i, t) {
  this.unobserveResize(t);
}, ft = function(i, t) {
  this.unobserveIntersection(t);
};
let $ = !1;
const I = [];
function ut() {
  $ = !1;
  for (let i = 0; i < I.length; i++)
    I[i].w();
  I.length = 0;
}
function ct() {
  for (let i = p.length - 1; i >= 0; i--)
    p[i](R);
}
function E(i) {
  let t, e;
  w ? (t = w.scroll, e = w.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), R.scroll = t, R.velocity = e, ct();
}
function at() {
  for (let i = g.length - 1; i >= 0; i--)
    g[i](G);
}
function j(i) {
  G.width = window.innerWidth, G.height = window.innerHeight, at();
}
let A = null;
const m = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new Map(), Y = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map();
function ht(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = B.get(t);
  o || (o = /* @__PURE__ */ new Map(), B.set(t, o));
  let r = o.get(e);
  r || (r = /* @__PURE__ */ new Map(), o.set(e, r));
  let s = r;
  if (Array.isArray(n)) {
    let u = s.get("array");
    u || (u = /* @__PURE__ */ new Map(), s.set("array", u)), s = u;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let _ = s.get(a);
      _ || (_ = /* @__PURE__ */ new Map(), s.set(a, _)), s = _;
    }
  } else {
    let u = s.get("number");
    u || (u = /* @__PURE__ */ new Map(), s.set("number", u)), s = u;
    let c = s.get(n);
    c || (c = /* @__PURE__ */ new Map(), s.set(n, c)), s = c;
  }
  let l = s.get("data");
  return l || (l = {
    observer: new IntersectionObserver((c) => {
      for (let a = 0; a < c.length; a++) {
        const _ = c[a], M = l.callbacks.get(_.target);
        if (M) {
          v[0] = _;
          for (let P = M.length - 1; P >= 0; P--)
            M[P](v);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: s,
    elementsCount: 0
  }, s.set("data", l)), l;
}
class K {
  constructor(t, e) {
    this.element = t, d.set(this.element, this), this.a = this.constructor.name, this.i = {}, this.l = e || {}, this.p = {}, this.w = this.w.bind(this), this.x(), h.get("autoBindActions") && this.E();
  }
  get ref() {
    return this.i;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, n = b(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const l = n[s], u = l.getAttribute(e);
      let c = o[u];
      c === void 0 && (c = [], o[u] = c), c.push(l);
    }
    let r = !0;
    for (const s in t) {
      r = !1;
      break;
    }
    if (r)
      for (const s in o) {
        const l = s.indexOf(":");
        if (l !== -1) {
          const u = s.substring(0, l), c = s.substring(l + 1);
          u === this.a && !this.i[c] && (this.i[c] = o[s]);
        } else
          this.i[s] || (this.i[s] = o[s]);
      }
    else {
      this.i = {};
      for (const s in t) {
        if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
        const l = Array.isArray(t[s]);
        if (t[s] !== null && l && t[s].length > 0) {
          this.i[s] = t[s];
          continue;
        }
        const u = `${this.a}:${s}`;
        let c = o[u] || [];
        c.length === 0 && (c = o[s] || []), this.i[s] = l ? c : c[0] ?? null;
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
      const o = e.trim();
      if (o.startsWith("{") || o.startsWith("["))
        try {
          n = JSON.parse(o);
        } catch (r) {
          console.error(`Failed to parse options for component "${this.a}": ${r.message}`);
        }
    }
    this.l = {
      ...this.l,
      ...t,
      ...n
    };
  }
  get state() {
    return this.p;
  }
  set state(t) {
    console.warn("Use setState instead."), this.p = t;
  }
  y() {
    this.mount();
  }
  b() {
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
    if (this.o && (this.o.forEach(lt, this), this.o = null), this.s && (this.s.forEach(ft, this), this.s = null), this.f) {
      for (let t = 0; t < this.f.length; t += 3)
        this.f[t].removeEventListener(this.f[t + 1], this[this.f[t + 2]]);
      this.f = null;
    }
    this.i = null, this.element && (d.delete(this.element), this.element = null);
  }
  observeScroll(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (N || (N = !0, window.lenis ? (w = window.lenis, w.on("scroll", E)) : window.addEventListener("scroll", E, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(t) === -1 && this.t.push(t), p.indexOf(t) === -1 && p.push(t));
  }
  unobserveScroll(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(t);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const e = p.indexOf(t);
    e !== -1 && (p[e] = p[p.length - 1], p.pop()), p.length === 0 && N && (N = !1, w ? (w.off("scroll", E), w = null) : window.removeEventListener("scroll", E));
  }
  observeWindowResize(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.addEventListener(T, j, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), g.indexOf(t) === -1 && g.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = g.indexOf(t);
    e !== -1 && (g[e] = g[g.length - 1], g.pop()), g.length === 0 && x && (x = !1, window.removeEventListener(T, j));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    A || (A = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], u = m.get(l.target);
        if (u) {
          v[0] = l;
          for (let c = u.length - 1; c >= 0; c--)
            u[c](v);
        }
      }
    }));
    let n = m.get(t);
    n || (n = [], m.set(t, n), A.observe(t)), n.indexOf(e) === -1 && n.push(e), this.o || (this.o = /* @__PURE__ */ new Map());
    let o = this.o.get(t);
    o || (o = [], this.o.set(t, o)), o.indexOf(e) === -1 && o.push(e);
  }
  unobserveResize(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.o) return;
    const n = this.o.get(t);
    if (!n) return;
    if (e) {
      const r = n.indexOf(e);
      r !== -1 && (n[r] = n[n.length - 1], n.pop());
      const s = m.get(t);
      if (s) {
        const l = s.indexOf(e);
        l !== -1 && (s[l] = s[s.length - 1], s.pop());
      }
    } else {
      const r = m.get(t);
      if (r)
        for (let s = 0; s < n.length; s++) {
          const l = n[s], u = r.indexOf(l);
          u !== -1 && (r[u] = r[r.length - 1], r.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.o.delete(t);
    const o = m.get(t);
    o && o.length === 0 && (m.delete(t), A && A.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const o = ht(n);
    let r = o.callbacks.get(t);
    r || (r = [], o.callbacks.set(t, r), o.observer.observe(t), o.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
    let s = this.s.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.s.set(t, s));
    let l = s.get(o);
    l || (l = [], s.set(o, l)), l.indexOf(e) === -1 && l.push(e);
  }
  I(t, e) {
    const n = this.O, o = this.N;
    if (o) {
      const r = t.indexOf(o);
      if (r !== -1 && (t[r] = t[t.length - 1], t.pop(), e && e.callbacks.has(n))) {
        const s = e.callbacks.get(n), l = s.indexOf(o);
        l !== -1 && (s[l] = s[s.length - 1], s.pop());
      }
    } else {
      if (e && e.callbacks.has(n)) {
        const r = e.callbacks.get(n);
        for (let s = 0; s < t.length; s++) {
          const l = t[s], u = r.indexOf(l);
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
    n && (this.O = t, this.N = e, n.forEach(this.I, this), this.O = null, this.N = null, n.size === 0 && this.s.delete(t));
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
    return n ? n instanceof HTMLScriptElement ? n.r ? n.r : (n.r = new Promise((o, r) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(e ? window[e] : !0);
      }, n.onerror = () => {
        s(), delete n.r, r(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), r(new Error(`Script tag '${t}' has no src or data-src.`)));
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
    return e ? e instanceof HTMLLinkElement ? e.r ? e.r : (e.r = new Promise((n, o) => {
      const r = () => {
        e.onload = null, e.onerror = null;
      };
      if (e.onload = () => {
        r(), n(!0);
      }, e.onerror = () => {
        r(), delete e.r, o(new Error(`Failed to load style: ${t}`));
      }, !e.href && e.hasAttribute("data-href"))
        e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
      else if (!e.href && !e.hasAttribute("data-href"))
        r(), o(new Error(`Link tag '${t}' has no href or data-href.`));
      else if (e.href && !e.hasAttribute("data-href")) {
        let s = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === e.href) {
            s = !0;
            break;
          }
        s && (r(), n(!0));
      }
    }), e.r) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.a}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.p[e] !== n && (this.p[e] = n, this.d || (this.d = this._ || {}, this.c = this.g || {}, I.push(this), $ || ($ = !0, ot(ut))), this.d[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = q.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, q.set(e, r)), this.c[r] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  w() {
    if (this.element) {
      if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
        let t = !1;
        for (const e in this.c) {
          t = !0;
          break;
        }
        if (t)
          for (const e in this.c) {
            if (!Object.prototype.hasOwnProperty.call(this.c, e)) continue;
            const n = this.c[e];
            this.element.getAttribute(e) !== n && this.element.setAttribute(e, n);
          }
      }
      this.stateChange(this.d), this._ = this.d, this.g = this.c;
      for (const t in this._)
        delete this._[t];
      if (this.g)
        for (const t in this.g)
          delete this.g[t];
      this.d = null, this.c = null;
    }
  }
  stateChange(t) {
    return t;
  }
  x() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = k.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !Y.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      k.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const r = e[o];
      this[r] = this[r].bind(this);
    }
  }
}
K.prototype.E = function() {
  const i = b("[data-action]", this.element), t = i.length;
  for (let e = 0; e < t; e++) {
    const n = i[e], o = n.getAttribute("data-action");
    if (!o) continue;
    let r = 0;
    for (; r < o.length; ) {
      let s = o.indexOf(" ", r);
      if (s === -1 && (s = o.length), s > r) {
        const l = o.substring(r, s), u = l.indexOf("->");
        let c, a;
        u !== -1 ? (c = l.substring(0, u), a = l.substring(u + 2)) : (c = l, a = void 0), this[a] && typeof this[a] == "function" && !a.startsWith("_") && !Y.has(a) ? (n.addEventListener(c, this[a]), this.f || (this.f = []), this.f.push(n, c, a)) : console.warn(`Method "${a}" not found, is restricted, or is not a function in component.`);
      }
      r = s + 1;
    }
  }
};
class Ot extends K {
  async require() {
  }
  y() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class dt {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null), this.u = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    h.get("log") && console.info(`Emitting event '${t}'`);
    const n = this.listeners[t];
    if (!n || n.length === 0) return;
    e && typeof e == "object" && (e.a = t), this.u[t] = (this.u[t] || 0) + 1;
    const o = n.length;
    try {
      for (let r = 0; r < o; r++) {
        const s = n[r];
        s && s(e);
      }
    } finally {
      if (this.u[t]--, this.u[t] === 0) {
        let r = 0;
        for (let s = 0; s < n.length; s++)
          n[s] !== null && (n[r++] = n[s]);
        n.length = r;
      }
    }
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let o = e;
    n && (o = (r) => {
      this.off(t, o), e(r);
    }, e.h || (e.h = /* @__PURE__ */ Object.create(null)), e.h[t] = o), this.listeners[t].push(o);
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    if (!e) {
      const s = this.listeners[t];
      if (s)
        if (this.u && this.u[t] > 0)
          for (let l = 0; l < s.length; l++)
            s[l] = null;
        else
          s.length = 0;
      return;
    }
    const n = this.listeners[t];
    if (!n) return;
    let o = e;
    e.h && e.h[t] ? (o = e.h[t], delete e.h[t]) : e.v && (o = e.v);
    const r = n.indexOf(o);
    r !== -1 && (this.u && this.u[t] > 0 ? n[r] = null : n.splice(r, 1));
  }
}
const Nt = new dt();
let y = null, S = null;
const O = [], pt = (i) => {
  i.isConnected && it(S, i);
};
function gt(i) {
  const t = `${h.get("attrPrefix")}-component`, e = typeof window < "u" && window.gia ? window.gia.components : {};
  O.length = 0;
  for (let n = 0; n < i.length; n++) {
    const o = i[n];
    for (let r = 0; r < o.removedNodes.length; r++) {
      const s = o.removedNodes[r];
      if (s.nodeType === Node.ELEMENT_NODE) {
        s.hasAttribute(t) && C(s);
        const l = b(`[${t}]`, s);
        for (let u = 0; u < l.length; u++)
          C(l[u]);
      }
    }
    if (o.addedNodes.length > 0)
      for (let r = 0; r < o.addedNodes.length; r++) {
        const s = o.addedNodes[r];
        s.nodeType === Node.ELEMENT_NODE && (s.hasAttribute(t) || s.querySelector(`[${t}]`)) && O.indexOf(s) === -1 && O.push(s);
      }
  }
  S = e;
  for (let n = 0; n < O.length; n++)
    pt(O[n]);
  S = null;
}
function U() {
  typeof document > "u" || (h.get("autoMountComponents") && !y ? (y = new MutationObserver(gt), y.observe(document.body, {
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
  Ot as Component,
  At as clear,
  h as config,
  z as createInstance,
  C as destroyInstance,
  Nt as eventbus,
  _t as getComponentFromElement,
  it as loadComponents,
  bt as measure,
  ot as mutate,
  yt as removeComponents,
  mt as utils
};
