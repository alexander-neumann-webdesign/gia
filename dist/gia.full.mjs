var J = Object.defineProperty;
var Q = (i, e, t) => e in i ? J(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var L = (i, e, t) => Q(i, typeof e != "symbol" ? e + "" : e, t);
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
  set(e, t) {
    this.l[e] = t;
  }
  get(e) {
    return this.l[e];
  }
}
const h = new V(), d = /* @__PURE__ */ new WeakMap();
function z(i, e, t, n) {
  if (d.has(i))
    return console.warn(`Component "${e}" already exists.`), d.get(i);
  try {
    const s = new t(i, n);
    return h.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function _t(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : d.get(i) || null;
}
function Z(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function b(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function X(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function F(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function D(i, e) {
  return F(i, e, "remove");
}
function tt(i, e) {
  return F(i, e, "add");
}
function et(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  i.dispatchEvent(s);
}
function nt(i, e) {
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
function it(i = {}, e = document.documentElement) {
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
  const n = [], s = `${h.get("attrPrefix")}-component`, r = b(`[${s}]`, e), o = r.length;
  for (let f = 0; f < o; f++) {
    const u = r[f];
    if (!d.get(u)) {
      const a = u.getAttribute(s);
      typeof i[a] == "function" ? n.push(z(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !d.get(e)) {
    const u = e.getAttribute(s);
    typeof i[u] == "function" ? n.push(z(e, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
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
function yt(i = document.documentElement) {
  const e = b(`[${h.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    C(e[t]);
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
function H(i, e) {
  let t = l.wrapperPool.pop();
  return t || (t = function() {
    t.fn.call(t.ctx);
  }, t.n = !0), t.fn = i, t.ctx = e, t;
}
function st() {
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
  e.length = 0, l.tempWrites = e, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && W();
}
function W() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(st));
}
function bt(i, e) {
  const t = e ? H(i, e) : i;
  return l.reads.push(t), W(), t;
}
function ot(i, e) {
  const t = e ? H(i, e) : i;
  return l.writes.push(t), W(), t;
}
function At(i) {
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
let N = !1, x = !1;
const p = [], rt = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), T = rt ? "orientationchange" : "resize", g = [];
let w = null;
const R = { scroll: 0, velocity: 0 }, G = { width: 0, height: 0 }, I = [null], lt = function(i, e) {
  this.unobserveResize(e);
}, ft = function(i, e) {
  this.unobserveIntersection(e);
};
let $ = !1;
const E = [];
function ut() {
  $ = !1;
  for (let i = 0; i < E.length; i++)
    E[i].g();
  E.length = 0;
}
function ct() {
  for (let i = 0; i < p.length; i++)
    p[i](R);
}
function v(i) {
  let e, t;
  w ? (e = w.scroll, t = w.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), R.scroll = e, R.velocity = t, ct();
}
function at() {
  for (let i = 0; i < g.length; i++)
    g[i](G);
}
function B(i) {
  G.width = window.innerWidth, G.height = window.innerHeight, at();
}
let A = null;
const m = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new Map(), Y = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map();
function ht(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = j.get(e);
  s || (s = /* @__PURE__ */ new Map(), j.set(e, s));
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
  constructor(e, t) {
    this.element = e, d.set(this.element, this), this.c = this.constructor.name, this.i = {}, this.l = t || {}, this.d = {}, this.g = this.g.bind(this), this.N(), h.get("autoBindActions") && this.x();
  }
  get ref() {
    return this.i;
  }
  set ref(e) {
    const t = `${h.get("attrPrefix")}-ref`, n = b(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
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
    if (this.t && (this.t.forEach(this.unobserveScroll, this), this.t = null), this.e && (this.e.forEach(this.unobserveWindowResize, this), this.e = null), this.o && (this.o.forEach(lt, this), this.o = null), this.s && (this.s.forEach(ft, this), this.s = null), this.f) {
      for (let e = 0; e < this.f.length; e += 3)
        this.f[e].removeEventListener(this.f[e + 1], this[this.f[e + 2]]);
      this.f = null;
    }
    this.i = null, this.element && (d.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (N || (N = !0, window.lenis ? (w = window.lenis, w.on("scroll", v)) : window.addEventListener("scroll", v, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(e) === -1 && this.t.push(e), p.indexOf(e) === -1 && p.push(e));
  }
  unobserveScroll(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(e);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const t = p.indexOf(e);
    t !== -1 && (p[t] = p[p.length - 1], p.pop()), p.length === 0 && N && (N = !1, w ? (w.off("scroll", v), w = null) : window.removeEventListener("scroll", v));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.addEventListener(T, B, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(e) === -1 && this.e.push(e), g.indexOf(e) === -1 && g.push(e));
  }
  unobserveWindowResize(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(e);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const t = g.indexOf(e);
    t !== -1 && (g[t] = g[g.length - 1], g.pop()), g.length === 0 && x && (x = !1, window.removeEventListener(T, B));
  }
  observeResize(e, t) {
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
    let n = m.get(e);
    n || (n = [], m.set(e, n), A.observe(e)), n.indexOf(t) === -1 && n.push(t), this.o || (this.o = /* @__PURE__ */ new Map());
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
    s && s.length === 0 && (m.delete(e), A && A.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = ht(n);
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
        if (this.d[t] !== n && (this.d[t] = n, this.h || (this.h = this.w || {}, this.u = this.p || {}, E.push(this), $ || ($ = !0, ot(ut))), this.h[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = q.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, q.set(t, r)), this.u[r] = s === "boolean" ? n ? "true" : "false" : n;
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
    let t = k.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let r = 0; r < s.length; r++) {
        const o = s[r];
        !Y.has(o) && !o.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, o)) == null ? void 0 : n.value) == "function" && t.push(o);
      }
      k.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const r = t[s];
      this[r] = this[r].bind(this);
    }
  }
}
K.prototype.x = function() {
  const i = b("[data-action]", this.element), e = i.length;
  for (let t = 0; t < e; t++) {
    const n = i[t], s = n.getAttribute("data-action");
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
class Ot extends K {
  async require() {
  }
  m() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class dt {
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
      this.listeners[e] = [];
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
const Nt = new dt();
let y = null, S = null;
const O = [], pt = (i) => {
  i.isConnected && it(S, i);
};
function gt(i) {
  const e = `${h.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  O.length = 0;
  for (let n = 0; n < i.length; n++) {
    const s = i[n];
    for (let r = 0; r < s.removedNodes.length; r++) {
      const o = s.removedNodes[r];
      if (o.nodeType === Node.ELEMENT_NODE) {
        o.hasAttribute(e) && C(o);
        const f = b(`[${e}]`, o);
        for (let u = 0; u < f.length; u++)
          C(f[u]);
      }
    }
    if (s.addedNodes.length > 0)
      for (let r = 0; r < s.addedNodes.length; r++) {
        const o = s.addedNodes[r];
        o.nodeType === Node.ELEMENT_NODE && O.indexOf(o) === -1 && O.push(o);
      }
  }
  S = t;
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
  h.set = function(e, t) {
    i.call(this, e, t), e === "autoMountComponents" && U();
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
