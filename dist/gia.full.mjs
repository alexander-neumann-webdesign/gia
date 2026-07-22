var K = Object.defineProperty;
var U = (i, t, e) => t in i ? K(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var L = (i, t, e) => U(i, typeof t != "symbol" ? t + "" : t, e);
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
  t.priority !== void 0 && (i.p = t.priority), window.gia.components[e] = i;
});
class J {
  constructor() {
    L(this, "r", {
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
const h = new J(), d = /* @__PURE__ */ new WeakMap();
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
function gt(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : d.get(i) || null;
}
function Q(i, t = document) {
  return typeof i != "string" ? i : t.querySelector(i);
}
function b(i, t = document) {
  return typeof i != "string" ? i : t.querySelectorAll(i);
}
function V(i, t, e = null) {
  e === null ? i.classList.toggle(t) : i.classList.toggle(t, !!e);
}
function q(i, t, e) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[e](t);
  else
    i.classList[e](t);
  return i;
}
function Z(i, t) {
  return q(i, t, "remove");
}
function X(i, t) {
  return q(i, t, "add");
}
function D(i, t, e = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = e;
  const o = new CustomEvent(t, n);
  i.dispatchEvent(o);
}
function tt(i, t) {
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
const pt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: X,
  debounce: tt,
  query: Q,
  queryAll: b,
  removeClass: Z,
  toggleClass: V,
  triggerEvent: D
}, Symbol.toStringTag, { value: "Module" }));
function et(i = {}, t = document.documentElement) {
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
      typeof i[a] == "function" ? n.push(z(f, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !d.get(t)) {
    const f = t.getAttribute(o);
    typeof i[f] == "function" ? n.push(z(t, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
  }
  n.length > 1 && n.sort((l, f) => {
    if (!l) return 1;
    if (!f) return -1;
    const u = l.constructor.p ?? l.constructor.priority ?? 0;
    return (f.constructor.p ?? f.constructor.priority ?? 0) - u;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f._();
  }
}
function G(i) {
  if (!i) return;
  let t = d.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = d.get(e), i = e);
  }
  if (t) {
    const e = t.f || "Unknown";
    try {
      typeof t.w == "function" ? t.w() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    d.delete(i), t.element && (t.element = null), h.get("log") && console.info(`Removed component "${e}".`);
  }
}
function _t(i = document.documentElement) {
  const t = b(`[${h.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    G(t[e]);
}
const c = (typeof window < "u" ? window.m : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
c.tempReads || (c.tempReads = []);
c.tempWrites || (c.tempWrites = []);
typeof window < "u" && !window.m && (window.m = c);
function nt() {
  c.scheduled = !1;
  const i = c.reads;
  c.reads = c.tempReads;
  for (let e = 0; e < i.length; e++)
    if (i[e])
      try {
        i[e]();
      } catch (n) {
        console.error(n);
      }
  i.length = 0, c.tempReads = i;
  const t = c.writes;
  c.writes = c.tempWrites;
  for (let e = 0; e < t.length; e++)
    if (t[e])
      try {
        t[e]();
      } catch (n) {
        console.error(n);
      }
  t.length = 0, c.tempWrites = t, (c.reads.length > 0 || c.writes.length > 0) && R();
}
function R() {
  !c.scheduled && typeof window < "u" && (c.scheduled = !0, window.requestAnimationFrame(nt));
}
function wt(i, t) {
  const e = t ? i.bind(t) : i;
  return c.reads.push(e), R(), e;
}
function it(i, t) {
  const e = t ? i.bind(t) : i;
  return c.writes.push(e), R(), e;
}
function mt(i) {
  let t = c.reads.indexOf(i);
  return t > -1 ? (c.reads[t] = null, !0) : (t = c.writes.indexOf(i), t > -1 ? (c.writes[t] = null, !0) : !1);
}
let N = !1, x = !1;
const g = [], st = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), k = st ? "orientationchange" : "resize", p = [];
let _ = null;
const $ = { scroll: 0, velocity: 0 }, P = { width: 0, height: 0 }, I = [null], ot = function(i, t) {
  this.unobserveResize(t);
}, rt = function(i, t) {
  this.unobserveIntersection(t);
};
let S = !1;
const v = [];
function lt() {
  S = !1;
  for (let i = 0; i < v.length; i++)
    v[i].d();
  v.length = 0;
}
function ft() {
  for (let i = 0; i < g.length; i++)
    g[i]($);
}
function E(i) {
  let t, e;
  _ ? (t = _.scroll, e = _.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), $.scroll = t, $.velocity = e, ft();
}
function ut() {
  for (let i = 0; i < p.length; i++)
    p[i](P);
}
function W(i) {
  P.width = window.innerWidth, P.height = window.innerHeight, ut();
}
let A = null;
const m = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new Map(), F = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), T = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new Map();
function ct(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = B.get(t);
  o || (o = /* @__PURE__ */ new Map(), B.set(t, o));
  let r = o.get(e);
  r || (r = /* @__PURE__ */ new Map(), o.set(e, r));
  let s = r;
  if (Array.isArray(n)) {
    let f = s.get("array");
    f || (f = /* @__PURE__ */ new Map(), s.set("array", f)), s = f;
    for (let u = 0; u < n.length; u++) {
      const a = n[u];
      let w = s.get(a);
      w || (w = /* @__PURE__ */ new Map(), s.set(a, w)), s = w;
    }
  } else {
    let f = s.get("number");
    f || (f = /* @__PURE__ */ new Map(), s.set("number", f)), s = f;
    let u = s.get(n);
    u || (u = /* @__PURE__ */ new Map(), s.set(n, u)), s = u;
  }
  let l = s.get("data");
  return l || (l = {
    observer: new IntersectionObserver((u) => {
      for (let a = 0; a < u.length; a++) {
        const w = u[a], M = l.callbacks.get(w.target);
        if (M) {
          I[0] = w;
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
class H {
  constructor(t, e) {
    this.element = t, d.set(this.element, this), this.f = this.constructor.name, this.n = {}, this.r = e || {}, this.a = {}, this.d = this.d.bind(this), this.A(), h.get("autoBindActions") && this.O();
  }
  get ref() {
    return this.n;
  }
  set ref(t) {
    const e = `${h.get("attrPrefix")}-ref`, n = b(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
    for (let s = 0; s < n.length; s++) {
      const l = n[s], f = l.getAttribute(e);
      let u = o[f];
      u === void 0 && (u = [], o[f] = u), u.push(l);
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
          const f = s.substring(0, l), u = s.substring(l + 1);
          f === this.f && !this.n[u] && (this.n[u] = o[s]);
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
        const f = `${this.f}:${s}`;
        let u = o[f] || [];
        u.length === 0 && (u = o[s] || []), this.n[s] = l ? u : u[0] ?? null;
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
          console.error(`Failed to parse options for component "${this.f}": ${r.message}`);
        }
    }
    this.r = {
      ...this.r,
      ...t,
      ...n
    };
  }
  get state() {
    return this.a;
  }
  set state(t) {
    console.warn("Use setState instead."), this.a = t;
  }
  _() {
    this.mount();
  }
  w() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.n = null, this.element && (d.delete(this.element), this.element = null);
      return;
    }
    this.t && (this.t.forEach(this.unobserveScroll, this), this.t = null), this.e && (this.e.forEach(this.unobserveWindowResize, this), this.e = null), this.s && (this.s.forEach(ot, this), this.s = null), this.i && (this.i.forEach(rt, this), this.i = null), this.n = null, this.element && (d.delete(this.element), this.element = null);
  }
  observeScroll(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (N || (N = !0, window.lenis ? (_ = window.lenis, _.on("scroll", E)) : window.addEventListener("scroll", E, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(t) === -1 && this.t.push(t), g.indexOf(t) === -1 && g.push(t));
  }
  unobserveScroll(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(t);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const e = g.indexOf(t);
    e !== -1 && (g[e] = g[g.length - 1], g.pop()), g.length === 0 && N && (N = !1, _ ? (_.off("scroll", E), _ = null) : window.removeEventListener("scroll", E));
  }
  observeWindowResize(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (x || (x = !0, window.addEventListener(k, W, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), p.indexOf(t) === -1 && p.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = p.indexOf(t);
    e !== -1 && (p[e] = p[p.length - 1], p.pop()), p.length === 0 && x && (x = !1, window.removeEventListener(k, W));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    A || (A = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], f = m.get(l.target);
        if (f) {
          I[0] = l;
          for (let u = 0; u < f.length; u++)
            f[u](I);
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
    const o = ct(n);
    let r = o.callbacks.get(t);
    r || (r = [], o.callbacks.set(t, r), o.observer.observe(t), o.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.i || (this.i = /* @__PURE__ */ new Map());
    let s = this.i.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.i.set(t, s));
    let l = s.get(o);
    l || (l = [], s.set(o, l)), l.indexOf(e) === -1 && l.push(e);
  }
  N(t, e) {
    const n = this.y, o = this.b;
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
    n && (this.y = t, this.b = e, n.forEach(this.N, this), this.y = null, this.b = null, n.size === 0 && this.i.delete(t));
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
    return `[${h.get("attrPrefix")}-ref="${e ? `${this.f}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.a[e] !== n && (this.a[e] = n, this.c || (this.c = this.g || {}, this.l = this.h || {}, v.push(this), S || (S = !0, it(lt))), this.c[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = j.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, j.set(e, r)), this.l[r] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  d() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let t = !1;
      for (const e in this.l) {
        t = !0;
        break;
      }
      if (t)
        for (const e in this.l) {
          if (!Object.prototype.hasOwnProperty.call(this.l, e)) continue;
          const n = this.l[e];
          this.element.getAttribute(e) !== n && this.element.setAttribute(e, n);
        }
    }
    this.stateChange(this.c), this.g = this.c, this.h = this.l;
    for (const t in this.g)
      delete this.g[t];
    if (this.h)
      for (const t in this.h)
        delete this.h[t];
    this.c = null, this.l = null;
  }
  stateChange(t) {
    return t;
  }
  A() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = T.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !F.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      T.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const r = e[o];
      this[r] = this[r].bind(this);
    }
  }
}
H.prototype.O = function() {
  const i = b("[data-action]", this.element), t = i.length;
  for (let e = 0; e < t; e++) {
    const n = i[e], o = n.getAttribute("data-action");
    if (!o) continue;
    let r = 0;
    for (; r < o.length; ) {
      let s = o.indexOf(" ", r);
      if (s === -1 && (s = o.length), s > r) {
        const l = o.substring(r, s), f = l.indexOf("->");
        let u, a;
        f !== -1 ? (u = l.substring(0, f), a = l.substring(f + 2)) : (u = l, a = void 0), this[a] && typeof this[a] == "function" && !a.startsWith("_") && !F.has(a) ? n.addEventListener(u, this[a]) : console.warn(`Method "${a}" not found, is restricted, or is not a function in component.`);
      }
      r = s + 1;
    }
  }
};
class yt extends H {
  async require() {
  }
  _() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => this.mount()) : this.mount();
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
    e && typeof e == "object" && (e.f = t);
    const o = n.slice();
    for (let r = 0; r < o.length; r++)
      o[r](e);
  }
  on(t, e, n = !1) {
    this.listeners[t] || (this.listeners[t] = []);
    let o = e;
    n && (o = (r) => {
      this.off(t, o), e(r);
    }, e.u || (e.u = /* @__PURE__ */ Object.create(null)), e.u[t] = o), this.listeners[t].push(o);
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
    e.u && e.u[t] ? (o = e.u[t], delete e.u[t]) : e.x && (o = e.x);
    const r = n.indexOf(o);
    r !== -1 && (r === n.length - 1 || (n[r] = n[n.length - 1]), n.pop());
  }
}
const bt = new at();
let y = null;
const O = [];
function ht(i) {
  const t = `${h.get("attrPrefix")}-component`, e = typeof window < "u" && window.gia ? window.gia.components : {};
  O.length = 0;
  for (let n = 0; n < i.length; n++) {
    const o = i[n];
    for (let r = 0; r < o.removedNodes.length; r++) {
      const s = o.removedNodes[r];
      if (s.nodeType === Node.ELEMENT_NODE) {
        s.hasAttribute(t) && G(s);
        const l = b(`[${t}]`, s);
        for (let f = 0; f < l.length; f++)
          G(l[f]);
      }
    }
    o.addedNodes.length > 0 && o.target.nodeType === Node.ELEMENT_NODE && O.indexOf(o.target) === -1 && O.push(o.target);
  }
  for (let n = 0; n < O.length; n++) {
    const o = O[n];
    o.isConnected && et(e, o);
  }
}
function Y() {
  typeof document > "u" || (h.get("autoMountComponents") && !y ? (y = new MutationObserver(ht), y.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !h.get("autoMountComponents") && y && (y.disconnect(), y = null));
}
{
  const i = h.set;
  h.set = function(t, e) {
    i.call(this, t, e), t === "autoMountComponents" && Y();
  };
}
typeof window < "u" && setTimeout(Y, 0);
export {
  H as BaseComponent,
  yt as Component,
  mt as clear,
  h as config,
  z as createInstance,
  G as destroyInstance,
  bt as eventbus,
  gt as getComponentFromElement,
  et as loadComponents,
  wt as measure,
  it as mutate,
  _t as removeComponents,
  pt as utils
};
