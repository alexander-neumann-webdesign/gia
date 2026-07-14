var j = Object.defineProperty;
var T = (i, t, e) => t in i ? j(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var $ = (i, t, e) => T(i, typeof t != "symbol" ? t + "" : t, e);
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
class q {
  constructor() {
    $(this, "r", {
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
const _ = new q(), h = /* @__PURE__ */ new WeakMap();
function S(i, t, e, n) {
  if (h.has(i))
    return console.warn(`Component "${t}" already exists.`), h.get(i);
  try {
    const o = new e(i, n);
    return _.get("log") && console.info(`Created instance of component "${t}".`), o;
  } catch (o) {
    return console.error(`Failed to create component "${t}".`, o), null;
  }
}
function ut(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : h.get(i) || null;
}
function F(i, t = document) {
  return typeof i != "string" ? i : t.querySelector(i);
}
function I(i, t = document) {
  return typeof i != "string" ? i : t.querySelectorAll(i);
}
function H(i, t, e = null) {
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
function Y(i, t) {
  return B(i, t, "remove");
}
function K(i, t) {
  return B(i, t, "add");
}
function U(i, t, e = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = e;
  const o = new CustomEvent(t, n);
  i.dispatchEvent(o);
}
function J(i, t) {
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
const ct = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: K,
  debounce: J,
  query: F,
  queryAll: I,
  removeClass: Y,
  toggleClass: H,
  triggerEvent: U
}, Symbol.toStringTag, { value: "Module" }));
function at(i = {}, t = document.documentElement) {
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
  const n = [], o = `${_.get("attrPrefix")}-component`, r = I(`[${o}]`, t), s = r.length;
  for (let l = 0; l < s; l++) {
    const f = r[l];
    if (!h.get(f)) {
      const a = f.getAttribute(o);
      typeof i[a] == "function" ? n.push(S(f, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (t instanceof Element && t.hasAttribute(o) && !h.get(t)) {
    const f = t.getAttribute(o);
    typeof i[f] == "function" ? n.push(S(t, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
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
function Q(i) {
  if (!i) return;
  let t = h.get(i);
  if (!t && typeof i == "string") {
    const e = document.getElementById(i);
    e && (t = h.get(e), i = e);
  }
  if (t) {
    const e = t.f || "Unknown";
    try {
      typeof t.w == "function" ? t.w() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    h.delete(i), t.element && (t.element = null), _.get("log") && console.info(`Removed component "${e}".`);
  }
}
function ht(i = document.documentElement) {
  const t = I(`[${_.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    Q(t[e]);
}
const c = (typeof window < "u" ? window.m : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
c.tempReads || (c.tempReads = []);
c.tempWrites || (c.tempWrites = []);
typeof window < "u" && !window.m && (window.m = c);
function V() {
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
  t.length = 0, c.tempWrites = t, (c.reads.length > 0 || c.writes.length > 0) && P();
}
function P() {
  !c.scheduled && typeof window < "u" && (c.scheduled = !0, window.requestAnimationFrame(V));
}
function dt(i, t) {
  const e = t ? i.bind(t) : i;
  return c.reads.push(e), P(), e;
}
function Z(i, t) {
  const e = t ? i.bind(t) : i;
  return c.writes.push(e), P(), e;
}
function gt(i) {
  let t = c.reads.indexOf(i);
  return t > -1 ? (c.reads[t] = null, !0) : (t = c.writes.indexOf(i), t > -1 ? (c.writes[t] = null, !0) : !1);
}
let A = !1, b = !1;
const d = [], X = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), R = X ? "orientationchange" : "resize", g = [];
let p = null;
const M = { scroll: 0, velocity: 0 }, C = { width: 0, height: 0 }, x = [null], D = function(i, t) {
  this.unobserveResize(t);
}, tt = function(i, t) {
  this.unobserveIntersection(t);
};
let G = !1;
const N = [];
function et() {
  G = !1;
  for (let i = 0; i < N.length; i++)
    N[i].d();
  N.length = 0;
}
function nt() {
  for (let i = 0; i < d.length; i++)
    d[i](M);
}
function O(i) {
  let t, e;
  p ? (t = p.scroll, e = p.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), M.scroll = t, M.velocity = e, nt();
}
function it() {
  for (let i = 0; i < g.length; i++)
    g[i](C);
}
function z(i) {
  C.width = window.innerWidth, C.height = window.innerHeight, it();
}
let y = null;
const m = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new Map(), st = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new Map();
function ot(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = L.get(t);
  o || (o = /* @__PURE__ */ new Map(), L.set(t, o));
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
        const w = u[a], v = l.callbacks.get(w.target);
        if (v) {
          x[0] = w;
          for (let E = 0; E < v.length; E++)
            v[E](x);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: s,
    elementsCount: 0
  }, s.set("data", l)), l;
}
class rt {
  constructor(t, e) {
    this.element = t, h.set(this.element, this), this.f = this.constructor.name, this.n = {}, this.r = e || {}, this.a = {}, this.d = this.d.bind(this), this.b();
  }
  get ref() {
    return this.n;
  }
  set ref(t) {
    const e = `${_.get("attrPrefix")}-ref`, n = I(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
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
    const e = this.element.getAttribute(`${_.get("attrPrefix")}-options`);
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
      this.n = null, this.element && (h.delete(this.element), this.element = null);
      return;
    }
    this.t && (this.t.forEach(this.unobserveScroll, this), this.t = null), this.e && (this.e.forEach(this.unobserveWindowResize, this), this.e = null), this.s && (this.s.forEach(D, this), this.s = null), this.i && (this.i.forEach(tt, this), this.i = null), this.n = null, this.element && (h.delete(this.element), this.element = null);
  }
  observeScroll(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (A || (A = !0, window.lenis ? (p = window.lenis, p.on("scroll", O)) : window.addEventListener("scroll", O, { passive: !0 })), this.t || (this.t = []), this.t.indexOf(t) === -1 && this.t.push(t), d.indexOf(t) === -1 && d.push(t));
  }
  unobserveScroll(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.t) {
      const n = this.t.indexOf(t);
      n !== -1 && (this.t[n] = this.t[this.t.length - 1], this.t.pop());
    }
    const e = d.indexOf(t);
    e !== -1 && (d[e] = d[d.length - 1], d.pop()), d.length === 0 && A && (A = !1, p ? (p.off("scroll", O), p = null) : window.removeEventListener("scroll", O));
  }
  observeWindowResize(t) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.addEventListener(R, z, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), g.indexOf(t) === -1 && g.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = g.indexOf(t);
    e !== -1 && (g[e] = g[g.length - 1], g.pop()), g.length === 0 && b && (b = !1, window.removeEventListener(R, z));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    y || (y = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], f = m.get(l.target);
        if (f) {
          x[0] = l;
          for (let u = 0; u < f.length; u++)
            f[u](x);
        }
      }
    }));
    let n = m.get(t);
    n || (n = [], m.set(t, n), y.observe(t)), n.indexOf(e) === -1 && n.push(e), this.s || (this.s = /* @__PURE__ */ new Map());
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
    o && o.length === 0 && (m.delete(t), y && y.unobserve(t));
  }
  observeIntersection(t, e, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const o = ot(n);
    let r = o.callbacks.get(t);
    r || (r = [], o.callbacks.set(t, r), o.observer.observe(t), o.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.i || (this.i = /* @__PURE__ */ new Map());
    let s = this.i.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.i.set(t, s));
    let l = s.get(o);
    l || (l = [], s.set(o, l)), l.indexOf(e) === -1 && l.push(e);
  }
  O(t, e) {
    const n = this.y, o = this.A;
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
    n && (this.y = t, this.A = e, n.forEach(this.O, this), this.y = null, this.A = null, n.size === 0 && this.i.delete(t));
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
    return `[${_.get("attrPrefix")}-ref="${e ? `${this.f}:` : ""}${t}"]`;
  }
  setState(t) {
    if (t)
      for (const e in t) {
        if (!Object.prototype.hasOwnProperty.call(t, e)) continue;
        const n = t[e];
        if (this.a[e] !== n && (this.a[e] = n, this.c || (this.c = this.g || {}, this.l = this.h || {}, N.push(this), G || (G = !0, Z(et))), this.c[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = W.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, W.set(e, r)), this.l[r] = o === "boolean" ? n ? "true" : "false" : n;
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
  b() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = k.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !st.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      k.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const r = e[o];
      this[r] = this[r].bind(this);
    }
  }
}
class pt extends rt {
  async require() {
  }
  _() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => this.mount()) : this.mount();
  }
}
class lt {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(t, e = {}) {
    _.get("log") && console.info(`Emitting event '${t}'`);
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
    e.u && e.u[t] ? (o = e.u[t], delete e.u[t]) : e.N && (o = e.N);
    const r = n.indexOf(o);
    r !== -1 && (r === n.length - 1 || (n[r] = n[n.length - 1]), n.pop());
  }
}
const _t = new lt();
export {
  rt as BaseComponent,
  pt as Component,
  gt as clear,
  _ as config,
  S as createInstance,
  Q as destroyInstance,
  _t as eventbus,
  ut as getComponentFromElement,
  at as loadComponents,
  dt as measure,
  Z as mutate,
  ht as removeComponents,
  ct as utils
};
