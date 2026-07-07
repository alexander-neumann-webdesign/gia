var B = Object.defineProperty;
var W = (i, e, t) => e in i ? B(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var S = (i, e, t) => W(i, typeof e != "symbol" ? e + "" : e, t);
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
  e.priority !== void 0 && (i.p = e.priority), window.gia.components[t] = i;
});
class j {
  constructor() {
    S(this, "s", {
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
const d = new j(), u = /* @__PURE__ */ new WeakMap();
function G(i, e, t, n) {
  if (u.has(i))
    return console.warn(`Component "${e}" already exists.`), u.get(i);
  try {
    const s = new t(i, n);
    return d.get("log") && console.info(`Created instance of component "${e}".`), s;
  } catch (s) {
    return console.error(`Failed to create component "${e}".`, s), null;
  }
}
function fe(i) {
  return typeof i == "string" && (i = document.getElementById(i), !i) ? null : u.get(i) || null;
}
function T(i, e = document) {
  return typeof i != "string" ? i : e.querySelector(i);
}
function N(i, e = document) {
  return typeof i != "string" ? i : e.querySelectorAll(i);
}
function q(i, e, t = null) {
  t === null ? i.classList.toggle(e) : i.classList.toggle(e, !!t);
}
function L(i, e, t) {
  if (!i) return i;
  if (i.length !== void 0 && i.nodeType === void 0)
    for (let n = 0; n < i.length; n++)
      i[n].classList[t](e);
  else
    i.classList[t](e);
  return i;
}
function F(i, e) {
  return L(i, e, "remove");
}
function H(i, e) {
  return L(i, e, "add");
}
function Y(i, e, t = null, n = {
  bubbles: !0,
  cancelable: !0,
  detail: null
}) {
  n.detail = t;
  const s = new CustomEvent(e, n);
  i.dispatchEvent(s);
}
function K(i, e) {
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
const ce = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addClass: H,
  debounce: K,
  query: T,
  queryAll: N,
  removeClass: F,
  toggleClass: q,
  triggerEvent: Y
}, Symbol.toStringTag, { value: "Module" }));
function ae(i = {}, e = document.documentElement) {
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
  const n = [], s = `${d.get("attrPrefix")}-component`, r = N(`[${s}]`, e), o = r.length;
  for (let l = 0; l < o; l++) {
    const f = r[l];
    if (!u.get(f)) {
      const a = f.getAttribute(s);
      typeof i[a] == "function" ? n.push(G(f, a, i[a])) : console.warn(`Constructor "${a}" not found.`);
    }
  }
  if (e instanceof Element && e.hasAttribute(s) && !u.get(e)) {
    const f = e.getAttribute(s);
    typeof i[f] == "function" ? n.push(G(e, f, i[f])) : console.warn(`Constructor "${f}" not found.`);
  }
  n.length > 1 && n.sort((l, f) => {
    if (!l) return 1;
    if (!f) return -1;
    const c = l.constructor.p ?? l.constructor.priority ?? 0;
    return (f.constructor.p ?? f.constructor.priority ?? 0) - c;
  });
  for (let l = 0; l < n.length; l++) {
    const f = n[l];
    f && f.g();
  }
}
function U(i) {
  if (!i) return;
  let e = u.get(i);
  if (!e && typeof i == "string") {
    const t = document.getElementById(i);
    t && (e = u.get(t), i = t);
  }
  if (e) {
    const t = e.f || "Unknown";
    try {
      typeof e.w == "function" ? e.w() : e.unmount();
    } catch (n) {
      console.error(`Gia: Error unmounting component "${t}".`, n);
    }
    u.delete(i), e.element && (e.element = null), d.get("log") && console.info(`Removed component "${t}".`);
  }
}
function ue(i = document.documentElement) {
  const e = N(`[${d.get("attrPrefix")}-component]`, i);
  for (let t = 0; t < e.length; t++)
    U(e[t]);
}
let w = !1, m = !1;
const y = /* @__PURE__ */ new Set(), J = typeof navigator < "u" && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i), k = J ? "orientationchange" : "resize", A = /* @__PURE__ */ new Set();
let h = null;
const O = { scroll: 0, velocity: 0 }, E = { width: 0, height: 0 }, I = [null], Q = (i) => i(O), V = (i) => i(E), x = (i) => i(I), Z = function(i, e) {
  this.unobserveResize(e);
}, X = function(i, e) {
  this.unobserveIntersection(e);
}, D = (i) => i.d();
let v = !1;
const C = /* @__PURE__ */ new Set();
function ee() {
  v = !1, C.forEach(D), C.clear();
}
function te() {
  y.forEach(Q);
}
function b(i) {
  let e, t;
  h ? (e = h.scroll, t = h.velocity) : i && typeof i.scroll == "number" ? (e = i.scroll, t = i.velocity || 0) : (e = window.scrollY || window.pageYOffset, t = 0), O.scroll = e, O.velocity = t, te();
}
function ne() {
  A.forEach(V);
}
function $(i) {
  E.width = window.innerWidth, E.height = window.innerHeight, ne();
}
let g = null;
const p = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new Map(), ie = /* @__PURE__ */ new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]), P = /* @__PURE__ */ new WeakMap(), R = /* @__PURE__ */ new Map();
function se(i) {
  const e = i.root || null, t = i.rootMargin || "0px 0px 0px 0px", n = i.threshold || 0;
  let s = z.get(e);
  s || (s = /* @__PURE__ */ new Map(), z.set(e, s));
  let r = s.get(t);
  r || (r = /* @__PURE__ */ new Map(), s.set(t, r));
  let o = r;
  if (Array.isArray(n)) {
    let f = o.get("array");
    f || (f = /* @__PURE__ */ new Map(), o.set("array", f)), o = f;
    for (let c = 0; c < n.length; c++) {
      const a = n[c];
      let _ = o.get(a);
      _ || (_ = /* @__PURE__ */ new Map(), o.set(a, _)), o = _;
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
      for (let a = 0; a < c.length; a++) {
        const _ = c[a], M = l.callbacks.get(_.target);
        M && (I[0] = _, M.forEach(x));
      }
    }, i),
    callbacks: /* @__PURE__ */ new WeakMap(),
    nodeMap: o,
    elementsCount: 0
  }, o.set("data", l)), l;
}
let oe = class {
  constructor(e, t) {
    this.element = e, u.set(this.element, this), this.f = this.constructor.name, this.e = {}, this.s = t || {}, this.u = {}, this.d = this.d.bind(this), this.y();
  }
  get ref() {
    return this.e;
  }
  set ref(e) {
    const t = `${d.get("attrPrefix")}-ref`, n = N(`[${t}]`, this.element), s = /* @__PURE__ */ Object.create(null);
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
    const t = this.element.getAttribute(`${d.get("attrPrefix")}-options`);
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
  g() {
    this.mount();
  }
  w() {
    if (this.unmount(), typeof __GIA_NANO__ < "u" && __GIA_NANO__) {
      this.e = null, this.element && (u.delete(this.element), this.element = null);
      return;
    }
    this.o && (this.o.forEach(this.unobserveScroll, this), this.o = null), this.r && (this.r.forEach(this.unobserveWindowResize, this), this.r = null), this.n && (this.n.forEach(Z, this), this.n = null), this.t && (this.t.forEach(X, this), this.t = null), this.e = null, this.element && (u.delete(this.element), this.element = null);
  }
  observeScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (w || (w = !0, window.lenis ? (h = window.lenis, h.on("scroll", b)) : window.addEventListener("scroll", b, { passive: !0 })), this.o || (this.o = /* @__PURE__ */ new Set()), this.o.add(e), y.add(e));
  }
  unobserveScroll(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.o && this.o.delete(e), y.delete(e), y.size === 0 && w && (w = !1, h ? (h.off("scroll", b), h = null) : window.removeEventListener("scroll", b)));
  }
  observeWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || (m || (m = !0, window.addEventListener(k, $, { passive: !0 })), this.r || (this.r = /* @__PURE__ */ new Set()), this.r.add(e), A.add(e));
  }
  unobserveWindowResize(e) {
    typeof __GIA_NANO__ < "u" && __GIA_NANO__ || (this.r && this.r.delete(e), A.delete(e), A.size === 0 && m && (m = !1, window.removeEventListener(k, $)));
  }
  observeResize(e, t) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.ResizeObserver) return;
    g || (g = new ResizeObserver((r) => {
      for (let o = 0; o < r.length; o++) {
        const l = r[o], f = p.get(l.target);
        f && (I[0] = l, f.forEach(x));
      }
    }));
    let n = p.get(e);
    n || (n = /* @__PURE__ */ new Set(), p.set(e, n), g.observe(e)), n.add(t), this.n || (this.n = /* @__PURE__ */ new Map());
    let s = this.n.get(e);
    s || (s = /* @__PURE__ */ new Set(), this.n.set(e, s)), s.add(t);
  }
  unobserveResize(e, t = null) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || !this.n) return;
    const n = this.n.get(e);
    if (!n) return;
    if (t) {
      n.delete(t);
      const r = p.get(e);
      r && r.delete(t);
    } else {
      const r = p.get(e);
      r && n.forEach(Set.prototype.delete, r), n.clear();
    }
    n.size === 0 && this.n.delete(e);
    const s = p.get(e);
    s && s.size === 0 && (p.delete(e), g && g.unobserve(e));
  }
  observeIntersection(e, t, n = {}) {
    if (typeof __GIA_NANO__ < "u" && __GIA_NANO__ || typeof window > "u" || !window.IntersectionObserver) return;
    const s = se(n);
    let r = s.callbacks.get(e);
    r || (r = /* @__PURE__ */ new Set(), s.callbacks.set(e, r), s.observer.observe(e), s.elementsCount++), r.add(t), this.t || (this.t = /* @__PURE__ */ new Map());
    let o = this.t.get(e);
    o || (o = /* @__PURE__ */ new Map(), this.t.set(e, o));
    let l = o.get(s);
    l || (l = /* @__PURE__ */ new Set(), o.set(s, l)), l.add(t);
  }
  A(e, t) {
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
    n && (this.m = e, this.b = t, n.forEach(this.A, this), this.m = null, this.b = null, n.size === 0 && this.t.delete(e));
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
    return `[${d.get("attrPrefix")}-ref="${t ? `${this.f}:` : ""}${e}"]`;
  }
  setState(e) {
    if (e)
      for (const t in e) {
        if (!Object.prototype.hasOwnProperty.call(e, t)) continue;
        const n = e[t];
        if (this.u[t] !== n && (this.u[t] = n, this.a || (this.a = this._ || {}, this.l = this.h || {}, C.add(this), v || (v = !0, requestAnimationFrame(ee))), this.a[t] = n, typeof __GIA_NANO__ > "u" || !__GIA_NANO__)) {
          const s = typeof n;
          if (s === "boolean" || s === "string") {
            let r = R.get(t);
            r || (r = `data-${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, R.set(t, r)), this.l[r] = s === "boolean" ? n ? "true" : "false" : n;
          }
        }
      }
  }
  d() {
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
    this.stateChange(this.a), this._ = this.a, this.h = this.l;
    for (const e in this._)
      delete this._[e];
    if (this.h)
      for (const e in this.h)
        delete this.h[e];
    this.a = null, this.l = null;
  }
  stateChange(e) {
    return e;
  }
  y() {
    var n;
    const e = Object.getPrototypeOf(this);
    let t = P.get(e);
    if (!t) {
      t = [];
      const s = Object.getOwnPropertyNames(e);
      for (let r = 0; r < s.length; r++) {
        const o = s[r];
        !ie.has(o) && !o.startsWith("_") && typeof ((n = Object.getOwnPropertyDescriptor(e, o)) == null ? void 0 : n.value) == "function" && t.push(o);
      }
      P.set(e, t);
    }
    for (let s = 0; s < t.length; s++) {
      const r = t[s];
      this[r] = this[r].bind(this);
    }
  }
  O() {
  }
};
class de extends oe {
  async require() {
  }
  g() {
    const e = this.require();
    e && typeof e.then == "function" ? e.then(() => this.mount()) : this.mount();
  }
}
class re {
  constructor() {
    this.listeners = /* @__PURE__ */ Object.create(null);
  }
  emit(e, t = {}) {
    d.get("log") && console.info(`Emitting event '${e}'`);
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
    t.c && t.c[e] ? (s = t.c[e], delete t.c[e]) : t.N && (s = t.N);
    const r = n.indexOf(s);
    r !== -1 && (r === n.length - 1 || (n[r] = n[n.length - 1]), n.pop());
  }
}
const _e = new re();
export {
  oe as BaseComponent,
  de as Component,
  d as config,
  G as createInstance,
  U as destroyInstance,
  _e as eventbus,
  fe as getComponentFromElement,
  ae as loadComponents,
  ue as removeComponents,
  ce as utils
};
