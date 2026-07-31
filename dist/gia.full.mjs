var J = Object.defineProperty;
var Q = (i, t, e) => t in i ? J(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var z = (i, t, e) => Q(i, typeof t != "symbol" ? t + "" : t, e);
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
    z(this, "r", {
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
    this.r[t] = e;
  }
  get(t) {
    return this.r[t];
  }
}
const h = new V(), d = /* @__PURE__ */ new WeakMap();
function k(i, t, e, n) {
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
      const l = o, f = n;
      o = null, n = null, i.apply(l, f);
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
    const f = r[l];
    if (!d.get(f)) {
      const a = f.getAttribute(o);
      typeof i[a] == "function" ? n.push(k(f, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !d.get(t)) {
    const f = t.getAttribute(o);
    typeof i[f] == "function" ? n.push(k(t, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
  }
  n.length > 1 && n.sort((l, f) => {
    if (!l) return 1;
    if (!f) return -1;
    const c = l.constructor._ ?? l.constructor.priority ?? 0;
    return (f.constructor._ ?? f.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f.m();
  }
}
function P(i) {
  if (!i) return;
  let t = d.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = d.get(e), i = e);
  }
  if (t) {
    const e = t.u || "Unknown";
    try {
      typeof t.y == "function" ? t.y() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    d.delete(i), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function yt(i = document.documentElement) {
  const t = b(`[${h.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    P(t[e]);
}
const u = (typeof window < "u" ? window.b : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
u.tempReads || (u.tempReads = []);
u.tempWrites || (u.tempWrites = []);
u.wrapperPool || (u.wrapperPool = []);
typeof window < "u" && !window.b && (window.b = u);
function H(i, t) {
  let e = u.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.c = !0), e.fn = i, e.ctx = t, e;
}
function st() {
  u.scheduled = !1;
  const i = u.reads;
  u.reads = u.tempReads;
  for (let e = 0; e < i.length; e++) {
    const n = i[e];
    if (n) {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
      n.c && (n.fn = null, n.ctx = null, u.wrapperPool.push(n));
    }
  }
  i.length = 0, u.tempReads = i;
  const t = u.writes;
  u.writes = u.tempWrites;
  for (let e = 0; e < t.length; e++) {
    const n = t[e];
    if (n) {
      try {
        n();
      } catch (o) {
        console.error(o);
      }
      n.c && (n.fn = null, n.ctx = null, u.wrapperPool.push(n));
    }
  }
  t.length = 0, u.tempWrites = t, (u.reads.length > 0 || u.writes.length > 0) && R();
}
function R() {
  !u.scheduled && typeof window < "u" && (u.scheduled = !0, window.requestAnimationFrame(st));
}
function bt(i, t) {
  const e = t ? H(i, t) : i;
  return u.reads.push(e), R(), e;
}
function ot(i, t) {
  const e = t ? H(i, t) : i;
  return u.writes.push(e), R(), e;
}
function At(i) {
  let t = u.reads.indexOf(i);
  if (t > -1) {
    const e = u.reads[t];
    return e && e.c && (e.fn = null, e.ctx = null, u.wrapperPool.push(e)), u.reads[t] = null, !0;
  }
  for (let e = 0; e < u.reads.length; e++) {
    const n = u.reads[e];
    if (n && n.c && n.fn === i)
      return n.fn = null, n.ctx = null, u.wrapperPool.push(n), u.reads[e] = null, !0;
  }
  if (t = u.writes.indexOf(i), t > -1) {
    const e = u.writes[t];
    return e && e.c && (e.fn = null, e.ctx = null, u.wrapperPool.push(e)), u.writes[t] = null, !0;
  }
  for (let e = 0; e < u.writes.length; e++) {
    const n = u.writes[e];
    if (n && n.c && n.fn === i)
      return n.fn = null, n.ctx = null, u.wrapperPool.push(n), u.writes[e] = null, !0;
  }
  return !1;
}
let N = !1, x = !1;
const p = [], rt = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), W = rt ? "orientationchange" : "resize", g = [];
let w = null;
const G = { scroll: 0, velocity: 0 }, $ = { width: 0, height: 0 }, I = [null], lt = function(i, t) {
  this.unobserveResize(t);
}, ft = function(i, t) {
  this.unobserveIntersection(t);
};
let S = !1;
const E = [];
function ut() {
  S = !1;
  for (let i = 0; i < E.length; i++)
    E[i].g();
  E.length = 0;
}
function ct() {
  for (let i = 0; i < p.length; i++)
    p[i](G);
}
function v(i) {
  let t, e;
  w ? (t = w.scroll, e = w.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), G.scroll = t, G.velocity = e, ct();
}
function at() {
  for (let i = 0; i < g.length; i++)
    g[i]($);
}
function T(i) {
  $.width = window.innerWidth, $.height = window.innerHeight, at();
}
let A = null;
const m = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new Map(), Y = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), j = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map();
function ht(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = B.get(t);
  o || (o = /* @__PURE__ */ new Map(), B.set(t, o));
  let r = o.get(e);
  r || (r = /* @__PURE__ */ new Map(), o.set(e, r));
  let s = r;
  if (Array.isArray(n)) {
    let f = s.get("array");
    f || (f = /* @__PURE__ */ new Map(), s.set("array", f)), s = f;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let _ = s.get(a);
      _ || (_ = /* @__PURE__ */ new Map(), s.set(a, _)), s = _;
    }
  } else {
    let f = s.get("number");
    f || (f = /* @__PURE__ */ new Map(), s.set("number", f)), s = f;
    let c = s.get(n);
    c || (c = /* @__PURE__ */ new Map(), s.set(n, c)), s = c;
  }
  let l = s.get("data");
  return l || (l = {
    observer: new IntersectionObserver((c) => {
      for (let a = 0; a < c.length; a++) {
        const _ = c[a], M = l.callbacks.get(_.target);
        if (M) {
          I[0] = _;
          for (let C = 0; C < M.length; C++)
            M[C](I);
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
    this.element = t, d.set(this.element, this), this.u = this.constructor.name, this.n = {}, this.r = e || {}, this.d = {}, this.g = this.g.bind(this), this.N(), h.get("autoBindActions") && this.x();
  }
  get ref() {
    return this.n;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, n = b(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const l = n[s], f = l.getAttribute(e);
      let c = o[f];
      c === void 0 && (c = [], o[f] = c), c.push(l);
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
          const f = s.substring(0, l), c = s.substring(l + 1);
          f === this.u && !this.n[c] && (this.n[c] = o[s]);
        } else
          this.n[s] || (this.n[s] = o[s]);
      }
    else {
      this.n = {};
      for (const s in t) {
        if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
        const l = Array.isArray(t[s]);
        if (t[s] !== null && l && t[s].length > 0) {
          this.n[s] = t[s];
          continue;
        }
        const f = `${this.u}:${s}`;
        let c = o[f] || [];
        c.length === 0 && (c = o[s] || []), this.n[s] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.r;
  }
  set options(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.r = { ...this.r, ...t };
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
          console.error(`Failed to parse options for component "${this.u}": ${r.message}`);
        }
    }
    this.r = {
      ...this.r,
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
      this.n = null, this.element && (d.delete(this.element), this.element = null);
      return;
    }
    if (this.t && (this.t.forEach(this.unobserveScroll, this), this.t = null), this.e && (this.e.forEach(this.unobserveWindowResize, this), this.e = null), this.s && (this.s.forEach(lt, this), this.s = null), this.i && (this.i.forEach(ft, this), this.i = null), this.l) {
      for (let t = 0; t < this.l.length; t += 3)
        this.l[t].removeEventListener(this.l[t + 1], this[this.l[t + 2]]);
      this.l = null;
    }
    this.n = null, this.element && (d.delete(this.element), this.element = null);
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
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.addEventListener(W, T, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), g.indexOf(t) === -1 && g.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = g.indexOf(t);
    e !== -1 && (g[e] = g[g.length - 1], g.pop()), g.length === 0 && x && (x = !1, window.removeEventListener(W, T));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    A || (A = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], f = m.get(l.target);
        if (f) {
          I[0] = l;
          for (let c = 0; c < f.length; c++)
            f[c](I);
        }
      }
    }));
    let n = m.get(t);
    n || (n = [], m.set(t, n), A.observe(t)), n.indexOf(e) === -1 && n.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
    let o = this.s.get(t);
    o || (o = [], this.s.set(t, o)), o.indexOf(e) === -1 && o.push(e);
  }
  unobserveResize(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.s) return;
    const n = this.s.get(t);
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
          const l = n[s], f = r.indexOf(l);
          f !== -1 && (r[f] = r[r.length - 1], r.pop());
        }
      n.length = 0;
    }
    n.length === 0 && this.s.delete(t);
    const o = m.get(t);
    o && o.length === 0 && (m.delete(t), A && A.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const o = ht(n);
    let r = o.callbacks.get(t);
    r || (r = [], o.callbacks.set(t, r), o.observer.observe(t), o.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.i || (this.i = /* @__PURE__ */ new Map());
    let s = this.i.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.i.set(t, s));
    let l = s.get(o);
    l || (l = [], s.set(o, l)), l.indexOf(e) === -1 && l.push(e);
  }
  v(t, e) {
    const n = this.A, o = this.O;
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
          const l = t[s], f = r.indexOf(l);
          f !== -1 && (r[f] = r[r.length - 1], r.pop());
        }
      }
      t.length = 0;
    }
    if (t.length === 0 && this.i.get(n).delete(e), e) {
      const r = e.callbacks.get(n);
      r && r.length === 0 && (e.callbacks.delete(n), e.observer.unobserve(n), e.elementsCount--), e.elementsCount === 0 && (e.observer.disconnect(), e.nodeMap && e.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(t, e = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.i) return;
    const n = this.i.get(t);
    n && (this.A = t, this.O = e, n.forEach(this.v, this), this.A = null, this.O = null, n.size === 0 && this.i.delete(t));
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
    return n ? n instanceof HTMLScriptElement ? n.o ? n.o : (n.o = new Promise((o, r) => {
      const s = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        s(), o(e ? window[e] : !0);
      }, n.onerror = () => {
        s(), delete n.o, r(new Error(`Failed to load script: ${t}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (s(), r(new Error(`Script tag '${t}' has no src or data-src.`)));
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
    return e ? e instanceof HTMLLinkElement ? e.o ? e.o : (e.o = new Promise((n, o) => {
      const r = () => {
        e.onload = null, e.onerror = null;
      };
      if (e.onload = () => {
        r(), n(!0);
      }, e.onerror = () => {
        r(), delete e.o, o(new Error(`Failed to load style: ${t}`));
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
    }), e.o) : Promise.reject(new Error(`Element with ID '${t}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${t}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(t, e = !1) {
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.u}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.d[e] !== n && (this.d[e] = n, this.h || (this.h = this.w || {}, this.f = this.p || {}, E.push(this), S || (S = !0, ot(ut))), this.h[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = q.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, q.set(e, r)), this.f[r] = o === "boolean" ? n ? "true" : "false" : n;
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
  N() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = j.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !Y.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      j.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const r = e[o];
      this[r] = this[r].bind(this);
    }
  }
}
K.prototype.x = function() {
  const i = b("[data-action]", this.element), t = i.length;
  for (let e = 0; e < t; e++) {
    const n = i[e], o = n.getAttribute("data-action");
    if (!o) continue;
    let r = 0;
    for (; r < o.length; ) {
      let s = o.indexOf(" ", r);
      if (s === -1 && (s = o.length), s > r) {
        const l = o.substring(r, s), f = l.indexOf("->");
        let c, a;
        f !== -1 ? (c = l.substring(0, f), a = l.substring(f + 2)) : (c = l, a = void 0), this[a] && typeof this[a] == "function" && !a.startsWith("_") && !Y.has(a) ? (n.addEventListener(c, this[a]), this.l || (this.l = []), this.l.push(n, c, a)) : console.warn(`Method "${a}" not found, is restricted, or is not a function in component.`);
      }
      r = s + 1;
    }
  }
};
class Ot extends K {
  async require() {
  }
  m() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => this.mount()) : this.mount();
  }
}
class dt {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    h.get("log") && console.info(`Emitting event '${t}'`);
    const n = this.listeners[t];
    if (!n || n.length === 0) return;
    e && typeof e == "object" && (e.u = t);
    const o = n.slice();
    for (let r = 0; r < o.length; r++)
      o[r](e);
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let o = e;
    n && (o = (r) => {
      this.off(t, o), e(r);
    }, e.a || (e.a = /* @__PURE__ */ Object.create(null)), e.a[t] = o), this.listeners[t].push(o);
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
    let o = e;
    e.a && e.a[t] ? (o = e.a[t], delete e.a[t]) : e.E && (o = e.E);
    const r = n.indexOf(o);
    r !== -1 && n.splice(r, 1);
  }
}
const Nt = new dt();
let y = null, L = null;
const O = [], pt = (i) => {
  i.isConnected && it(L, i);
};
function gt(i) {
  const t = `${h.get("attrPrefix")}-component`, e = typeof window < "u" && window.gia ? window.gia.components : {};
  O.length = 0;
  for (let n = 0; n < i.length; n++) {
    const o = i[n];
    for (let r = 0; r < o.removedNodes.length; r++) {
      const s = o.removedNodes[r];
      if (s.nodeType === Node.ELEMENT_NODE) {
        s.hasAttribute(t) && P(s);
        const l = b(`[${t}]`, s);
        for (let f = 0; f < l.length; f++)
          P(l[f]);
      }
    }
    if (o.addedNodes.length > 0)
      for (let r = 0; r < o.addedNodes.length; r++) {
        const s = o.addedNodes[r];
        s.nodeType === Node.ELEMENT_NODE && O.indexOf(s) === -1 && O.push(s);
      }
  }
  L = e;
  for (let n = 0; n < O.length; n++)
    pt(O[n]);
  L = null;
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
  k as createInstance,
  P as destroyInstance,
  Nt as eventbus,
  _t as getComponentFromElement,
  it as loadComponents,
  bt as measure,
  ot as mutate,
  yt as removeComponents,
  mt as utils
};
