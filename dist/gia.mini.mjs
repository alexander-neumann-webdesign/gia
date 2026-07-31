var T = Object.defineProperty;
var q = (i, t, e) => t in i ? T(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var $ = (i, t, e) => q(i, typeof t != "symbol" ? t + "" : t, e);
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
  t.priority !== void 0 && (i.w = t.priority), window.gia.components[e] = i;
});
class F {
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
const _ = new F(), h = /* @__PURE__ */ new WeakMap();
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
  const o = new CustomEvent(t, n);
  i.dispatchEvent(o);
}
function Q(i, t) {
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
  for (const l in i) {
    e = !0;
    break;
  }
  if (!e) {
    console.warn("App has no components");
    return;
  }
  const n = [], o = `${_.get("attrPrefix")}-component`, r = v(`[${o}]`, t), s = r.length;
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
    const c = l.constructor.w ?? l.constructor.priority ?? 0;
    return (f.constructor.w ?? f.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f.m();
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
    const e = t.f || "Unknown";
    try {
      typeof t.y == "function" ? t.y() : t.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${e}".`, n);
    }
    h.delete(i), t.element && (t.element = null), _.get("log") && console.info(`Removed component "${e}".`);
  }
}
function dt(i = document.documentElement) {
  const t = v(`[${_.get("attrPrefix")}-component]`, i);
  for (let e = 0; e < t.length; e++)
    V(t[e]);
}
const u = (typeof window < "u" ? window.A : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
u.tempReads || (u.tempReads = []);
u.tempWrites || (u.tempWrites = []);
u.wrapperPool || (u.wrapperPool = []);
typeof window < "u" && !window.A && (window.A = u);
function j(i, t) {
  let e = u.wrapperPool.pop();
  return e || (e = function() {
    e.fn.call(e.ctx);
  }, e.u = !0), e.fn = i, e.ctx = t, e;
}
function Z() {
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
      n.u && (n.fn = null, n.ctx = null, u.wrapperPool.push(n));
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
      n.u && (n.fn = null, n.ctx = null, u.wrapperPool.push(n));
    }
  }
  t.length = 0, u.tempWrites = t, (u.reads.length > 0 || u.writes.length > 0) && G();
}
function G() {
  !u.scheduled && typeof window < "u" && (u.scheduled = !0, window.requestAnimationFrame(Z));
}
function pt(i, t) {
  const e = t ? j(i, t) : i;
  return u.reads.push(e), G(), e;
}
function X(i, t) {
  const e = t ? j(i, t) : i;
  return u.writes.push(e), G(), e;
}
function gt(i) {
  let t = u.reads.indexOf(i);
  if (t > -1) {
    const e = u.reads[t];
    return e && e.u && (e.fn = null, e.ctx = null, u.wrapperPool.push(e)), u.reads[t] = null, !0;
  }
  for (let e = 0; e < u.reads.length; e++) {
    const n = u.reads[e];
    if (n && n.u && n.fn === i)
      return n.fn = null, n.ctx = null, u.wrapperPool.push(n), u.reads[e] = null, !0;
  }
  if (t = u.writes.indexOf(i), t > -1) {
    const e = u.writes[t];
    return e && e.u && (e.fn = null, e.ctx = null, u.wrapperPool.push(e)), u.writes[t] = null, !0;
  }
  for (let e = 0; e < u.writes.length; e++) {
    const n = u.writes[e];
    if (n && n.u && n.fn === i)
      return n.fn = null, n.ctx = null, u.wrapperPool.push(n), u.writes[e] = null, !0;
  }
  return !1;
}
let A = !1, b = !1;
const d = [], D = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), R = D ? "orientationchange" : "resize", p = [];
let g = null;
const M = { scroll: 0, velocity: 0 }, P = { width: 0, height: 0 }, x = [null], tt = function(i, t) {
  this.unobserveResize(t);
}, et = function(i, t) {
  this.unobserveIntersection(t);
};
let C = !1;
const N = [];
function nt() {
  C = !1;
  for (let i = 0; i < N.length; i++)
    N[i].g();
  N.length = 0;
}
function it() {
  for (let i = 0; i < d.length; i++)
    d[i](M);
}
function O(i) {
  let t, e;
  g ? (t = g.scroll, e = g.velocity) : i && typeof i.scroll == "number" ? (t = i.scroll, e = i.velocity || 0) : (t = window.scrollY || window.pageYOffset, e = 0), M.scroll = t, M.velocity = e, it();
}
function st() {
  for (let i = 0; i < p.length; i++)
    p[i](P);
}
function z(i) {
  P.width = window.innerWidth, P.height = window.innerHeight, st();
}
let y = null;
const m = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new Map(), ot = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), k = /* @__PURE__ */ new WeakMap(), W = /* @__PURE__ */ new Map();
function rt(i) {
  const t = i.root || null, e = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let o = L.get(t);
  o || (o = /* @__PURE__ */ new Map(), L.set(t, o));
  let r = o.get(e);
  r || (r = /* @__PURE__ */ new Map(), o.set(e, r));
  let s = r;
  if (Array.isArray(n)) {
    let f = s.get("array");
    f || (f = /* @__PURE__ */ new Map(), s.set("array", f)), s = f;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let w = s.get(a);
      w || (w = /* @__PURE__ */ new Map(), s.set(a, w)), s = w;
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
        const w = c[a], I = l.callbacks.get(w.target);
        if (I) {
          x[0] = w;
          for (let E = 0; E < I.length; E++)
            I[E](x);
        }
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: s,
    elementsCount: 0
  }, s.set("data", l)), l;
}
class lt {
  constructor(t, e) {
    this.element = t, h.set(this.element, this), this.f = this.constructor.name, this.n = {}, this.r = e || {}, this.d = {}, this.g = this.g.bind(this), this.N();
  }
  get ref() {
    return this.n;
  }
  set ref(t) {
    const e = `${_.get("attrPrefix")}-ref`, n = v(`[${e}]`, this.element), o = /* @__PURE__ */ Object.create(null);
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
          f === this.f && !this.n[c] && (this.n[c] = o[s]);
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
      this.n = null, this.element && (h.delete(this.element), this.element = null);
      return;
    }
    if (this.t && (this.t.forEach(this.unobserveScroll, this), this.t = null), this.e && (this.e.forEach(this.unobserveWindowResize, this), this.e = null), this.s && (this.s.forEach(tt, this), this.s = null), this.i && (this.i.forEach(et, this), this.i = null), this.a) {
      for (let t = 0; t < this.a.length; t += 3)
        this.a[t].removeEventListener(this.a[t + 1], this[this.a[t + 2]]);
      this.a = null;
    }
    this.n = null, this.element && (h.delete(this.element), this.element = null);
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
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (b || (b = !0, window.addEventListener(R, z, { passive: !0 })), this.e || (this.e = []), this.e.indexOf(t) === -1 && this.e.push(t), p.indexOf(t) === -1 && p.push(t));
  }
  unobserveWindowResize(t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) return;
    if (this.e) {
      const n = this.e.indexOf(t);
      n !== -1 && (this.e[n] = this.e[this.e.length - 1], this.e.pop());
    }
    const e = p.indexOf(t);
    e !== -1 && (p[e] = p[p.length - 1], p.pop()), p.length === 0 && b && (b = !1, window.removeEventListener(R, z));
  }
  observeResize(t, e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    y || (y = new ResizeObserver((r) => {
      for (let s = 0; s < r.length; s++) {
        const l = r[s], f = m.get(l.target);
        if (f) {
          x[0] = l;
          for (let c = 0; c < f.length; c++)
            f[c](x);
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
    const o = rt(n);
    let r = o.callbacks.get(t);
    r || (r = [], o.callbacks.set(t, r), o.observer.observe(t), o.elementsCount++), r.indexOf(e) === -1 && r.push(e), this.i || (this.i = /* @__PURE__ */ new Map());
    let s = this.i.get(t);
    s || (s = /* @__PURE__ */ new Map(), this.i.set(t, s));
    let l = s.get(o);
    l || (l = [], s.set(o, l)), l.indexOf(e) === -1 && l.push(e);
  }
  x(t, e) {
    const n = this.b, o = this.O;
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
    n && (this.b = t, this.O = e, n.forEach(this.x, this), this.b = null, this.O = null, n.size === 0 && this.i.delete(t));
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
        if (this.d[e] !== n && (this.d[e] = n, this.h || (this.h = this._ || {}, this.l = this.p || {}, N.push(this), C || (C = !0, X(nt))), this.h[e] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const o = typeof n;
          if (o === "boolean" || o === "string") {
            let r = W.get(e);
            r || (r = `data-${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, W.set(e, r)), this.l[r] = o === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  g() {
    if (this.element) {
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
      this.stateChange(this.h), this._ = this.h, this.p = this.l;
      for (const t in this._)
        delete this._[t];
      if (this.p)
        for (const t in this.p)
          delete this.p[t];
      this.h = null, this.l = null;
    }
  }
  stateChange(t) {
    return t;
  }
  N() {
    var n;
    const t = Object.getPrototypeOf(this);
    let e = k.get(t);
    if (!e) {
      e = [];
      const o = Object.getOwnPropertyNames(t);
      for (let r = 0; r < o.length; r++) {
        const s = o[r];
        !ot.has(s) && !s.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(t, s)) == null ? void 0 : n.value) == "function" && e.push(s);
      }
      k.set(t, e);
    }
    for (let o = 0; o < e.length; o++) {
      const r = e[o];
      this[r] = this[r].bind(this);
    }
  }
}
class _t extends lt {
  async require() {
  }
  m() {
    const t = this.require();
    t && typeof t.then == "function" ? t.then(() => this.mount()) : this.mount();
  }
}
class ft {
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
    }, e.c || (e.c = /* @__PURE__ */ Object.create(null)), e.c[t] = o), this.listeners[t].push(o);
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
    e.c && e.c[t] ? (o = e.c[t], delete e.c[t]) : e.v && (o = e.v);
    const r = n.indexOf(o);
    r !== -1 && n.splice(r, 1);
  }
}
const wt = new ft();
export {
  lt as BaseComponent,
  _t as Component,
  gt as clear,
  _ as config,
  S as createInstance,
  V as destroyInstance,
  wt as eventbus,
  ct as getComponentFromElement,
  ht as loadComponents,
  pt as measure,
  X as mutate,
  dt as removeComponents,
  at as utils
};
