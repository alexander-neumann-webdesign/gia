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
  t.priority !== void 0 && (i.m = t.priority), window.gia.components[e] = i;
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
const w = new F(), a = /* @__PURE__ */ new WeakMap();
function W(i, t, e, n) {
  if (a.has(i))
    return console.warn(`Component "${t}" already exists.`), a.get(i);
  try {
    const r = new e(i, n);
    return w.get("log") && console.info(`Created instance of component "${t}".`), r;
  } catch (r) {
    return console.error(`Failed to create component "${t}".`, r), null;
  }
}
function ct(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : a.get(i) || null;
}
function H(i, t = document) {
  return typeof i != "string" ? i : t.querySelector(i);
}
function I(i, t = document) {
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
  const r = new CustomEvent(t, n);
  i.dispatchEvent(r);
}
function Q(i, t) {
  let e, n = null, r = null;
  const o = () => {
    if (clearTimeout(e), n) {
      const f = r, u = n;
      r = null, n = null, i.apply(f, u);
    }
  }, s = function() {
    n = arguments, r = this, clearTimeout(e), e = setTimeout(o, t);
  };
  return s.cancel = function() {
    clearTimeout(e), n = null, r = null;
  }, s;
}
const ht = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: U,
  debounce: Q,
  query: H,
  queryAll: I,
  removeClass: K,
  toggleClass: Y,
  triggerEvent: J
}, Symbol.toStringTag, { value: "Module" }));
function at(i = {}, t = document.documentElement) {
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
  const n = [], r = `${w.get("attrPrefix")}-component`, o = I(`[${r}]`, t), s = o.length;
  for (let f = 0; f < s; f++) {
    const u = o[f];
    if (!a.get(u)) {
      const h = u.getAttribute(r);
      typeof i[h] == "function" ? n.push(W(u, h, i[h])) : console.warn(`Constructor "${h}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(r) && !a.get(t)) {
    const u = t.getAttribute(r);
    typeof i[u] == "function" ? n.push(W(t, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
  }
  n.length > 1 && n.sort((f, u) => {
    if (!f) return 1;
    if (!u) return -1;
    const c = f.constructor.m ?? f.constructor.priority ?? 0;
    return (u.constructor.m ?? u.constructor.priority ?? 0) - c;
  });
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    u && u.y();
  }
}
function V(i) {
  if (!i) return;
  let t = a.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = a.get(e), i = e);
  }
  if (t) {
    const e = t.c || "Unknown";
    try {
      typeof t.A == "function" ? t.A() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    a.delete(i), t.element && (t.element = null), w.get("log") && console.info(`Removed component "${e}".`);
  }
}
function dt(i = document.documentElement) {
  const t = I(`[${w.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    V(t[e]);
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
      } catch (r) {
        console.error(r);
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
      } catch (r) {
        console.error(r);
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
      const r = l.currentReads[n];
      if (r && r.n && r.fn === i)
        return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.currentReads[n] = null, !0;
    }
  }
  if (l.currentWrites) {
    let e = l.currentWrites.indexOf(i);
    if (e > -1) {
      const n = l.currentWrites[e];
      return n && n.n && (n.fn = null, n.ctx = null, l.wrapperPool.push(n)), l.currentWrites[e] = null, !0;
    }
    for (let n = 0; n < l.currentWrites.length; n++) {
      const r = l.currentWrites[n];
      if (r && r.n && r.fn === i)
        return r.fn = null, r.ctx = null, l.wrapperPool.push(r), l.currentWrites[n] = null, !0;
    }
  }
  return !1;
}
let A = !1, b = !1;
const d = [], D = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), $ = D ? "orientationchange" : "resize", p = [];
let g = null;
const v = { scroll: 0, velocity: 0 }, M = { width: 0, height: 0 }, N = [null], tt = function(i, t) {
  this.unobserveResize(t);
}, et = function(i, t) {
  this.unobserveIntersection(t);
};
let R = !1;
const x = [];
function nt() {
  R = !1;
  for (let i = 0; i < x.length; i++)
    x[i].w();
  x.length = 0;
}
function it() {
  for (let i = d.length - 1; i >= 0; i--)
    d[i](v);
}
function O(i) {
  let t, e;
  g ? (t = g.scroll, e = g.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), v.scroll = t, v.velocity = e, it();
}
function st() {
  for (let i = p.length - 1; i >= 0; i--)
    p[i](M);
}
function S(i) {
  M.width = window.innerWidth, M.height = window.innerHeight, st();
}
let y = null;
const m = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new Map(), rt = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), L = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new Map();
function ot(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let r = z.get(t);
  r || (r = /* @__PURE__ */ new Map(), z.set(t, r));
  let o = r.get(e);
  o || (o = /* @__PURE__ */ new Map(), r.set(e, o));
  let s = o;
  if (Array.isArray(n)) {
    let u = s.get("array");
    u || (u = /* @__PURE__ */ new Map(), s.set("array", u)), s = u;
    for (let c = 0; c < n.length; c++) {
      const h = n[c];
      let _ = s.get(h);
      _ || (_ = /* @__PURE__ */ new Map(), s.set(h, _)), s = _;
    }
  } else {
    let u = s.get("number");
    u || (u = /* @__PURE__ */ new Map(), s.set("number", u)), s = u;
    let c = s.get(n);
    c || (c = /* @__PURE__ */ new Map(), s.set(n, c)), s = c;
  }
  let f = s.get("data");
  return f || (f = {
    observer: new IntersectionObserver((c) => {
      for (let h = 0; h < c.length; h++) {
        const _ = c[h], E = f.callbacks.get(_.target);
        if (E) {
          N[0] = _;
          for (let P = E.length - 1; P >= 0; P--)
            E[P](N);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: s,
    elementsCount: 0
  }, s.set("data", f)), f;
}
class lt {
  constructor(t, e) {
    this.element = t, a.set(this.element, this), this.c = this.constructor.name, this.i = {}, this.l = e || {}, this.p = {}, this.w = this.w.bind(this), this.N();
  }
  get ref() {
    return this.i;
  }
  set ref(t) {
    const e = `${w.get("attrPrefix")}-ref`, n = I(`[${e}]`, this.element), r = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const f = n[s], u = f.getAttribute(e);
      let c = r[u];
      c === void 0 && (c = [], r[u] = c), c.push(f);
    }
    let o = !0;
    for (const s in t) {
      o = !1;
      break;
    }
    if (o)
      for (const s in r) {
        const f = s.indexOf(":");
        if (f !== -1) {
          const u = s.substring(0, f), c = s.substring(f + 1);
          u === this.c && !this.i[c] && (this.i[c] = r[s]);
        } else
          this.i[s] || (this.i[s] = r[s]);
      }
    else {
      this.i = {};
      for (const s in t) {
        if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
        const f = Array.isArray(t[s]);
        if (t[s] !== null && f && t[s].length > 0) {
          this.i[s] = t[s];
          continue;
        }
        const u = `${this.c}:${s}`;
        let c = r[u] || [];
        c.length === 0 && (c = r[s] || []), this.i[s] = f ? c : c[0] ?? null;
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
      const r = e.trim();
      if (r.startsWith("{") || r.startsWith("["))
        try {
          n = JSON.parse(r);
        } catch (o) {
          console.error(`Failed to parse options for component "${this.c}": ${o.message}`);
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
  A() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.i = null, this.element && (a.delete(this.element), this.element = null);
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
    this.i = null, this.element && (a.delete(this.element), this.element = null);
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
      for (let s = 0; s < o.length; s++) {
        const f = o[s], u = m.get(f.target);
        if (u) {
          N[0] = f;
          for (let c = u.length - 1; c >= 0; c--)
            u[c](N);
        }
      }
    }));
    let n = m.get(t);
    n || (n = [], m.set(t, n), y.observe(t)), n.indexOf(e) === -1 && n.push(e), this.r || (this.r = /* @__PURE__ */ new Map());
    let r = this.r.get(t);
    r || (r = [], this.r.set(t, r)), r.indexOf(e) === -1 && r.push(e);
  }
  unobserveResize(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.r) return;
    const n = this.r.get(t);
    if (!n) return;
    if (e) {
      const o = n.indexOf(e);
      o !== -1 && (n[o] = n[n.length - 1], n.pop());
      const s = m.get(t);
      if (s) {
        const f = s.indexOf(e);
        f !== -1 && (s[f] = s[s.length - 1], s.pop());
      }
    } else {
      const o = m.get(t);
      if (o)
        for (let s = 0; s < n.length; s++) {
          const f = n[s], u = o.indexOf(f);
          u !== -1 && (o[u] = o[o.length - 1], o.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.r.delete(t);
    const r = m.get(t);
    r && r.length === 0 && (m.delete(t), y && y.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const r = ot(n);
    let o = r.callbacks.get(t);
    o || (o = [], r.callbacks.set(t, o), r.observer.observe(t), r.elementsCount++), o.indexOf(e) === -1 && o.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
    let s = this.s.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.s.set(t, s));
    let f = s.get(r);
    f || (f = [], s.set(r, f)), f.indexOf(e) === -1 && f.push(e);
  }
  I(t, e) {
    const n = this.O, r = this.x;
    if (r) {
      const o = t.indexOf(r);
      if (o !== -1 && (t[o] = t[t.length - 1], t.pop(), e && e.callbacks.has(n))) {
        const s = e.callbacks.get(n), f = s.indexOf(r);
        f !== -1 && (s[f] = s[s.length - 1], s.pop());
      }
    } else {
      if (e && e.callbacks.has(n)) {
        const o = e.callbacks.get(n);
        for (let s = 0; s < t.length; s++) {
          const f = t[s], u = o.indexOf(f);
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
    n && (this.O = t, this.x = e, n.forEach(this.I, this), this.O = null, this.x = null, n.size === 0 && this.s.delete(t));
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
    return n ? n instanceof HTMLScriptElement ? n.o ? n.o : (n.o = new Promise((r, o) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), r(e ? window[e] : !0);
      }, n.onerror = () => {
        s(), delete n.o, o(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), o(new Error(`Script tag '${t}' has no src or data-src.`)));
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
    return e ? e instanceof HTMLLinkElement ? e.o ? e.o : (e.o = new Promise((n, r) => {
      const o = () => {
        e.onload = null, e.onerror = null;
      };
      if (e.onload = () => {
        o(), n(!0);
      }, e.onerror = () => {
        o(), delete e.o, r(new Error(`Failed to load style: ${t}`));
      }, !e.href && e.hasAttribute("data-href"))
        e.href = e.getAttribute("data-href"), e.removeAttribute("data-href");
      else if (!e.href && !e.hasAttribute("data-href"))
        o(), r(new Error(`Link tag '${t}' has no href or data-href.`));
      else if (e.href && !e.hasAttribute("data-href")) {
        let s = !1;
        for (let f = 0; f < document.styleSheets.length; f++)
          if (document.styleSheets[f].href === e.href) {
            s = !0;
            break;
          }
        s && (o(), n(!0));
      }
    }), e.o) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${w.get("attrPrefix")}-ref="${e ? `${this.c}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.p[e] !== n && (this.p[e] = n, this.d || (this.d = this._ || {}, this.u = this.g || {}, x.push(this), R || (R = !0, X(nt))), this.d[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const r = typeof n;
          if (r === "boolean" || r === "string") {
            let o = k.get(e);
            o || (o = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, k.set(e, o)), this.u[o] = r === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  w() {
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
      this.stateChange(this.d), this._ = this.d, this.g = this.u;
      for (const t in this._)
        delete this._[t];
      if (this.g)
        for (const t in this.g)
          delete this.g[t];
      this.d = null, this.u = null;
    }
  }
  stateChange(t) {
    return t;
  }
  N() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = L.get(t);
    if (!e) {
      e = [];
      const r = Object.getOwnPropertyNames(t);
      for (let o = 0; o < r.length; o++) {
        const s = r[o];
        !rt.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      L.set(t, e);
    }
    for (let r = 0; r < e.length; r++) {
      const o = e[r];
      this[o] = this[o].bind(this);
    }
  }
}
class wt extends lt {
  async require() {
  }
  y() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => {
      this.element && this.mount();
    }) : this.mount();
  }
}
class ft {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null), this.f = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    w.get("log") && console.info(`Emitting event '${t}'`);
    const n = this.listeners[t];
    if (!n || n.length === 0) return;
    e && typeof e == "object" && (e.c = t), this.f[t] = (this.f[t] || 0) + 1;
    const r = n.length;
    try {
      for (let o = 0; o < r; o++) {
        const s = n[o];
        s && s(e);
      }
    } finally {
      if (this.f[t]--, this.f[t] === 0) {
        let o = 0;
        for (let s = 0; s < n.length; s++)
          n[s] !== null && (n[o++] = n[s]);
        n.length = o;
      }
    }
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let r = e;
    n && (r = (o) => {
      this.off(t, r), e(o);
    }, e.h || (e.h = /* @__PURE__ */ Object.create(null)), e.h[t] = r), this.listeners[t].push(r);
  }
  once(t, e) {
    this.on(t, e, !0);
  }
  off(t, e) {
    if (!e) {
      const s = this.listeners[t];
      if (s)
        if (this.f && this.f[t] > 0)
          for (let f = 0; f < s.length; f++)
            s[f] = null;
        else
          s.length = 0;
      return;
    }
    const n = this.listeners[t];
    if (!n) return;
    let r = e;
    e.h && e.h[t] ? (r = e.h[t], delete e.h[t]) : e.E && (r = e.E);
    const o = n.indexOf(r);
    o !== -1 && (this.f && this.f[t] > 0 ? n[o] = null : n.splice(o, 1));
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
  at as loadComponents,
  pt as measure,
  X as mutate,
  dt as removeComponents,
  ht as utils
};
