var T = Object.defineProperty;
var q = (i, t, e) => t in i ? T(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var G = (i, t, e) => q(i, typeof t != "symbol" ? t + "" : t, e);
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
class F {
  constructor() {
    G(this, "l", {
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
const w = new F(), h = /* @__PURE__ */ new WeakMap();
function W(i, t, e, n) {
  if (h.has(i))
    return console.warn(`Component "${t}" already exists.`), h.get(i);
  try {
    const s = new e(i, n);
    return w.get("log") && console.info(`Created instance of component "${t}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${t}".`, s), null;
  }
}
function ct(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : h.get(i) || null;
}
function H(i, t = document) {
  return typeof i != "string" ? i : t.querySelector(i);
}
function v(i, t = document) {
  return typeof i != "string" ? i : t.querySelectorAll(i);
}
function Y(i, t, e = null) {
  e === null ? i.classList.toggle(t) : i.classList.toggle(t, !!e);
}
function B(i, t, e) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[e](t);
  else
    i.classList[e](t);
  return i;
}
function K(i, t) {
  return B(i, t, "remove");
}
function U(i, t) {
  return B(i, t, "add");
}
function J(i, t, e = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = e;
  const s = new CustomEvent(t, n);
  i.dispatchEvent(s);
}
function Q(i, t) {
  let e, n = null, s = null;
  const o = () => {
    if (clearTimeout(e), n) {
      const f = s, u = n;
      s = null, n = null, i.apply(f, u);
    }
  }, r = function() {
    n = arguments, s = this, clearTimeout(e), e = setTimeout(o, t);
  };
  return r.cancel = function() {
    clearTimeout(e), n = null, s = null;
  }, r;
}
const at = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: U,
  debounce: Q,
  query: H,
  queryAll: v,
  removeClass: K,
  toggleClass: Y,
  triggerEvent: J
}, Symbol.toStringTag, { value: "Module" }));
function ht(i = {}, t = document.documentElement) {
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
  const n = [], s = `${w.get("attrPrefix")}-component`, o = v(`[${s}]`, t), r = o.length;
  for (let f = 0; f < r; f++) {
    const u = o[f];
    if (!h.get(u)) {
      const a = u.getAttribute(s);
      typeof i[a] == "function" ? n.push(W(u, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(s) && !h.get(t)) {
    const u = t.getAttribute(s);
    typeof i[u] == "function" ? n.push(W(t, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
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
  let t = h.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = h.get(e), i = e);
  }
  if (t) {
    const e = t.u || "Unknown";
    try {
      typeof t.y == "function" ? t.y() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    h.delete(i), t.element && (t.element = null), w.get("log") && console.info(`Removed component "${e}".`);
  }
}
function dt(i = document.documentElement) {
  const t = v(`[${w.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    V(t[e]);
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
function j(i, t) {
  let e = l.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.n = !0), e.fn = i, e.ctx = t, e;
}
function Z() {
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
  t.length = 0, l.tempWrites = t, l.currentWrites = null, (l.reads.length > 0 || l.writes.length > 0) && C();
}
function C() {
  !l.scheduled && typeof window < "u" && (l.scheduled = !0, window.requestAnimationFrame(Z));
}
function pt(i, t) {
  const e = t ? j(i, t) : i;
  return l.reads.push(e), C(), e;
}
function X(i, t) {
  const e = t ? j(i, t) : i;
  return l.writes.push(e), C(), e;
}
function gt(i) {
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
let A = !1, b = !1;
const d = [], D = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), $ = D ? "orientationchange" : "resize", p = [];
let g = null;
const P = { scroll: 0, velocity: 0 }, M = { width: 0, height: 0 }, N = [null], tt = function(i, t) {
  this.unobserveResize(t);
}, et = function(i, t) {
  this.unobserveIntersection(t);
};
let R = !1;
const x = [];
function nt() {
  R = !1;
  for (let i = 0; i < x.length; i++)
    x[i].g();
  x.length = 0;
}
function it() {
  for (let i = 0; i < d.length; i++)
    d[i](P);
}
function O(i) {
  let t, e;
  g ? (t = g.scroll, e = g.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), P.scroll = t, P.velocity = e, it();
}
function st() {
  for (let i = 0; i < p.length; i++)
    p[i](M);
}
function S(i) {
  M.width = window.innerWidth, M.height = window.innerHeight, st();
}
let y = null;
const m = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new Map(), rt = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), L = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new Map();
function ot(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = z.get(t);
  s || (s = /* @__PURE__ */ new Map(), z.set(t, s));
  let o = s.get(e);
  o || (o = /* @__PURE__ */ new Map(), s.set(e, o));
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
        const _ = c[a], I = f.callbacks.get(_.target);
        if (I) {
          N[0] = _;
          for (let E = 0; E < I.length; E++)
            I[E](N);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: r,
    elementsCount: 0
  }, r.set("data", f)), f;
}
class lt {
  constructor(t, e) {
    this.element = t, h.set(this.element, this), this.u = this.constructor.name, this.i = {}, this.l = e || {}, this.d = {}, this.g = this.g.bind(this), this.x();
  }
  get ref() {
    return this.i;
  }
  set ref(t) {
    const e = `${w.get("attrPrefix")}-ref`, n = v(`[${e}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let r = 0; r < n.length; r++) {
      const f = n[r], u = f.getAttribute(e);
      let c = s[u];
      c === void 0 && (c = [], s[u] = c), c.push(f);
    }
    let o = !0;
    for (const r in t) {
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
      for (const r in t) {
        if (!Object.prototype.hasOwnProperty.call(t, r)) continue;
        const f = Array.isArray(t[r]);
        if (t[r] !== null && f && t[r].length > 0) {
          this.i[r] = t[r];
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
  set options(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.l = { ...this.l, ...t };
      return;
    }
    const e = this.element.getAttribute(`${w.get("attrPrefix")}-options`);
    let n = {};
    if (e) {
      const s = e.trim();
      if (s.startsWith("{") || s.startsWith("["))
        try {
          n = JSON.parse(s);
        } catch (o) {
          console.error(`Failed to parse options for component "${this.u}": ${o.message}`);
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
      this.i = null, this.element && (h.delete(this.element), this.element = null);
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
    if (this.r && (this.r.forEach(tt, this), this.r = null), this.s && (this.s.forEach(et, this), this.s = null), this.a) {
      for (let t = 0; t < this.a.length; t += 3)
        this.a[t].removeEventListener(this.a[t + 1], this[this.a[t + 2]]);
      this.a = null;
    }
    this.i = null, this.element && (h.delete(this.element), this.element = null);
  }
  observeScroll(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (A || (A = !0, window.lenis ? (g = window.lenis, g.on("scroll", O)) : window.addEventListener("scroll", O, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(t) === -1 && this.t.push(t), d.indexOf(t) === -1 && d.push(t));
  }
  unobserveScroll(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(t);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const e = d.indexOf(t);
    e !== -1 && (d[e] = d[d.length - 1], d.pop()), d.length === 0 && A && (A = !1, g ? (g.off("scroll", O), g = null) : window.removeEventListener("scroll", O));
  }
  observeWindowResize(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.addEventListener($, S, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), p.indexOf(t) === -1 && p.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = p.indexOf(t);
    e !== -1 && (p[e] = p[p.length - 1], p.pop()), p.length === 0 && b && (b = !1, window.removeEventListener($, S));
  }
  observeResize(t, e) {
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
    let n = m.get(t);
    n || (n = [], m.set(t, n), y.observe(t)), n.indexOf(e) === -1 && n.push(e), this.r || (this.r = /* @__PURE__ */ new Map());
    let s = this.r.get(t);
    s || (s = [], this.r.set(t, s)), s.indexOf(e) === -1 && s.push(e);
  }
  unobserveResize(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.r) return;
    const n = this.r.get(t);
    if (!n) return;
    if (e) {
      const o = n.indexOf(e);
      o !== -1 && (n[o] = n[n.length - 1], n.pop());
      const r = m.get(t);
      if (r) {
        const f = r.indexOf(e);
        f !== -1 && (r[f] = r[r.length - 1], r.pop());
      }
    } else {
      const o = m.get(t);
      if (o)
        for (let r = 0; r < n.length; r++) {
          const f = n[r], u = o.indexOf(f);
          u !== -1 && (o[u] = o[o.length - 1], o.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.r.delete(t);
    const s = m.get(t);
    s && s.length === 0 && (m.delete(t), y && y.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = ot(n);
    let o = s.callbacks.get(t);
    o || (o = [], s.callbacks.set(t, o), s.observer.observe(t), s.elementsCount++), o.indexOf(e) === -1 && o.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
    let r = this.s.get(t);
    r || (r = /* @__PURE__ */ new Map(), this.s.set(t, r));
    let f = r.get(s);
    f || (f = [], r.set(s, f)), f.indexOf(e) === -1 && f.push(e);
  }
  N(t, e) {
    const n = this.b, s = this.O;
    if (s) {
      const o = t.indexOf(s);
      if (o !== -1 && (t[o] = t[t.length - 1], t.pop(), e && e.callbacks.has(n))) {
        const r = e.callbacks.get(n), f = r.indexOf(s);
        f !== -1 && (r[f] = r[r.length - 1], r.pop());
      }
    } else {
      if (e && e.callbacks.has(n)) {
        const o = e.callbacks.get(n);
        for (let r = 0; r < t.length; r++) {
          const f = t[r], u = o.indexOf(f);
          u !== -1 && (o[u] = o[o.length - 1], o.pop());
        }
      }
      t.length = 0;
    }
    if (t.length === 0 && this.s.get(n).delete(e), e) {
      const o = e.callbacks.get(n);
      o && o.length === 0 && (e.callbacks.delete(n), e.observer.unobserve(n), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.s) return;
    const n = this.s.get(t);
    n && (this.b = t, this.O = e, n.forEach(this.N, this), this.b = null, this.O = null, n.size === 0 && this.s.delete(t));
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
    return n ? n instanceof HTMLScriptElement ? n.o ? n.o : (n.o = new Promise((s, o) => {
      const r = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        r(), s(e ? window[e] : !0);
      }, n.onerror = () => {
        r(), delete n.o, o(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (r(), o(new Error(`Script tag '${t}' has no src or data-src.`)));
    }), n.o) : Promise.reject(new Error(`Element with ID '${t}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${t}' not found.`));
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
    return e ? e instanceof HTMLLinkElement ? e.o ? e.o : (e.o = new Promise((n, s) => {
      const o = () => {
        e.onload = null, e.onerror = null;
      };
      if (e.onload = () => {
        o(), n(!0);
      }, e.onerror = () => {
        o(), delete e.o, s(new Error(`Failed to load style: ${t}`));
      }, !e.href && e.hasAttribute("data-href"))
        e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
      else if (!e.href && !e.hasAttribute("data-href"))
        o(), s(new Error(`Link tag '${t}' has no href or data-href.`));
      else if (e.href && !e.hasAttribute("data-href")) {
        let r = !1;
        for (let f = 0; f < document.styleSheets.length; f++)
          if (document.styleSheets[f].href === e.href) {
            r = !0;
            break;
          }
        r && (o(), n(!0));
      }
    }), e.o) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${w.get("attrPrefix")}-ref="${e ? `${this.u}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.d[e] !== n && (this.d[e] = n, this.h || (this.h = this.w || {}, this.f = this.p || {}, x.push(this), R || (R = !0, X(nt))), this.h[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let o = k.get(e);
            o || (o = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, k.set(e, o)), this.f[o] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  g() {
    if (this.element) {
      if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
        let t = !1;
        for (const e in this.f) {
          t = !0;
          break;
        }
        if (t)
          for (const e in this.f) {
            if (!Object.prototype.hasOwnProperty.call(this.f, e)) continue;
            const n = this.f[e];
            this.element.getAttribute(e) !== n && this.element.setAttribute(e, n);
          }
      }
      this.stateChange(this.h), this.w = this.h, this.p = this.f;
      for (const t in this.w)
        delete this.w[t];
      if (this.p)
        for (const t in this.p)
          delete this.p[t];
      this.h = null, this.f = null;
    }
  }
  stateChange(t) {
    return t;
  }
  x() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = L.get(t);
    if (!e) {
      e = [];
      const s = Object.getOwnPropertyNames(t);
      for (let o = 0; o < s.length; o++) {
        const r = s[o];
        !rt.has(r) && !r.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, r)) == null ? void 0 : n.value) == "function" && e.push(r);
      }
      L.set(t, e);
    }
    for (let s = 0; s < e.length; s++) {
      const o = e[s];
      this[o] = this[o].bind(this);
    }
  }
}
class wt extends lt {
  async require() {
  }
  m() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class ft {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    w.get("log") && console.info(`Emitting event '${t}'`);
    const n = this.listeners[t];
    if (!n || n.length === 0) return;
    e && typeof e == "object" && (e.u = t);
    const s = n.slice();
    for (let o = 0; o < s.length; o++)
      s[o](e);
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let s = e;
    n && (s = (o) => {
      this.off(t, s), e(o);
    }, e.c || (e.c = /* @__PURE__ */ Object.create(null)), e.c[t] = s), this.listeners[t].push(s);
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    if (!e) {
      this.listeners[t] = [];
      return;
    }
    const n = this.listeners[t];
    if (!n) return;
    let s = e;
    e.c && e.c[t] ? (s = e.c[t], delete e.c[t]) : e.v && (s = e.v);
    const o = n.indexOf(s);
    o !== -1 && n.splice(o, 1);
  }
}
const _t = new ft();
export {
  lt as BaseComponent,
  wt as Component,
  gt as clear,
  w as config,
  W as createInstance,
  V as destroyInstance,
  _t as eventbus,
  ct as getComponentFromElement,
  ht as loadComponents,
  pt as measure,
  X as mutate,
  dt as removeComponents,
  at as utils
};
