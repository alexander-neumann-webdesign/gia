var K = Object.defineProperty;
var U = (i, e, t) => e in i ? K(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var R = (i, e, t) => U(i, typeof e != "symbol" ? e + "" : e, t);
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
  e.priority !== void 0 && (i.g = e.priority), window.gia.components[t] = i;
});
class J {
  constructor() {
    R(this, "s", {
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
    this.s[e] = t;
  }
  get(e) {
    return this.s[e];
  }
}
const h = new J(), p = /* @__PURE__ */ new WeakMap();
function x(i, e, t, n) {
  if (p.has(i))
    return console.warn(`Component "${e}" already exists.`), p.get(i);
  try {
    const s = new t(i, n);
    return h.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function me(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : p.get(i) || null;
}
function Q(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function m(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function V(i, e, t = null) {
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
function Z(i, e) {
  return F(i, e, "remove");
}
function X(i, e) {
  return F(i, e, "add");
}
function D(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  i.dispatchEvent(s);
}
function ee(i, e) {
  let t, n = null, s = null;
  const r = () => {
    if (clearTimeout(t), n) {
      const l = s, f = n;
      s = null, n = null, i.apply(l, f);
    }
  }, o = function() {
    n = arguments, s = this, clearTimeout(t), t = setTimeout(r, e);
  };
  return o.cancel = function() {
    clearTimeout(t), n = null, s = null;
  }, o;
}
const be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: X,
  debounce: ee,
  query: Q,
  queryAll: m,
  removeClass: Z,
  toggleClass: V,
  triggerEvent: D
}, Symbol.toStringTag, { value: "Module" }));
function te(i = {}, e = document.documentElement) {
  if (!i) {
    console.warn("App has no components");
    return;
  }
  let t = !1;
  for (const l in i) {
    t = !0;
    break;
  }
  if (!t) {
    console.warn("App has no components");
    return;
  }
  const n = [], s = `${h.get("attrPrefix")}-component`, r = m(`[${s}]`, e), o = r.length;
  for (let l = 0; l < o; l++) {
    const f = r[l];
    if (!p.get(f)) {
      const u = f.getAttribute(s);
      typeof i[u] == "function" ? n.push(x(f, u, i[u])) : console.warn(`Constructor "${u}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !p.get(e)) {
    const f = e.getAttribute(s);
    typeof i[f] == "function" ? n.push(x(e, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
  }
  n.length > 1 && n.sort((l, f) => {
    if (!l) return 1;
    if (!f) return -1;
    const c = l.constructor.g ?? l.constructor.priority ?? 0;
    return (f.constructor.g ?? f.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f._();
  }
}
function C(i) {
  if (!i) return;
  let e = p.get(i);
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = p.get(t), i = t);
  }
  if (e) {
    const t = e.f || "Unknown";
    try {
      typeof e.w == "function" ? e.w() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    p.delete(i), e.element && (e.element = null), h.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ye(i = document.documentElement) {
  const e = m(`[${h.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    C(e[t]);
}
let y = !1, A = !1;
const O = /* @__PURE__ */ new Set(), ne = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), L = ne ? "orientationchange" : "resize", E = /* @__PURE__ */ new Set();
let g = null;
const M = { scroll: 0, velocity: 0 }, I = { width: 0, height: 0 }, k = [null], ie = (i) => i(M), se = (i) => i(I), H = (i) => i(k), oe = function(i, e) {
  this.unobserveResize(e);
}, re = function(i, e) {
  this.unobserveIntersection(e);
}, le = (i) => i.h();
let S = !1;
const G = /* @__PURE__ */ new Set();
function fe() {
  S = !1, G.forEach(le), G.clear();
}
function ce() {
  O.forEach(ie);
}
function N(i) {
  let e, t;
  g ? (e = g.scroll, t = g.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), M.scroll = e, M.velocity = t, ce();
}
function ae() {
  E.forEach(se);
}
function W(i) {
  I.width = window.innerWidth, I.height = window.innerHeight, ae();
}
let b = null;
const _ = /* @__PURE__ */ new WeakMap(), T = /* @__PURE__ */ new Map(), B = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), j = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new Map();
function ue(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = T.get(e);
  s || (s = /* @__PURE__ */ new Map(), T.set(e, s));
  let r = s.get(t);
  r || (r = /* @__PURE__ */ new Map(), s.set(t, r));
  let o = r;
  if (Array.isArray(n)) {
    let f = o.get("array");
    f || (f = /* @__PURE__ */ new Map(), o.set("array", f)), o = f;
    for (let c = 0; c < n.length; c++) {
      const u = n[c];
      let d = o.get(u);
      d || (d = /* @__PURE__ */ new Map(), o.set(u, d)), o = d;
    }
  } else {
    let f = o.get("number");
    f || (f = /* @__PURE__ */ new Map(), o.set("number", f)), o = f;
    let c = o.get(n);
    c || (c = /* @__PURE__ */ new Map(), o.set(n, c)), o = c;
  }
  let l = o.get("data");
  return l || (l = {
    observer: new IntersectionObserver((c) => {
      for (let u = 0; u < c.length; u++) {
        const d = c[u], z = l.callbacks.get(d.target);
        z && (k[0] = d, z.forEach(H));
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: o,
    elementsCount: 0
  }, o.set("data", l)), l;
}
let de = class {
  constructor(e, t) {
    this.element = e, p.set(this.element, this), this.f = this.constructor.name, this.e = {}, this.s = t || {}, this.u = {}, this.h = this.h.bind(this), this.A(), h.get("autoBindActions") && this.N();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${h.get("attrPrefix")}-ref`, n = m(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
    for (let o = 0; o < n.length; o++) {
      const l = n[o], f = l.getAttribute(t);
      let c = s[f];
      c === void 0 && (c = [], s[f] = c), c.push(l);
    }
    let r = !0;
    for (const o in e) {
      r = !1;
      break;
    }
    if (r)
      for (const o in s) {
        const l = o.indexOf(":");
        if (l !== -1) {
          const f = o.substring(0, l), c = o.substring(l + 1);
          f === this.f && !this.e[c] && (this.e[c] = s[o]);
        } else
          this.e[o] || (this.e[o] = s[o]);
      }
    else {
      this.e = {};
      for (const o in e) {
        if (!Object.prototype.hasOwnProperty.call(e, o)) continue;
        const l = Array.isArray(e[o]);
        if (e[o] !== null && l && e[o].length > 0) {
          this.e[o] = e[o];
          continue;
        }
        const f = `${this.f}:${o}`;
        let c = s[f] || [];
        c.length === 0 && (c = s[o] || []), this.e[o] = l ? c : c[0] ?? null;
      }
    }
  }
  get options() {
    return this.s;
  }
  set options(e) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.s = { ...this.s, ...e };
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
          console.error(`Failed to parse options for component "${this.f}": ${r.message}`);
        }
    }
    this.s = {
      ...this.s,
      ...e,
      ...n
    };
  }
  get state() {
    return this.u;
  }
  set state(e) {
    console.warn("Use setState instead."), this.u = e;
  }
  _() {
    this.mount();
  }
  w() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.e = null, this.element && (p.delete(this.element), this.element = null);
      return;
    }
    this.o && (this.o.forEach(this.unobserveScroll, this), this.o = null), this.r && (this.r.forEach(this.unobserveWindowResize, this), this.r = null), this.n && (this.n.forEach(oe, this), this.n = null), this.t && (this.t.forEach(re, this), this.t = null), this.e = null, this.element && (p.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (y || (y = !0, window.lenis ? (g = window.lenis, g.on("scroll", N)) : window.addEventListener("scroll", N, { passive: !0 })), this.o || (this.o = /* @__PURE__ */ new Set()), this.o.add(e), O.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.o && this.o.delete(e), O.delete(e), O.size === 0 && y && (y = !1, g ? (g.off("scroll", N), g = null) : window.removeEventListener("scroll", N)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (A || (A = !0, window.addEventListener(L, W, { passive: !0 })), this.r || (this.r = /* @__PURE__ */ new Set()), this.r.add(e), E.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.r && this.r.delete(e), E.delete(e), E.size === 0 && A && (A = !1, window.removeEventListener(L, W)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    b || (b = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const l = r[o], f = _.get(l.target);
        f && (k[0] = l, f.forEach(H));
      }
    }));
    let n = _.get(e);
    n || (n = /* @__PURE__ */ new Set(), _.set(e, n), b.observe(e)), n.add(t), this.n || (this.n = /* @__PURE__ */ new Map());
    let s = this.n.get(e);
    s || (s = /* @__PURE__ */ new Set(), this.n.set(e, s)), s.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.n) return;
    const n = this.n.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const r = _.get(e);
      r && r.delete(t);
    } else {
      const r = _.get(e);
      r && n.forEach(Set.prototype.delete, r), n.clear();
    }
    n.size === 0 && this.n.delete(e);
    const s = _.get(e);
    s && s.size === 0 && (_.delete(e), b && b.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = ue(n);
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e), s.elementsCount++), r.add(t), this.t || (this.t = /* @__PURE__ */ new Map());
    let o = this.t.get(e);
    o || (o = /* @__PURE__ */ new Map(), this.t.set(e, o));
    let l = o.get(s);
    l || (l = /* @__PURE__ */ new Set(), o.set(s, l)), l.add(t);
  }
  O(e, t) {
    const n = this.m, s = this.b;
    if (s)
      e.has(s) && (e.delete(s), t && t.callbacks.has(n) && t.callbacks.get(n).delete(s));
    else {
      if (t && t.callbacks.has(n)) {
        const r = t.callbacks.get(n);
        e.forEach(Set.prototype.delete, r);
      }
      e.clear();
    }
    if (e.size === 0 && this.t.get(n).delete(t), t) {
      const r = t.callbacks.get(n);
      r && r.size === 0 && (t.callbacks.delete(n), t.observer.unobserve(n), t.elementsCount--), t.elementsCount === 0 && (t.observer.disconnect(), t.nodeMap && t.nodeMap.delete("data"));
    }
  }
  unobserveIntersection(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.t) return;
    const n = this.t.get(e);
    n && (this.m = e, this.b = t, n.forEach(this.O, this), this.m = null, this.b = null, n.size === 0 && this.t.delete(e));
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
    return n ? n instanceof HTMLScriptElement ? n.i ? n.i : (n.i = new Promise((s, r) => {
      const o = () => {
        n.onload = null, n.onerror = null;
      };
      n.onload = () => {
        o(), s(t ? window[t] : !0);
      }, n.onerror = () => {
        o(), delete n.i, r(new Error(`Failed to load script: ${e}`));
      }, !n.src && n.hasAttribute("data-src") ? (n.src = n.getAttribute("data-src"), n.removeAttribute("data-src")) : !n.src && !n.hasAttribute("data-src") && (o(), r(new Error(`Script tag '${e}' has no src or data-src.`)));
    }), n.i) : Promise.reject(new Error(`Element with ID '${e}' is not a valid script tag.`)) : Promise.reject(new Error(`Script tag with ID '${e}' not found.`));
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
    return t ? t instanceof HTMLLinkElement ? t.i ? t.i : (t.i = new Promise((n, s) => {
      const r = () => {
        t.onload = null, t.onerror = null;
      };
      if (t.onload = () => {
        r(), n(!0);
      }, t.onerror = () => {
        r(), delete t.i, s(new Error(`Failed to load style: ${e}`));
      }, !t.href && t.hasAttribute("data-href"))
        t.href = t.getAttribute("data-href"), t.removeAttribute("data-href");
      else if (!t.href && !t.hasAttribute("data-href"))
        r(), s(new Error(`Link tag '${e}' has no href or data-href.`));
      else if (t.href && !t.hasAttribute("data-href")) {
        let o = !1;
        for (let l = 0; l < document.styleSheets.length; l++)
          if (document.styleSheets[l].href === t.href) {
            o = !0;
            break;
          }
        o && (r(), n(!0));
      }
    }), t.i) : Promise.reject(new Error(`Element with ID '${e}' is not a valid link tag.`)) : Promise.reject(new Error(`Link tag with ID '${e}' not found.`));
  }
  mount() {
  }
  unmount() {
  }
  getRef(e, t = !1) {
    return `[${h.get("attrPrefix")}-ref="${t ? `${this.f}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.u[t] !== n && (this.u[t] = n, this.a || (this.a = this.p || {}, this.l = this.d || {}, G.add(this), S || (S = !0, requestAnimationFrame(fe))), this.a[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = q.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, q.set(t, r)), this.l[r] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  h() {
    if (typeof __GIA_NANO__ > "u" || !__GIA_NANO__) {
      let e = !1;
      for (const t in this.l) {
        e = !0;
        break;
      }
      if (e)
        for (const t in this.l) {
          if (!Object.prototype.hasOwnProperty.call(this.l, t)) continue;
          const n = this.l[t];
          this.element.getAttribute(t) !== n && this.element.setAttribute(t, n);
        }
    }
    this.stateChange(this.a), this.p = this.a, this.d = this.l;
    for (const e in this.p)
      delete this.p[e];
    if (this.d)
      for (const e in this.d)
        delete this.d[e];
    this.a = null, this.l = null;
  }
  stateChange(e) {
    return e;
  }
  A() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = j.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let r = 0; r < s.length; r++) {
        const o = s[r];
        !B.has(o) && !o.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, o)) == null ? void 0 : n.value) == "function" && t.push(o);
      }
      j.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const r = t[s];
      this[r] = this[r].bind(this);
    }
  }
  N() {
    const e = m("[data-action]", this.element), t = e.length;
    for (let n = 0; n < t; n++) {
      const s = e[n], r = s.getAttribute("data-action");
      if (!r) continue;
      let o = 0;
      for (; o < r.length; ) {
        let l = r.indexOf(" ", o);
        if (l === -1 && (l = r.length), l > o) {
          const f = r.substring(o, l), c = f.indexOf("->");
          let u, d;
          c !== -1 ? (u = f.substring(0, c), d = f.substring(c + 2)) : (u = f, d = void 0), this[d] && typeof this[d] == "function" && !d.startsWith("_") && !B.has(d) ? s.addEventListener(u, this[d]) : console.warn(`Method "${d}" not found, is restricted, or is not a function in component.`);
        }
        o = l + 1;
      }
    }
  }
};
class Ne extends de {
  async require() {
  }
  _() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => this.mount()) : this.mount();
  }
}
class he {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    h.get("log") && console.info(`Emitting event '${e}'`);
    const n = this.listeners[e];
    if (!n || n.length === 0) return;
    t && typeof t == "object" && (t.f = e);
    const s = n.slice();
    for (let r = 0; r < s.length; r++)
      s[r](t);
  }
  on(e, t, n = !1) {
    this.listeners[e] || (this.listeners[e] = []);
    let s = t;
    n && (s = (r) => {
      this.off(e, s), t(r);
    }, t.c || (t.c = /* @__PURE__ */ Object.create(null)), t.c[e] = s), this.listeners[e].push(s);
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
    t.c && t.c[e] ? (s = t.c[e], delete t.c[e]) : t.E && (s = t.E);
    const r = n.indexOf(s);
    r !== -1 && (r === n.length - 1 || (n[r] = n[n.length - 1]), n.pop());
  }
}
const Oe = new he();
let w = null, $ = null;
const v = /* @__PURE__ */ new Set(), pe = (i) => {
  i.isConnected && te($, i);
};
function ge(i) {
  const e = `${h.get("attrPrefix")}-component`, t = typeof window < "u" && window.gia ? window.gia.components : {};
  v.clear();
  for (let n = 0; n < i.length; n++) {
    const s = i[n];
    for (let r = 0; r < s.removedNodes.length; r++) {
      const o = s.removedNodes[r];
      if (o.nodeType === Node.ELEMENT_NODE) {
        o.hasAttribute(e) && C(o);
        const l = m(`[${e}]`, o);
        for (let f = 0; f < l.length; f++)
          C(l[f]);
      }
    }
    s.addedNodes.length > 0 && s.target.nodeType === Node.ELEMENT_NODE && v.add(s.target);
  }
  $ = t, v.forEach(pe), $ = null;
}
function Y() {
  typeof document > "u" || (h.get("autoMountComponents") && !w ? (w = new MutationObserver(ge), w.observe(document.body, {
    childList: !0,
    subtree: !0
  })) : !h.get("autoMountComponents") && w && (w.disconnect(), w = null));
}
{
  const i = h.set;
  h.set = function(e, t) {
    i.call(this, e, t), e === "autoMountComponents" && Y();
  };
}
const a = (typeof window < "u" ? window.y : null) || {
  reads: [],
  writes: [],
  scheduled: !1
};
a.tempReads || (a.tempReads = []);
a.tempWrites || (a.tempWrites = []);
typeof window < "u" && !window.y && (window.y = a);
function _e() {
  a.scheduled = !1;
  const i = a.reads;
  a.reads = a.tempReads;
  for (let t = 0; t < i.length; t++)
    try {
      i[t]();
    } catch (n) {
      console.error(n);
    }
  i.length = 0, a.tempReads = i;
  const e = a.writes;
  a.writes = a.tempWrites;
  for (let t = 0; t < e.length; t++)
    try {
      e[t]();
    } catch (n) {
      console.error(n);
    }
  e.length = 0, a.tempWrites = e, (a.reads.length > 0 || a.writes.length > 0) && P();
}
function P() {
  !a.scheduled && typeof window < "u" && (a.scheduled = !0, window.requestAnimationFrame(_e));
}
function Ee(i, e) {
  const t = e ? i.bind(e) : i;
  return a.reads.push(t), P(), t;
}
function ve(i, e) {
  const t = e ? i.bind(e) : i;
  return a.writes.push(t), P(), t;
}
function Ce(i) {
  let e = a.reads.indexOf(i);
  return e > -1 ? (a.reads.splice(e, 1), !0) : (e = a.writes.indexOf(i), e > -1 ? (a.writes.splice(e, 1), !0) : !1);
}
typeof window < "u" && setTimeout(Y, 0);
export {
  de as BaseComponent,
  Ne as Component,
  Ce as clear,
  h as config,
  x as createInstance,
  C as destroyInstance,
  Oe as eventbus,
  me as getComponentFromElement,
  te as loadComponents,
  Ee as measure,
  ve as mutate,
  ye as removeComponents,
  be as utils
};
